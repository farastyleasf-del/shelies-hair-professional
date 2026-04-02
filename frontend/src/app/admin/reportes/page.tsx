"use client";
import { useEffect, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { apiUrl, authedFetch } from "@/lib/api";

interface SessionStat {
  user_name: string; user_email: string;
  session_date: string; sessions: string; total_minutes: string;
}
interface ChatStat {
  sender_name: string; session_date: string;
  conversations: string; messages_sent: string;
}
interface SessionToday {
  id: number; user_name: string; user_email: string;
  started_at: string; ended_at: string | null; duration_minutes: number | null;
}
interface ShiftStat {
  employee_name: string; employee_email: string; shift_date: string;
  shifts: string; total_minutes: string; total_appointments: string;
}
interface StylistProductivity {
  stylist_name: string; shift_date: string;
  appointments_completed: string; avg_duration: string;
}

function fmtMin(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function KPI({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: string; color?: string;
}) {
  const t = useAdminTheme();
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-2"
      style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: t.colors.textMuted }}>{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color: color ?? t.colors.text }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: t.colors.textFaint }}>{sub}</p>}
    </div>
  );
}

export default function IndicadoresPage() {
  const t = useAdminTheme();
  const [days, setDays] = useState(7);
  const [sessions, setSessions]       = useState<SessionStat[]>([]);
  const [chatStats, setChatStats]     = useState<ChatStat[]>([]);
  const [todaySessions, setTodaySessions] = useState<SessionToday[]>([]);
  const [shiftStats, setShiftStats]   = useState<ShiftStat[]>([]);
  const [stylistProd, setStylistProd] = useState<StylistProductivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authedFetch(apiUrl(`/api/employees/sessions/stats?days=${days}`)).then(r => r.json()).catch(() => []),
      authedFetch(apiUrl(`/api/employees/sessions/chat-stats?days=${days}`)).then(r => r.json()).catch(() => []),
      authedFetch(apiUrl("/api/employees/sessions/today")).then(r => r.json()).catch(() => []),
      authedFetch(apiUrl(`/api/stylist/shifts/stats?days=${days}`)).then(r => r.json()).catch(() => []),
      authedFetch(apiUrl(`/api/stylist/productivity?days=${days}`)).then(r => r.json()).catch(() => []),
    ]).then(([s, c, td, ss, sp]) => {
      if (Array.isArray(s)) setSessions(s);
      if (Array.isArray(c)) setChatStats(c);
      if (Array.isArray(td)) setTodaySessions(td);
      if (Array.isArray(ss)) setShiftStats(ss);
      if (Array.isArray(sp)) setStylistProd(sp);
    }).finally(() => setLoading(false));
  }, [days]);

  // KPIs globales
  const totalHoy = todaySessions.reduce((s, x) => s + (x.duration_minutes ?? 0), 0);
  const activosAhora = todaySessions.filter(s => !s.ended_at).length;
  const totalConvs = chatStats.reduce((s, x) => s + parseInt(x.conversations), 0);
  const totalMsgs  = chatStats.reduce((s, x) => s + parseInt(x.messages_sent), 0);

  // Adherencia por agente (últimos N días)
  const byAgent: Record<string, { sessions: number; minutes: number }> = {};
  sessions.forEach(s => {
    if (!byAgent[s.user_name]) byAgent[s.user_name] = { sessions: 0, minutes: 0 };
    byAgent[s.user_name].sessions += parseInt(s.sessions);
    byAgent[s.user_name].minutes  += parseInt(s.total_minutes);
  });

  // Productividad chat por agente
  const byAgentChat: Record<string, { conversations: number; messages: number }> = {};
  chatStats.forEach(c => {
    if (!byAgentChat[c.sender_name]) byAgentChat[c.sender_name] = { conversations: 0, messages: 0 };
    byAgentChat[c.sender_name].conversations += parseInt(c.conversations);
    byAgentChat[c.sender_name].messages      += parseInt(c.messages_sent);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: t.colors.text }}>📊 Reportes</h1>
          <p className="text-sm mt-0.5" style={{ color: t.colors.textMuted }}>
            Adherencia, productividad y métricas del equipo
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border overflow-hidden"
          style={{ borderColor: t.colors.border }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className="px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: days === d ? t.colors.primary : "transparent",
                color: days === d ? "#fff" : t.colors.textMuted,
              }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: t.colors.textFaint }}>Cargando indicadores...</div>
      ) : (
        <>
          {/* KPIs top */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Agentes activos ahora" value={String(activosAhora)} icon="🟢"
              color={activosAhora > 0 ? t.colors.success : t.colors.textMuted}
              sub="En sesión en este momento" />
            <KPI label="Minutos conectados hoy" value={fmtMin(totalHoy)} icon="⏱️"
              sub={`${todaySessions.length} sesiones hoy`} />
            <KPI label={`Conversaciones (${days}d)`} value={String(totalConvs)} icon="💬"
              color={t.colors.primary} />
            <KPI label={`Mensajes enviados (${days}d)`} value={String(totalMsgs)} icon="📤"
              sub="Solo mensajes salientes" />
          </div>

          {/* Sesiones hoy */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
            <div className="px-5 py-3 border-b flex items-center justify-between"
              style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <h2 className="text-sm font-semibold" style={{ color: t.colors.text }}>
                🕐 Sesiones de hoy
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: t.colors.primaryLight, color: t.colors.primary }}>
                {todaySessions.length} registros
              </span>
            </div>
            {todaySessions.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ backgroundColor: t.colors.bgCard, color: t.colors.textFaint }}>
                Sin sesiones registradas hoy. Los agentes deben iniciar sesión en el módulo Agente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ backgroundColor: t.colors.bgCard }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                      {["Agente", "Inicio", "Fin", "Duración", "Estado"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wider font-semibold"
                          style={{ color: t.colors.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todaySessions.map(s => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                        <td className="px-5 py-3">
                          <p className="font-medium" style={{ color: t.colors.text }}>{s.user_name}</p>
                          <p className="text-[10px]" style={{ color: t.colors.textFaint }}>{s.user_email}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-mono" style={{ color: t.colors.textMuted }}>
                          {fmtTime(s.started_at)}
                        </td>
                        <td className="px-5 py-3 text-sm font-mono" style={{ color: t.colors.textMuted }}>
                          {s.ended_at ? fmtTime(s.ended_at) : "—"}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold" style={{ color: t.colors.text }}>
                          {s.duration_minutes != null ? fmtMin(s.duration_minutes) : "En curso"}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
                            style={{
                              backgroundColor: s.ended_at ? t.colors.border : t.colors.successLight,
                              color: s.ended_at ? t.colors.textFaint : t.colors.successText,
                            }}>
                            {s.ended_at ? "Finalizada" : "🟢 Activa"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Adherencia por agente */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
              <div className="px-5 py-3 border-b"
                style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                <h2 className="text-sm font-semibold" style={{ color: t.colors.text }}>
                  ⏳ Adherencia por agente ({days}d)
                </h2>
              </div>
              {Object.keys(byAgent).length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ backgroundColor: t.colors.bgCard, color: t.colors.textFaint }}>
                  Sin datos de sesiones en este período
                </div>
              ) : (
                <div style={{ backgroundColor: t.colors.bgCard }}>
                  {Object.entries(byAgent)
                    .sort((a, b) => b[1].minutes - a[1].minutes)
                    .map(([name, stats]) => (
                      <div key={name} className="flex items-center gap-4 px-5 py-3"
                        style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: t.colors.primary }}>
                          {name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: t.colors.text }}>{name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px]" style={{ color: t.colors.textFaint }}>
                              {stats.sessions} sesión{stats.sessions !== 1 ? "es" : ""}
                            </span>
                            <span className="text-[10px] font-semibold" style={{ color: t.colors.primary }}>
                              {fmtMin(stats.minutes)} conectado
                            </span>
                          </div>
                        </div>
                        {/* Barra de progreso (máx 8h/día × días) */}
                        <div className="w-20">
                          <div className="h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: t.colors.border }}>
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (stats.minutes / (days * 480)) * 100)}%`,
                                backgroundColor: t.colors.primary,
                              }} />
                          </div>
                          <p className="text-[9px] text-right mt-0.5" style={{ color: t.colors.textFaint }}>
                            {Math.round((stats.minutes / (days * 480)) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Productividad chat */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
              <div className="px-5 py-3 border-b"
                style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                <h2 className="text-sm font-semibold" style={{ color: t.colors.text }}>
                  💬 Productividad Chat ({days}d)
                </h2>
              </div>
              {Object.keys(byAgentChat).length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ backgroundColor: t.colors.bgCard, color: t.colors.textFaint }}>
                  Sin datos de mensajes en este período
                </div>
              ) : (
                <div style={{ backgroundColor: t.colors.bgCard }}>
                  {Object.entries(byAgentChat)
                    .sort((a, b) => b[1].messages - a[1].messages)
                    .map(([name, stats]) => (
                      <div key={name} className="flex items-center gap-4 px-5 py-3"
                        style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: "#059669" }}>
                          {name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: t.colors.text }}>{name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px]" style={{ color: t.colors.textFaint }}>
                              {stats.conversations} conversación{stats.conversations !== 1 ? "es" : ""}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              {stats.messages} mensajes
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold" style={{ color: t.colors.text }}>
                            {stats.messages}
                          </p>
                          <p className="text-[9px]" style={{ color: t.colors.textFaint }}>msgs</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sección Estilistas ── */}
          {(shiftStats.length > 0 || stylistProd.length > 0) && (
            <>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px" style={{ backgroundColor: t.colors.border }} />
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#DCFCE7", color: "#14532D" }}>
                  💇 Estilistas
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: t.colors.border }} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Adherencia estilistas */}
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
                  <div className="px-5 py-3 border-b"
                    style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                    <h2 className="text-sm font-semibold" style={{ color: t.colors.text }}>
                      ⏱ Turnos estilistas ({days}d)
                    </h2>
                  </div>
                  {(() => {
                    const byEst: Record<string, { shifts: number; minutes: number; appts: number }> = {};
                    shiftStats.forEach(s => {
                      if (!byEst[s.employee_name]) byEst[s.employee_name] = { shifts: 0, minutes: 0, appts: 0 };
                      byEst[s.employee_name].shifts  += parseInt(s.shifts);
                      byEst[s.employee_name].minutes += parseInt(s.total_minutes);
                      byEst[s.employee_name].appts   += parseInt(s.total_appointments);
                    });
                    return Object.entries(byEst).length === 0 ? (
                      <div className="p-8 text-center text-sm" style={{ backgroundColor: t.colors.bgCard, color: t.colors.textFaint }}>
                        Sin datos de turnos de estilistas aún
                      </div>
                    ) : (
                      <div style={{ backgroundColor: t.colors.bgCard }}>
                        {Object.entries(byEst).sort((a, b) => b[1].minutes - a[1].minutes).map(([name, st]) => (
                          <div key={name} className="flex items-center gap-4 px-5 py-3"
                            style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: "#2E8B57" }}>
                              {name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: t.colors.text }}>{name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px]" style={{ color: t.colors.textFaint }}>
                                  {st.shifts} turno{st.shifts !== 1 ? "s" : ""}
                                </span>
                                <span className="text-[10px] font-semibold" style={{ color: "#2E8B57" }}>
                                  {fmtMin(st.minutes)} en turno
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold" style={{ color: t.colors.text }}>{st.appts}</p>
                              <p className="text-[9px]" style={{ color: t.colors.textFaint }}>citas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Productividad estilistas */}
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
                  <div className="px-5 py-3 border-b"
                    style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                    <h2 className="text-sm font-semibold" style={{ color: t.colors.text }}>
                      💇 Productividad estilistas ({days}d)
                    </h2>
                  </div>
                  {stylistProd.length === 0 ? (
                    <div className="p-8 text-center text-sm" style={{ backgroundColor: t.colors.bgCard, color: t.colors.textFaint }}>
                      Sin datos de productividad aún
                    </div>
                  ) : (
                    <div style={{ backgroundColor: t.colors.bgCard }}>
                      {(() => {
                        const byS: Record<string, { total: number; days: number }> = {};
                        stylistProd.forEach(p => {
                          if (!byS[p.stylist_name]) byS[p.stylist_name] = { total: 0, days: 0 };
                          byS[p.stylist_name].total += parseInt(p.appointments_completed || "0");
                          byS[p.stylist_name].days  += 1;
                        });
                        return Object.entries(byS).sort((a, b) => b[1].total - a[1].total).map(([name, st]) => (
                          <div key={name} className="flex items-center gap-4 px-5 py-3"
                            style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: "#8B3A4A" }}>
                              {name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: t.colors.text }}>{name}</p>
                              <p className="text-[10px]" style={{ color: t.colors.textFaint }}>
                                {st.days} día{st.days !== 1 ? "s" : ""} · prom {(st.total / st.days).toFixed(1)}/día
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold" style={{ color: t.colors.text }}>{st.total}</p>
                              <p className="text-[9px]" style={{ color: t.colors.textFaint }}>citas atendidas</p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Histórico por día */}
          {sessions.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
              <div className="px-5 py-3 border-b"
                style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                <h2 className="text-sm font-semibold" style={{ color: t.colors.text }}>
                  📅 Detalle por día
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ backgroundColor: t.colors.bgCard }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                      {["Fecha", "Agente", "Sesiones", "Tiempo conectado"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wider font-semibold"
                          style={{ color: t.colors.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                        <td className="px-5 py-3 text-sm font-mono" style={{ color: t.colors.textMuted }}>
                          {fmtDate(s.session_date)}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium" style={{ color: t.colors.text }}>{s.user_name}</p>
                          <p className="text-[10px]" style={{ color: t.colors.textFaint }}>{s.user_email}</p>
                        </td>
                        <td className="px-5 py-3 text-sm" style={{ color: t.colors.textMuted }}>
                          {s.sessions}
                        </td>
                        <td className="px-5 py-3 font-semibold" style={{ color: t.colors.text }}>
                          {fmtMin(parseInt(s.total_minutes))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
