"use client";
import { apiUrl, authedFetch } from "@/lib/api";
import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminThemeProvider, useAdminTheme } from "@/lib/admin-theme";


/* ── Theme Toggle Button (Grande y Visible) ── */
function ThemeToggle() {
  const t = useAdminTheme();

  return (
    <button
      onClick={t.toggleMode}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium text-sm hover:opacity-80"
      style={{ borderColor: t.colors.border, color: t.colors.text }}
      title={t.mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span className="text-xl">{t.mode === "dark" ? "☀️" : "🌙"}</span>
      <span className="hidden md:inline">{t.mode === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
    </button>
  );
}

/* ── Sidebar ── */
function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const t = useAdminTheme();
  const [previewRole, setPreviewRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const pr = sessionStorage.getItem("preview_role");
      setPreviewRole(pr);
    } catch (e) {
      setPreviewRole(null);
    }
  }, []);

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/inbox", label: "Inbox", badge: 8 },
    { href: "/admin/citas", label: "Citas" },
    { href: "/admin/pedidos", label: "Pedidos" },
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/productos", label: "Productos" },
    { href: "/admin/servicios", label: "Servicios" },
    { href: "/admin/equipo", label: "Equipo" },
    { href: "/admin/estilistas", label: "HC Equipo" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/reportes", label: "Reportes" },
    { href: "/admin/configuracion", label: "Config" },
    { href: "/admin/perfil", label: "Perfil" },
  ];

  const visibleLinks = previewRole === "colaborador"
    ? links.filter((l) => ["/admin", "/admin/inbox", "/admin/pedidos", "/admin/clientes"].includes(l.href))
    : links;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay para móviles */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`${collapsed ? "w-20" : "w-64"} min-h-screen flex flex-col border-r transition-all duration-300 flex-shrink-0 fixed md:relative z-50 md:z-auto ${collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"}`}
        style={{ backgroundColor: t.colors.bgSidebar, borderColor: t.colors.border }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: t.colors.border }}>
          <div className="flex items-center justify-between">
            {!collapsed && (
              <Link href="/admin" className="font-bold text-xl flex items-center gap-2" style={{ color: t.colors.text }}>
                <span className="text-2xl">💎</span>
                <span>Shelie</span>
              </Link>
            )}
            {collapsed && (
              <Link href="/admin" className="text-2xl mx-auto">💎</Link>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleLinks.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                title={collapsed ? l.label : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative hover:opacity-80"
                style={{
                  backgroundColor: active ? t.colors.primary : "transparent",
                  color: active ? "#FFFFFF" : t.colors.textMuted,
                }}
              >
                {!collapsed && <span>{l.label}</span>}
                {l.badge && !collapsed && (
                  <span
                    className="ml-auto text-white text-xs font-bold rounded-full px-2 py-0.5"
                    style={{ backgroundColor: t.colors.danger }}
                  >
                    {l.badge}
                  </span>
                )}
                {l.badge && collapsed && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ backgroundColor: t.colors.danger }}
                  >
                    {l.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: t.colors.border }}>
          <button
            onClick={onToggle}
            className="w-full p-2 rounded-lg border transition-all text-sm font-medium hover:opacity-80"
            style={{ borderColor: t.colors.border, color: t.colors.textMuted }}
          >
            {collapsed ? "▶" : "◀ Contraer"}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Login ── */
function LoginForm({ onLogin }: { onLogin: (user?: { name: string; avatar: string; role: string }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Intentar verificar por API (DB)
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
      setError("Credenciales incorrectas");
    } catch {
      setError("Sin conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B3A4A] via-[#6B2A3A] to-[#4B1A2A] flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💎</div>
          <h1 className="font-bold text-3xl text-[#121212] mb-2">Shelie Admin</h1>
          <p className="text-[#6B6B6B] text-sm">Panel de Control</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-[#6B6B6B] block mb-2 font-medium uppercase tracking-wider">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full bg-white border border-[#EDE3E1] rounded-lg px-4 py-3 text-sm text-[#121212] placeholder-[#6B6B6B]/50 focus:outline-none focus:ring-2 focus:ring-[#8B3A4A] focus:border-transparent transition"
              placeholder="admin@shelie.com"
            />
          </div>
          <div>
            <label className="text-xs text-[#6B6B6B] block mb-2 font-medium uppercase tracking-wider">Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full bg-white border border-[#EDE3E1] rounded-lg px-4 py-3 text-sm text-[#121212] placeholder-[#6B6B6B]/50 focus:outline-none focus:ring-2 focus:ring-[#8B3A4A] focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-200">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#8B3A4A] to-[#6B2A3A] text-white font-semibold rounded-lg py-3 text-sm hover:from-[#6B2A3A] hover:to-[#8B3A4A] transition-all shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main Layout ── */
function AdminLayoutInner({ children }: { children: ReactNode }) {
  const t = useAdminTheme();
  // Empieza colapsado (safe para móvil). En desktop se expande después del mount.
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (window.innerWidth >= 768) setCollapsed(false);
  }, []);

  // Cerrar sidebar automáticamente al navegar en móvil
  useEffect(() => {
    if (window.innerWidth < 768) setCollapsed(true);
  }, [pathname]);

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{ backgroundColor: t.colors.bg, color: t.colors.text }}
    >
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Header con Toggle de Tema */}
        <div
          className="border-b px-4 md:px-6 py-4"
          style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Botón Hamburguesa (solo móvil) */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="md:hidden p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ color: t.colors.text }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1">
              <h2 className="text-base md:text-lg font-bold" style={{ color: t.colors.text }}>Panel de Administración</h2>
              <p className="text-xs md:text-sm hidden sm:block" style={{ color: t.colors.textMuted }}>Shelie Siempre Bellas</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthed(sessionStorage.getItem("admin_auth") === "true");
    setChecking(false);
  }, []);

  if (checking) return <div className="min-h-screen bg-[#FAF7F4]" />;
  if (!authed) return <LoginForm onLogin={(user) => {
    if (user) {
      try { localStorage.setItem("shelie_agent_name", user.name); } catch {}
    }
    setAuthed(true);
  }} />;

  return (
    <AdminThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminThemeProvider>
  );
}
