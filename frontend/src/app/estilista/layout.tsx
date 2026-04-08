"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiUrl, stylistFetch } from "@/lib/api";
import Image from "next/image";

// ─── Paleta ───────────────────────────────────────────────
const P = {
  bg:           "#FAF7F4",
  bgCard:       "#FFFFFF",
  bgSubtle:     "#F5F0EC",
  vino:         "#8B3A4A",
  vinoDeep:     "#5E2430",
  vinoLight:    "#F5EAEC",
  dorado:       "#C9A46A",
  doradoDeep:   "#A07C45",
  doradoLight:  "#FDF6E8",
  text:         "#1E0F0A",
  textMed:      "#5C3A30",
  textMuted:    "#957068",
  textFaint:    "#C4A99F",
  border:       "#EAE0DA",
  borderLight:  "#F3EDE9",
  shadow:       "0 4px 20px rgba(94,36,48,0.07)",
};

// ─── Types ────────────────────────────────────────────────
export interface StylistUser {
  id: number;
  name: string;
  email: string;
  cedula: string;
  cargo: string;
  site: string;
  status?: string;
  phone?: string | null;
  fecha_ingreso?: string | null;
  admin_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ─── Nav links ───────────────────────────────────────────
const NAV_LINKS = [
  {
    href: "/estilista",
    label: "Inicio",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/estilista/citas",
    label: "Mis Citas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/estilista/horario",
    label: "Horario",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    href: "/estilista/metricas",
    label: "Métricas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
];

// ─── Login ────────────────────────────────────────────────
function LoginEstilista({ onLogin }: { onLogin: (u: StylistUser) => void }) {
  const [cedula, setCedula]     = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!cedula || !password) return;
    setLoading(true); setError("");

    try {
      // Validar contra el backend (la contraseña se verifica en el servidor)
      const authRes = await stylistFetch(apiUrl("/api/employees/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cedula.trim(), password }),
      });
      if (authRes.status === 401) { setError("Usuario o contraseña incorrectos"); return; }
      if (authRes.status === 403) { setError("Usuario inactivo"); return; }
      if (!authRes.ok) { setError("Error del servidor"); return; }

      const data = await authRes.json() as { employee: StylistUser; token?: string };
      if (!data.employee) { setError("Usuario no encontrado"); return; }
      if (data.token) sessionStorage.setItem("estilista_token", data.token);
      onLogin(data.employee);
    } catch {
      setError("Sin conexión al servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        body { font-family: 'Inter', system-ui, sans-serif; }
        .lg-flex-login { display: none; }
        @media (min-width: 1024px) { .lg-flex-login { display: flex !important; } }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", background: `linear-gradient(160deg, ${P.bg} 0%, #F2E9E4 100%)` }}>
        {/* Left brand panel — desktop only */}
        <div
          className="lg-flex-login"
          style={{
            width: 420, flexShrink: 0,
            background: `linear-gradient(160deg, ${P.vinoDeep} 0%, ${P.vino} 55%, #A85068 100%)`,
            padding: "64px 48px", flexDirection: "column", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", border: `1px solid rgba(201,164,106,.15)` }}/>
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", border: `1px solid rgba(201,164,106,.1)` }}/>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: `rgba(201,164,106,.7)`, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>Portal Estilistas</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 12 }}>
              Shelie&apos;s<br/>Hair Studio
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
              Tu espacio de trabajo personal. Gestiona tus citas, horarios y productividad en un solo lugar.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Agenda del día en tiempo real", "Workflow de servicio por fases", "Reserva de cupos semanales", "Métricas de productividad"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid rgba(201,164,106,.5)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={P.dorado} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ width: "100%", maxWidth: 420, borderRadius: 24, background: "rgba(255,255,255,0.96)", boxShadow: "0 32px 80px rgba(94,36,48,0.18), 0 8px 24px rgba(0,0,0,0.08)", backdropFilter: "blur(20px)", padding: "40px 36px" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              {/* Decorative gradient ring behind logo */}
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", padding: 3, background: "conic-gradient(from 180deg, #8B3A4A, #C9A46A, #5E2430, #8B3A4A)", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(94,36,48,.25)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#fff" }}>
                  <Image src="/images/shelies-logo-real.jpg" alt="Shelie's" width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: P.text, margin: "0 0 6px" }}>Bienvenida</h2>
              <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Usa el formato <strong>nombre.apellido</strong></p>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: P.textMed, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>Usuario</label>
                <input
                  value={cedula} onChange={e => setCedula(e.target.value)}
                  type="text" placeholder="nombre.apellido" autoComplete="username"
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${P.border}`, fontSize: 15, color: P.text, background: "#FDFAF8", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = P.vino; e.target.style.boxShadow = `0 0 0 3px rgba(139,58,74,.08)`; }}
                  onBlur={e => { e.target.style.borderColor = P.border; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: P.textMed, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={password} onChange={e => setPassword(e.target.value)}
                    type={showPass ? "text" : "password"} placeholder="••••••••••" autoComplete="current-password"
                    style={{ width: "100%", padding: "13px 44px 13px 16px", borderRadius: 12, border: `1.5px solid ${P.border}`, fontSize: 15, color: P.text, background: "#FDFAF8", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = P.vino; e.target.style.boxShadow = `0 0 0 3px rgba(139,58,74,.08)`; }}
                    onBlur={e => { e.target.style.borderColor = P.border; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: P.textFaint, padding: 0 }}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: "11px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !cedula || !password}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12, border: "none", cursor: loading || !cedula || !password ? "not-allowed" : "pointer",
                  background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, color: "#fff", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: loading || !cedula || !password ? 0.5 : 1,
                  boxShadow: loading || !cedula || !password ? "none" : "0 8px 24px rgba(94,36,48,.3)",
                  transition: "opacity .15s",
                }}
              >
                {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>}
                {loading ? "Verificando…" : "Ingresar"}
              </button>

              {/* Hint with info icon */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(201,164,106,0.08)", border: "1px solid rgba(201,164,106,0.25)", borderRadius: 10, padding: "9px 12px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.doradoDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p style={{ textAlign: "center", fontSize: 11, color: P.textMuted, margin: 0 }}>
                  Ingresa con tu usuario: <span style={{ fontWeight: 600, color: P.textMed }}>nombre.apellido</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shift Timer ─────────────────────────────────────────
function ShiftTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const base = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - base) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

// ─── Shell ────────────────────────────────────────────────
function EstilistaShell({ children, user, onLogout }: { children: ReactNode; user: StylistUser; onLogout: () => void }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [shiftStartedAt, setShiftStartedAt] = useState<string | null>(null);
  const [shiftEndedAt, setShiftEndedAt]   = useState<string | null>(null);
  const [shiftEnded, setShiftEnded]       = useState(false);
  const [shiftStartedAtLog, setShiftStartedAtLog] = useState<string | null>(null); // For display when ended
  const [shiftLoading, setShiftLoading]   = useState(false);
  const [confirmAction, setConfirmAction] = useState<"start" | "end" | null>(null);
  const [isMobile, setIsMobile]           = useState(true);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Load shift state for today
  useEffect(() => {
    if (!user?.id) return;
    // Check active shift
    stylistFetch(apiUrl(`/api/stylist/shifts/active/${user.id}`))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.started_at) setShiftStartedAt(d.started_at); })
      .catch(() => {});
    // Check if already ended today
    stylistFetch(apiUrl("/api/stylist/shifts/today"))
      .then(r => r.ok ? r.json() : [])
      .then((shifts: Array<{ employee_id?: number; ended_at: string | null; started_at: string }>) => {
        const mine = shifts.filter(s => Number(s.employee_id) === user.id);
        const active = mine.find(s => !s.ended_at);
        const ended = mine.find(s => !!s.ended_at);
        if (!active && ended) {
          setShiftEnded(true);
          setShiftStartedAt(null);
          setShiftStartedAtLog(ended.started_at);
          setShiftEndedAt(ended.ended_at);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  function fmtTime(iso: string | null) {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }

  async function handleStartShift() {
    setShiftLoading(true);
    try {
      const r = await stylistFetch(apiUrl("/api/stylist/shifts/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: user.id, employeeName: user.name, employeeEmail: user.email }),
      });
      if (r.ok) {
        const d = await r.json();
        setShiftStartedAt(d.started_at ?? new Date().toISOString());
      }
    } catch {} finally { setShiftLoading(false); setConfirmAction(null); }
  }

  async function handleEndShift() {
    setShiftLoading(true);
    try {
      const r = await stylistFetch(apiUrl("/api/stylist/shifts/end"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: user.id }),
      });
      if (r.ok) {
        const d = await r.json();
        setShiftStartedAtLog(shiftStartedAt);
        setShiftEndedAt(d.ended_at ?? new Date().toISOString());
        setShiftStartedAt(null);
        setShiftEnded(true);
      }
    } catch {} finally { setShiftLoading(false); setConfirmAction(null); }
  }

  const firstName = user.name.split(" ")[0];

  const navContent = (
    <nav style={{ padding: "24px 12px", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* User card */}
      <div style={{ borderRadius: 14, border: `1px solid ${P.border}`, background: P.bgSubtle, padding: "14px 12px", textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: `0 4px 12px rgba(94,36,48,.2)` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
            <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
          </svg>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: "0 0 4px" }}>{user.name}</p>
        <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.vinoDeep, background: P.vinoLight, border: `1px solid ${P.vino}30`, borderRadius: 20, padding: "2px 8px", display: "inline-block" }}>{user.cargo || "Estilista"}</span>
      </div>

      {/* Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV_LINKS.map(link => {
          const isActive = link.href === "/estilista" ? pathname === "/estilista" : pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                paddingTop: 10, paddingBottom: 10,
                paddingLeft: isActive ? 13 : 16, paddingRight: 12,
                borderRadius: 10, textDecoration: "none",
                fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "background .15s",
                background: isActive ? "linear-gradient(90deg, rgba(201,164,106,0.12), transparent)" : "transparent",
                color: isActive ? P.dorado : P.textMuted,
                borderLeft: isActive ? `3px solid ${P.dorado}` : "3px solid transparent",
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = P.bgSubtle; } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom: name + logout */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${P.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${P.doradoDeep},${P.dorado})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#fff" }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: P.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</p>
            <p style={{ fontSize: 9, color: P.textFaint, margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>{user.cargo || "Estilista"}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${P.border}`, background: "transparent", color: P.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Salir
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; background: ${P.bg}; color: ${P.text}; margin: 0; }
      `}</style>

      <div style={{ minHeight: "100vh", background: P.bg, color: P.text }}>
        {/* Header */}
        <header style={{ background: P.bgCard, borderBottom: `1px solid ${P.border}`, position: "sticky", top: 0, zIndex: 30, boxShadow: P.shadow }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 64 }}>
            {/* Hamburger — mobile / Collapse toggle — desktop */}
            <button
              type="button"
              onClick={() => isMobile ? setDrawerOpen(true) : setSidebarHidden(v => !v)}
              style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${P.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: P.textMuted }}
            >
              {!isMobile && !sidebarHidden ? (
                /* panel-collapse icon */
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="1" width="5" height="16" rx="2" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4.5 7l-2 2 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : !isMobile && sidebarHidden ? (
                /* panel-expand icon */
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="1" width="5" height="16" rx="2" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M3.5 7l2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                /* hamburger — mobile */
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect y="3" width="18" height="1.5" rx="1" fill="currentColor"/>
                  <rect y="8.25" width="18" height="1.5" rx="1" fill="currentColor"/>
                  <rect y="13.5" width="18" height="1.5" rx="1" fill="currentColor"/>
                </svg>
              )}
            </button>

            {/* Brand */}
            <Link href="/estilista" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                  <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textMuted, margin: 0 }}>Portal Estilistas</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: 0, letterSpacing: "0.05em" }}>Shelie&apos;s Hair</p>
              </div>
            </Link>

            {/* Shift + Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Shift indicator/button */}
              {shiftEnded && !shiftStartedAt ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, background: P.bgSubtle, fontSize: 11, fontWeight: 500, color: P.textMuted }}>
                  Turno: {fmtTime(shiftStartedAtLog)} → {fmtTime(shiftEndedAt)}
                </span>
              ) : confirmAction ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: P.textMed }}>
                    {confirmAction === "start" ? `Iniciar a las ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}?` : `Finalizar a las ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}?`}
                  </span>
                  <button onClick={() => setConfirmAction(null)}
                    style={{ padding: "5px 10px", borderRadius: 16, border: `1px solid ${P.border}`, background: "transparent", color: P.textMuted, fontSize: 10, cursor: "pointer" }}>
                    No
                  </button>
                  <button onClick={confirmAction === "start" ? handleStartShift : handleEndShift}
                    disabled={shiftLoading}
                    style={{ padding: "5px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#fff", background: confirmAction === "start" ? "#22C55E" : P.vino, opacity: shiftLoading ? 0.6 : 1 }}>
                    {shiftLoading ? "..." : "Confirmar"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAction(shiftStartedAt ? "end" : "start")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "opacity .15s",
                    background: shiftStartedAt ? P.vinoLight : P.doradoLight,
                    color: shiftStartedAt ? P.vinoDeep : P.doradoDeep,
                  }}
                >
                  {shiftStartedAt ? (
                    <>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", animation: "pulse-dot 2s ease-in-out infinite", flexShrink: 0 }}/>
                      <ShiftTimer startedAt={shiftStartedAt} />&nbsp;· Finalizar turno
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Iniciar turno
                    </>
                  )}
                </button>
              )}

              {/* Logout */}
              <button
                onClick={onLogout}
                style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${P.border}`, background: "transparent", color: P.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {isMobile && drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(30,15,10,.4)", backdropFilter: "blur(4px)" }}
            />
            <div
              style={{ position: "fixed", left: 0, top: 0, zIndex: 50, height: "100%", width: 260, background: P.bgCard, overflowY: "auto", boxShadow: "4px 0 24px rgba(94,36,48,.12)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px", borderBottom: `1px solid ${P.border}` }}>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: P.textMuted, margin: 0 }}>Menú</p>
                <button type="button" onClick={() => setDrawerOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: P.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              {navContent}
            </div>
          </>
        )}

        {/* Body */}
        <div style={{ display: "flex" }}>
          {/* Sidebar desktop */}
          {!isMobile && !sidebarHidden && (
            <aside style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${P.border}`, background: P.bgCard }}>
              <div style={{ position: "sticky", top: 64, height: "calc(100vh - 64px)", overflowY: "auto" }}>
                {navContent}
              </div>
            </aside>
          )}

          {/* Main */}
          <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "28px 20px" : "32px" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

// ─── Layout (auth gate + shell) ──────────────────────────
export default function EstilistaLayout({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<StylistUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("estilista_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setChecking(false);
  }, []);

  function handleLogin(u: StylistUser) {
    sessionStorage.setItem("estilista_user", JSON.stringify(u));
    setUser(u);
  }

  function handleLogout() {
    sessionStorage.removeItem("estilista_user");
    sessionStorage.removeItem("estilista_token");
    setUser(null);
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg,${P.bg},#F2E9E4)` }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ width: 28, height: 28, border: `2px solid rgba(139,58,74,.15)`, borderTopColor: P.vino, borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>
      </div>
    );
  }

  if (!user) {
    return <LoginEstilista onLogin={handleLogin} />;
  }

  return (
    <EstilistaShell user={user} onLogout={handleLogout}>
      {children}
    </EstilistaShell>
  );
}
