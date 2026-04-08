"use client";
import { apiUrl, authedFetch } from "@/lib/api";
import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminThemeProvider, useAdminTheme } from "@/lib/admin-theme";

// ─── Paleta ───────────────────────────────────────────────
const P = {
  bg:         "#FAF7F4",
  vino:       "#8B3A4A",
  vinoDeep:   "#5E2430",
  dorado:     "#C9A46A",
  doradoDeep: "#A07C45",
  doradoLight:"#FDF6E8",
  text:       "#1E0F0A",
  textMed:    "#5C3A30",
  textMuted:  "#957068",
  textFaint:  "#C4A99F",
  border:     "#EAE0DA",
};

// ─── Nav structure (simplified) ───────────────────────────
const NAV_SECTIONS = [
  {
    title: "Principal",
    links: [
      { href: "/admin",        label: "Dashboard",  icon: "📊" },
      { href: "/admin/inbox",  label: "Inbox",      icon: "💬" },
    ],
  },
  {
    title: "Negocio",
    links: [
      { href: "/admin/pedidos",    label: "Pedidos",    icon: "📦" },
      { href: "/admin/citas",      label: "Citas",      icon: "📅" },
      { href: "/admin/promos",     label: "Promos",     icon: "🎉" },
    ],
  },
  {
    title: "Catálogo",
    links: [
      { href: "/admin/productos",  label: "Productos",  icon: "🧴" },
      { href: "/admin/servicios",  label: "Servicios",  icon: "✂️" },
    ],
  },
  {
    title: "Equipo",
    links: [
      { href: "/admin/equipo",     label: "Equipo",     icon: "👥" },
      { href: "/admin/reportes",   label: "Reportes",   icon: "📈" },
    ],
  },
];

// ─── Login ────────────────────────────────────────────────
function LoginAdmin({ onLogin }: { onLogin: (user: { name: string; avatar: string; role: string }) => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email || !password) return;
    setLoading(true); setError("");
    try {
      const res = await authedFetch(apiUrl("/api/admin/auth"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json() as { user: { name: string; avatar: string; role: string }; token?: string };
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_user", JSON.stringify(data.user));
        if (data.token) sessionStorage.setItem("admin_token", data.token);
        localStorage.setItem("shelie_agent_name", data.user.name);
        onLogin(data.user);
        return;
      }
      if (res.status === 401) setError("Credenciales incorrectas");
      else setError("Error del servidor");
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
        .lg-flex-admin { display: none; }
        @media (min-width: 1024px) { .lg-flex-admin { display: flex !important; } }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", background: `linear-gradient(160deg, ${P.bg} 0%, #F2E9E4 100%)` }}>
        {/* Left brand panel */}
        <div className="lg-flex-admin"
          style={{
            width: 420, flexShrink: 0,
            background: `linear-gradient(160deg, ${P.vinoDeep} 0%, ${P.vino} 55%, #A85068 100%)`,
            padding: "64px 48px", flexDirection: "column", justifyContent: "space-between",
            position: "relative", overflow: "hidden",
          }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", border: `1px solid rgba(201,164,106,.15)` }}/>
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", border: `1px solid rgba(201,164,106,.1)` }}/>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: `rgba(201,164,106,.7)`, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>Panel Administrativo</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 12 }}>
              Shelie&apos;s<br/>Hair Studio
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
              Gestiona tu negocio desde un solo lugar. Pedidos, citas, equipo, reportes y más.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Dashboard con métricas en tiempo real", "Gestión de pedidos y citas", "Catálogo de productos y servicios", "Equipo, turnos y reportes"].map(f => (
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
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", padding: 3, background: "conic-gradient(from 180deg, #8B3A4A, #C9A46A, #5E2430, #8B3A4A)", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(94,36,48,.25)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  💎
                </div>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: P.text, margin: "0 0 6px" }}>Administración</h2>
              <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Ingresa con tus credenciales de admin</p>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: P.textMed, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>Usuario</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="text" placeholder="shelie" autoComplete="username"
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${P.border}`, fontSize: 15, color: P.text, background: "#FDFAF8", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = P.vino; e.target.style.boxShadow = `0 0 0 3px rgba(139,58,74,.08)`; }}
                  onBlur={e => { e.target.style.borderColor = P.border; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: P.textMed, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input value={password} onChange={e => setPassword(e.target.value)}
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

              <button type="submit" disabled={loading || !email || !password}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12, border: "none",
                  cursor: loading || !email || !password ? "not-allowed" : "pointer",
                  background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, color: "#fff", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: loading || !email || !password ? 0.5 : 1,
                  boxShadow: loading || !email || !password ? "none" : "0 8px 24px rgba(94,36,48,.3)",
                  transition: "opacity .15s",
                }}>
                {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>}
                {loading ? "Verificando…" : "Ingresar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────
function AdminSidebar({ user, onLogout }: { user: { name: string; avatar: string; role: string } | null; onLogout: () => void }) {
  const pathname = usePathname();
  const t = useAdminTheme();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <nav style={{ padding: "20px 12px", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* User card */}
      {user && (
        <div style={{ borderRadius: 14, border: `1px solid ${t.colors.border}`, background: t.mode === "dark" ? t.colors.bgDeep : "#F5F0EC", padding: "14px 12px", textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: `0 4px 12px rgba(94,36,48,.2)`, fontSize: 20 }}>
            {user.avatar || "💎"}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: t.colors.text, margin: "0 0 2px" }}>{user.name}</p>
          <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: t.colors.primary, background: t.colors.primaryLight, borderRadius: 20, padding: "2px 8px", display: "inline-block" }}>{user.role}</span>
        </div>
      )}

      {/* Nav sections */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.title}>
            <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: t.colors.textFaint, padding: "0 12px", marginBottom: 6 }}>{section.title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {section.links.map(link => {
                const active = isActive(link.href);
                return (
                  <Link key={link.href} href={link.href}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 10, textDecoration: "none",
                      fontSize: 13, fontWeight: active ? 600 : 400, transition: "all .15s",
                      background: active ? t.colors.primaryLight : "transparent",
                      color: active ? t.colors.primary : t.colors.textMuted,
                      borderLeft: active ? `3px solid ${t.colors.primary}` : "3px solid transparent",
                    }}>
                    <span style={{ fontSize: 15 }}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: logout */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.colors.border}` }}>
        <button onClick={onLogout}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${t.colors.border}`, background: "transparent", color: t.colors.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

// ─── Shell ────────────────────────────────────────────────
function AdminShell({ children, user, onLogout }: { children: ReactNode; user: { name: string; avatar: string; role: string } | null; onLogout: () => void }) {
  const t = useAdminTheme();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
      `}</style>

      <div style={{ minHeight: "100vh", background: t.colors.bg, color: t.colors.text }}>
        {/* Header */}
        <header style={{ background: t.colors.bgCard, borderBottom: `1px solid ${t.colors.border}`, position: "sticky", top: 0, zIndex: 30, boxShadow: "0 4px 20px rgba(94,36,48,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 60 }}>
            {/* Hamburger / Collapse */}
            <button type="button"
              onClick={() => isMobile ? setDrawerOpen(true) : setSidebarHidden(v => !v)}
              style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.colors.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.colors.textMuted }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect y="3" width="18" height="1.5" rx="1" fill="currentColor"/>
                <rect y="8.25" width="18" height="1.5" rx="1" fill="currentColor"/>
                <rect y="13.5" width="18" height="1.5" rx="1" fill="currentColor"/>
              </svg>
            </button>

            {/* Brand */}
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${P.vinoDeep},${P.vino})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                💎
              </div>
              <div>
                <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.35em", color: t.colors.textMuted, margin: 0 }}>Admin</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: t.colors.text, margin: 0 }}>Shelie&apos;s</p>
              </div>
            </Link>

            {/* Theme + user */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={t.toggleMode}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.colors.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
                title={t.mode === "dark" ? "Modo claro" : "Modo oscuro"}>
                {t.mode === "dark" ? "☀️" : "🌙"}
              </button>
              {user && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${P.doradoDeep},${P.dorado})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {isMobile && drawerOpen && (
          <>
            <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(30,15,10,.4)", backdropFilter: "blur(4px)" }} />
            <div style={{ position: "fixed", left: 0, top: 0, zIndex: 50, height: "100%", width: 260, background: t.colors.bgCard, overflowY: "auto", boxShadow: "4px 0 24px rgba(94,36,48,.12)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: `1px solid ${t.colors.border}` }}>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: t.colors.textMuted, margin: 0 }}>Menú</p>
                <button type="button" onClick={() => setDrawerOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: t.colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              <AdminSidebar user={user} onLogout={onLogout} />
            </div>
          </>
        )}

        {/* Body */}
        <div style={{ display: "flex" }}>
          {!isMobile && !sidebarHidden && (
            <aside style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${t.colors.border}`, background: t.colors.bgCard }}>
              <div style={{ position: "sticky", top: 60, height: "calc(100vh - 60px)", overflowY: "auto" }}>
                <AdminSidebar user={user} onLogout={onLogout} />
              </div>
            </aside>
          )}
          <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "24px 16px" : "28px 32px" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

// ─── Layout (auth gate) ───────────────────────────────────
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<{ name: string; avatar: string; role: string } | null>(null);

  useEffect(() => {
    const ok = sessionStorage.getItem("admin_auth") === "true";
    setAuthed(ok);
    if (ok) {
      try { setUser(JSON.parse(sessionStorage.getItem("admin_user") ?? "null")); } catch {}
    }
    setChecking(false);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_token");
    setAuthed(false); setUser(null);
  }

  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg,${P.bg},#F2E9E4)` }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ width: 28, height: 28, border: `2px solid rgba(139,58,74,.15)`, borderTopColor: P.vino, borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>
    </div>
  );

  if (!authed) return <LoginAdmin onLogin={u => { setUser(u); setAuthed(true); }} />;

  return (
    <AdminThemeProvider>
      <AdminShell user={user} onLogout={handleLogout}>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
