"use client";
import { useState } from "react";
import { useAdminTheme, type ThemeMode } from "@/lib/admin-theme";
type AccentTone = "vino" | "dorado" | "nude";
import {
  slaRules, templates, assignmentRules, agents,
  channelIcons, channelColors,
} from "@/lib/admin-data";

function SectionCard({ title, icon, children, action }: {
  title: string; icon: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  const t = useAdminTheme();
  return (
    <div className={`${t.bgCard} border ${t.border} rounded-2xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-poppins font-semibold flex items-center gap-2 ${t.text}`}>
          <span>{icon}</span> {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ConfiguracionPage() {
  const t = useAdminTheme();
  const [tab, setTab] = useState<"sla" | "asignacion" | "templates" | "integraciones" | "apariencia">("sla");

  const ModeCard = ({ id, icon, label, desc }: { id: ThemeMode; icon: string; label: string; desc: string }) => (
    <button onClick={() => t.setMode(id)}
      className={`text-left rounded-2xl p-5 transition-all w-full text-sm border-2 flex flex-col items-start gap-3 ${
        t.mode === id ? `${t.bgCard} ${t.accentBorder} shadow-xl ${t.accentShadow}` : `${t.bgDeep} ${t.border} hover:opacity-90`
      }`}>
      <div className="flex items-center gap-3 w-full">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <p className={`font-semibold ${t.text}`}>{label}</p>
          <p className={`text-xs ${t.textMuted}`}>{desc}</p>
        </div>
        {t.mode === id && <div className={`text-[11px] font-semibold px-2 py-1 rounded ${t.accentText}`}>✓ Activo</div>}
      </div>
      <div className="mt-2 w-full rounded-lg overflow-hidden border" style={{ borderColor: t.mode === id ? undefined : undefined }}>
        <div className={`${id === "dark" ? "bg-[#0F0F0F]" : "bg-white"} p-3`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${t.accentGradient} flex items-center justify-center text-white font-bold`}>S</div>
            <div className="flex-1">
              <div className={`h-3 rounded ${id === "dark" ? "bg-white/10" : "bg-gray-200"} w-3/4 mb-1`} />
              <div className={`h-2 rounded ${id === "dark" ? "bg-white/5" : "bg-gray-100"} w-1/2`} />
            </div>
          </div>
          <div className="flex gap-2">
            <div className={`h-8 rounded-md ${id === "dark" ? "bg-white/5" : "bg-gray-100"} w-24`} />
            <div className="flex-1 space-y-2">
              <div className={`h-3 rounded ${id === "dark" ? "bg-white/10" : "bg-gray-200"}`} />
              <div className={`h-3 rounded ${id === "dark" ? "bg-white/5" : "bg-gray-100"} w-2/3`} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );

  const ToneCard = ({ tn }: { tn: { id: AccentTone; label: string; desc: string; hex: string; gradient: string; preview: string[] } }) => (
    <button
      className={`relative text-left rounded-2xl p-5 transition-all border-2 w-full ${t.bgDeep} ${t.border} hover:opacity-90`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          {tn.preview.map((color, i) => (
            <div key={i} className="w-8 h-8 rounded-md shadow-inner" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${t.text}`}>{tn.label}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <div className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: `linear-gradient(90deg, ${tn.preview.join(',')})` }}>Botón primario</div>
        <div className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: `${tn.hex}40`, color: tn.hex }}>Secundario</div>
      </div>
    </button>
  );

  const activeTabCls = `bg-gradient-to-r ${t.accentGradient} text-white shadow-lg ${t.accentShadow}`;
  const inactiveTabCls = t.mode === "dark" ? "bg-white/5 text-white/50 hover:text-white hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200";

  return (
    <div className="space-y-4">
      <div>
        <h1 className={`text-2xl font-poppins font-bold ${t.text}`}>⚙️ Configuración</h1>
        <p className={`${t.textMuted} text-sm mt-1`}>SLA, reglas de asignación, plantillas, integraciones y apariencia</p>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 border-b ${t.border} pb-3 flex-wrap`}>
        {([
          { id: "sla", label: "⏱️ SLA" },
          { id: "asignacion", label: "🔀 Asignación" },
          { id: "templates", label: "📋 Plantillas" },
          { id: "integraciones", label: "🔌 Integraciones" },
          { id: "apariencia", label: "🎨 Apariencia" },
        ] as const).map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              tab === tb.id ? activeTabCls : inactiveTabCls
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ═══ SLA ═══ */}
      {tab === "sla" && (
        <SectionCard title="Reglas de SLA por Canal" icon="⏱️"
          action={<button className="text-xs bg-vino/20 text-vino px-3 py-1.5 rounded-lg hover:bg-vino/30">+ Agregar regla</button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-[11px] uppercase tracking-wider">
                  <th className="text-left pb-3">Canal</th>
                  <th className="text-center pb-3">1ra Respuesta (max)</th>
                  <th className="text-center pb-3">Resolución (max)</th>
                  <th className="text-center pb-3">Prioridad</th>
                  <th className="text-right pb-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slaRules.map((rule) => (
                  <tr key={rule.channel} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs ${channelColors[rule.channel]}`}>
                        {channelIcons[rule.channel]} {rule.channel}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="bg-white/5 px-3 py-1 rounded-lg text-xs">{rule.maxFirstResponse} min</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="bg-white/5 px-3 py-1 rounded-lg text-xs">{rule.maxResolution} min</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        rule.priority === "urgent" ? "bg-red-500/20 text-red-400" :
                        rule.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                        "bg-white/5 text-white/50"
                      }`}>
                        {rule.priority}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-xs text-white/40 hover:text-white px-2 py-1 rounded hover:bg-white/5">✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-white/20 mt-4">
            ⓘ Si se excede el SLA, se genera una alerta automática en el Dashboard y se notifica al supervisor.
          </p>
        </SectionCard>
      )}

      {/* ═══ ASIGNACIÓN ═══ */}
      {tab === "asignacion" && (
        <SectionCard title="Reglas de Asignación Automática" icon="🔀"
          action={<button className="text-xs bg-vino/20 text-vino px-3 py-1.5 rounded-lg hover:bg-vino/30">+ Nueva regla</button>}>
          <div className="space-y-3">
            {assignmentRules.map((rule) => (
              <div key={rule.id}
                className={`flex items-center justify-between bg-[#141414] rounded-xl p-4 border ${
                  rule.active ? "border-white/5" : "border-white/5 opacity-50"
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${rule.active ? "bg-green-400" : "bg-white/20"}`} />
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-[10px] text-white/30">
                      Condición: <span className="text-white/50">{rule.condition} = {rule.value}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">
                    → {rule.assignTo === "round-robin" ? "🔄 Round Robin" :
                      agents.find((a) => a.id === rule.assignTo)?.name || rule.assignTo}
                  </span>
                  <button className="text-xs text-white/30 hover:text-white px-2 py-1 rounded hover:bg-white/5">✏️</button>
                  <button className={`text-xs px-3 py-1 rounded-lg ${
                    rule.active ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"
                  }`}>
                    {rule.active ? "Activa" : "Inactiva"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#141414] rounded-xl p-4">
            <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">📖 Cómo funciona</p>
            <ul className="text-xs text-white/40 space-y-1">
              <li>• Las reglas se evalúan en orden de arriba a abajo</li>
              <li>• La primera regla que coincida asigna la conversación</li>
              <li>• &quot;Round Robin&quot; distribuye equitativamente entre agentes disponibles</li>
              <li>• Si ninguna regla aplica, la conversación queda sin asignar</li>
            </ul>
          </div>
        </SectionCard>
      )}

      {/* ═══ TEMPLATES, INTEGRACIONES y APARIENCIA (abreviados para concisión) */}
      {tab === "templates" && (
        <SectionCard title="Plantillas de Mensajes" icon="📋"
          action={<button className="text-xs bg-vino/20 text-vino px-3 py-1.5 rounded-lg hover:bg-vino/30">+ Nueva plantilla</button>}>
          <div className="grid md:grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <div key={tpl.id} className={`${t.bgCard} border ${t.border} rounded-xl p-4 hover:shadow`}> 
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-medium ${t.text}`}>{tpl.name}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/30 capitalize">{tpl.category}</span>
                </div>
                <div className="flex gap-1 mb-3">
                  {tpl.channel.map((ch) => (
                    <span key={ch} className={`text-[10px] px-1.5 py-0.5 rounded ${channelColors[ch]}`}>{channelIcons[ch]}</span>
                  ))}
                </div>
                <div className={`${t.bgDeep} rounded-lg p-3 mb-2`}>
                  <p className={`text-xs ${t.textMuted} whitespace-pre-wrap`}>{tpl.text}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === "integraciones" && (
        <div className="space-y-4">
          <SectionCard title="Canales Conectados" icon="🔌">
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { name: "WhatsApp Business API", icon: "📱", status: "connected", desc: "Meta Cloud API v18.0" },
                { name: "Instagram Messaging", icon: "📸", status: "connected", desc: "Graph API v18.0" },
                { name: "Facebook Messenger", icon: "💬", status: "connected", desc: "Page: @shelie_siemprebellas" },
              ].map((int) => (
                <div key={int.name} className={`${t.bgDeep} border ${t.border} rounded-xl p-4 flex items-center gap-4`}>
                  <span className="text-2xl">{int.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${t.text}`}>{int.name}</p>
                    <p className={`text-[10px] ${t.textFaint}`}>{int.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "apariencia" && (
        <div className="space-y-6">
          <SectionCard title="Modo de Apariencia" icon="🌗">
            <p className={`text-xs ${t.textMuted} mb-4`}>Selecciona el modo visual del panel de administración</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                { id: "dark" as ThemeMode, icon: "🌙", label: "Modo Oscuro", desc: "Fondo negro profundo" },
                { id: "light" as ThemeMode, icon: "☀️", label: "Modo Claro", desc: "Fondo claro Shelie" },
              ]).map((m) => (
                <ModeCard key={m.id} id={m.id} icon={m.icon} label={m.label} desc={m.desc} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Tono de Acento" icon="🎨">
            <p className={`text-xs ${t.textMuted} mb-4`}>Elige el color de acento</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { id: "vino" as AccentTone, label: "Vino", desc: "Acento vino", hex: '#8B3A4A', preview: ['#8B3A4A','#E8B7B7','#FAF7F4'] },
                { id: "dorado" as AccentTone, label: "Dorado", desc: "Detalle premium", hex: '#C9A46A', preview: ['#C9A46A','#E8B7B7','#FAF7F4'] },
                { id: "nude" as AccentTone, label: "Nude", desc: "Acento neutro", hex: '#E8B7B7', preview: ['#E8B7B7','#F3E6E6','#FAF7F4'] },
              ]).map((tn) => (
                <ToneCard key={tn.id} tn={tn as any} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Vista Previa" icon="👁️">
            <p className={`text-xs ${t.textMuted} mb-4`}>Así se ven tus ajustes aplicados en tiempo real</p>
            <div className={`rounded-xl border ${t.border} overflow-hidden`}>
              <div className="flex">
                <div className={`${t.bgSidebar} p-4 w-56 border-r ${t.border}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${t.accentGradient} flex items-center justify-center text-white font-bold`}>S</div>
                    <div>
                      <p className={`text-sm font-semibold ${t.text}`}>Shelie</p>
                      <p className={`text-[10px] ${t.textFaint}`}>Admin</p>
                    </div>
                  </div>
                </div>
                <div className={`${t.bg} p-4 flex-1`}>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {['Ingresos','Pedidos','CSAT'].map((kpi) => (
                      <div key={kpi} className={`${t.bgCard} border ${t.border} rounded-xl p-3`}> 
                        <p className={`text-[10px] ${t.textFaint} uppercase`}>{kpi}</p>
                        <p className={`text-sm font-bold ${t.text} mt-1`}>$1.2M</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
