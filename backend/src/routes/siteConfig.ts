/**
 * Site Config — key/value para configuración del sitio
 * Tabla: bbdd_shelies.site_config
 */
import { Router, Request, Response } from "express";
import { query } from "../lib/db";

const router = Router();

export async function initSiteConfigTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.site_config (
      key   VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `, []);
  console.log("[site-config] tabla lista");
}

/* GET / — obtener toda la config (público) */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await query<{ key: string; value: string }>(`SELECT key, value FROM bbdd_shelies.site_config`, []);
    const config: Record<string, string> = {};
    for (const r of rows) config[r.key] = r.value;
    res.json(config);
  } catch (err) {
    console.error("[site-config GET]", err);
    res.json({});
  }
});

/* PUT / — guardar config (admin) */
router.put("/", async (req: Request, res: Response) => {
  try {
    const entries = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(entries)) {
      await query(`
        INSERT INTO bbdd_shelies.site_config (key, value, updated_at) VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
      `, [key, value]);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[site-config PUT]", err);
    res.status(500).json({ error: "Error al guardar" });
  }
});

export default router;
