"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl, stylistFetch } from "@/lib/api";
import type { StylistUser } from "./layout";

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

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY = toDateStr(new Date());
const WEEK_START = (() => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return toDateStr(d);
})();

interface Appointment {
  id: number;
  client_name: string;
  service_name: string;
  date: string;
  time: string;
  status: string;
  workflow_status?: string;
  price?: number;
  notes?: string;
  client_phone?: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string; label: string; left: string }> = {
  pendiente:   { bg: "#FEF9EC", color: "#A07C45", border: "#F5E0A8", label: "Pendiente",  left: "#C9A46A" },
  en_atencion: { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE", label: "En atención", left: "#4F46E5" },
  completado:  { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "Completada", left: "#16A34A" },
  cancelado:   { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "Cancelada",  left: "#DC2626" },
  confirmed:   { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Confirmada", left: "#1D4ED8" },
  pending:     { bg: "#FEF9EC", color: "#A07C45", border: "#F5E0A8", label: "Pendiente",  left: "#C9A46A" },
  completed:   { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "Completada", left: "#16A34A" },
  cancelled:   { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "Cancelada",  left: "#DC2626" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS["pendiente"];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
      {s.label}
    </span>
  );
}

// ─── KPI icon helpers ─────────────────────────────────────
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

export default function EstilistaDashboard() {
  const [user, setUser]       = useState<StylistUser | null>(null);
  const [appts, setAppts]     = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickHover, setQuickHover] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("estilista_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    stylistFetch(apiUrl(`/api/stylist/appointments/all?employeeId=${user.id}`))
      .then(r => r.json())
      .then(d => setAppts(d.data ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const todayAppts = appts.filter(a => a.date === TODAY).sort((a, b) => a.time.localeCompare(b.time));
  const todayTotal = todayAppts.length;
  const todayPending = todayAppts.filter(a => {
    const s = a.workflow_status ?? a.status;
    return s === "pendiente" || s === "pending" || s === "confirmed";
  }).length;
  const todayCompleted = todayAppts.filter(a => {
    const s = a.workflow_status ?? a.status;
    return s === "completado" || s === "completed";
  }).length;
  const weekCompleted = appts.filter(a => {
    const s = a.workflow_status ?? a.status;
    return a.date >= WEEK_START && (s === "completado" || s === "completed");
  }).length;

  // Hero: first pending appointment today
  const heroAppt = todayAppts.find(a => {
    const s = a.workflow_status ?? a.status;
    return s === "pendiente" || s === "pending" || s === "confirmed";
  }) ?? null;

  const upcomingAppts = appts
    .filter(a => a.date > TODAY && a.status !== "cancelled" && a.workflow_status !== "cancelado")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  const kpis = [
    { label: "Citas hoy",       value: loading ? "–" : todayTotal,     sub: `${todayCompleted} completadas`,  accent: false, icon: <CalendarIcon />,    accentColor: P.vino },
    { label: "Pendientes hoy",  value: loading ? "–" : todayPending,   sub: "por atender",                    accent: false, icon: <ClockIcon />,       accentColor: P.doradoDeep },
    { label: "Completadas hoy", value: loading ? "–" : todayCompleted, sub: "servicios finalizados",           accent: false, icon: <CheckCircleIcon />, accentColor: "#16A34A" },
    { label: "Esta semana",     value: loading ? "–" : weekCompleted,  sub: "servicios completados",           accent: true,  icon: <TrendIcon />,       accentColor: P.doradoDeep },
  ];

  const quickLinks = [
    {
      href: "/estilista/citas",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.vino} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      iconBg: P.vinoLight,
      title: "Ver Calendario",
      sub: "Vista semanal de tus citas",
      hoverBorder: P.vino,
      hoverBg: "rgba(139,58,74,0.03)",
    },
    {
      href: "/estilista/metricas",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.doradoDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      iconBg: P.doradoLight,
      title: "Mis Métricas",
      sub: "Productividad e historial",
      hoverBorder: P.dorado,
      hoverBg: "rgba(201,164,106,0.03)",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* Page header */}
      <div>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textFaint, margin: "0 0 4px" }}>Panel Estilista</p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: P.text, margin: "0 0 4px" }}>
          Bienvenida{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>
          {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Hero: próxima cita */}
      {!loading && (
        heroAppt ? (
          <div style={{
            background: "linear-gradient(135deg, #5E2430 0%, #8B3A4A 50%, #A07C45 100%)",
            borderRadius: 20, padding: "24px 28px", color: "#fff",
            boxShadow: "0 12px 40px rgba(94,36,48,0.28)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Decorative circle */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", pointerEvents: "none" }}/>
            <div style={{ position: "absolute", bottom: -20, right: 60, width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(201,164,106,0.15)", pointerEvents: "none" }}/>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                  <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Próxima cita</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                HOY · {heroAppt.time}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{heroAppt.client_name}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 16px" }}>{heroAppt.service_name}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <StatusBadge status={heroAppt.workflow_status ?? heroAppt.status} />
                {heroAppt.price != null && (
                  <span style={{ fontSize: 16, fontWeight: 700, color: P.dorado }}>
                    ${heroAppt.price.toLocaleString("es-CO")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, padding: "18px 22px", display: "flex", alignItems: "center", gap: 12, boxShadow: P.shadow }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: P.bgSubtle, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Sin citas pendientes hoy</p>
          </div>
        )
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={i} style={{
            borderRadius: 16,
            border: `1px solid ${k.accent ? P.dorado + "55" : P.border}`,
            background: k.accent ? `linear-gradient(135deg, ${P.doradoLight}, #fff)` : P.bgCard,
            padding: "20px 22px",
            boxShadow: P.shadow,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Icon top-right */}
            <div style={{ position: "absolute", top: 16, right: 16, color: k.accentColor, opacity: 0.5 }}>
              {k.icon}
            </div>
            {/* Bottom border accent */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: k.accent ? `linear-gradient(90deg, ${P.dorado}, transparent)` : `linear-gradient(90deg, ${P.border}, transparent)`, borderRadius: "0 0 16px 16px" }}/>

            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: P.textFaint, margin: "0 0 8px" }}>{k.label}</p>
            <p style={{ fontSize: 40, fontWeight: 700, color: k.accent ? P.doradoDeep : P.text, margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: P.textMuted, margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Today + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's appointments */}
        <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${P.borderLight}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: P.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.vino} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Citas de hoy
            </h2>
            <Link href="/estilista/citas" style={{ fontSize: 11, color: P.vino, textDecoration: "none", fontWeight: 500 }}>Ver calendario →</Link>
          </div>
          <div style={{ padding: "12px 12px" }}>
            {loading ? (
              [1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: 10, background: P.bgSubtle, marginBottom: 6 }}/>)
            ) : todayAppts.length === 0 ? (
              <div style={{ padding: "36px 0", textAlign: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Sin citas para hoy</p>
              </div>
            ) : (
              todayAppts.map(a => {
                const statusKey = a.workflow_status ?? a.status;
                const statusStyle = STATUS_COLORS[statusKey] ?? STATUS_COLORS["pendiente"];
                return (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 10, marginBottom: 4,
                    background: P.bgSubtle,
                    borderLeft: `4px solid ${statusStyle.left}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: P.vino, minWidth: 50, fontVariantNumeric: "tabular-nums" }}>{a.time}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>{a.client_name}</p>
                        <p style={{ fontSize: 11, color: P.textMuted, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                            <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
                          </svg>
                          {a.service_name}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={a.workflow_status ?? a.status} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming appointments */}
        <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${P.borderLight}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: P.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.vino} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Próximas citas
            </h2>
            <Link href="/estilista/citas" style={{ fontSize: 11, color: P.vino, textDecoration: "none", fontWeight: 500 }}>Ver todas →</Link>
          </div>
          <div style={{ padding: "12px 12px" }}>
            {loading ? (
              [1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: 10, background: P.bgSubtle, marginBottom: 6 }}/>)
            ) : upcomingAppts.length === 0 ? (
              <div style={{ padding: "36px 0", textAlign: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Sin próximas citas</p>
              </div>
            ) : (
              upcomingAppts.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, marginBottom: 4, background: P.bgSubtle }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>{a.client_name}</p>
                    <p style={{ fontSize: 11, color: P.textMuted, margin: 0 }}>{a.service_name}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: P.vino, margin: "0 0 2px" }}>
                      {new Date(a.date + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </p>
                    <p style={{ fontSize: 10, color: P.textFaint, margin: 0 }}>{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((ql, idx) => (
          <Link
            key={ql.href}
            href={ql.href}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "18px 20px",
              borderRadius: 16,
              border: `1px solid ${quickHover === idx ? ql.hoverBorder : P.border}`,
              background: quickHover === idx ? ql.hoverBg : P.bgCard,
              textDecoration: "none",
              boxShadow: P.shadow,
              transition: "border-color .15s, background .15s",
            }}
            onMouseEnter={() => setQuickHover(idx)}
            onMouseLeave={() => setQuickHover(null)}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: ql.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {ql.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>{ql.title}</p>
              <p style={{ fontSize: 12, color: P.textMuted, margin: 0 }}>{ql.sub}</p>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ marginLeft: "auto", transform: quickHover === idx ? "translateX(3px)" : "translateX(0)", transition: "transform .15s", flexShrink: 0 }}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
