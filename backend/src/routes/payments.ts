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
      await query(
        `INSERT INTO shelies.orders
           (external_reference, status, total, items_json, payer_json, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (external_reference) DO NOTHING`,
        [
          orderId,
          "pendiente",
          total,
          JSON.stringify(body.items),
          JSON.stringify(body.payer),
        ]
      );
    } catch {
      // Si la tabla de orders no tiene esas columnas, ignoramos el error
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

    // Actualizar estado del pedido en DB
    if (orderId) {
      try {
        await query(
          `UPDATE shelies.orders
           SET status = $1, mp_payment_id = $2, updated_at = NOW()
           WHERE external_reference = $3`,
          [status === "approved" ? "pagado" : status ?? "desconocido", paymentId, orderId]
        );
      } catch {
        // Si la tabla no tiene esas columnas, log sin error crítico
        console.warn("[MP webhook] No se pudo actualizar DB:", orderId);
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
