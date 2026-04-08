"use client";

import { useEffect, useState } from "react";
import { apiUrl, stylistFetch } from "@/lib/api";
import type { StylistUser } from "../layout";

// ─── Paleta ───────────────────────────────────────────────
const P = {
  bg:          "#FAF7F4",
  bgCard:      "#FFFFFF",
  bgSubtle:    "#F5F0EC",
  vino:        "#8B3A4A",
  vinoDeep:    "#5E2430",
  vinoLight:   "#F5EAEC",
  dorado:      "#C9A46A",
  doradoDeep:  "#A07C45",
  doradoLight: "#FDF6E8",
  text:        "#1E0F0A",
  textMed:     "#5C3A30",
  textMuted:   "#957068",
  textFaint:   "#C4A99F",
  border:      "#EAE0DA",
  borderLight: "#F3EDE9",
  shadow:      "0 4px 20px rgba(94,36,48,0.07)",
};

const HOURS = ["08:00","12:00","16:00"];
const DAY_NAMES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getWeekDays(anchor: Date) {
  const day = anchor.getDay();
  const monday = addDays(anchor, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const TODAY = toDateStr(new Date());

interface Appointment {
  id: number;
  client_name: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
  workflow_status?: string;
  phase_index?: number;
  total_phases?: number;
  phases_log?: string[];
  price?: number;
  notes?: string;
  client_phone?: string;
}

const WF_STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pendiente:   { bg: P.doradoLight, color: P.doradoDeep, border: "#F5E0A8",  label: "Pendiente" },
  en_atencion: { bg: "#EEF2FF",     color: "#4F46E5",    border: "#C7D2FE",  label: "En atención" },
  completado:  { bg: "#F0FDF4",     color: "#16A34A",    border: "#BBF7D0",  label: "Completada" },
  cancelado:   { bg: "#FEF2F2",     color: "#DC2626",    border: "#FECACA",  label: "Cancelada" },
  confirmed:   { bg: "#EFF6FF",     color: "#1D4ED8",    border: "#BFDBFE",  label: "Confirmada" },
  pending:     { bg: P.doradoLight, color: P.doradoDeep, border: "#F5E0A8",  label: "Pendiente" },
  completed:   { bg: "#F0FDF4",     color: "#16A34A",    border: "#BBF7D0",  label: "Completada" },
  cancelled:   { bg: "#FEF2F2",     color: "#DC2626",    border: "#FECACA",  label: "Cancelada" },
};

function effectiveStatus(a: Appointment): string {
  return a.workflow_status ?? a.status ?? "pendiente";
}

function timeToHour(t: string): number {
  const parts = t.trim().split(" ");
  const [hStr] = parts[0].split(":");
  let h = parseInt(hStr, 10);
  if (parts[1]) {
    const period = parts[1].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
  }
  return h;
}

// ─── Workflow stepper ─────────────────────────────────────
function WorkflowStepper({
  appt,
  user,
  onUpdated,
}: {
  appt: Appointment;
  user: StylistUser;
  onUpdated: (updated: Appointment) => void;
}) {
  const [phases, setPhases]   = useState<string[]>([]);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState("");

  const ws = effectiveStatus(appt);
  const isCompleted = ws === "completado" || ws === "completed";
  const isCancelled = ws === "cancelado" || ws === "cancelled";

  useEffect(() => {
    if (!appt.service_name) return;
    stylistFetch(apiUrl(`/api/stylist/workflow/phases?service=${encodeURIComponent(appt.service_name)}`))
      .then(r => r.json())
      .then(d => setPhases(Array.isArray(d) ? d : d.phases ?? []))
      .catch(() => {});
  }, [appt.service_name]);

  async function handleArrived() {
    setBusy(true); setMsg("");
    try {
      const r = await stylistFetch(apiUrl("/api/stylist/workflow/arrived"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appt.id }),
      });
      if (r.ok) {
        const d = await r.json();
        onUpdated({ ...appt, workflow_status: "en_atencion", phase_index: 0, ...d.appointment });
        setMsg("Cliente en atención");
      }
    } catch { setMsg("Error al actualizar"); } finally { setBusy(false); }
  }

  async function handleAdvance() {
    if (!phases.length) return;
    const currentIndex = appt.phase_index ?? 0;
    const nextIndex = currentIndex + 1;
    const phaseName = phases[currentIndex] ?? `Fase ${currentIndex + 1}`;
    const totalPhases = phases.length;

    setBusy(true); setMsg("");
    try {
      const r = await stylistFetch(apiUrl("/api/stylist/workflow/advance"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt.id,
          stylistEmployeeId: user.id,
          stylistName: user.name,
          phaseName,
          phaseIndex: nextIndex,
          totalPhases,
          serviceName: appt.service_name,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const isDone = nextIndex >= totalPhases;
        onUpdated({
          ...appt,
          workflow_status: isDone ? "completado" : "en_atencion",
          phase_index: nextIndex,
          total_phases: totalPhases,
          ...d.appointment,
        });
        setMsg(isDone ? "Servicio completado" : `Fase "${phaseName}" completada`);
      }
    } catch { setMsg("Error al avanzar fase"); } finally { setBusy(false); }
  }

  const phaseIndex = appt.phase_index ?? 0;
  const totalPhases = appt.total_phases ?? phases.length;
  const allPhasesLabel = phases.length > 0
    ? `Fase ${Math.min(phaseIndex + 1, phases.length)} / ${phases.length}`
    : null;

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${P.borderLight}` }}>
      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: "0 0 12px" }}>Workflow</p>

      {/* Phases pills */}
      {phases.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {phases.map((ph, i) => {
            const done = i < phaseIndex;
            const current = i === phaseIndex && ws === "en_atencion";
            return (
              <span key={i} style={{
                fontSize: 10, padding: "4px 10px", borderRadius: 20, fontWeight: 600,
                background: done ? P.vinoLight : current ? `linear-gradient(135deg,${P.vinoDeep},${P.vino})` : P.bgSubtle,
                color: done ? P.vino : current ? "#fff" : P.textFaint,
                border: `1px solid ${done ? P.vino + "40" : current ? "transparent" : P.border}`,
              }}>
                {done && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {ph}
              </span>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {(ws === "pendiente" || ws === "pending" || ws === "confirmed") && (
          <button
            onClick={handleArrived}
            disabled={busy}
            style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: busy ? "wait" : "pointer", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, color: "#fff", fontSize: 12, fontWeight: 600, opacity: busy ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
          >
            {busy && <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>}
            Cliente llegó — iniciar
          </button>
        )}

        {ws === "en_atencion" && !isCompleted && (
          <button
            onClick={handleAdvance}
            disabled={busy}
            style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: busy ? "wait" : "pointer", background: `linear-gradient(135deg,${P.doradoDeep},${P.dorado})`, color: "#fff", fontSize: 12, fontWeight: 600, opacity: busy ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}
          >
            {busy && <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>}
            {allPhasesLabel ? `Completar ${allPhasesLabel}` : "Avanzar fase"}
          </button>
        )}

        {isCompleted && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16A34A", fontSize: 12, fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
            Servicio completado
          </div>
        )}

        {isCancelled && (
          <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 500 }}>Cita cancelada</span>
        )}
      </div>

      {msg && <p style={{ fontSize: 12, color: P.vino, marginTop: 8, fontWeight: 500 }}>{msg}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function CitasPage() {
  const [user, setUser]         = useState<StylistUser | null>(null);
  const [anchor, setAnchor]     = useState(new Date());
  const [appts, setAppts]       = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const weekDays = getWeekDays(anchor);
  const weekLabel = `${weekDays[0].toLocaleDateString("es-CO", { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("estilista_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    stylistFetch(apiUrl(`/api/stylist/appointments/all?employeeId=${user.id}`))
      .then(r => r.json())
      .then(d => { if (!cancelled) { const raw = d.data ?? d ?? []; setAppts(raw.map((a: Record<string, unknown>) => ({ ...a, time: a.time ?? a.time_slot ?? "", date: a.date ? String(a.date).slice(0, 10) : "" }))); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id, anchor]);

  function getAppts(dateStr: string, hour: string) {
    const hourNum = parseInt(hour.split(":")[0], 10);
    return appts.filter(a => a.date === dateStr && timeToHour(a.time) === hourNum);
  }

  function handleUpdated(updated: Appointment) {
    setAppts(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelected(updated);
  }

  const weekTotal = appts.filter(
    a => a.date >= toDateStr(weekDays[0]) && a.date <= toDateStr(weekDays[6]) && a.status !== "cancelled" && a.workflow_status !== "cancelado"
  ).length;
  const weekCompleted = appts.filter(
    a => a.date >= toDateStr(weekDays[0]) && a.date <= toDateStr(weekDays[6]) && (a.status === "completed" || a.workflow_status === "completado")
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header + nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textFaint, margin: "0 0 4px" }}>Mis citas</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: P.text, margin: 0 }}>
              Calendario{user?.name ? ` — ${user.name.split(" ")[0]}` : ""}
            </h1>
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 4, background: P.bgSubtle, borderRadius: 12, padding: 4, border: `1px solid ${P.border}` }}>
            {(["calendar", "list"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: viewMode === mode ? P.bgCard : "transparent",
                  color: viewMode === mode ? P.vino : P.textFaint,
                  boxShadow: viewMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  display: "flex", alignItems: "center", gap: 6, transition: "all .15s",
                }}
              >
                {mode === "calendar"
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Calendario</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> Lista</>
                }
              </button>
            ))}
          </div>
        </div>
        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setAnchor(d => addDays(d, -7))}
            style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${P.border}`, background: P.bgCard, color: P.textMed, fontSize: 13, cursor: "pointer", fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            ‹ Anterior
          </button>
          <span style={{ fontSize: 12, color: P.textMuted, minWidth: 180, textAlign: "center", fontWeight: 500 }}>{weekLabel}</span>
          <button
            onClick={() => setAnchor(d => addDays(d, 7))}
            style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${P.border}`, background: P.bgCard, color: P.textMed, fontSize: 13, cursor: "pointer", fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            Siguiente ›
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${P.vino}40`, background: P.vinoLight, color: P.vino, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Week stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ borderRadius: 12, border: `1px solid ${P.border}`, background: P.bgCard, padding: "10px 18px", textAlign: "center", boxShadow: P.shadow }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: P.text, margin: "0 0 2px", fontFamily: "'Playfair Display', serif" }}>{weekTotal}</p>
          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: 0 }}>Citas semana</p>
        </div>
        <div style={{ borderRadius: 12, border: `1px solid ${P.border}`, background: P.bgCard, padding: "10px 18px", textAlign: "center", boxShadow: P.shadow }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#16A34A", margin: "0 0 2px", fontFamily: "'Playfair Display', serif" }}>{weekCompleted}</p>
          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: 0 }}>Completadas</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {(Object.entries(WF_STATUS_STYLE) as [string, typeof WF_STATUS_STYLE[string]][])
            .filter((_, i) => i < 4)
            .map(([k, s]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: P.textMuted }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }}/>
                {s.label}
              </div>
            ))}
        </div>
        {loading && <p style={{ fontSize: 11, color: P.textFaint }}>Cargando…</p>}
      </div>

      {/* Empty state — only in calendar mode */}
      {!loading && appts.length === 0 && viewMode === "calendar" && (
        <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, padding: "56px 0", textAlign: "center", boxShadow: P.shadow }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p style={{ fontSize: 14, color: P.textMuted, margin: "0 0 4px" }}>Sin citas esta semana</p>
          <p style={{ fontSize: 12, color: P.textFaint, margin: 0 }}>Las reservas aparecerán aquí automáticamente</p>
        </div>
      )}

      {/* ── Lista view ── */}
      {viewMode === "list" && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {appts.length === 0 ? (
            <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, padding: "56px 0", textAlign: "center", boxShadow: P.shadow }}>
              <p style={{ fontSize: 14, color: P.textMuted, margin: 0 }}>Sin citas esta semana</p>
            </div>
          ) : (() => {
            const weekAppts = appts
              .filter(a => a.date >= toDateStr(weekDays[0]) && a.date <= toDateStr(weekDays[6]))
              .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.time ?? "").localeCompare(b.time ?? ""));
            const byDay: Record<string, Appointment[]> = {};
            weekAppts.forEach(a => { byDay[a.date] = [...(byDay[a.date] ?? []), a]; });
            return Object.entries(byDay).map(([date, dayAppts]) => {
              const d = new Date(date + "T12:00:00");
              const isToday = date === TODAY;
              const dayLabel = d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
              return (
                <div key={date} style={{ borderRadius: 16, border: `1px solid ${isToday ? P.vino + "40" : P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow }}>
                  <div style={{ padding: "12px 20px", background: isToday ? P.vinoLight : P.bgSubtle, borderBottom: `1px solid ${isToday ? P.vino + "25" : P.borderLight}`, display: "flex", alignItems: "center", gap: 10 }}>
                    {isToday && <div style={{ width: 8, height: 8, borderRadius: "50%", background: P.vino, flexShrink: 0 }}/>}
                    <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? P.vino : P.textMed, textTransform: "capitalize" }}>{dayLabel}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: P.textFaint, background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 20, padding: "2px 8px" }}>{dayAppts.length} cita{dayAppts.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div>
                    {dayAppts.map((a, idx) => {
                      const ws = effectiveStatus(a);
                      const st = WF_STATUS_STYLE[ws] ?? WF_STATUS_STYLE["pendiente"];
                      const isSelected = selected?.id === a.id;
                      return (
                        <div
                          key={a.id}
                          onClick={() => setSelected(isSelected ? null : a)}
                          style={{
                            display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                            borderTop: idx > 0 ? `1px solid ${P.borderLight}` : "none",
                            cursor: "pointer", transition: "background .12s",
                            background: isSelected ? P.vinoLight : "transparent",
                            borderLeft: `4px solid ${st.color}`,
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = P.bgSubtle; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <div style={{ minWidth: 52, textAlign: "center", flexShrink: 0 }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: P.vino, margin: 0, fontVariantNumeric: "tabular-nums" }}>{a.time}</p>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: P.text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.client_name}</p>
                            <p style={{ fontSize: 12, color: P.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "middle" }}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                              {a.service_name}
                            </p>
                          </div>
                          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{st.label}</span>
                            {(ws === "pendiente" || ws === "pending" || ws === "confirmed") && (
                              <span style={{ fontSize: 10, color: P.textFaint }}>→ Iniciar</span>
                            )}
                            {(ws === "completado" || ws === "completed") && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Calendar grid */}
      {viewMode === "calendar" && <div style={{ overflowX: "auto", borderRadius: 16, border: `1px solid ${P.border}`, boxShadow: P.shadow }}>
        <div style={{ minWidth: 700 }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: `1px solid ${P.border}`, background: P.bgSubtle }}>
            <div style={{ padding: "12px 8px" }} />
            {weekDays.map((d, i) => {
              const isToday = toDateStr(d) === TODAY;
              return (
                <div key={i} style={{ padding: "12px 4px", textAlign: "center", background: isToday ? P.vinoLight : "transparent" }}>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: "0 0 3px" }}>{DAY_NAMES[i]}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: isToday ? P.vino : P.textMed, margin: 0, fontFamily: "'Playfair Display', serif" }}>{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          {HOURS.map(hour => (
            <div key={hour} style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: `1px solid ${P.borderLight}` }}>
              <div style={{ padding: "10px 8px", textAlign: "right" }}>
                <p style={{ fontSize: 9, color: P.textFaint, margin: 0 }}>{hour}</p>
              </div>
              {weekDays.map((d, di) => {
                const dateStr = toDateStr(d);
                const cell = getAppts(dateStr, hour);
                const isToday = dateStr === TODAY;
                return (
                  <div key={di} style={{ minHeight: 50, borderLeft: `1px solid ${P.borderLight}`, padding: 4, background: isToday ? "rgba(139,58,74,.02)" : "transparent" }}>
                    {cell.map(a => {
                      const ws = effectiveStatus(a);
                      const st = WF_STATUS_STYLE[ws] ?? WF_STATUS_STYLE["pendiente"];
                      const isSelected = selected?.id === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setSelected(isSelected ? null : a)}
                          style={{
                            display: "block", width: "100%", marginBottom: 3, padding: "5px 7px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                            border: `1px solid ${isSelected ? P.vino : st.border}`,
                            background: isSelected ? P.vinoLight : st.bg,
                            outline: "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, flexShrink: 0 }}/>
                            <span style={{ fontSize: 10, fontWeight: 600, color: P.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.client_name.split(" ")[0]}
                            </span>
                          </div>
                          <p style={{ fontSize: 9, color: P.textMuted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.time}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>}

      {/* Detail panel */}
      {selected && (() => {
        const ws = effectiveStatus(selected);
        const st = WF_STATUS_STYLE[ws] ?? WF_STATUS_STYLE["pendiente"];
        return (
          <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow }}>
            {/* Gradient header */}
            <div style={{ background: `linear-gradient(135deg, ${P.vinoDeep}, ${P.vino})`, padding: "20px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>{selected.client_name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.2)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {st.label}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    {selected.date} · {selected.time}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, fontSize: 13, marginBottom: 4 }}>
                <div>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: "0 0 4px" }}>Servicio</p>
                  <p style={{ color: P.text, margin: 0, fontWeight: 600 }}>{selected.service_name}</p>
                </div>
                {selected.price != null && (
                  <div>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: "0 0 4px" }}>Valor</p>
                    <p style={{ color: P.vino, margin: 0, fontWeight: 700, fontSize: 16 }}>${(selected.price ?? 0).toLocaleString("es-CO")}</p>
                  </div>
                )}
                {selected.client_phone && (
                  <div>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: "0 0 4px" }}>Teléfono</p>
                    <a href={`tel:${selected.client_phone}`} style={{ color: P.vino, margin: 0, fontWeight: 500, textDecoration: "none" }}>{selected.client_phone}</a>
                  </div>
                )}
                {selected.notes && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, margin: "0 0 4px" }}>Notas</p>
                    <p style={{ color: P.textMed, margin: 0 }}>{selected.notes}</p>
                  </div>
                )}
              </div>

              {user && (
                <WorkflowStepper appt={selected} user={user} onUpdated={handleUpdated} />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
