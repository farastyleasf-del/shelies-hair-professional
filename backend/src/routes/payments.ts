/**
 * Pagos — MercadoPago Production
 *
 * POST /api/payments/create-preference  → crea preferencia MP y devuelve init_point
 * POST /api/payments/webhook            → recibe notificaciones de MP (IPN)
 * GET  /api/payments/status/:id         → consulta estado de un pago
 */
import { Router, Request, Response } from "express";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { query } from "../lib/db";
import { v4 as uuidv4 } from "uuid";

const router = Router();

function getMPClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

/* ── Tipos ── */
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;       // en COP (pesos colombianos)
  category_id?: string;
  picture_url?: string;
}

interface CheckoutBody {
  items: CartItem[];
  payer: {
    name: string;
    surname?: string;
    email: string;
    phone?: string;
  };
  shipping_address?: {
    street_name: string;
    city: string;
    zip_code?: string;
  };
  notes?: string;
  external_reference?: string;
}

/* ── POST /create-preference ── */
router.post("/create-preference", async (req: Request, res: Response) => {
  try {
    const body = req.body as CheckoutBody;

    if (!body.items?.length || !body.payer?.email) {
      res.status(400).json({ error: "items y payer.email son requeridos" });
      return;
    }

    const client = getMPClient();
    const preference = new Preference(client);

    const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
    const BACKEND_URL  = process.env.BACKEND_URL  ?? "http://localhost:3001";

    const orderId = body.external_reference ?? `shelies-${Date.now()}-${uuidv4().slice(0,8)}`;

    const result = await preference.create({
      body: {
        items: body.items.map((item) => ({
          id:          item.id,
          title:       item.name,
          quantity:    item.quantity,
          unit_price:  item.unit_price,
          currency_id: "COP",
          picture_url: item.picture_url,
          category_id: item.category_id ?? "others",
        })),
        payer: {
          name:    body.payer.name,
          surname: body.payer.surname ?? "",
          email:   body.payer.email,
          phone:   body.payer.phone
            ? { area_code: "57", number: body.payer.phone.replace(/\D/g, "") }
            : undefined,
        },
        back_urls: {
          success: `${FRONTEND_URL}/confirmacion?status=approved&order=${orderId}`,
          failure: `${FRONTEND_URL}/checkout?status=rejected&order=${orderId}`,
          pending: `${FRONTEND_URL}/confirmacion?status=pending&order=${orderId}`,
        },
        auto_return:        "approved",
        notification_url:   `${BACKEND_URL}/api/payments/webhook`,
        external_reference: orderId,
        statement_descriptor: "SHELIES SIEMPRE",
        expires:             false,
        metadata: {
          notes:            body.notes ?? "",
          shipping_address: JSON.stringify(body.shipping_address ?? {}),
        },
      },
    });

    // Guardar pedido en DB con estado "pendiente"
    try {
      const total = body.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      const clientName = `${body.payer.name} ${body.payer.surname ?? ""}`.trim();
      const clientAddress = body.shipping_address
        ? `${body.shipping_address.street_name}, ${body.shipping_address.city}`
        : "";
      await query(
        `INSERT INTO bbdd_shelies.orders
           (order_number, client_name, client_phone, client_email, client_address,
            items, subtotal, discount, total, status, payment_method, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, 'pendiente', 'mercadopago', $10, NOW())
         ON CONFLICT (order_number) DO NOTHING`,
        [
          orderId,
          clientName,
          body.payer.phone ?? "",
          body.payer.email,
          clientAddress,
          JSON.stringify(body.items),
          total,
          0,
          total,
          body.notes ?? "",
        ]
      );
    } catch (dbErr) {
      console.warn("[MP create-preference] DB insert failed:", dbErr);
    }

    res.json({
      preference_id: result.id,
      init_point:    result.init_point,        // URL producción
      sandbox_init_point: result.sandbox_init_point, // URL sandbox (pruebas)
      order_id:      orderId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    console.error("[MP create-preference]", msg);
    if (msg.includes("no configurado")) {
      res.status(503).json({ error: "Pasarela de pago no configurada" });
    } else {
      res.status(500).json({ error: "Error al crear preferencia de pago" });
    }
  }
});

/* ── POST /webhook (IPN de MercadoPago) ── */
router.post("/webhook", async (req: Request, res: Response) => {
  // MP espera 200 inmediatamente
  res.sendStatus(200);

  try {
    const { type, data } = req.body as {
      type: string;
      data: { id: string };
    };

    if (type !== "payment") return;

    const client  = getMPClient();
    const payment = new Payment(client);
    const info    = await payment.get({ id: data.id });

    const status    = info.status;          // approved | rejected | pending | in_process
    const orderId   = info.external_reference;
    const paymentId = String(info.id);

    console.log(`[MP webhook] payment ${paymentId} | order ${orderId} | status ${status}`);

    // Actualizar estado en DB según tipo de referencia
    if (orderId) {
      try {
        if (orderId.startsWith("cita-")) {
          // Es una seña de cita — actualizar appointments
          const newApptStatus    = status === "approved" ? "confirmada" : "pendiente_pago";
          const newDepositStatus = status ?? "pendiente";
          await query(
            `UPDATE bbdd_shelies.appointments
             SET status = $1, deposit_status = $2, payment_ref = $3, updated_at = NOW()
             WHERE payment_ref = $4`,
            [newApptStatus, newDepositStatus, paymentId, orderId]
          );
          // También actualizar en orders
          try {
            const newOrderStatus = status === "approved" ? "pagado" : "pendiente";
            await query(
              `UPDATE bbdd_shelies.orders
               SET status = $1, payment_ref = $2, updated_at = NOW()
               WHERE order_number = $3`,
              [newOrderStatus, paymentId, orderId]
            );
          } catch { /* si no existe en orders no es crítico */ }
        } else {
          // Es un pedido de tienda
          const newStatus = status === "approved" ? "pagado" : status ?? "pendiente";
          await query(
            `UPDATE bbdd_shelies.orders
             SET status = $1, payment_ref = $2, updated_at = NOW()
             WHERE order_number = $3`,
            [newStatus, paymentId, orderId]
          );
        }
      } catch (dbErr) {
        console.warn("[MP webhook] No se pudo actualizar DB:", orderId, dbErr);
      }
    }
  } catch (err) {
    console.error("[MP webhook processing]", err);
  }
});

/* ── GET /status/:paymentId ── */
router.get("/status/:paymentId", async (req: Request, res: Response) => {
  try {
    const client  = getMPClient();
    const payment = new Payment(client);
    const info    = await payment.get({ id: req.params.paymentId });

    res.json({
      id:                 info.id,
      status:             info.status,
      status_detail:      info.status_detail,
      external_reference: info.external_reference,
      amount:             info.transaction_amount,
      currency:           info.currency_id,
      payment_method:     info.payment_method_id,
      payer_email:        info.payer?.email,
    });
  } catch (err) {
    console.error("[MP status]", err);
    res.status(500).json({ error: "No se pudo consultar el pago" });
  }
});

export default router;
