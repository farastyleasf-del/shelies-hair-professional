"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiUrl, domiciliarioFetch } from "@/lib/api";

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
export interface DomUser {
  id: number;
  name: string;
  email: string;
  cedula: string;
  cargo: string;
  status: string;
}

// ─── Nav links ───────────────────────────────────────────
const NAV_LINKS = [
  {
    href: "/domiciliario",
    label: "Inicio",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/domiciliario/pedidos",
    label: "Pedidos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    href: "/domiciliario/historial",
    label: "Historial",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

// ─── Login ────────────────────────────────────────────────
function LoginDomiciliario({ onLogin }: { onLogin: (u: DomUser) => void }) {
  const [usuario, setUsuario]   = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!usuario || !password) return;
    setLoading(true); setError("");

    try {
      const authRes = await fetch(apiUrl("/api/employees/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: usuario.trim(), password }),
      });
      if (authRes.status === 401) { setError("Usuario o contraseña incorrectos"); return; }
      if (authRes.status === 403) { setError("Usuario inactivo"); return; }
      if (!authRes.ok) { setError("Error del servidor"); return; }

      const data = await authRes.json() as { employee: DomUser; token?: string };
      if (!data.employee) { setError("Usuario no encontrado"); return; }
      if (data.token) sessionStorage.setItem("domiciliario_token", data.token);
      sessionStorage.setItem("domiciliario_user", JSON.stringify(data.employee));
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
        .lg-flex-dom { display: none; }
        @media (min-width: 1024px) { .lg-flex-dom { display: flex !important; } }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", background: `linear-gradient(160deg, ${P.bg} 0%, #F2E9E4 100%)` }}>
        {/* Left brand panel — desktop only */}
        <div
          className="lg-flex-dom"
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
            <p style={{ fontSize: 10, fontWeight: 600, color: `rgba(201,164,106,.7)`, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>Portal Domiciliarios</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 12 }}>
              Shelie&apos;s<br/>Hair Studio
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
              Tu panel de entregas. Gestiona tus pedidos, rutas y entregas del día en un solo lugar.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Pedidos pendientes en tiempo real", "Marcar entregas al instante", "Historial de entregas", "Resumen de cobros del día"].map(f => (
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
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 8px 24px rgba(94,36,48,.25)` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: P.text, margin: "0 0 6px" }}>Bienvenido</h2>
              <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Usa el formato <strong>nombre.apellido</strong></p>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: P.textMed, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>Usuario</label>
                <input
                  value={usuario} onChange={e => setUsuario(e.target.value)}
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
                disabled={loading || !usuario || !password}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12, border: "none", cursor: loading || !usuario || !password ? "not-allowed" : "pointer",
                  background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, color: "#fff", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: loading || !usuario || !password ? 0.5 : 1,
                  boxShadow: loading || !usuario || !password ? "none" : "0 8px 24px rgba(94,36,48,.3)",
                  transition: "opacity .15s",
                }}
              >
                {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>}
                {loading ? "Verificando…" : "Ingresar"}
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: P.textFaint, margin: 0 }}>
                Ingresa con tu usuario: <span style={{ fontWeight: 600, color: P.textMed }}>nombre.apellido</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Shell ────────────────────────────────────────────────
function DomiciliarioShell({ children, user, onLogout }: { children: ReactNode; user: DomUser; onLogout: () => void }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [isMobile, setIsMobile]           = useState(true);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const navContent = (
    <nav style={{ padding: "24px 12px" }}>
      {/* User card */}
      <div style={{ borderRadius: 14, border: `1px solid ${P.border}`, background: P.bgSubtle, padding: "14px 12px", textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: `0 4px 12px rgba(94,36,48,.2)` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>{user.name}</p>
        <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textMuted, margin: 0 }}>{user.cargo || "Domiciliario"}</p>
      </div>

      {/* Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_LINKS.map(link => {
          const isActive = link.href === "/domiciliario" ? pathname === "/domiciliario" : pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "background .15s",
                background: isActive ? `linear-gradient(135deg,${P.vinoDeep},${P.vino})` : "transparent",
                color: isActive ? "#fff" : P.textMuted,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = P.bgSubtle; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
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
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="1" width="5" height="16" rx="2" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4.5 7l-2 2 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : !isMobile && sidebarHidden ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="1" width="5" height="16" rx="2" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M3.5 7l2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect y="3" width="18" height="1.5" rx="1" fill="currentColor"/>
                  <rect y="8.25" width="18" height="1.5" rx="1" fill="currentColor"/>
                  <rect y="13.5" width="18" height="1.5" rx="1" fill="currentColor"/>
                </svg>
              )}
            </button>

            {/* Brand */}
            <Link href="/domiciliario" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textMuted, margin: 0 }}>Portal Domiciliarios</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: 0, letterSpacing: "0.05em" }}>Shelie&apos;s Hair</p>
              </div>
            </Link>

            {/* User name + Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: P.textMed, fontWeight: 500, display: "none" }} className="sm:inline">
                {user.name}
              </span>
              <button
                onClick={onLogout}
                style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${P.border}`, background: "transparent", color: P.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Cerrar sesión
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
export default function DomiciliarioLayout({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<DomUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("domiciliario_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setChecking(false);
  }, []);

  function handleLogin(u: DomUser) {
    sessionStorage.setItem("domiciliario_user", JSON.stringify(u));
    setUser(u);
  }

  function handleLogout() {
    sessionStorage.removeItem("domiciliario_user");
    sessionStorage.removeItem("domiciliario_token");
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
    return <LoginDomiciliario onLogin={handleLogin} />;
  }

  return (
    <DomiciliarioShell user={user} onLogout={handleLogout}>
      {children}
    </DomiciliarioShell>
  );
}
