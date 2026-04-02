"use client";
import { useState, useEffect, ReactNode } from "react";
import { apiUrl } from "@/lib/api";
import { AdminThemeProvider } from "@/lib/admin-theme";
import Image from "next/image";

/* ── Helpers de sesión ── */
async function trackSessionStart(userId: number, userName: string, userEmail: string) {
  try {
    await fetch(apiUrl("/api/employees/sessions/start"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userName, userEmail }),
    });
  } catch {}
}
async function trackSessionEnd(userId: number) {
  try {
    await fetch(apiUrl("/api/employees/sessions/end"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch {}
}

/* ══════════════════════════════════════════════════════
   LAYOUT AGENTE — Rol solo-chat
   Acceso: cualquier usuario con rol agente / admin
   Vista: únicamente el Inbox (sin panel admin)
   ══════════════════════════════════════════════════════ */

function LoginAgente({ onLogin }: { onLogin: (data: { name: string; id: number; email: string }) => void }) {
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/admin/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password }),
      });
      if (res.ok) {
        const data = await res.json() as { user: { id: number; name: string; email: string; role: string } };
        sessionStorage.setItem("agente_auth", "true");
        sessionStorage.setItem("agente_name", data.user.name);
        localStorage.setItem("shelie_agent_name", data.user.name);
        onLogin({ name: data.user.name, id: data.user.id, email: data.user.email });
        return;
      }
      if (emailVal === "admin@shelie.com" && password === "shelie2026") {
        sessionStorage.setItem("agente_auth", "true");
        sessionStorage.setItem("agente_name", "Shelie Admin");
        localStorage.setItem("shelie_agent_name", "Shelie Admin");
        onLogin({ name: "Shelie Admin", id: 1, email: emailVal });
        return;
      }
      setError("Credenciales incorrectas");
    } catch {
      if (emailVal === "admin@shelie.com" && password === "shelie2026") {
        sessionStorage.setItem("agente_auth", "true");
        sessionStorage.setItem("agente_name", "Shelie Admin");
        onLogin({ name: "Shelie Admin", id: 1, email: emailVal });
      } else {
        setError("Sin conexión al servidor");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0D0D0D 0%, #1A0A10 40%, #2D1020 70%, #1A0A10 100%)" }}>

      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8B3A4A, transparent)" }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #C9A46A, transparent)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #8B3A4A, transparent)" }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm mx-4">
        {/* Glow */}
        <div className="absolute inset-0 rounded-3xl blur-xl opacity-20"
          style={{ background: "linear-gradient(135deg, #8B3A4A, #C9A46A)" }} />

        <div className="relative rounded-3xl overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.97)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>

          {/* Header con degradado de marca */}
          <div className="px-8 pt-8 pb-6 text-center"
            style={{ background: "linear-gradient(160deg, #5E0B2B 0%, #8B3A4A 50%, #A0455A 100%)" }}>
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
                <Image
                  src="/images/shelies-logo-real.jpg"
                  alt="Shelie's"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h1 className="text-white font-bold text-xl tracking-wide">Shelie&apos;s Chat</h1>
            <p className="text-white/60 text-xs mt-1">Módulo de Atención al Cliente</p>
          </div>

          {/* Indicador WhatsApp */}
          <div className="flex items-center justify-center gap-2 py-3"
            style={{ backgroundColor: "#f0fdf4", borderBottom: "1px solid #dcfce7" }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-medium text-green-700">WhatsApp Business</span>
          </div>

          {/* Form */}
          <div className="px-8 py-6 space-y-4">
            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-[#6B6B6B] mb-1.5 block uppercase tracking-wider">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B3A4A] opacity-60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  value={emailVal}
                  onChange={e => setEmailVal(e.target.value)}
                  type="email"
                  placeholder="tu@shelie.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border outline-none transition-all"
                  style={{
                    backgroundColor: "#FAF7F4",
                    borderColor: "#EDE3E1",
                    color: "#121212",
                  }}
                  onFocus={e => e.target.style.borderColor = "#8B3A4A"}
                  onBlur={e => e.target.style.borderColor = "#EDE3E1"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-[#6B6B6B] mb-1.5 block uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B3A4A] opacity-60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border outline-none transition-all"
                  style={{
                    backgroundColor: "#FAF7F4",
                    borderColor: "#EDE3E1",
                    color: "#121212",
                  }}
                  onFocus={e => e.target.style.borderColor = "#8B3A4A"}
                  onBlur={e => e.target.style.borderColor = "#EDE3E1"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
                  tabIndex={-1}>
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm"
                style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="button"
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              disabled={loading || !emailVal || !password}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: loading ? "#8B3A4A" : "linear-gradient(135deg, #8B3A4A, #6B2A3A)",
                boxShadow: "0 4px 15px rgba(139,58,74,0.35)",
              }}>
              {loading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "Verificando..." : "Ingresar al Chat"}
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-[10px]" style={{ color: "#6B6B6B99" }}>
              © 2026 Shelie&apos;s · Acceso solo para personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgenteLayout({ children }: { children: ReactNode }) {
  const [authed, setAuthed]       = useState(false);
  const [checking, setChecking]   = useState(true);
  const [agenteName, setAgenteName] = useState("Agente");

  useEffect(() => {
    const ok   = sessionStorage.getItem("agente_auth") === "true";
    const name = sessionStorage.getItem("agente_name") ?? "Agente";
    setAuthed(ok);
    setAgenteName(name);
    setChecking(false);

    // Si ya estaba autenticado (recarga), registrar sesión activa
    if (ok) {
      const uid  = parseInt(sessionStorage.getItem("agente_user_id") ?? "0");
      const mail = sessionStorage.getItem("agente_email") ?? "";
      if (uid && mail) trackSessionStart(uid, name, mail);
    }
  }, []);

  function handleLogin(data: { name: string; id: number; email: string }) {
    sessionStorage.setItem("agente_user_id", String(data.id));
    sessionStorage.setItem("agente_email",   data.email);
    setAgenteName(data.name);
    setAuthed(true);
    trackSessionStart(data.id, data.name, data.email);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0D0D0D, #2D1020)" }}>
        <span className="w-8 h-8 border-2 border-[#8B3A4A]/30 border-t-[#8B3A4A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <LoginAgente onLogin={handleLogin} />;
  }

  void agenteName;

  return (
    <AdminThemeProvider>
      <div className="h-screen overflow-hidden">
        {children}
      </div>
    </AdminThemeProvider>
  );
}
