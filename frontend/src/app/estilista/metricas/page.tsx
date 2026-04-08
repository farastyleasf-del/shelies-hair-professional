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

const DAY_PERIODS = [7, 14, 30] as const;
type Period = typeof DAY_PERIODS[number];

interface DayStat {
  date: string;
  appointments: number;
  completed: number;
  shifts: number;
  avg_duration_min?: number;
}

interface ProductivityData {
  period_days: number;
  total_appointments: number;
  total_completed: number;
  total_shifts: number;
  avg_per_day: number;
  by_day: DayStat[];
}

const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

export default function MetricasPage() {
  const [user, setUser]         = useState<StylistUser | null>(null);
  const [period, setPeriod]     = useState<Period>(14);
  const [data, setData]         = useState<ProductivityData | null>(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("estilista_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    stylistFetch(apiUrl(`/api/stylist/productivity?days=${period}&employeeId=${user.id}`))
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, period]);

  const rows = (data?.by_day ?? []).slice().sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const maxCompleted = Math.max(...rows.map(r => r.completed), 1);

  const completionRate = data && data.total_appointments > 0
    ? Math.round(data.total_completed / data.total_appointments * 100)
    : 0;

  const kpis = [
    {
      label: `Citas (${period}d)`,
      value: loading ? "–" : (data?.total_appointments ?? 0),
      sub: `${data?.total_completed ?? 0} completadas`,
      accent: false,
      rate: null as number | null,
    },
    {
      label: "Turnos trabajados",
      value: loading ? "–" : (data?.total_shifts ?? 0),
      sub: `últimos ${period} días`,
      accent: false,
      rate: null,
    },
    {
      label: "Promedio / día",
      value: loading ? "–" : (data?.avg_per_day?.toFixed(1) ?? "0"),
      sub: "citas completadas",
      accent: true,
      rate: null,
    },
    {
      label: "Tasa de completado",
      value: loading ? "–" : `${completionRate}%`,
      sub: "citas finalizadas",
      accent: false,
      rate: loading ? null : completionRate,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* Header + period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textFaint, margin: "0 0 4px" }}>Productividad</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: P.text, margin: 0 }}>
            Métricas{user?.name ? ` — ${user.name.split(" ")[0]}` : ""}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {DAY_PERIODS.map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              style={{
                padding: "8px 18px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                border: period === d ? "none" : `1px solid ${P.border}`,
                background: period === d ? `linear-gradient(135deg,${P.vinoDeep},${P.vino})` : P.bgCard,
                color: period === d ? "#fff" : P.textMuted,
                boxShadow: period === d ? "0 4px 12px rgba(94,36,48,.25)" : "none",
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            borderRadius: 16,
            border: `1px solid ${k.accent ? P.dorado + "55" : P.border}`,
            background: k.accent ? `linear-gradient(135deg, ${P.doradoLight}, #fff)` : P.bgCard,
            padding: "22px 24px",
            boxShadow: P.shadow,
          }}>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: P.textFaint, margin: "0 0 8px" }}>{k.label}</p>
            <p style={{ fontSize: 40, fontWeight: 700, color: k.accent ? P.doradoDeep : P.text, margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{k.value}</p>
            <p style={{ fontSize: 12, color: P.textMuted, margin: "0 0 0" }}>{k.sub}</p>
            {k.rate !== null && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 5, borderRadius: 3, background: P.bgSubtle, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${k.rate}%`, borderRadius: 3, background: `linear-gradient(90deg, ${P.vino}, ${P.dorado})`, transition: "width .6s ease" }}/>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart — bar chart */}
      {rows.length > 0 && (
        <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, padding: "20px 22px", boxShadow: P.shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: 0 }}>Citas completadas por día</p>
            <span style={{ fontSize: 11, color: P.textFaint }}>últimos {Math.min(rows.length, 14)} días</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
            {rows.slice(0, 14).reverse().map((r, i) => {
              const pct = r.completed / maxCompleted;
              const barH = Math.max(pct * 96, r.completed > 0 ? 8 : 4);
              const d = new Date(r.date + "T12:00:00");
              const showLabel = i % 2 === 0;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                  {/* Value label */}
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      {r.completed > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: P.vino }}>{r.completed}</span>
                      )}
                      <div style={{
                        width: "100%", height: `${barH}px`, borderRadius: "4px 4px 0 0",
                        background: r.completed > 0
                          ? `linear-gradient(180deg, ${P.dorado}, ${P.vino})`
                          : P.bgSubtle,
                        transition: "height .4s ease",
                      }}/>
                    </div>
                  </div>
                  {/* Axis label — show every 2nd */}
                  <span style={{ fontSize: 9, color: showLabel ? P.textFaint : "transparent", whiteSpace: "nowrap" }}>
                    {d.getDate()} {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][d.getMonth()].slice(0,3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History table */}
      <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${P.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: P.text, margin: 0 }}>Historial por día · últimos {period} días</h2>
          {loading && <span style={{ fontSize: 11, color: P.textFaint }}>Cargando…</span>}
        </div>

        {loading ? (
          <div style={{ padding: "16px" }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 44, borderRadius: 10, background: P.bgSubtle, marginBottom: 6 }}/>)}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}>
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Sin datos de productividad en este período</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${P.borderLight}`, background: P.bgSubtle }}>
                  {["Fecha", "Citas totales", "Completadas", "Turnos", "Promedio min"].map(h => (
                    <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textFaint, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.date} style={{ borderBottom: `1px solid ${P.borderLight}`, background: i % 2 === 0 ? "transparent" : P.bg }}>
                    <td style={{ padding: "12px 18px", color: P.textMed, fontWeight: 500 }}>{fmtDate(r.date)}</td>
                    <td style={{ padding: "12px 18px", color: P.text }}>{r.appointments}</td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: r.completed > 0 ? P.vino : P.textFaint, minWidth: 16 }}>{r.completed}</span>
                        {r.appointments > 0 && (
                          <div style={{ flex: 1, minWidth: 48, maxWidth: 72 }}>
                            <div style={{ height: 4, borderRadius: 2, background: P.bgSubtle, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.round(r.completed / r.appointments * 100)}%`, background: `linear-gradient(90deg,${P.vino},${P.dorado})`, borderRadius: 2 }}/>
                            </div>
                          </div>
                        )}
                        {r.completed > 0 && r.appointments > 0 && (
                          <span style={{ fontSize: 10, color: P.textFaint }}>{Math.round(r.completed / r.appointments * 100)}%</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px", color: P.textMuted }}>{r.shifts}</td>
                    <td style={{ padding: "12px 18px", color: P.textMuted }}>
                      {r.avg_duration_min != null ? `${Math.round(r.avg_duration_min)} min` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${P.border}`, background: P.bgSubtle }}>
                  <td style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Total ({period} días)
                  </td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: P.text }}>{data?.total_appointments ?? 0}</td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: P.vino, fontSize: 15 }}>{data?.total_completed ?? 0}</td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: P.text }}>{data?.total_shifts ?? 0}</td>
                  <td style={{ padding: "12px 18px", color: P.textMuted }}>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
