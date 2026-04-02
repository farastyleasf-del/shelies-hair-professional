/**
 * Contacto — bbdd_shelies.contact_messages
 *
 * POST /api/contact   → guarda mensaje de contacto
 * GET  /api/contact   → lista mensajes (admin)
 */
import { Router, Request, Response } from "express";
import { query } from "../lib/db";

const router = Router();

/* ── Crear tabla si no existe ── */
export async function initContactTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.contact_messages (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      email       VARCHAR(255) NOT NULL,
      subject     VARCHAR(500) DEFAULT '',
      message     TEXT NOT NULL,
      status      VARCHAR(50)  DEFAULT 'nuevo',
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    )
  `, []);
  console.log("[contact] tabla contact_messages lista");
}

/* ── POST / — nuevo mensaje ── */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, subject = "", message } = req.body as {
      name: string;
      email: string;
      subject?: string;
      message: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      res.status(400).json({ error: "name, email y message son requeridos" });
      return;
    }

    const rows = await query(
      `INSERT INTO bbdd_shelies.contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    res.status(201).json({ ok: true, id: (rows[0] as { id: number }).id });
  } catch (err) {
    console.error("[contact POST]", err);
    res.status(500).json({ error: "Error al guardar el mensaje" });
  }
});

/* ── GET / — listar mensajes (admin) ── */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT * FROM bbdd_shelies.contact_messages ORDER BY created_at DESC LIMIT 200`,
      []
    );
    res.json(rows);
  } catch (err) {
    console.error("[contact GET]", err);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

export default router;
