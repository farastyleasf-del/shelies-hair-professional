import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  getEmployees, getEmployee, updateEmployee,
  startSession, endSession, getSessionsToday, getSessionStats, getChatStats,
  getEmployeeByUsername,
} from "../lib/employees-db";
import { query } from "../lib/db";
import { signToken } from "../middleware/auth";

const router = Router();

/* ── POST /api/employees/auth ── login por username (nombre.apellido) + contraseña individual o compartida */
router.post("/auth", async (req: Request, res: Response) => {
  const { name, password } = req.body as { name?: string; password?: string };
  if (!name || !password) { res.status(400).json({ error: "Usuario y contraseña requeridos" }); return; }

  try {
    // Busca por username exacto primero, luego por tokens de nombre
    let emp = await getEmployeeByUsername(name.trim().toLowerCase());
    if (!emp) {
      const emps = await getEmployees();
      const tokens = name.trim().toLowerCase().split(/[\s.]+/).filter(Boolean);
      emp = emps.find(e => {
        const parts = e.name.toLowerCase().split(/\s+/);
        return tokens.every(t => parts.some(p => p.startsWith(t)));
      }) ?? null;
    }
    if (!emp) { res.status(401).json({ error: "Usuario no encontrado" }); return; }
    if (emp.status !== "activo") { res.status(403).json({ error: "Usuario inactivo" }); return; }

    // Verificar contraseña: individual (bcrypt) o compartida (texto plano fallback)
    let ok = false;
    if (emp.password_hash) {
      ok = await bcrypt.compare(password, emp.password_hash);
    }
    if (!ok) {
      const sharedPw = process.env.SHARED_EMPLOYEE_PASSWORD ?? "shelies2026";
      ok = (password === sharedPw);
    }
    if (!ok) { res.status(401).json({ error: "Contraseña incorrecta" }); return; }

    const token = signToken({
      id: emp.id, email: emp.username ?? emp.cedula,
      name: emp.name, role: emp.cargo, avatar: "✂️",
    });
    res.json({ employee: emp, token });
  } catch (err) {
    console.error("[employees auth]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── GET /api/employees ── lista todos o filtra por ?cargo=estilista|call_center */
router.get("/", async (req: Request, res: Response) => {
  try {
    const cargo = req.query.cargo as string | undefined;
    res.json(await getEmployees(cargo));
  } catch (err) {
    console.error("[employees GET]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── GET /api/employees/:id ── */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const emp = await getEmployee(parseInt(req.params.id));
    if (!emp) { res.status(404).json({ error: "No encontrado" }); return; }
    res.json(emp);
  } catch (err) {
    console.error("[employees GET id]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── PATCH /api/employees/:id ── */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const updated = await updateEmployee(parseInt(req.params.id), req.body);
    if (!updated) { res.status(404).json({ error: "No encontrado" }); return; }
    res.json(updated);
  } catch (err) {
    console.error("[employees PATCH]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── POST /api/employees/sessions/start ── */
router.post("/sessions/start", async (req: Request, res: Response) => {
  try {
    const { userId, userName, userEmail } = req.body as {
      userId: number; userName: string; userEmail: string;
    };
    if (!userId || !userName || !userEmail) {
      res.status(400).json({ error: "userId, userName y userEmail requeridos" }); return;
    }
    const session = await startSession(userId, userName, userEmail);
    res.json(session);
  } catch (err) {
    console.error("[sessions start]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── POST /api/employees/sessions/end ── */
router.post("/sessions/end", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId: number };
    if (!userId) { res.status(400).json({ error: "userId requerido" }); return; }
    const session = await endSession(userId);
    res.json(session ?? { status: "no_open_session" });
  } catch (err) {
    console.error("[sessions end]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── DELETE /api/employees/sessions/reset — admin reset turno de un agente ── */
router.delete("/sessions/reset", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.userId as string, 10);
    if (!userId) { res.status(400).json({ error: "userId requerido" }); return; }
    // Cerrar todas las sesiones abiertas de hoy para este usuario
    const rows = await query(`
      UPDATE bbdd_shelies.agent_sessions
      SET ended_at = NOW(),
          duration_minutes = GREATEST(1, EXTRACT(EPOCH FROM (NOW() - started_at))::int / 60)
      WHERE user_id = $1 AND ended_at IS NULL
      RETURNING *
    `, [userId]);
    // Eliminar sesiones de hoy (reset completo)
    await query(`
      DELETE FROM bbdd_shelies.agent_sessions
      WHERE user_id = $1 AND session_date = CURRENT_DATE
    `, [userId]);
    res.json({ ok: true, cleared: rows.length });
  } catch (err) {
    console.error("[sessions reset]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── GET /api/employees/sessions/today ── */
router.get("/sessions/today", async (_req: Request, res: Response) => {
  try {
    res.json(await getSessionsToday());
  } catch (err) {
    console.error("[sessions today]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── GET /api/employees/sessions/stats?days=7 ── */
router.get("/sessions/stats", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string ?? "7");
    res.json(await getSessionStats(days));
  } catch (err) {
    console.error("[sessions stats]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── GET /api/employees/sessions/chat-stats?days=7 ── */
router.get("/sessions/chat-stats", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string ?? "7");
    res.json(await getChatStats(days));
  } catch (err) {
    console.error("[chat stats]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
