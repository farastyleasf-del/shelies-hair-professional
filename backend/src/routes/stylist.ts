import { Router } from "express";
import {
  initStylistTables,
  startStylistShift, endStylistShift, getActiveShift,
  getShiftsToday, getShiftStats,
  getStylistSchedule, upsertScheduleSlot,
  getAppointmentsToday, getAllAppointmentsForStylist,
  advanceWorkflow, markClientArrived,
  getStylistProductivity,
  getPhasesForService,
  getSlotTemplatesWithBookings, createSlotTemplate, deleteSlotTemplate,
  bookSlot, unbookSlot, getWeekSlotsForEmployee,
} from "../lib/stylist-db";

const router = Router();

/* ── Init tables on first import ── */
initStylistTables().catch(e => console.warn("[stylist init]", e));

/* ──────────────────────────────────────────────────────────
   TURNOS
────────────────────────────────────────────────────────── */

// POST /api/stylist/shifts/start
router.post("/shifts/start", async (req, res) => {
  const { employeeId, employeeName, employeeEmail } = req.body as {
    employeeId: number; employeeName: string; employeeEmail: string;
  };
  if (!employeeId || !employeeName) {
    return res.status(400).json({ error: "employeeId y employeeName requeridos" });
  }
  try {
    const shift = await startStylistShift(employeeId, employeeName, employeeEmail ?? "");
    res.json(shift);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/stylist/shifts/end
router.post("/shifts/end", async (req, res) => {
  const { employeeId } = req.body as { employeeId: number };
  if (!employeeId) return res.status(400).json({ error: "employeeId requerido" });
  try {
    const shift = await endStylistShift(employeeId);
    res.json(shift ?? { message: "Sin turno activo" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/stylist/shifts/active/:employeeId
router.get("/shifts/active/:employeeId", async (req, res) => {
  const empId = parseInt(req.params.employeeId);
  try {
    const shift = await getActiveShift(empId);
    res.json(shift ?? null);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/stylist/shifts/today
router.get("/shifts/today", async (_req, res) => {
  try {
    res.json(await getShiftsToday());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/stylist/shifts/stats?days=7
router.get("/shifts/stats", async (req, res) => {
  const days = parseInt(String(req.query.days ?? "7"));
  try {
    res.json(await getShiftStats(days));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ──────────────────────────────────────────────────────────
   HORARIOS
────────────────────────────────────────────────────────── */

// GET /api/stylist/schedule/:employeeId
router.get("/schedule/:employeeId", async (req, res) => {
  const empId = parseInt(req.params.employeeId);
  try {
    res.json(await getStylistSchedule(empId));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// PUT /api/stylist/schedule/:employeeId
router.put("/schedule/:employeeId", async (req, res) => {
  const empId = parseInt(req.params.employeeId);
  const { slots } = req.body as {
    slots: Array<{ weekday: number; timeSlot: string; isAvailable: boolean }>;
  };
  if (!Array.isArray(slots)) return res.status(400).json({ error: "slots[] requerido" });
  try {
    for (const s of slots) {
      await upsertScheduleSlot(empId, s.weekday, s.timeSlot, s.isAvailable);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ──────────────────────────────────────────────────────────
   CITAS
────────────────────────────────────────────────────────── */

// GET /api/stylist/appointments/today?name=X&employeeId=Y
router.get("/appointments/today", async (req, res) => {
  const name  = String(req.query.name ?? "");
  const empId = parseInt(String(req.query.employeeId ?? "0"));
  try {
    res.json(await getAppointmentsToday(name, empId));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/stylist/appointments/all?name=X&employeeId=Y
router.get("/appointments/all", async (req, res) => {
  const name  = String(req.query.name ?? "");
  const empId = parseInt(String(req.query.employeeId ?? "0"));
  try {
    res.json(await getAllAppointmentsForStylist(name, empId));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ──────────────────────────────────────────────────────────
   WORKFLOW
────────────────────────────────────────────────────────── */

// POST /api/stylist/workflow/advance
router.post("/workflow/advance", async (req, res) => {
  const { appointmentId, stylistEmployeeId, stylistName,
          phaseName, phaseIndex, totalPhases, serviceName } = req.body as {
    appointmentId: number; stylistEmployeeId: number; stylistName: string;
    phaseName: string; phaseIndex: number; totalPhases: number; serviceName: string;
  };
  try {
    await advanceWorkflow(
      appointmentId, stylistEmployeeId, stylistName,
      phaseName, phaseIndex, totalPhases, serviceName
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// POST /api/stylist/workflow/arrived
router.post("/workflow/arrived", async (req, res) => {
  const { appointmentId } = req.body as { appointmentId: number };
  try {
    await markClientArrived(appointmentId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// GET /api/stylist/workflow/phases?service=alisado
router.get("/workflow/phases", (req, res) => {
  const service = String(req.query.service ?? "");
  res.json(getPhasesForService(service));
});

/* ──────────────────────────────────────────────────────────
   MÉTRICAS
────────────────────────────────────────────────────────── */

// GET /api/stylist/productivity?days=7
router.get("/productivity", async (req, res) => {
  const days = parseInt(String(req.query.days ?? "7"));
  try {
    res.json(await getStylistProductivity(days));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* ──────────────────────────────────────────────────────────
   CUPOS DE HORARIO (admin configura, estilistas reservan)
────────────────────────────────────────────────────────── */

// GET /api/stylist/slots?week=2026-03-31        → slots con bookings para esa semana
router.get("/slots", async (req, res) => {
  const week = String(req.query.week ?? new Date().toISOString().slice(0, 10));
  try { res.json(await getSlotTemplatesWithBookings(week)); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// GET /api/stylist/slots/my?employeeId=X&week=YYYY-MM-DD
router.get("/slots/my", async (req, res) => {
  const empId = parseInt(String(req.query.employeeId ?? "0"));
  const week  = String(req.query.week ?? new Date().toISOString().slice(0, 10));
  if (!empId) return res.status(400).json({ error: "employeeId requerido" });
  try { res.json(await getWeekSlotsForEmployee(empId, week)); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// POST /api/stylist/slots  { weekday, timeSlot, maxCapacity, label }
router.post("/slots", async (req, res) => {
  const { weekday, timeSlot, maxCapacity = 3, label = "" } = req.body as {
    weekday: number; timeSlot: string; maxCapacity?: number; label?: string;
  };
  if (weekday == null || !timeSlot) return res.status(400).json({ error: "weekday y timeSlot requeridos" });
  try { res.json(await createSlotTemplate(weekday, timeSlot, maxCapacity, label)); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// DELETE /api/stylist/slots/:id
router.delete("/slots/:id", async (req, res) => {
  try { await deleteSlotTemplate(parseInt(req.params.id)); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// POST /api/stylist/slots/book  { templateId, employeeId, employeeName, weekStart }
router.post("/slots/book", async (req, res) => {
  const { templateId, employeeId, employeeName, weekStart } = req.body as {
    templateId: number; employeeId: number; employeeName: string; weekStart: string;
  };
  try { res.json(await bookSlot(templateId, employeeId, employeeName, weekStart)); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// POST /api/stylist/slots/unbook  { templateId, employeeId, weekStart }
router.post("/slots/unbook", async (req, res) => {
  const { templateId, employeeId, weekStart } = req.body as {
    templateId: number; employeeId: number; weekStart: string;
  };
  try { await unbookSlot(templateId, employeeId, weekStart); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

export default router;
