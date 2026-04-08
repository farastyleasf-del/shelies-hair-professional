"use client";
import { useState, useEffect, ReactNode } from "react";
import { apiUrl } from "@/lib/api";
import Image from "next/image";
import { AdminThemeProvider } from "@/lib/admin-theme";

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
};

/* ══════════════════════════════════════════════════════
   LOGIN AGENTE — Estilo unificado con estilista/domiciliario
   ══════════════════════════════════════════════════════ */

function LoginAgente({ onLogin }: { onLogin: (data: { name: string; id: number; email: string }) => void }) {
  const [usuario, setUsuario]   = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!usuario || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/employees/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: usuario.trim(), password }),
      });
      if (res.status === 401) { setError("Usuario o contraseña incorrectos"); return; }
      if (res.status === 403) { setError("Usuario inactivo"); return; }
      if (!res.ok) { setError("Error del servidor"); return; }
      const data = await res.json() as { employee: { id: number; name: string; email: string; cargo: string }; token?: string };
      if (data.token) sessionStorage.setItem("agente_token", data.token);
      sessionStorage.setItem("agente_auth", "true");
      sessionStorage.setItem("agente_name", data.employee.name);
      localStorage.setItem("shelie_agent_name", data.employee.name);
      onLogin({ name: data.employee.name, id: data.employee.id, email: data.employee.email ?? usuario });
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
        .lg-flex-agente { display: none; }
        @media (min-width: 1024px) { .lg-flex-agente { display: flex !important; } }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", background: `linear-gradient(160deg, ${P.bg} 0%, #F2E9E4 100%)` }}>
        {/* Left brand panel — desktop only */}
        <div
          className="lg-flex-agente"
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
            <p style={{ fontSize: 10, fontWeight: 600, color: `rgba(201,164,106,.7)`, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>Portal Agentes</p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 12 }}>
              Shelie&apos;s<br/>Hair Studio
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
              Tu centro de atención al cliente. Gestiona chats de WhatsApp, crea pedidos y atiende consultas en un solo lugar.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["Inbox WhatsApp Business en tiempo real", "Crear pedidos desde el chat", "Plantillas de respuesta rápida", "Rastreo de pedidos al instante"].map(f => (
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
              {/* Decorative gradient ring behind icon */}
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", padding: 3, background: "conic-gradient(from 180deg, #8B3A4A, #C9A46A, #5E2430, #8B3A4A)", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(94,36,48,.25)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: "#fff" }}>
                  <Image src="/images/shelies-logo-real.jpg" alt="Shelie's" width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
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
                {loading ? "Verificando…" : "Ingresar al Chat"}
              </button>

              {/* WhatsApp hint */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,168,132,0.06)", border: "1px solid rgba(0,168,132,0.2)", borderRadius: 10, padding: "9px 12px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00A884" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
                <p style={{ fontSize: 11, color: P.textMuted, margin: 0 }}>
                  WhatsApp Business · Ingresa con tu usuario: <span style={{ fontWeight: 600, color: P.textMed }}>nombre.apellido</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   LAYOUT WRAPPER
   ══════════════════════════════════════════════════════ */

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
  }, []);

  function handleLogin(data: { name: string; id: number; email: string }) {
    sessionStorage.setItem("agente_user_id", String(data.id));
    sessionStorage.setItem("agente_email",   data.email);
    setAgenteName(data.name);
    setAuthed(true);
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg,${P.bg},#F2E9E4)` }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ width: 28, height: 28, border: `2px solid rgba(139,58,74,.15)`, borderTopColor: P.vino, borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }}/>
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
