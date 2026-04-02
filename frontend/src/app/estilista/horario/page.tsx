"use client";

import { useEffect, useState, useCallback } from "react";
import { apiUrl, stylistFetch } from "@/lib/api";
import type { StylistUser } from "../layout";

const P = {
  bg: "#FAF7F4", bgCard: "#FFFFFF", bgSubtle: "#F5F0EC",
  vino: "#8B3A4A", vinoDeep: "#5E2430", vinoLight: "#F5EAEC",
  dorado: "#C9A46A", doradoDeep: "#A07C45", doradoLight: "#FDF6E8",
  text: "#1E0F0A", textMed: "#5C3A30", textMuted: "#957068", textFaint: "#C4A99F",
  border: "#EAE0DA", borderLight: "#F3EDE9", shadow: "0 4px 20px rgba(94,36,48,0.07)",
};

/* Slot que devuelve /api/stylist/slots/my */
interface WeekSlot {
  id: number;
  weekday: number;      // 1=Lun … 7=Dom (ISO) — puede venir como 0=Dom,1=Lun según backend
  time_slot: string;    // "09:00"
  label: string;
  max_capacity: number;
  booked_count: number;
  is_mine: boolean;
  is_full: boolean;
}

const DAYS_FULL  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DAYS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function addDays(base: Date, n: number) {
  const d = new Date(base); d.setDate(d.getDate() + n); return d;
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getMondayOf(d: Date): Date {
  const c = new Date(d);
  const day = c.getDay();
  c.setDate(c.getDate() - ((day + 6) % 7));
  c.setHours(0,0,0,0);
  return c;
}

export default function HorarioPage() {
  const [user, setUser]         = useState<StylistUser | null>(null);
  const [anchor, setAnchor]     = useState(() => getMondayOf(new Date()));
  const [slots, setSlots]       = useState<WeekSlot[]>([]);
  const [loading, setLoading]   = useState(false);
  const [busy, setBusy]         = useState<number | null>(null);
  const [msg, setMsg]           = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("estilista_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const weekStart = toDateStr(anchor);
  const weekEnd   = toDateStr(addDays(anchor, 6));
  const weekLabel = `${anchor.toLocaleDateString("es-CO",{day:"numeric",month:"short"})} — ${addDays(anchor,6).toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"})}`;

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    stylistFetch(apiUrl(`/api/stylist/slots/my?employeeId=${user.id}&week=${weekStart}`))
      .then(r => r.json())
      .then(d => setSlots(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [user?.id, weekStart]);

  useEffect(() => { load(); }, [load]);

  async function handleBook(slot: WeekSlot) {
    if (!user) return;
    setBusy(slot.id); setMsg(null);
    try {
      const r = await stylistFetch(apiUrl("/api/stylist/slots/book"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: slot.id, employeeId: user.id, employeeName: user.name, weekStart }),
      });
      const d = await r.json() as { ok: boolean; reason?: string };
      if (d.ok) { setMsg({ text: "Cupo reservado exitosamente", ok: true }); load(); }
      else setMsg({ text: d.reason ?? "No se pudo reservar", ok: false });
    } catch { setMsg({ text: "Sin conexión al servidor", ok: false }); }
    finally { setBusy(null); }
  }

  async function handleUnbook(slot: WeekSlot) {
    if (!user) return;
    setBusy(slot.id); setMsg(null);
    try {
      await stylistFetch(apiUrl("/api/stylist/slots/unbook"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: slot.id, employeeId: user.id, weekStart }),
      });
      setMsg({ text: "Reserva cancelada", ok: true }); load();
    } catch { setMsg({ text: "Sin conexión al servidor", ok: false }); }
    finally { setBusy(null); }
  }

  /* agrupa por weekday */
  const byDay: Record<number, WeekSlot[]> = {};
  slots.forEach(s => { byDay[s.weekday] = [...(byDay[s.weekday] ?? []), s]; });

  /* slots ya reservados por mí, agrupados por weekday para la vista de semana */
  const mySlots = slots.filter(s => s.is_mine);
  const myByDay: Record<number, WeekSlot[]> = {};
  mySlots.forEach(s => { myByDay[s.weekday] = [...(myByDay[s.weekday] ?? []), s]; });

  /* Días de la semana (Lun=1 … Dom=7 en JS el weekday viene 0=dom,1=lun,...) */
  // El backend guarda weekday: 0=Dom,1=Lun,...,6=Sáb
  // Mostramos Lun(1) a Dom(0) en ese orden
  const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun→Sáb→Dom

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Page header + week nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textFaint, margin: "0 0 4px" }}>Mi horario</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: P.text, margin: 0 }}>
            Cupos y Horario Semanal
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setAnchor(d => getMondayOf(addDays(d, -7)))}
            style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${P.border}`, background: P.bgCard, color: P.textMed, fontSize: 13, cursor: "pointer", fontWeight: 500, boxShadow: P.shadow }}>
            ‹ Anterior
          </button>
          <span style={{ fontSize: 12, color: P.textMuted, minWidth: 210, textAlign: "center" }}>{weekLabel}</span>
          <button onClick={() => setAnchor(d => getMondayOf(addDays(d, 7)))}
            style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${P.border}`, background: P.bgCard, color: P.textMed, fontSize: 13, cursor: "pointer", fontWeight: 500, boxShadow: P.shadow }}>
            Siguiente ›
          </button>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{ padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: msg.ok ? P.vinoLight : "#FEF2F2",
          border: `1px solid ${msg.ok ? P.vino + "40" : "#FECACA"}`,
          color: msg.ok ? P.vinoDeep : "#DC2626",
        }}>
          {msg.text}
        </div>
      )}

      {/* ── SECCIÓN 1: Picker de cupos disponibles ── */}
      <section>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: P.text, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.vino} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Cupos publicados
          </h2>
          <p style={{ fontSize: 12, color: P.textMuted, margin: 0 }}>
            Estos son los turnos que el administrador abrió para esta semana. Reserva los que deseas trabajar.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} style={{ height: 110, borderRadius: 14, background: P.bgSubtle, animation: "pulse 1.5s ease-in-out infinite" }}/>)}
          </div>
        ) : slots.length === 0 ? (
          <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, padding: "48px 20px", textAlign: "center", boxShadow: P.shadow }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <p style={{ fontSize: 14, fontWeight: 600, color: P.textMuted, margin: "0 0 4px" }}>Sin cupos esta semana</p>
            <p style={{ fontSize: 12, color: P.textFaint, margin: 0 }}>El administrador aún no ha publicado horarios disponibles</p>
          </div>
        ) : (
          /* Agrupar por día */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {DISPLAY_ORDER.map(wd => {
              const daySlots = byDay[wd] ?? [];
              if (!daySlots.length) return null;
              // Calculate the actual date for this weekday (anchor = Monday)
              // DISPLAY_ORDER: [1,2,3,4,5,6,0] → offset from Monday = wd===0 ? 6 : wd-1
              const dayOffset = wd === 0 ? 6 : wd - 1;
              const dayDate = addDays(anchor, dayOffset);
              const dayDateStr = dayDate.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
              const isToday = toDateStr(dayDate) === toDateStr(new Date());
              const myCount = daySlots.filter(s => s.is_mine).length;
              return (
                <div key={wd} style={{ borderRadius: 16, border: `1px solid ${isToday ? P.vino + "40" : P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow }}>
                  {/* Day header */}
                  <div style={{ padding: "10px 20px", background: isToday ? P.vinoLight : P.bgSubtle, borderBottom: `1px solid ${isToday ? P.vino + "25" : P.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {isToday && <div style={{ width: 7, height: 7, borderRadius: "50%", background: P.vino, flexShrink: 0 }}/>}
                      <p style={{ fontSize: 11, fontWeight: 700, color: isToday ? P.vinoDeep : P.vino, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {DAYS_FULL[wd]}
                      </p>
                      <span style={{ fontSize: 11, color: isToday ? P.vino : P.textMuted, fontWeight: 500 }}>{dayDateStr}</span>
                    </div>
                    {myCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: P.vinoDeep, background: P.vinoLight, border: `1px solid ${P.vino}30`, borderRadius: 20, padding: "2px 8px" }}>
                        ✓ {myCount} reservado{myCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {/* Slots */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                    {daySlots.map((slot, si) => {
                      const isBusy = busy === slot.id;
                      const isFull = slot.is_full && !slot.is_mine;
                      return (
                        <div key={slot.id} style={{
                          padding: "16px 20px",
                          borderTop: si > 0 ? `1px solid ${P.borderLight}` : "none",
                          borderLeft: si > 0 ? `1px solid ${P.borderLight}` : "none",
                          background: slot.is_mine ? P.vinoLight : "transparent",
                        }}>
                          {/* Time */}
                          <p style={{ fontSize: 18, fontWeight: 700, color: slot.is_mine ? P.vinoDeep : P.text, margin: "0 0 4px", fontFamily: "'Playfair Display', serif", fontVariantNumeric: "tabular-nums" }}>
                            {slot.time_slot}
                          </p>
                          {slot.label && (
                            <p style={{ fontSize: 11, color: slot.is_mine ? P.vino : P.textMuted, margin: "0 0 10px" }}>{slot.label}</p>
                          )}
                          {/* Capacity dots */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                            {Array.from({ length: slot.max_capacity }).map((_, di) => (
                              <div key={di} style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: di < slot.booked_count ? (slot.is_mine && di === slot.booked_count - 1 ? P.vino : P.dorado) : P.borderLight,
                                border: `1px solid ${di < slot.booked_count ? (slot.is_mine && di === slot.booked_count - 1 ? P.vinoDeep : P.doradoDeep) : P.border}`,
                              }}/>
                            ))}
                            <span style={{ fontSize: 11, color: P.textFaint, marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>
                              {slot.booked_count}/{slot.max_capacity}
                            </span>
                          </div>
                          {/* Action */}
                          {slot.is_mine ? (
                            <button onClick={() => handleUnbook(slot)} disabled={isBusy}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${P.vino}`, background: "transparent", color: P.vino, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: isBusy ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              {isBusy && <span style={{ width: 10, height: 10, border: `1.5px solid ${P.vino}30`, borderTopColor: P.vino, borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>}
                              Cancelar reserva
                            </button>
                          ) : isFull ? (
                            <button disabled style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${P.border}`, background: P.bgSubtle, color: P.textFaint, fontSize: 12, fontWeight: 600, cursor: "not-allowed" }}>
                              Cupo lleno
                            </button>
                          ) : (
                            <button onClick={() => handleBook(slot)} disabled={isBusy}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: isBusy ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 4px 12px ${P.vino}25` }}>
                              {isBusy && <span style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>}
                              Reservar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── SECCIÓN 2: Mi semana — vista de cupos reservados ── */}
      <section>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: P.text, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.doradoDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Mi semana — turnos reservados
          </h2>
          <p style={{ fontSize: 12, color: P.textMuted, margin: 0 }}>Vista rápida de los cupos que ya tienes para esta semana</p>
        </div>

        {loading ? (
          <div style={{ height: 100, borderRadius: 14, background: P.bgSubtle }}/>
        ) : mySlots.length === 0 ? (
          <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, padding: "32px 20px", textAlign: "center", boxShadow: P.shadow }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style={{ fontSize: 13, color: P.textMuted, margin: "0 0 3px" }}>No tienes cupos reservados esta semana</p>
            <p style={{ fontSize: 12, color: P.textFaint, margin: 0 }}>Reserva cupos arriba para verlos aquí</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, boxShadow: P.shadow }}>
            <div style={{ minWidth: 560 }}>
              {/* Header de días */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${P.border}`, background: P.bgSubtle }}>
                {DISPLAY_ORDER.map((wd, i) => {
                  const dayDate = addDays(anchor, wd === 0 ? 6 : wd - 1); // calcular fecha real
                  const isToday = toDateStr(dayDate) === toDateStr(new Date());
                  return (
                    <div key={i} style={{ padding: "10px 6px", textAlign: "center", background: isToday ? P.vinoLight : "transparent" }}>
                      <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: isToday ? P.vino : P.textFaint, margin: "0 0 3px", fontWeight: 600 }}>{DAYS_SHORT[wd]}</p>
                      <p style={{ fontSize: 17, fontWeight: 700, color: isToday ? P.vino : P.textMed, margin: 0, fontFamily: "'Playfair Display', serif" }}>{dayDate.getDate()}</p>
                    </div>
                  );
                })}
              </div>
              {/* Slots row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: 80 }}>
                {DISPLAY_ORDER.map((wd, i) => {
                  const daySlots = myByDay[wd] ?? [];
                  return (
                    <div key={i} style={{ borderLeft: i > 0 ? `1px solid ${P.borderLight}` : "none", padding: 8, minHeight: 80 }}>
                      {daySlots.length === 0 ? (
                        <div style={{ height: "100%", minHeight: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: P.border, fontSize: 18 }}>—</span>
                        </div>
                      ) : daySlots.map(s => (
                        <div key={s.id} style={{ borderRadius: 8, background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, padding: "8px 10px", marginBottom: 4, boxShadow: `0 2px 8px ${P.vino}25` }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 1px", fontVariantNumeric: "tabular-nums" }}>{s.time_slot}</p>
                          {s.label && <p style={{ fontSize: 10, color: "rgba(255,255,255,.65)", margin: 0 }}>{s.label}</p>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
