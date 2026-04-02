/**
 * Cotizaciones — bbdd_shelies.quotes
 *
 * POST   /api/quotes              → crear cotización (y opcionalmente enviar WA)
 * GET    /api/quotes              → listar (filter: conversation_id, phone)
 * GET    /api/quotes/:id          → detalle
 * PATCH  /api/quotes/:id          → actualizar estado
 */
import { Router, Request, Response } from "express";
import { query } from "../lib/db";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/* ── Crear tabla si no existe ── */
async function ensureQuotesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.quotes (
      id            SERIAL PRIMARY KEY,
      quote_number  VARCHAR(100) UNIQUE NOT NULL,
      conversation_id VARCHAR(50),
      client_name   VARCHAR(255) DEFAULT '',
      client_phone  VARCHAR(50)  DEFAULT '',
      items         JSONB        NOT NULL DEFAULT '[]',
      subtotal      NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
      total         NUMERIC(12,2) NOT NULL DEFAULT 0,
      notes         TEXT         DEFAULT '',
      status        VARCHAR(50)  DEFAULT 'enviada',
      created_by    VARCHAR(255) DEFAULT '',
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
}
ensureQuotesTable().catch(console.error);

/* ── POST / — crear cotización ── */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      conversation_id, client_name = "", client_phone = "",
      items, subtotal, discount = 0, total, notes = "",
      created_by = "Admin", send_whatsapp = false,
    } = req.body as {
      conversation_id?: string;
      client_name?: string;
      client_phone?: string;
      items: Array<{ name: string; description?: string; qty: number; price: number; type?: string }>;
      subtotal: number;
      discount?: number;
      total: number;
      notes?: string;
      created_by?: string;
      send_whatsapp?: boolean;
    };

    if (!items?.length || total === undefined) {
      res.status(400).json({ error: "items y total son requeridos" });
      return;
    }

    const quote_number = `COT-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    const rows = await query(
      `INSERT INTO bbdd_shelies.quotes
         (quote_number, conversation_id, client_name, client_phone,
          items, subtotal, discount, total, notes, status, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,'enviada',$10,NOW())
       RETURNING *`,
      [
        quote_number, conversation_id ?? null, client_name, client_phone,
        JSON.stringify(items), subtotal, discount, total, notes, created_by,
      ]
    );

    const quote = rows[0];

    // Enviar por WhatsApp si se solicitó
    if (send_whatsapp && client_phone && process.env.WHATSAPP_ACCESS_TOKEN) {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const token   = process.env.WHATSAPP_ACCESS_TOKEN;

      const lines = (items as Array<{ name: string; qty: number; price: number }>)
        .map((i) => `• ${i.name} × ${i.qty} — $${Number(i.price).toLocaleString("es-CO")}`)
        .join("\n");

      const discountLine = discount > 0
        ? `\n💸 Descuento: -$${Number(discount).toLocaleString("es-CO")}` : "";

      const waText =
        `📋 *COTIZACIÓN SHELIE'S*\n` +
        `🔖 ${quote_number}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `${lines}${discountLine}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Total: $${Number(total).toLocaleString("es-CO")}*\n\n` +
        `${notes ? `📝 ${notes}\n\n` : ""}` +
        `⏰ Válida por 48 horas\n` +
        `💬 Responde para reservar tu cita\n\n` +
        `_Shelie's Siempre Bellas_ ✨`;

      try {
        await fetch(
          `https://graph.facebook.com/v19.0/${phoneId}/messages`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: client_phone.replace(/\D/g, ""),
              type: "text",
              text: { body: waText },
            }),
          }
        );
        // Guardar como mensaje outbound en DB
        await query(
          `INSERT INTO bbdd_shelies.wa_messages
             (id, conversation_id, direction, sender_name, text, status, created_at)
           VALUES ($1,$2,'outbound',$3,$4,'sent',NOW())
           ON CONFLICT (id) DO NOTHING`,
          [`quote-${quote_number}`, conversation_id ?? client_phone, created_by, waText]
        );
        // Actualizar last_message de la conversación
        if (conversation_id) {
          await query(
            `UPDATE bbdd_shelies.wa_conversations
             SET last_message=$1, last_message_at=NOW() WHERE id=$2`,
            [`📋 Cotización ${quote_number}`, conversation_id]
          );
        }
      } catch (waErr) {
        console.warn("[quotes WA send]", waErr);
      }
    }

    res.status(201).json(quote);
  } catch (err) {
    console.error("[quotes POST]", err);
    res.status(500).json({ error: "Error al crear cotización" });
  }
});

/* ── GET / — listar ── */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { conversation_id, phone } = req.query;
    const params: unknown[] = [];
    const wheres: string[] = [];

    if (conversation_id) { params.push(conversation_id); wheres.push(`conversation_id = $${params.length}`); }
    if (phone)           { params.push(phone);           wheres.push(`client_phone = $${params.length}`); }

    const where = wheres.length ? `WHERE ${wheres.join(" AND ")}` : "";
    const rows = await query(
      `SELECT * FROM bbdd_shelies.quotes ${where} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error("[quotes GET]", err);
    res.status(500).json({ error: "Error al obtener cotizaciones" });
  }
});

/* ── GET /:id ── */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT * FROM bbdd_shelies.quotes WHERE id::text = $1 OR quote_number = $1`,
      [req.params.id]
    );
    if (!rows.length) { res.status(404).json({ error: "No encontrada" }); return; }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

/* ── PATCH /:id — actualizar estado ── */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body as { status?: string; notes?: string };
    const sets: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    let i = 1;
    if (status) { sets.push(`status = $${i++}`); params.push(status); }
    if (notes !== undefined) { sets.push(`notes = $${i++}`); params.push(notes); }
    params.push(req.params.id);
    const rows = await query(
      `UPDATE bbdd_shelies.quotes SET ${sets.join(",")} WHERE id::text = $${i} OR quote_number = $${i} RETURNING *`,
      params
    );
    if (!rows.length) { res.status(404).json({ error: "No encontrada" }); return; }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

export default router;
