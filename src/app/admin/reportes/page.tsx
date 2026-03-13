"use client";
import { useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import {
  funnelData, channelReports, topIntents, agents,
  salesKPIs, chatKPIs, formatCOPAdmin, channelIcons,
} from "@/lib/admin-data";

/* ── Card ── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const t = useAdminTheme();
  return <div className={`${t.bgCard} border ${t.border} rounded-2xl p-5 ${className}`}>{children}</div>;
}

/* ── KPI Tile ── */
function KPITile({ label, value, sub, delta, icon, accent }: {
  label: string; value: string; sub?: string; delta?: string; icon: string; accent?: boolean;
}) {
  const t = useAdminTheme();
  const dc = delta?.startsWith("+") ? "text-emerald-400" : delta?.startsWith("-") ? "text-red-400" : t.textMuted;
  return (
    <Card className={accent ? `ring-1 ${t.accentBorder}` : ""}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[11px] uppercase tracking-wider font-semibold ${t.textFaint}`}>{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? t.accentText : t.text} font-poppins`}>{value}</p>
      <div className="flex items-center gap-2 mt-1.5">
        {delta && <span className={`text-xs font-semibold ${dc}`}>{delta}</span>}
        {sub && <span className={`text-[11px] ${t.textFaint}`}>{sub}</span>}
      </div>
    </Card>
  );
}

/* ── Horizontal Bar ── */
function HBarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal?: number }) {
  const t = useAdminTheme();
  const max = maxVal || Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${t.text}`}>{d.label}</span>
            <span className={`text-xs font-bold ${t.textMuted}`}>{d.value.toLocaleString()}</span>
          </div>
          <div className={`h-6 rounded-lg ${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} overflow-hidden`}>
            <div className={`h-full rounded-lg ${d.color} flex items-center justify-end pr-2`} style={{ width: `${Math.max((d.value / max) * 100, 2)}%` }}>
              <span className="text-[10px] font-bold text-white drop-shadow-sm">{((d.value / max) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Vertical Bars ── */
function VBarChart({ bars, height = 200 }: { bars: { label: string; value: number; color: string }[]; height?: number }) {
  const t = useAdminTheme();
  const max = Math.max(...bars.map((b) => b.value));
  const gridLines = 5;
  const gc = t.mode === "dark" ? "border-white/5" : "border-gray-100";
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        <div className="flex flex-col justify-between h-full pr-2">
          {Array.from({ length: gridLines + 1 }).map((_, i) => (
            <span key={i} className={`text-[9px] ${t.textFaint} text-right w-10 leading-none`}>{Math.round(max - (max / gridLines) * i).toLocaleString()}</span>
          ))}
        </div>
        <div className={`flex-1 relative flex items-end gap-2 border-l border-b ${gc} pl-2 pb-1`}>
          {Array.from({ length: gridLines }).map((_, i) => (
            <div key={i} className={`absolute left-0 right-0 border-t ${gc}`} style={{ bottom: `${((i + 1) / gridLines) * 100}%` }} />
          ))}
          {bars.map((b, i) => {
            const pct = max > 0 ? (b.value / max) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center relative z-10 group">
                <div className={`absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity ${t.bgDeep} ${t.border} border rounded-lg px-2 py-1 text-[10px] ${t.text} font-bold whitespace-nowrap shadow-xl z-20`}>
                  {b.value.toLocaleString()}
                </div>
                <div className={`w-full max-w-[40px] rounded-t-lg ${b.color} hover:opacity-90 cursor-pointer`} style={{ height: `${Math.max(pct, 2)}%` }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex ml-12 gap-2 mt-2">
        {bars.map((b, i) => <div key={i} className="flex-1 text-center"><span className={`text-[10px] ${t.textFaint} truncate block`}>{b.label}</span></div>)}
      </div>
    </div>
  );
}

/* ── Donut ── */
function DonutChart({ segments, size = 140, label }: { segments: { value: number; color: string; label: string }[]; size?: number; label?: string }) {
  const t = useAdminTheme();
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cum = 0;
  const parts = segments.map((seg) => { const start = (cum / total) * 360; cum += seg.value; return `${seg.color} ${start}deg ${(cum / total) * 360}deg`; });
  const innerBg = t.mode === "dark" ? "#1A1A1A" : "#ffffff";
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-full relative flex items-center justify-center" style={{ width: size, height: size, background: `conic-gradient(${parts.join(", ")})` }}>
        <div className="rounded-full flex items-center justify-center" style={{ width: size * 0.6, height: size * 0.6, backgroundColor: innerBg }}>
          <div className="text-center">
            <p className={`text-lg font-bold ${t.text} font-poppins`}>{total.toLocaleString()}</p>
            {label && <p className={`text-[9px] ${t.textFaint}`}>{label}</p>}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className={t.textMuted}>{seg.label}</span>
            <span className={`font-bold ${t.text} ml-auto`}>{((seg.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sparkline ── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-[2px] h-6">
      {values.map((v, i) => <div key={i} className={`w-1 rounded-full ${color} opacity-60`} style={{ height: `${Math.max((v / max) * 100, 8)}%` }} />)}
    </div>
  );
}

/* ── Table ── */
function DataTable({ columns, rows }: { columns: { key: string; label: string; align?: string }[]; rows: Record<string, React.ReactNode>[] }) {
  const t = useAdminTheme();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className={`border-b ${t.border}`}>
            {columns.map((c) => <th key={c.key} className={`py-2.5 px-3 ${c.align === "right" ? "text-right" : "text-left"} ${t.textFaint} uppercase tracking-wider text-[10px] font-semibold`}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b ${t.border} ${t.tableRowHover} transition-colors`}>
              {columns.map((c) => <td key={c.key} className={`py-2.5 px-3 ${c.align === "right" ? "text-right" : "text-left"}`}>{row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Channel helpers ── */
const chName: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", web: "Web Chat", facebook: "Facebook", tiktok: "TikTok" };
const chColor: Record<string, string> = { whatsapp: "bg-emerald-500", instagram: "bg-pink-500", web: "bg-blue-500", facebook: "bg-purple-500", tiktok: "bg-black" };
const chHex: Record<string, string> = { whatsapp: "#10b981", instagram: "#ec4899", web: "#3b82f6", facebook: "#8b5cf6", tiktok: "#010101" };
const chEmoji: Record<string, string> = { whatsapp: "💚", instagram: "📸", web: "🌐", facebook: "💬", tiktok: "🎵" };

/* ================================================================ */
export default function ReportesPage() {
  const t = useAdminTheme();
  const [tab, setTab] = useState<"overview" | "funnel" | "canales" | "equipo" | "intents">("overview");

  const tabs = [
    { id: "overview" as const, label: "📊 Overview" },
    { id: "funnel" as const, label: "🔄 Funnel" },
    { id: "canales" as const, label: "📡 Canales" },
    { id: "equipo" as const, label: "👥 Equipo" },
    { id: "intents" as const, label: "🎯 Intenciones" },
  ];

  const activeTab = `bg-gradient-to-r ${t.accentGradient} text-white shadow-lg ${t.accentShadow}`;
  const inactiveTab = t.mode === "dark" ? "bg-white/5 text-white/50 hover:text-white hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold font-poppins ${t.text}`}>📈 Business Intelligence</h1>
          <p className={`text-sm ${t.textMuted} mt-0.5`}>Panel de análisis y métricas operacionales</p>
        </div>
        <div className="flex items-center gap-3">
          <select className={`${t.inputBg} ${t.inputBorder} border rounded-xl px-3 py-2 text-xs ${t.text} focus:outline-none`}>
            <option>Últimos 30 días</option><option>Últimos 7 días</option><option>Este mes</option><option>Trimestre actual</option>
          </select>
          <button className={`px-4 py-2 rounded-xl text-xs font-semibold ${inactiveTab} transition-colors`}>📥 Exportar</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tb) => <button key={tb.id} onClick={() => setTab(tb.id)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === tb.id ? activeTab : inactiveTab}`}>{tb.label}</button>)}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPITile icon="💰" label="Ingresos Mes" value={formatCOPAdmin(salesKPIs.revenueMonth)} delta="+12.4%" sub="vs mes anterior" accent />
            <KPITile icon="🛒" label="Pedidos Mes" value={salesKPIs.ordersMonth.toString()} delta="+8.2%" sub="completados" />
            <KPITile icon="💬" label="Chats Hoy" value={chatKPIs.newChatsToday.toString()} delta="+23.1%" sub="nuevos" />
            <KPITile icon="⚡" label="Conversión" value={`${salesKPIs.conversionRate}%`} delta="+2.1%" sub="del embudo" accent />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-bold ${t.text}`}>Ingresos por Canal</h3>
                  <p className={`text-[11px] ${t.textFaint}`}>Distribución de ventas por canal de origen</p>
                </div>
                <Sparkline values={[42,56,38,67,55,78,62,89,72,95,88,102]} color="bg-emerald-400" />
              </div>
              <VBarChart height={180} bars={channelReports.map((ch) => ({
                label: chName[ch.channel] || ch.channel, value: ch.revenue, color: chColor[ch.channel] || "bg-gray-500",
              }))} />
            </Card>
            <Card>
              <h3 className={`text-sm font-bold ${t.text} mb-1`}>Distribución de Canales</h3>
              <p className={`text-[11px] ${t.textFaint} mb-4`}>Participación por conversaciones</p>
              <DonutChart label="conversaciones" segments={channelReports.map((ch) => ({
                value: ch.conversations, color: chHex[ch.channel] || "#6b7280", label: chName[ch.channel] || ch.channel,
              }))} />
            </Card>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPITile icon="📨" label="Tiempo Respuesta" value={`${chatKPIs.avgFRT}s`} delta="-15%" sub="promedio FRT" />
            <KPITile icon="🤖" label="Handoff IA" value={`${chatKPIs.handoffRate}%`} delta="-2%" sub="IA → humano" />
            <KPITile icon="📦" label="Ticket Promedio" value={formatCOPAdmin(salesKPIs.aov)} delta="+4.1%" sub="por pedido" />
            <KPITile icon="💎" label="Chat → Venta" value={`${chatKPIs.chatToSaleRate}%`} delta="+5%" sub="conversión chat" accent />
          </div>
        </div>
      )}

      {/* ══════════ FUNNEL ══════════ */}
      {tab === "funnel" && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-sm font-bold ${t.text}`}>Embudo de Conversión</h3>
                <p className={`text-[11px] ${t.textFaint}`}>De visitante a cliente — últimos 30 días</p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${t.mode === "dark" ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                Conversión Total: {salesKPIs.conversionRate}%
              </div>
            </div>
            <div className="space-y-3">
              {funnelData.map((step, i) => {
                const maxCount = funnelData[0].count;
                const pct = (step.count / maxCount) * 100;
                const dropOff = i > 0 ? ((1 - step.count / funnelData[i - 1].count) * 100).toFixed(1) : null;
                const colors = ["bg-gradient-to-r from-blue-500 to-blue-400","bg-gradient-to-r from-cyan-500 to-cyan-400","bg-gradient-to-r from-emerald-500 to-emerald-400","bg-gradient-to-r from-amber-500 to-amber-400","bg-gradient-to-r from-rose-500 to-rose-400"];
                return (
                  <div key={step.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colors[i]} shadow-sm`}>{i + 1}</span>
                        <span className={`text-sm font-semibold ${t.text}`}>{step.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {dropOff && <span className="text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">↓ {dropOff}% drop-off</span>}
                        <span className={`text-sm font-bold ${t.text}`}>{step.count.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={`h-10 rounded-xl ${t.mode === "dark" ? "bg-white/5" : "bg-gray-50"} overflow-hidden`}>
                      <div className={`h-full ${colors[i]} rounded-xl flex items-center justify-end pr-3`} style={{ width: `${Math.max(pct, 3)}%` }}>
                        <span className="text-xs font-bold text-white drop-shadow-sm">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <h3 className={`text-sm font-bold ${t.text} mb-4`}>📋 Detalle del Embudo</h3>
            <DataTable
              columns={[{ key: "stage", label: "Etapa" },{ key: "count", label: "Usuarios", align: "right" },{ key: "pct", label: "% del Total", align: "right" },{ key: "conv", label: "Conversión", align: "right" },{ key: "drop", label: "Drop-off", align: "right" }]}
              rows={funnelData.map((step, i) => ({
                stage: <span className="font-medium">{step.name}</span>,
                count: <span className="font-bold">{step.count.toLocaleString()}</span>,
                pct: <span>{((step.count / funnelData[0].count) * 100).toFixed(1)}%</span>,
                conv: i > 0 ? <span className="text-emerald-400 font-semibold">{((step.count / funnelData[i - 1].count) * 100).toFixed(1)}%</span> : <span className={t.textFaint}>—</span>,
                drop: i > 0 ? <span className="text-red-400 font-semibold">{((1 - step.count / funnelData[i - 1].count) * 100).toFixed(1)}%</span> : <span className={t.textFaint}>—</span>,
              }))}
            />
          </Card>
        </div>
      )}

      {/* ══════════ CANALES ══════════ */}
      {tab === "canales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {channelReports.map((ch) => (
              <Card key={ch.channel}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{chEmoji[ch.channel] || "📡"}</span>
                  <span className={`font-bold text-sm ${t.text}`}>{chName[ch.channel]}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className={`text-[10px] ${t.textFaint} uppercase`}>Conversaciones</p><p className={`text-lg font-bold ${t.text}`}>{ch.conversations.toLocaleString()}</p></div>
                  <div><p className={`text-[10px] ${t.textFaint} uppercase`}>Ingresos</p><p className={`text-lg font-bold ${t.text}`}>{formatCOPAdmin(ch.revenue)}</p></div>
                  <div><p className={`text-[10px] ${t.textFaint} uppercase`}>Pedidos</p><p className={`text-sm font-bold ${t.text}`}>{ch.orders}</p></div>
                  <div><p className={`text-[10px] ${t.textFaint} uppercase`}>Conversión</p><p className="text-sm font-bold text-emerald-400">{ch.conversion}%</p></div>
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <h3 className={`text-sm font-bold ${t.text} mb-1`}>💰 Ingresos por Canal</h3>
            <p className={`text-[11px] ${t.textFaint} mb-4`}>Comparación de revenue generado — con etiquetas de valor</p>
            <VBarChart height={220} bars={channelReports.map((ch) => ({
              label: chName[ch.channel], value: ch.revenue, color: chColor[ch.channel] || "bg-gray-500",
            }))} />
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className={`text-sm font-bold ${t.text} mb-1`}>📊 Tasa de Conversión</h3>
              <p className={`text-[11px] ${t.textFaint} mb-4`}>Porcentaje de conversión por canal</p>
              <HBarChart maxVal={10} data={channelReports.map((ch) => ({
                label: chName[ch.channel], value: ch.conversion, color: chColor[ch.channel] || "bg-gray-500",
              }))} />
            </Card>
            <Card>
              <h3 className={`text-sm font-bold ${t.text} mb-1`}>📨 Conversaciones por Canal</h3>
              <p className={`text-[11px] ${t.textFaint} mb-4`}>Volumen de conversaciones atendidas</p>
              <HBarChart data={channelReports.map((ch) => ({
                label: chName[ch.channel], value: ch.conversations, color: chColor[ch.channel] || "bg-gray-500",
              }))} />
            </Card>
          </div>
          <Card>
            <h3 className={`text-sm font-bold ${t.text} mb-4`}>📋 Detalle Completo por Canal</h3>
            <DataTable
              columns={[{ key: "ch", label: "Canal" },{ key: "convs", label: "Conversaciones", align: "right" },{ key: "orders", label: "Pedidos", align: "right" },{ key: "rev", label: "Revenue", align: "right" },{ key: "conv", label: "Conversión", align: "right" }]}
              rows={channelReports.map((ch) => ({
                ch: <span className="font-semibold">{channelIcons[ch.channel]} {chName[ch.channel]}</span>,
                convs: <span className="font-bold">{ch.conversations.toLocaleString()}</span>,
                orders: <span className="font-bold">{ch.orders}</span>,
                rev: <span className={`font-bold ${t.accentText}`}>{formatCOPAdmin(ch.revenue)}</span>,
                conv: <span className="font-bold text-emerald-400">{ch.conversion}%</span>,
              }))}
            />
          </Card>
        </div>
      )}

      {/* ══════════ EQUIPO ══════════ */}
      {tab === "equipo" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const rc: Record<string, string> = { admin: "text-red-400 bg-red-500/10", supervisor: "text-amber-400 bg-amber-500/10", agente: "text-blue-400 bg-blue-500/10", soporte: "text-purple-400 bg-purple-500/10" };
              const sd = agent.active ? "bg-emerald-400" : "bg-gray-500";
              const csatPct = Math.round(agent.stats.satisfaction * 20);
              const progress = Math.min((agent.stats.chatsToday / agent.goals.chatsPerDay) * 100, 100);
              return (
                <Card key={agent.id}>
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.accentGradient} flex items-center justify-center text-white font-bold text-lg shadow-lg ${t.accentShadow}`}>{agent.name.charAt(0)}</div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${sd} rounded-full border-2 ${t.mode === "dark" ? "border-[#1A1A1A]" : "border-white"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-sm ${t.text}`}>{agent.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rc[agent.role] || "text-gray-400 bg-gray-500/10"}`}>{agent.role.toUpperCase()}</span>
                      </div>
                      <p className={`text-[11px] ${t.textFaint}`}>{agent.channels.join(" · ")}</p>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div><p className={`text-[9px] ${t.textFaint} uppercase`}>Chats hoy</p><p className={`text-base font-bold ${t.text}`}>{agent.stats.chatsToday}</p></div>
                        <div><p className={`text-[9px] ${t.textFaint} uppercase`}>Backlog</p><p className={`text-base font-bold ${t.text}`}>{agent.stats.backlog}</p></div>
                        <div><p className={`text-[9px] ${t.textFaint} uppercase`}>CSAT</p><p className={`text-base font-bold ${csatPct >= 90 ? "text-emerald-400" : csatPct >= 80 ? "text-amber-400" : "text-red-400"}`}>{csatPct}%</p></div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] ${t.textFaint}`}>Rendimiento</span>
                          <span className={`text-[10px] font-bold ${t.text}`}>{agent.stats.chatsToday}/{agent.goals.chatsPerDay}</span>
                        </div>
                        <div className={`h-2 rounded-full ${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} overflow-hidden`}>
                          <div className={`h-full rounded-full ${progress >= 100 ? "bg-emerald-500" : progress >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card>
            <h3 className={`text-sm font-bold ${t.text} mb-1`}>📊 Comparativa de Rendimiento</h3>
            <p className={`text-[11px] ${t.textFaint} mb-4`}>Chats hoy por agente vs objetivo</p>
            <HBarChart data={agents.map((a) => {
              const pct = Math.min((a.stats.chatsToday / a.goals.chatsPerDay) * 100, 100);
              return {
                label: `${a.name} (${a.stats.chatsToday}/${a.goals.chatsPerDay})`, value: a.stats.chatsToday,
                color: pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500",
              };
            })} />
          </Card>
          <Card>
            <h3 className={`text-sm font-bold ${t.text} mb-4`}>📋 Tabla de Equipo</h3>
            <DataTable
              columns={[{ key: "agent", label: "Agente" },{ key: "role", label: "Rol" },{ key: "status", label: "Estado" },{ key: "backlog", label: "Backlog", align: "right" },{ key: "chats", label: "Chats hoy", align: "right" },{ key: "csat", label: "CSAT", align: "right" },{ key: "progress", label: "Meta", align: "right" }]}
              rows={agents.map((a) => {
                const csatPct = Math.round(a.stats.satisfaction * 20);
                const goalPct = Math.round(Math.min((a.stats.chatsToday / a.goals.chatsPerDay) * 100, 100));
                return {
                  agent: <span className="font-semibold">{a.name}</span>,
                  role: <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${a.role === "admin" ? "text-red-400 bg-red-500/10" : a.role === "supervisor" ? "text-amber-400 bg-amber-500/10" : a.role === "agente" ? "text-blue-400 bg-blue-500/10" : "text-purple-400 bg-purple-500/10"}`}>{a.role}</span>,
                  status: <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${a.active ? "bg-emerald-400" : "bg-gray-500"}`} /><span className={`text-[11px] ${t.textMuted}`}>{a.active ? "activo" : "inactivo"}</span></span>,
                  backlog: <span className="font-bold">{a.stats.backlog}</span>,
                  chats: <span className="font-bold">{a.stats.chatsToday}</span>,
                  csat: <span className={`font-bold ${csatPct >= 90 ? "text-emerald-400" : csatPct >= 80 ? "text-amber-400" : "text-red-400"}`}>{csatPct}%</span>,
                  progress: <span className={`font-bold ${goalPct >= 100 ? "text-emerald-400" : "text-amber-400"}`}>{goalPct}%</span>,
                };
              })}
            />
          </Card>
        </div>
      )}

      {/* ══════════ INTENTS ══════════ */}
      {tab === "intents" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPITile icon="🎯" label="Total Intenciones" value={topIntents.length.toString()} sub="detectadas por IA" />
            <KPITile icon="📊" label="Mayor Volumen" value={topIntents[0]?.intent || ""} sub={`${topIntents[0]?.count || 0} casos`} accent />
            <KPITile icon="🤖" label="Handoff IA" value={`${chatKPIs.handoffRate}%`} delta="-2%" sub="IA → humano" />
            <KPITile icon="📈" label="Tendencia" value={topIntents.filter((x) => x.trend === "up").length.toString()} sub="intenciones creciendo" />
          </div>
          <Card>
            <h3 className={`text-sm font-bold ${t.text} mb-1`}>🏆 Ranking de Intenciones</h3>
            <p className={`text-[11px] ${t.textFaint} mb-4`}>Top intenciones detectadas por IA — ordenadas por volumen</p>
            <HBarChart data={topIntents.slice(0, 10).map((intent, i) => ({
              label: `${i + 1}. ${intent.intent}`, value: intent.count,
              color: i === 0 ? "bg-gradient-to-r from-amber-500 to-amber-400" : i < 3 ? "bg-gradient-to-r from-blue-500 to-blue-400" : i < 6 ? "bg-gradient-to-r from-cyan-500 to-cyan-400" : "bg-gradient-to-r from-gray-500 to-gray-400",
            }))} />
          </Card>
          <Card>
            <h3 className={`text-sm font-bold ${t.text} mb-4`}>📋 Detalle de Intenciones</h3>
            <DataTable
              columns={[{ key: "rank", label: "#" },{ key: "intent", label: "Intención" },{ key: "count", label: "Volumen", align: "right" },{ key: "pct", label: "% del Total", align: "right" },{ key: "trend", label: "Tendencia", align: "right" }]}
              rows={topIntents.map((intent, i) => {
                const totalI = topIntents.reduce((s, x) => s + x.count, 0);
                return {
                  rank: <span className={`font-bold ${i < 3 ? t.accentText : t.textMuted}`}>{i + 1}</span>,
                  intent: <span className="font-semibold">{intent.intent}</span>,
                  count: <span className="font-bold">{intent.count.toLocaleString()}</span>,
                  pct: <span>{((intent.count / totalI) * 100).toFixed(1)}%</span>,
                  trend: <span className={`text-xs font-bold ${intent.trend === "up" ? "text-emerald-400" : intent.trend === "down" ? "text-red-400" : "text-gray-400"}`}>{intent.trend === "up" ? "▲ Subiendo" : intent.trend === "down" ? "▼ Bajando" : "— Estable"}</span>,
                };
              })}
            />
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className={`text-sm font-bold ${t.text} mb-1`}>📈 Distribución de Tendencias</h3>
              <p className={`text-[11px] ${t.textFaint} mb-4`}>Intenciones por dirección de tendencia</p>
              <DonutChart label="intenciones" segments={[
                { value: topIntents.filter((x) => x.trend === "up").length, color: "#10b981", label: "Creciendo" },
                { value: topIntents.filter((x) => x.trend === "stable").length, color: "#6b7280", label: "Estable" },
                { value: topIntents.filter((x) => x.trend === "down").length, color: "#ef4444", label: "Decreciendo" },
              ]} />
            </Card>
            <Card>
              <h3 className={`text-sm font-bold ${t.text} mb-1`}>⚡ Top 5 por Volumen</h3>
              <p className={`text-[11px] ${t.textFaint} mb-4`}>Concentración de las principales intenciones</p>
              <DonutChart label="total" segments={topIntents.slice(0, 5).map((intent, i) => ({
                value: intent.count, color: ["#f59e0b","#3b82f6","#06b6d4","#8b5cf6","#ec4899"][i], label: intent.intent,
              }))} />
            </Card>
          </div>
        </div>
      )}

      <div className={`text-center py-4 border-t ${t.border}`}>
        <p className={`text-[10px] ${t.textFaint}`}>📊 Shelie Business Intelligence — Datos actualizados cada 5 minutos</p>
      </div>
    </div>
  );
}
