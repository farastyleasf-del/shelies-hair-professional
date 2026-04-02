"use client";
import { useState } from "react";
import { useAdminTheme, type ThemeMode } from "@/lib/admin-theme";
import { channelIcons } from "@/lib/admin-data";

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const t = useAdminTheme();
  return (
    <div className={`border rounded-2xl p-6`} style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
      <h3 className="text-lg font-poppins font-semibold flex items-center gap-2 mb-4" style={{ color: t.colors.text }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

export default function ConfiguracionPage() {
  const t = useAdminTheme();
  const [tab, setTab] = useState<"integraciones" | "apariencia">("integraciones");

  const activeTabCls = `text-white shadow-lg`;
  const inactiveTabCls = t.mode === "dark"
    ? "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
    : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200";

  const ModeCard = ({ id, icon, label, desc }: { id: ThemeMode; icon: string; label: string; desc: string }) => (
    <button onClick={() => t.setMode(id)}
      className={`text-left rounded-2xl p-5 transition-all w-full text-sm flex flex-col items-start gap-3 border-2 ${
        t.mode === id
          ? `border-vino shadow-xl`
          : `border-transparent hover:opacity-90`
      }`}
      style={{ backgroundColor: t.colors.bgCard, borderColor: t.mode === id ? t.colors.primary : t.colors.border }}>
      <div className="flex items-center gap-3 w-full">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <p className="font-semibold" style={{ color: t.colors.text }}>{label}</p>
          <p className="text-xs" style={{ color: t.colors.textMuted }}>{desc}</p>
        </div>
        {t.mode === id && <span className="text-xs font-semibold px-2 py-1 rounded" style={{ color: t.colors.primary }}>✓ Activo</span>}
      </div>
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-poppins font-bold" style={{ color: t.colors.text }}>⚙️ Configuración</h1>
        <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>Integraciones y apariencia del panel</p>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 border-b pb-3`} style={{ borderColor: t.colors.border }}>
        {([
          { id: "integraciones" as const, label: "🔌 Integraciones" },
          { id: "apariencia" as const, label: "🎨 Apariencia" },
        ]).map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${tab === tb.id ? activeTabCls : inactiveTabCls}`}
            style={tab === tb.id ? { backgroundColor: t.colors.primary } : {}}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ═══ INTEGRACIONES ═══ */}
      {tab === "integraciones" && (
        <div className="space-y-4">
          {/* WhatsApp */}
          <SectionCard title="WhatsApp Business API" icon="📱">
            <p className="text-sm mb-4" style={{ color: t.colors.textMuted }}>
              Variables de entorno necesarias en el backend para recibir y enviar mensajes.
            </p>
            <div className="space-y-3 mb-4">
              {[
                { name: "WHATSAPP_ACCESS_TOKEN", desc: "Token permanente de Meta Business Manager" },
                { name: "WHATSAPP_PHONE_NUMBER_ID", desc: "ID del número registrado en Meta" },
                { name: "WHATSAPP_VERIFY_TOKEN", desc: "Token de verificación del webhook" },
              ].map((v) => (
                <div key={v.name} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${t.colors.border}` }}>
                  <code className="text-xs font-mono mt-0.5" style={{ color: t.colors.primary }}>{v.name}</code>
                  <p className="text-xs" style={{ color: t.colors.textMuted }}>{v.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.03)" : "#f3f4f6", border: `1px solid ${t.colors.border}` }}>
              <p className="font-medium mb-1" style={{ color: t.colors.text }}>URL del Webhook (registrar en Meta):</p>
              <code className="text-xs break-all" style={{ color: t.colors.textMuted }}>
                https://shelies.asf.company/api/whatsapp/webhook
              </code>
              <p className="text-xs mt-2" style={{ color: t.colors.textFaint }}>
                Meta Business Manager → WhatsApp → Configuración → Webhooks → Editar
              </p>
            </div>
          </SectionCard>

          {/* MercadoPago */}
          <SectionCard title="MercadoPago" icon="💳">
            <p className="text-sm mb-4" style={{ color: t.colors.textMuted }}>
              Necesario para procesar pagos en línea desde la tienda.
            </p>
            <div className="p-3 rounded-xl" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.03)" : "#f9fafb", border: `1px solid ${t.colors.border}` }}>
              <code className="text-xs font-mono" style={{ color: t.colors.primary }}>MERCADOPAGO_ACCESS_TOKEN</code>
              <p className="text-xs mt-1" style={{ color: t.colors.textMuted }}>Token de producción — obtener en MercadoPago Developers</p>
            </div>
          </SectionCard>

          {/* Canales */}
          <SectionCard title="Canales de mensajería" icon="💬">
            <p className="text-sm mb-4" style={{ color: t.colors.textMuted }}>
              Actualmente solo WhatsApp está integrado vía Meta Cloud API.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { ch: "whatsapp", label: "WhatsApp", status: "Activo" },
                { ch: "instagram", label: "Instagram", status: "Próximamente" },
                { ch: "facebook", label: "Facebook", status: "Próximamente" },
              ].map((c) => (
                <div key={c.ch} className="flex items-center gap-2 p-3 rounded-xl border" style={{ borderColor: t.colors.border, backgroundColor: t.colors.bgCard }}>
                  <span>{channelIcons[c.ch]}</span>
                  <div>
                    <p className="text-xs font-medium" style={{ color: t.colors.text }}>{c.label}</p>
                    <p className={`text-[10px] ${c.status === "Activo" ? "text-green-500" : ""}`} style={c.status !== "Activo" ? { color: t.colors.textFaint } : {}}>{c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ APARIENCIA ═══ */}
      {tab === "apariencia" && (
        <SectionCard title="Tema del panel" icon="🎨">
          <p className="text-sm mb-4" style={{ color: t.colors.textMuted }}>Elige entre modo claro y oscuro.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <ModeCard id="light" icon="☀️" label="Modo Claro" desc="Fondo blanco, ideal para el día" />
            <ModeCard id="dark" icon="🌙" label="Modo Oscuro" desc="Fondo oscuro, reduce la fatiga visual" />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
