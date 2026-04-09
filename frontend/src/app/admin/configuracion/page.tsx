"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAdminTheme, type ThemeMode } from "@/lib/admin-theme";
import { channelIcons } from "@/lib/admin-data";
import { apiUrl, authedFetch } from "@/lib/api";

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
  const [tab, setTab] = useState<"web" | "integraciones" | "apariencia">("web");

  // Site config — fotos slider
  const [sliderBefore, setSliderBefore] = useState("/images/services/antes-2.jpg");
  const [sliderAfter, setSliderAfter] = useState("/images/services/resultado-3.jpg");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configToast, setConfigToast] = useState("");
  const [uploadingSliderBefore, setUploadingSliderBefore] = useState(false);
  const [uploadingSliderAfter, setUploadingSliderAfter] = useState(false);
  const sliderBeforeRef = useRef<HTMLInputElement>(null);
  const sliderAfterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(apiUrl("/api/site-config"))
      .then(r => r.json())
      .then((cfg: Record<string, string>) => {
        if (cfg.slider_before) setSliderBefore(cfg.slider_before);
        if (cfg.slider_after) setSliderAfter(cfg.slider_after);
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  async function uploadSliderImage(file: File, target: "before" | "after") {
    const setter = target === "before" ? setSliderBefore : setSliderAfter;
    const setUploading = target === "before" ? setUploadingSliderBefore : setUploadingSliderAfter;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await authedFetch(apiUrl("/api/uploads"), { method: "POST", body: fd });
      const data = await res.json();
      setter(data.url as string);
    } catch {} finally { setUploading(false); }
  }

  async function saveSliderConfig() {
    setConfigSaving(true);
    try {
      await authedFetch(apiUrl("/api/site-config"), {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slider_before: sliderBefore, slider_after: sliderAfter }),
      });
      setConfigToast("Fotos del slider guardadas");
      setTimeout(() => setConfigToast(""), 3000);
    } catch {} finally { setConfigSaving(false); }
  }

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
          { id: "web" as const, label: "Página web" },
          { id: "integraciones" as const, label: "Integraciones" },
          { id: "apariencia" as const, label: "Apariencia" },
        ]).map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${tab === tb.id ? activeTabCls : inactiveTabCls}`}
            style={tab === tb.id ? { backgroundColor: t.colors.primary } : {}}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {configToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg" style={{ backgroundColor: t.colors.primary }}>
          {configToast}
        </div>
      )}

      {/* ═══ PÁGINA WEB ═══ */}
      {tab === "web" && (
        <div className="space-y-4">
          <SectionCard title="Slider Antes / Después" icon="">
            <p className="text-sm mb-4" style={{ color: t.colors.textMuted }}>
              Cambia las fotos del slider &quot;La Transformación Shelie&apos;s&quot; en la página de servicios.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Foto ANTES */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: t.colors.textMuted }}>Foto ANTES</p>
                <input ref={sliderBeforeRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadSliderImage(f, "before"); }} />
                {sliderBefore ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
                    <Image src={sliderBefore} alt="Antes" fill className="object-cover" sizes="300px" unoptimized />
                    <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-orange-500 text-white">ANTES</div>
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button onClick={() => sliderBeforeRef.current?.click()} disabled={uploadingSliderBefore}
                        className="text-[10px] px-2 py-1 rounded-lg bg-black/60 text-white font-medium hover:bg-black/80">
                        {uploadingSliderBefore ? "Subiendo..." : "Cambiar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => sliderBeforeRef.current?.click()} disabled={uploadingSliderBefore}
                    className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
                    style={{ borderColor: t.colors.border, color: t.colors.textMuted }}>
                    <span className="text-xs font-medium">{uploadingSliderBefore ? "Subiendo..." : "Subir foto ANTES"}</span>
                  </button>
                )}
              </div>

              {/* Foto DESPUÉS */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: t.colors.textMuted }}>Foto DESPUÉS</p>
                <input ref={sliderAfterRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadSliderImage(f, "after"); }} />
                {sliderAfter ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
                    <Image src={sliderAfter} alt="Después" fill className="object-cover" sizes="300px" unoptimized />
                    <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-500 text-white">DESPUÉS</div>
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button onClick={() => sliderAfterRef.current?.click()} disabled={uploadingSliderAfter}
                        className="text-[10px] px-2 py-1 rounded-lg bg-black/60 text-white font-medium hover:bg-black/80">
                        {uploadingSliderAfter ? "Subiendo..." : "Cambiar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => sliderAfterRef.current?.click()} disabled={uploadingSliderAfter}
                    className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
                    style={{ borderColor: t.colors.border, color: t.colors.textMuted }}>
                    <span className="text-xs font-medium">{uploadingSliderAfter ? "Subiendo..." : "Subir foto DESPUÉS"}</span>
                  </button>
                )}
              </div>
            </div>

            <button onClick={saveSliderConfig} disabled={configSaving}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: t.colors.primary }}>
              {configSaving ? "Guardando..." : "Guardar fotos del slider"}
            </button>
          </SectionCard>
        </div>
      )}

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
