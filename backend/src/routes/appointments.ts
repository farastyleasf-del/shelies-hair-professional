import { Router, Request, Response } from "express";
import { createAppointment, getAppointments } from "../lib/db-services";
import { query } from "../lib/db";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/* ── Migración: columnas de pago en appointments ── */
export async function initAppointmentsPaymentCols() {
  const cols = [
    "ADD COLUMN IF NOT EXISTS client_email  VARCHAR(255) DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(14,2) DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(50)  DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS payment_ref   VARCHAR(255) DEFAULT ''",
  ];
  for (const col of cols) {
    try {
      await query(`ALTER TABLE bbdd_shelies.appointments ${col}`, []);
    } catch { /* already exists */ }
  }
  console.log("[appointments] columnas de pago listas");
}

/* ── GET / ── */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const appointments = await getAppointments();
    res.json({ success: true, data: appointments });
  } catch (e) {
    console.error("GET /appointments:", e);
    res.status(500).json({ success: false, error: "Error al obtener citas" });
  }
});

/* ── POST /create-preference — cita con seña 30% vía MP ── */
router.post("/create-preference", async (req: Request, res: Response) => {
  try {
    const {
      servicio, estilista, fecha, hora,
      client_name, client_phone, client_email,
      precio,
    } = req.body as {
      servicio: string;
      estilista: string;
      fecha: string;
      hora: string;
      client_name: string;
      client_phone: string;
      client_email: string;
      precio: number;
    };

    if (!servicio || !fecha || !hora || !client_name || !client_phone || !client_email) {
      res.status(400).json({ error: "Todos los campos son requeridos" });
      return;
    }

    const deposit  = 30000; // Seña fija $30.000 COP
    const citaRef  = `cita-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const citaNotes = `Servicio: ${servicio} | Especialista: ${estilista}`;

    // Guardar cita pendiente en appointments
    await query(
      `INSERT INTO bbdd_shelies.appointments
         (service_id, stylist_id, client_name, client_phone, client_email,
          date, time_slot, status, notes,
          deposit_amount, deposit_status, payment_ref, created_at, updated_at)
       VALUES (NULL, NULL, $1, $2, $3, $4, $5, 'pendiente_pago', $6, $7, 'pendiente', $8, NOW(), NOW())`,
      [
        client_name, client_phone, client_email,
        fecha, hora,
        citaNotes,
        deposit, citaRef,
      ]
    );

    // También crear en orders para visibilidad en admin/pedidos
    try {
      await query(
        `INSERT INTO bbdd_shelies.orders
           (order_number, client_name, client_phone, client_email,
            items, subtotal, discount, total, status, payment_method, notes, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, 0, $6, 'pendiente', 'mercadopago', $7, NOW())
         ON CONFLICT (order_number) DO NOTHING`,
        [
          citaRef,
          client_name, client_phone, client_email,
          JSON.stringify([{ name: `Cita: ${servicio}`, qty: 1, price: deposit, type: "cita" }]),
          deposit,
          `Cita con ${estilista} — ${fecha} ${hora}`,
        ]
      );
    } catch (dbErr) {
      console.warn("[appointments] No se pudo insertar en orders:", dbErr);
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      res.status(503).json({ error: "Pasarela de pago no configurada" });
      return;
    }

    const mp         = new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
    const preference = new Preference(mp);

    const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
    const BACKEND_URL  = process.env.BACKEND_URL  ?? "http://localhost:3001";

    const result = await preference.create({
      body: {
        items: [{
          id:          citaRef,
          title:       `Reserva de cita — ${servicio}`,
          quantity:    1,
          unit_price:  deposit,
          currency_id: "COP",
          category_id: "services",
        }],
        payer: {
          name:    client_name,
          surname: "",
          email:   client_email,
          phone:   { area_code: "57", number: client_phone.replace(/\D/g, "") },
        },
        back_urls: {
          success: `${FRONTEND_URL}/confirmacion?status=approved&order=${citaRef}&type=cita`,
          failure: `${FRONTEND_URL}/servicios?payment=rejected`,
          pending: `${FRONTEND_URL}/confirmacion?status=pending&order=${citaRef}&type=cita`,
        },
        auto_return:        "approved",
        notification_url:   `${BACKEND_URL}/api/payments/webhook`,
        external_reference: citaRef,
        statement_descriptor: "SHELIES CITA",
        expires: false,
      },
    });

    res.json({
      init_point:         result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      order_id:           citaRef,
      deposit,
    });
  } catch (err) {
    console.error("[appointments create-preference]", err);
    res.status(500).json({ error: "Error al crear preferencia de pago" });
  }
});

/* ── POST / — crear cita directa (admin / interno) ── */
router.post("/", async (req: Request, res: Response) => {
  try {
    const appointment = await createAppointment(req.body);
    res.status(201).json({ success: true, data: appointment });
  } catch (e) {
    console.error("POST /appointments:", e);
    res.status(500).json({ success: false, error: "Error al crear cita" });
  }
});

/* ── PATCH /:id — actualizar cita (cancelar, reagendar, cambiar estado) ── */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const { status, date, time_slot, notes } = req.body as {
      status?: string; date?: string; time_slot?: string; notes?: string;
    };
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (status !== undefined)    { sets.push(`status = $${i++}`); params.push(status); }
    if (date !== undefined)      { sets.push(`date = $${i++}`); params.push(date); }
    if (time_slot !== undefined) { sets.push(`time_slot = $${i++}`); params.push(time_slot); }
    if (notes !== undefined)     { sets.push(`notes = $${i++}`); params.push(notes); }
    if (sets.length === 0) { res.status(400).json({ error: "Nada que actualizar" }); return; }
    sets.push(`updated_at = NOW()`);
    params.push(id);
    const rows = await query(
      `UPDATE bbdd_shelies.appointments SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`, params
    );
    if (rows.length === 0) { res.status(404).json({ error: "Cita no encontrada" }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    console.error("PATCH /appointments:", e);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

/* ── DELETE /:id — eliminar cita (admin) ── */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const rows = await query(`DELETE FROM bbdd_shelies.appointments WHERE id = $1 RETURNING id`, [id]);
    if (rows.length === 0) { res.status(404).json({ error: "Cita no encontrada" }); return; }
    res.json({ success: true });
  } catch (e) {
    console.error("DELETE /appointments:", e);
    res.status(500).json({ error: "Error al eliminar cita" });
  }
});

export default router;
