import { Router, Request, Response } from "express";
import {
  getServices, getServiceById, createService, updateService, deleteService,
  getStylists,
} from "../lib/db-services";
import { query } from "../lib/db";

const router = Router();

/* ── Servicios ── */
router.get("/", async (_req, res) => {
  try { res.json({ success: true, data: await getServices(false) }); }
  catch { res.status(500).json({ success: false, error: "Error" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const s = await getServiceById(parseInt(req.params.id));
    if (!s) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true, data: s });
  } catch { res.status(500).json({ success: false, error: "Error" }); }
});

router.post("/", async (req, res) => {
  try {
    const s = await createService(req.body);
    res.status(201).json({ success: true, data: s });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(400).json({ success: false, error: msg });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const s = await updateService(parseInt(req.params.id), req.body);
    if (!s) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true, data: s });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(400).json({ success: false, error: msg });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const ok = await deleteService(parseInt(req.params.id));
    if (!ok) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, error: "Error" }); }
});

/* ── Estilistas ── */
router.get("/stylists/list", async (_req, res) => {
  try { res.json({ success: true, data: await getStylists(false) }); }
  catch { res.status(500).json({ success: false, error: "Error" }); }
});

router.post("/stylists", async (req, res) => {
  try {
    const { name, role, photo, specialties, is_active } = req.body;
    const rows = await query(
      `INSERT INTO bbdd_shelies.stylists (name, role, photo, specialties, is_active)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, role ?? "", photo ?? null, JSON.stringify(specialties ?? []), is_active ?? true]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(400).json({ success: false, error: msg });
  }
});

router.patch("/stylists/:id", async (req, res) => {
  try {
    const { name, role, photo, specialties, is_active } = req.body;
    const fields: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (name !== undefined)       { fields.push(`name=$${i++}`);        vals.push(name); }
    if (role !== undefined)       { fields.push(`role=$${i++}`);        vals.push(role); }
    if (photo !== undefined)      { fields.push(`photo=$${i++}`);       vals.push(photo); }
    if (specialties !== undefined){ fields.push(`specialties=$${i++}`); vals.push(JSON.stringify(specialties)); }
    if (is_active !== undefined)  { fields.push(`is_active=$${i++}`);   vals.push(is_active); }
    if (fields.length === 0) { res.status(400).json({ success: false, error: "Sin campos" }); return; }
    vals.push(parseInt(req.params.id));
    const rows = await query(
      `UPDATE bbdd_shelies.stylists SET ${fields.join(",")} WHERE id=$${i} RETURNING *`, vals
    );
    if (!rows[0]) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(400).json({ success: false, error: msg });
  }
});

router.delete("/stylists/:id", async (req, res) => {
  try {
    const rows = await query(`DELETE FROM bbdd_shelies.stylists WHERE id=$1 RETURNING id`, [parseInt(req.params.id)]);
    if (!rows[0]) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, error: "Error" }); }
});

export default router;
