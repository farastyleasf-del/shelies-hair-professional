/**
 * Pedidos — CRUD de bbdd_shelies.orders
 *
 * GET    /api/orders            → lista pedidos (filtros: status, limit)
 * GET    /api/orders/:id        → detalle de un pedido
 * POST   /api/orders            → crea pedido manual (desde WA inbox u otro canal)
 * PATCH  /api/orders/:id        → actualiza estado, tracking, payment_ref
 */
import { Router, Request, Response } from "express";
import { query } from "../lib/db";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/* ── Crear tabla si no existe ── */
export async function initOrdersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.orders (
      id              SERIAL PRIMARY KEY,
      order_number    VARCHAR(100) UNIQUE NOT NULL,
      client_name     VARCHAR(255) NOT NULL,
      client_phone    VARCHAR(50)  DEFAULT '',
      client_email    VARCHAR(255) DEFAULT '',
      client_address  TEXT         DEFAULT '',
      items           JSONB        NOT NULL DEFAULT '[]',
      subtotal        NUMERIC(14,2) DEFAULT 0,
      discount        NUMERIC(14,2) DEFAULT 0,
      total           NUMERIC(14,2) NOT NULL,
      status          VARCHAR(50)   DEFAULT 'nuevo',
      payment_method  VARCHAR(50)   DEFAULT 'mercadopago',
      payment_ref     VARCHAR(255)  DEFAULT '',
      tracking_code   VARCHAR(255)  DEFAULT '',
      notes           TEXT          DEFAULT '',
      created_at      TIMESTAMPTZ   DEFAULT NOW(),
      updated_at      TIMESTAMPTZ   DEFAULT NOW()
    )
  `, []);
  // Migrations: add new columns if they don't exist
  await query(`ALTER TABLE bbdd_shelies.orders ADD COLUMN IF NOT EXISTS delivered_by VARCHAR(255) DEFAULT ''`, []);
  await query(`ALTER TABLE bbdd_shelies.orders ADD COLUMN IF NOT EXISTS delivery_date DATE`, []);
  console.log("[orders] tabla orders lista");
}

/* ── GET /track — buscar pedido por nro, email o teléfono ── */
router.get("/track", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string ?? "").trim().toLowerCase();
    if (!q) {
      res.status(400).json({ error: "Parámetro q requerido" });
      return;
    }
    const rows = await query(
      `SELECT * FROM bbdd_shelies.orders
       WHERE LOWER(order_number) = $1
          OR LOWER(client_email) = $1
          OR client_phone = $1
       ORDER BY created_at DESC LIMIT 1`,
      [q]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[orders GET /track]", err);
    res.status(500).json({ error: "Error al buscar pedido" });
  }
});

/* ── GET / — lista pedidos ── */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, limit = "100", today, delivery_date } = req.query;
    const params: unknown[] = [];
    const conditions: string[] = [];
    let i = 1;

    if (status) {
      conditions.push(`status = $${i++}`);
      params.push(status);
    }
    if (today === "true") {
      conditions.push(`DATE(created_at) = CURRENT_DATE`);
    }
    if (delivery_date === "today") {
      conditions.push(`delivery_date = CURRENT_DATE`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await query(
      `SELECT * FROM bbdd_shelies.orders ${where} ORDER BY created_at DESC LIMIT ${parseInt(limit as string, 10)}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error("[orders GET]", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

/* ── GET /:id — detalle ── */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT * FROM bbdd_shelies.orders WHERE id::text = $1 OR order_number = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[orders GET/:id]", err);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
});

/* ── POST / — crear pedido manual ── */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      client_name, client_phone = "", client_email = "",
      client_address = "", items, subtotal, discount = 0,
      total, payment_method = "whatsapp", notes = "",
    } = req.body as {
      client_name: string;
      client_phone?: string;
      client_email?: string;
      client_address?: string;
      items: unknown[];
      subtotal: number;
      discount?: number;
      total: number;
      payment_method?: string;
      notes?: string;
    };

    if (!client_name || !items?.length || total === undefined) {
      res.status(400).json({ error: "client_name, items y total son requeridos" });
      return;
    }

    const order_number = `shelies-${Date.now()}-${uuidv4().slice(0, 8)}`;

    const rows = await query(
      `INSERT INTO bbdd_shelies.orders
         (order_number, client_name, client_phone, client_email, client_address,
          items, subtotal, discount, total, status, payment_method, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, 'nuevo', $10, $11, NOW())
       RETURNING *`,
      [
        order_number, client_name, client_phone, client_email, client_address,
        JSON.stringify(items), subtotal, discount, total, payment_method, notes,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[orders POST]", err);
    res.status(500).json({ error: "Error al crear pedido" });
  }
});

/* ── PATCH /:id — actualizar estado / tracking ── */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { status, tracking_code, payment_ref, payment_method, notes, client_address, delivered_by } = req.body as {
      status?: string;
      tracking_code?: string;
      payment_ref?: string;
      payment_method?: string;
      notes?: string;
      client_address?: string;
      delivered_by?: string;
    };

    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (status !== undefined)         { sets.push(`status = $${i++}`);         params.push(status); }
    if (tracking_code !== undefined)  { sets.push(`tracking_code = $${i++}`);  params.push(tracking_code); }
    if (payment_ref !== undefined)    { sets.push(`payment_ref = $${i++}`);    params.push(payment_ref); }
    if (payment_method !== undefined) { sets.push(`payment_method = $${i++}`); params.push(payment_method); }
    if (notes !== undefined)          { sets.push(`notes = $${i++}`);          params.push(notes); }
    if (client_address !== undefined) { sets.push(`client_address = $${i++}`); params.push(client_address); }
    if (delivered_by !== undefined)   { sets.push(`delivered_by = $${i++}`);   params.push(delivered_by); }

    if (sets.length === 0) {
      res.status(400).json({ error: "No hay campos para actualizar" });
      return;
    }

    sets.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const rows = await query(
      `UPDATE bbdd_shelies.orders
       SET ${sets.join(", ")}
       WHERE id::text = $${i} OR order_number = $${i}
       RETURNING *`,
      params
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("[orders PATCH]", err);
    res.status(500).json({ error: "Error al actualizar pedido" });
  }
});

export default router;
