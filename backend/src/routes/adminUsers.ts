import { Router, Request, Response } from "express";
import {
  ensureAdminUsersTables, getAdminUsers,
  createAdminUser, updateAdminUser, deleteAdminUser,
  verifyAdminCredentials,
} from "../lib/admin-users-db";
import { signToken } from "../middleware/auth";

const router = Router();

/* ── Auth ── */
router.post("/auth", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: "Credenciales inválidas" });
      return;
    }
    const user = await verifyAdminCredentials(email, password);
    if (!user) {
      res.status(401).json({ error: "Credenciales incorrectas" });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar });
    res.json({ ok: true, user, token });
  } catch (err) {
    console.error("[admin/auth]", err);
    res.status(503).json({ error: "Error de conexión" });
  }
});

/* ── Users CRUD ── */
router.get("/users", async (_req: Request, res: Response) => {
  try {
    await ensureAdminUsersTables();
    res.json(await getAdminUsers());
  } catch (err) {
    console.error("[admin/users GET]", err);
    res.json([]);
  }
});

router.post("/users", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      name: string; email: string; password: string;
      role: string; avatar: string; phone?: string; bio?: string;
    };
    if (!body.name || !body.email || !body.password) {
      res.status(400).json({ error: "name, email y password son requeridos" });
      return;
    }
    await ensureAdminUsersTables();
    const user = await createAdminUser(body);

    // Si el rol es agente o estilista, también crear en employees para que pueda loguearse en /agente o /estilista
    if (body.role === "agente" || body.role === "estilista") {
      try {
        const bcrypt = await import("bcrypt");
        const passwordHash = await bcrypt.hash(body.password, 12);
        const cargo = body.role === "agente" ? "call_center" : "estilista";
        const { query: dbQuery } = await import("../lib/db");
        const cedula = String(user.id).padStart(10, "0");
        await dbQuery(`
          INSERT INTO bbdd_shelies.employees (cedula, name, cargo, site, email, status, username, password_hash, admin_user_id)
          VALUES ($1, $2, $3, 'SUR', $4, 'activo', $5, $6, $7)
          ON CONFLICT (username) DO UPDATE SET password_hash = $6, status = 'activo', name = $2
        `, [cedula, body.name, cargo, body.email, body.email, passwordHash, user.id]);
      } catch (empErr) {
        console.warn("[admin/users] No se pudo crear en employees:", empErr);
      }
    }

    res.status(201).json(user);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: "El email ya está registrado" });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

router.patch("/users", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.query.id as string ?? "0");
    if (!id) { res.status(400).json({ error: "id requerido" }); return; }
    const updated = await updateAdminUser(id, req.body);
    if (!updated) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

router.delete("/users", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.query.id as string ?? "0");
    if (!id) { res.status(400).json({ error: "id requerido" }); return; }
    await deleteAdminUser(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

export default router;
