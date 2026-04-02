/**
 * Stylist DB — Turnos, horarios, workflow de citas y métricas de estilistas
 */
import { query, queryOne } from "./db";

/* ──────────────────────────────────────────────────────────
   FASES DE SERVICIO POR TIPO
────────────────────────────────────────────────────────── */
export const SERVICE_PHASES: Record<string, string[]> = {
  "alisado":        ["Recepción","Diagnóstico","Lavado","Secado","Aplicación","Procesamiento","Enjuague","Secado final","Peinado","✅ Finalizado"],
  "botox":          ["Recepción","Diagnóstico","Lavado","Aplicación","Procesamiento","Enjuague","Secado","✅ Finalizado"],
  "reconstruccion": ["Recepción","Diagnóstico","Lavado","Aplicación","Procesamiento","Enjuague","Secado","✅ Finalizado"],
  "repolarizacion": ["Recepción","Lavado","Aplicación","Enjuague","Secado","✅ Finalizado"],
  "scalp":          ["Recepción","Diagnóstico","Aplicación Scalp","Masaje cuero cabelludo","Enjuague","Secado","✅ Finalizado"],
  "corte":          ["Recepción","Lavado","Corte Bordado","Secado","✅ Finalizado"],
  "nano":           ["Recepción","Aplicación","Secado","✅ Finalizado"],
  "default":        ["Recepción","En proceso","Finalización","✅ Finalizado"],
};

export function getPhasesForService(serviceName: string): string[] {
  const lower = serviceName.toLowerCase();
  if (lower.includes("alisado"))        return SERVICE_PHASES["alisado"];
  if (lower.includes("botox"))          return SERVICE_PHASES["botox"];
  if (lower.includes("reconstruc"))     return SERVICE_PHASES["reconstruccion"];
  if (lower.includes("repolariz"))      return SERVICE_PHASES["repolarizacion"];
  if (lower.includes("scalp") || lower.includes("caída") || lower.includes("caida")) return SERVICE_PHASES["scalp"];
  if (lower.includes("corte"))          return SERVICE_PHASES["corte"];
  if (lower.includes("nano") || lower.includes("cristal")) return SERVICE_PHASES["nano"];
  return SERVICE_PHASES["default"];
}

/* ──────────────────────────────────────────────────────────
   TIPOS
────────────────────────────────────────────────────────── */
export interface StylistShift {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  appointments_completed: number;
  shift_date: string;
}

export interface StylistSchedule {
  id: number;
  employee_id: number;
  weekday: number;        // 0=dom,1=lun,...,6=sáb
  time_slot: string;      // "08:00"
  is_available: boolean;
  created_at: string;
}

export interface AppointmentWorkflow {
  id: number;
  appointment_id: number;
  stylist_employee_id: number | null;
  stylist_name: string;
  current_phase: string;
  phase_index: number;
  total_phases: number;
  service_name: string;
  phases_log: Array<{ phase: string; completed_at: string }>;
  client_arrived_at: string | null;
  completed_at: string | null;
  workflow_status: "pendiente" | "en_atencion" | "completado" | "cancelado";
  updated_at: string;
}

/* ──────────────────────────────────────────────────────────
   CREAR TABLAS
────────────────────────────────────────────────────────── */
export async function initStylistTables(): Promise<void> {
  // Turnos de estilistas
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.stylist_shifts (
      id                     SERIAL PRIMARY KEY,
      employee_id            INT NOT NULL,
      employee_name          VARCHAR(255) NOT NULL,
      employee_email         VARCHAR(255) NOT NULL,
      started_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at               TIMESTAMPTZ,
      duration_minutes       INT,
      appointments_completed INT NOT NULL DEFAULT 0,
      shift_date             DATE NOT NULL DEFAULT CURRENT_DATE
    )
  `);

  // Horarios disponibles por estilista
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.stylist_schedules (
      id           SERIAL PRIMARY KEY,
      employee_id  INT NOT NULL,
      weekday      INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      time_slot    VARCHAR(10) NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (employee_id, weekday, time_slot)
    )
  `);

  // Cupos disponibles configurados por el admin
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.stylist_slot_templates (
      id            SERIAL PRIMARY KEY,
      weekday       INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      time_slot     VARCHAR(10) NOT NULL,
      label         VARCHAR(100) DEFAULT '',
      max_capacity  INT NOT NULL DEFAULT 3,
      active        BOOLEAN NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (weekday, time_slot)
    )
  `);

  // Reservas de estilistas en esos cupos (por semana)
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.stylist_slot_bookings (
      id              SERIAL PRIMARY KEY,
      template_id     INT NOT NULL REFERENCES bbdd_shelies.stylist_slot_templates(id) ON DELETE CASCADE,
      employee_id     INT NOT NULL,
      employee_name   VARCHAR(255) NOT NULL,
      week_start_date DATE NOT NULL,
      booked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (template_id, employee_id, week_start_date)
    )
  `);

  // Workflow de citas (columnas adicionales sobre appointments)
  const workflowCols = [
    "ADD COLUMN IF NOT EXISTS stylist_employee_id  INT",
    "ADD COLUMN IF NOT EXISTS stylist_name         VARCHAR(255) DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS service_name         VARCHAR(500) DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS workflow_status      VARCHAR(30)  DEFAULT 'pendiente'",
    "ADD COLUMN IF NOT EXISTS current_phase        VARCHAR(100) DEFAULT ''",
    "ADD COLUMN IF NOT EXISTS phase_index          INT          DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS total_phases         INT          DEFAULT 0",
    "ADD COLUMN IF NOT EXISTS phases_log           JSONB        DEFAULT '[]'",
    "ADD COLUMN IF NOT EXISTS client_arrived_at    TIMESTAMPTZ",
    "ADD COLUMN IF NOT EXISTS completed_at         TIMESTAMPTZ",
  ];
  for (const col of workflowCols) {
    try { await query(`ALTER TABLE bbdd_shelies.appointments ${col}`, []); } catch {}
  }
}

/* ──────────────────────────────────────────────────────────
   TURNOS
────────────────────────────────────────────────────────── */
export async function startStylistShift(
  employeeId: number, employeeName: string, employeeEmail: string
): Promise<StylistShift> {
  // Cerrar turno previo abierto
  await query(`
    UPDATE bbdd_shelies.stylist_shifts
    SET ended_at = NOW(),
        duration_minutes = GREATEST(1, EXTRACT(EPOCH FROM (NOW()-started_at))::int/60)
    WHERE employee_id = $1 AND ended_at IS NULL
  `, [employeeId]);

  const rows = await query<StylistShift>(`
    INSERT INTO bbdd_shelies.stylist_shifts (employee_id, employee_name, employee_email)
    VALUES ($1,$2,$3) RETURNING *
  `, [employeeId, employeeName, employeeEmail]);
  return rows[0];
}

export async function endStylistShift(employeeId: number): Promise<StylistShift | null> {
  const rows = await query<StylistShift>(`
    UPDATE bbdd_shelies.stylist_shifts
    SET ended_at = NOW(),
        duration_minutes = GREATEST(1, EXTRACT(EPOCH FROM (NOW()-started_at))::int/60)
    WHERE employee_id = $1 AND ended_at IS NULL
    RETURNING *
  `, [employeeId]);
  return rows[0] ?? null;
}

export async function getActiveShift(employeeId: number): Promise<StylistShift | null> {
  return queryOne<StylistShift>(`
    SELECT * FROM bbdd_shelies.stylist_shifts
    WHERE employee_id=$1 AND ended_at IS NULL
    ORDER BY started_at DESC LIMIT 1
  `, [employeeId]);
}

export async function getShiftsToday(): Promise<StylistShift[]> {
  return query<StylistShift>(`
    SELECT * FROM bbdd_shelies.stylist_shifts
    WHERE shift_date = CURRENT_DATE ORDER BY started_at DESC
  `);
}

export async function getShiftStats(days = 7): Promise<Array<{
  employee_name: string; employee_email: string; shift_date: string;
  shifts: string; total_minutes: string; total_appointments: string;
}>> {
  return query(`
    SELECT employee_name, employee_email, shift_date::text,
           COUNT(*)::text AS shifts,
           COALESCE(SUM(duration_minutes),0)::text AS total_minutes,
           COALESCE(SUM(appointments_completed),0)::text AS total_appointments
    FROM bbdd_shelies.stylist_shifts
    WHERE shift_date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY employee_name, employee_email, shift_date
    ORDER BY shift_date DESC, employee_name ASC
  `);
}

/* ──────────────────────────────────────────────────────────
   HORARIOS
────────────────────────────────────────────────────────── */
export async function getStylistSchedule(employeeId: number): Promise<StylistSchedule[]> {
  return query<StylistSchedule>(
    `SELECT * FROM bbdd_shelies.stylist_schedules WHERE employee_id=$1 ORDER BY weekday,time_slot`, [employeeId]
  );
}

export async function upsertScheduleSlot(
  employeeId: number, weekday: number, timeSlot: string, isAvailable: boolean
): Promise<void> {
  await query(`
    INSERT INTO bbdd_shelies.stylist_schedules (employee_id, weekday, time_slot, is_available)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (employee_id, weekday, time_slot)
    DO UPDATE SET is_available=$4
  `, [employeeId, weekday, timeSlot, isAvailable]);
}

/* ──────────────────────────────────────────────────────────
   CITAS DEL ESTILISTA
────────────────────────────────────────────────────────── */
export async function getAppointmentsByStylist(stylistName: string): Promise<AppointmentWorkflow[]> {
  // Busca por nombre parcial (datos existentes no tienen employee_id vinculado aún)
  const rows = await query<AppointmentWorkflow>(`
    SELECT
      id, id AS appointment_id,
      COALESCE(stylist_employee_id, 0) AS stylist_employee_id,
      COALESCE(stylist_name, '') AS stylist_name,
      COALESCE(service_name,
        (SELECT title FROM bbdd_shelies.services WHERE id=service_id LIMIT 1),
        notes, '') AS service_name,
      COALESCE(workflow_status, 'pendiente') AS workflow_status,
      COALESCE(current_phase,'') AS current_phase,
      COALESCE(phase_index, 0) AS phase_index,
      COALESCE(total_phases, 0) AS total_phases,
      COALESCE(phases_log,'[]'::jsonb) AS phases_log,
      client_arrived_at, completed_at, updated_at,
      client_name, date, time_slot, status, notes
    FROM bbdd_shelies.appointments
    WHERE LOWER(COALESCE(stylist_name, notes, '')) LIKE LOWER($1)
       OR stylist_employee_id = $2
    ORDER BY date DESC, time_slot ASC
    LIMIT 50
  `, [`%${stylistName.split(" ")[0]}%`, 0]);
  return rows;
}

export async function getAppointmentsToday(stylistName: string, employeeId: number): Promise<unknown[]> {
  return query(`
    SELECT
      id, client_name,
      COALESCE(service_name,
        (SELECT title FROM bbdd_shelies.services WHERE id=service_id LIMIT 1),
        notes, 'Servicio') AS service_name,
      COALESCE(stylist_name,'') AS stylist_name,
      date::text, time_slot, status,
      COALESCE(workflow_status,'pendiente') AS workflow_status,
      COALESCE(current_phase,'') AS current_phase,
      COALESCE(phase_index,0) AS phase_index,
      COALESCE(total_phases,0) AS total_phases,
      COALESCE(phases_log,'[]'::jsonb) AS phases_log,
      client_arrived_at, completed_at, notes,
      deposit_amount, deposit_status
    FROM bbdd_shelies.appointments
    WHERE date = CURRENT_DATE
      AND (stylist_employee_id = $1
           OR LOWER(COALESCE(stylist_name, notes,'')) LIKE LOWER($2))
    ORDER BY time_slot ASC
  `, [employeeId, `%${stylistName.split(" ")[0]}%`]);
}

export async function getAllAppointmentsForStylist(stylistName: string, employeeId: number): Promise<unknown[]> {
  return query(`
    SELECT
      id, client_name,
      COALESCE(service_name,
        (SELECT title FROM bbdd_shelies.services WHERE id=service_id LIMIT 1),
        notes, 'Servicio') AS service_name,
      COALESCE(stylist_name,'') AS stylist_name,
      date::text, time_slot, status,
      COALESCE(workflow_status,'pendiente') AS workflow_status,
      COALESCE(current_phase,'') AS current_phase,
      COALESCE(phase_index,0) AS phase_index,
      COALESCE(total_phases,0) AS total_phases,
      COALESCE(phases_log,'[]'::jsonb) AS phases_log,
      client_arrived_at, completed_at, notes,
      deposit_amount, deposit_status
    FROM bbdd_shelies.appointments
    WHERE stylist_employee_id = $1
       OR LOWER(COALESCE(stylist_name, notes,'')) LIKE LOWER($2)
    ORDER BY date DESC, time_slot ASC
    LIMIT 100
  `, [employeeId, `%${stylistName.split(" ")[0]}%`]);
}

/* ──────────────────────────────────────────────────────────
   WORKFLOW
────────────────────────────────────────────────────────── */
export async function advanceWorkflow(
  appointmentId: number,
  stylistEmployeeId: number,
  stylistName: string,
  phaseName: string,
  phaseIndex: number,
  totalPhases: number,
  serviceName: string
): Promise<void> {
  const isLast = phaseIndex >= totalPhases - 1;
  const nowTs  = new Date().toISOString();

  await query(`
    UPDATE bbdd_shelies.appointments
    SET
      stylist_employee_id = $2,
      stylist_name        = $3,
      service_name        = $7,
      workflow_status     = $4,
      current_phase       = $5,
      phase_index         = $6,
      total_phases        = $8,
      phases_log          = phases_log || $9::jsonb,
      client_arrived_at   = COALESCE(client_arrived_at, CASE WHEN $6=0 THEN NOW() ELSE NULL END),
      completed_at        = CASE WHEN $4='completado' THEN NOW() ELSE completed_at END,
      status              = CASE WHEN $4='completado' THEN 'completado' ELSE status END,
      updated_at          = NOW()
    WHERE id = $1
  `, [
    appointmentId,
    stylistEmployeeId,
    stylistName,
    isLast ? "completado" : "en_atencion",
    phaseName,
    phaseIndex,
    totalPhases,
    serviceName,
    JSON.stringify([{ phase: phaseName, completed_at: nowTs }]),
  ]);

  // Si completó, sumar al turno activo
  if (isLast) {
    await query(`
      UPDATE bbdd_shelies.stylist_shifts
      SET appointments_completed = appointments_completed + 1
      WHERE employee_id = $1 AND ended_at IS NULL
    `, [stylistEmployeeId]);
  }
}

export async function markClientArrived(appointmentId: number): Promise<void> {
  await query(`
    UPDATE bbdd_shelies.appointments
    SET client_arrived_at = NOW(),
        workflow_status = 'en_atencion',
        current_phase = 'Recepción',
        phase_index = 0,
        updated_at = NOW()
    WHERE id = $1
  `, [appointmentId]);
}

/* ──────────────────────────────────────────────────────────
   MÉTRICAS
────────────────────────────────────────────────────────── */
export async function getStylistProductivity(days = 7): Promise<Array<{
  stylist_name: string; shift_date: string;
  appointments_completed: string; avg_duration: string;
}>> {
  return query(`
    SELECT
      employee_name AS stylist_name,
      shift_date::text,
      SUM(appointments_completed)::text AS appointments_completed,
      ROUND(AVG(NULLIF(duration_minutes,0)))::text AS avg_duration
    FROM bbdd_shelies.stylist_shifts
    WHERE shift_date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY employee_name, shift_date
    ORDER BY shift_date DESC, employee_name ASC
  `);
}

/* ──────────────────────────────────────────────────────────
   CUPOS — ADMIN GESTIONA PLANTILLAS
────────────────────────────────────────────────────────── */
export interface SlotTemplate {
  id: number; weekday: number; time_slot: string;
  label: string; max_capacity: number; active: boolean;
}
export interface SlotBooking {
  id: number; template_id: number; employee_id: number;
  employee_name: string; week_start_date: string; booked_at: string;
}
export interface SlotWithBookings extends SlotTemplate {
  bookings: SlotBooking[];
  booked_count: number;
}

export async function getSlotTemplatesWithBookings(weekStart: string): Promise<SlotWithBookings[]> {
  const templates = await query<SlotTemplate>(
    `SELECT * FROM bbdd_shelies.stylist_slot_templates WHERE active=true ORDER BY weekday, time_slot`
  );
  if (templates.length === 0) return [];
  const bookings = await query<SlotBooking>(
    `SELECT * FROM bbdd_shelies.stylist_slot_bookings WHERE week_start_date=$1`,
    [weekStart]
  );
  return templates.map(t => {
    const tBookings = bookings.filter(b => b.template_id === t.id);
    return { ...t, bookings: tBookings, booked_count: tBookings.length };
  });
}

export async function createSlotTemplate(
  weekday: number, timeSlot: string, maxCapacity: number, label: string
): Promise<SlotTemplate> {
  const rows = await query<SlotTemplate>(`
    INSERT INTO bbdd_shelies.stylist_slot_templates (weekday, time_slot, max_capacity, label)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (weekday, time_slot) DO UPDATE SET max_capacity=$3, label=$4, active=true
    RETURNING *
  `, [weekday, timeSlot, maxCapacity, label]);
  return rows[0];
}

export async function deleteSlotTemplate(id: number): Promise<void> {
  await query(`UPDATE bbdd_shelies.stylist_slot_templates SET active=false WHERE id=$1`, [id]);
}

export async function bookSlot(
  templateId: number, employeeId: number, employeeName: string, weekStart: string
): Promise<{ ok: boolean; reason?: string }> {
  const cap = await queryOne<{ max_capacity: number; active: boolean }>(
    `SELECT max_capacity, active FROM bbdd_shelies.stylist_slot_templates WHERE id=$1`, [templateId]
  );
  if (!cap || !cap.active) return { ok: false, reason: "Cupo no disponible" };
  const count = await queryOne<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM bbdd_shelies.stylist_slot_bookings WHERE template_id=$1 AND week_start_date=$2`,
    [templateId, weekStart]
  );
  if (parseInt(count?.n ?? "0") >= cap.max_capacity) return { ok: false, reason: "Cupo lleno" };
  await query(`
    INSERT INTO bbdd_shelies.stylist_slot_bookings (template_id, employee_id, employee_name, week_start_date)
    VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING
  `, [templateId, employeeId, employeeName, weekStart]);
  return { ok: true };
}

export async function unbookSlot(templateId: number, employeeId: number, weekStart: string): Promise<void> {
  await query(
    `DELETE FROM bbdd_shelies.stylist_slot_bookings WHERE template_id=$1 AND employee_id=$2 AND week_start_date=$3`,
    [templateId, employeeId, weekStart]
  );
}

export async function getWeekSlotsForEmployee(
  employeeId: number, weekStart: string
): Promise<Array<SlotTemplate & { booked_count: number; is_mine: boolean; is_full: boolean }>> {
  const rows = await query<SlotTemplate & { booked_count: string; is_mine: string }>(`
    SELECT t.*,
      COUNT(b.id)::text AS booked_count,
      MAX(CASE WHEN b.employee_id=$1 THEN 1 ELSE 0 END)::text AS is_mine
    FROM bbdd_shelies.stylist_slot_templates t
    LEFT JOIN bbdd_shelies.stylist_slot_bookings b
      ON b.template_id=t.id AND b.week_start_date=$2
    WHERE t.active=true
    GROUP BY t.id
    ORDER BY t.weekday, t.time_slot
  `, [employeeId, weekStart]);
  return rows.map(r => ({
    ...r,
    booked_count: parseInt(r.booked_count),
    is_mine: r.is_mine === "1",
    is_full: parseInt(r.booked_count) >= r.max_capacity && r.is_mine !== "1",
  }));
}
