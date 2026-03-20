"use client";
import { useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import {
  salesKPIs, chatKPIs, opsKPIs,
  adminOrders, formatCOPAdmin, channelIcons, statusColors,
} from "@/lib/admin-data";

/* ── KPI Card (Rediseñado) ── */
function KPICard({ label, value, sub, trend, icon, semantic }: {
  label: string;
  value: string;
  sub?: string;
  trend?: { pct: number; up: boolean };
  icon?: string;
  semantic?: "success" | "warning" | "danger" | "info";
}) {
  const t = useAdminTheme();

  const semanticColors = {
    success: { text: t.colors.successText, bg: t.colors.successLight },
    warning: { text: t.colors.warningText, bg: t.colors.warningLight },
    danger: { text: t.colors.dangerText, bg: t.colors.dangerLight },
    info: { text: t.colors.infoText, bg: t.colors.infoLight },
  };

  const colors = semantic ? semanticColors[semantic] : null;

  return (
    <div
      className="border rounded-xl p-5 transition-all hover:shadow-lg"
      style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-medium" style={{ color: t.colors.textMuted }}>{label}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p
        className="text-3xl font-bold mb-2"
        style={{ color: colors?.text || t.colors.text }}
      >
        {value}
      </p>
      <div className="flex items-center gap-2">
        {trend && (
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: trend.up ? t.colors.successLight : t.colors.dangerLight,
              color: trend.up ? t.colors.successText : t.colors.dangerText
            }}
          >
            {trend.up ? "↑" : "↓"} {Math.abs(trend.pct)}%
          </span>
        )}
        {sub && <span className="text-sm" style={{ color: t.colors.textMuted }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ── Mini Bar Chart (Mejorado) ── */
function MiniBar({ items }: { items: { label: string; value: number; max: number; color?: string }[] }) {
  const t = useAdminTheme();
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-4">
          <span className="text-sm w-32 truncate font-medium" style={{ color: t.colors.text }}>{it.label}</span>
          <div
            className="flex-1 h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: t.mode === "dark" ? "#2A2A2A" : "#F3E6E6" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (it.value / it.max) * 100)}%`,
                backgroundColor: it.color || t.colors.primary
              }}
            />
          </div>
          <span className="text-sm w-12 text-right font-medium" style={{ color: t.colors.textMuted }}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Section Header (Mejorado) ── */
function SectionTitle({ icon, title, right }: { icon: string; title: string; right?: React.ReactNode }) {
  const t = useAdminTheme();
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: t.colors.text }}>
        <span className="text-2xl">{icon}</span>
        <span>{title}</span>
      </h2>
      {right}
    </div>
  );
}

export default function DashboardPage() {
  const t = useAdminTheme();
  const [tab, setTab] = useState<"ventas" | "chat" | "ops">("ventas");
  const prevMonthChange = ((salesKPIs.revenueMonth - salesKPIs.revenuePrevMonth) / salesKPIs.revenuePrevMonth) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: t.colors.text }}>Dashboard Ejecutivo</h1>
          <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>Resumen en tiempo real — Feb 12, 2026</p>
        </div>
        <div className="flex gap-2">
          {(["ventas", "chat", "ops"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: tab === tb ? t.colors.primary : t.colors.bgCard,
                color: tab === tb ? "#FFFFFF" : t.colors.text,
                borderWidth: tab === tb ? "0" : "1px",
                borderColor: tab === tb ? "transparent" : t.colors.border,
              }}
            >
              {tb === "ventas" ? "💰 Ventas" : tb === "chat" ? "💬 Chat" : "📦 Ops"}
            </button>
          ))}
        </div>
      </div>

      {/* Ventas Tab */}
      {tab === "ventas" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Revenue Hoy"
              value={formatCOPAdmin(salesKPIs.revenueToday)}
              trend={{ pct: 12, up: true }}
              icon="💵"
              semantic="success"
            />
            <KPICard
              label="Revenue Mes"
              value={formatCOPAdmin(salesKPIs.revenueMonth)}
              trend={{ pct: Math.round(prevMonthChange), up: prevMonthChange > 0 }}
              sub={`vs ${formatCOPAdmin(salesKPIs.revenuePrevMonth)}`}
              icon="📊"
            />
            <KPICard
              label="Pedidos Hoy"
              value={String(salesKPIs.ordersToday)}
              sub={`${salesKPIs.ordersMonth} este mes`}
              icon="🛍️"
            />
            <KPICard
              label="Ticket Promedio"
              value={formatCOPAdmin(salesKPIs.aov)}
              icon="💳"
              semantic="info"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Conversión"
              value={`${salesKPIs.conversionRate}%`}
              trend={{ pct: 0.3, up: true }}
              icon="📈"
              semantic="success"
            />
            <KPICard
              label="Abandono Carrito"
              value={`${salesKPIs.cartAbandonment}%`}
              trend={{ pct: 12, up: false }}
              sub="vs ayer"
              icon="🛒"
              semantic="warning"
            />
            <KPICard
              label="Pagados"
              value={String(salesKPIs.paidVsPending.paid)}
              sub={`${salesKPIs.paidVsPending.pending} pendientes`}
              icon="✅"
              semantic="success"
            />
            <KPICard
              label="Chat → Venta"
              value={`${chatKPIs.chatToSaleRate}%`}
              trend={{ pct: 5, up: true }}
              icon="💬"
              semantic="info"
            />
          </div>

          <div className="border rounded-xl p-6 transition-all"
            style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
            <SectionTitle icon="🏆" title="Top Productos del Mes" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase tracking-wider border-b"
                    style={{ color: t.colors.textMuted, borderColor: t.colors.border }}>
                    <th className="text-left pb-4 font-semibold">#</th>
                    <th className="text-left pb-4 font-semibold">Producto</th>
                    <th className="text-right pb-4 font-semibold">Unidades</th>
                    <th className="text-right pb-4 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesKPIs.topProducts.map((p, i) => (
                    <tr key={p.name} className="border-b last:border-0"
                      style={{ borderColor: t.colors.border }}>
                      <td className="py-4 font-medium" style={{ color: t.colors.textMuted }}>{i + 1}</td>
                      <td className="py-4 font-semibold" style={{ color: t.colors.text }}>{p.name}</td>
                      <td className="py-4 text-right" style={{ color: t.colors.textMuted }}>{p.units}</td>
                      <td className="py-4 text-right font-bold" style={{ color: t.colors.dorado }}>{formatCOPAdmin(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Chat Tab */}
      {tab === "chat" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Chats Nuevos Hoy"
              value={String(chatKPIs.newChatsToday)}
              trend={{ pct: 8, up: true }}
              icon="💬"
              semantic="info"
            />
            <KPICard
              label="Tiempo 1ra Respuesta"
              value={`${chatKPIs.avgFRT}s`}
              sub="Promedio global"
              icon="⏱️"
              semantic={chatKPIs.avgFRT > 60 ? "danger" : "success"}
            />
            <KPICard
              label="Resolución Promedio"
              value={`${chatKPIs.avgResolution} min`}
              icon="✅"
            />
            <KPICard
              label="Backlog"
              value={String(chatKPIs.backlog)}
              icon="📥"
              semantic={chatKPIs.backlog > 10 ? "danger" : "warning"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              label="Handoff Rate"
              value={`${chatKPIs.handoffRate}%`}
              sub="IA → humano"
              trend={{ pct: 2, up: false }}
              icon="🤖"
            />
            <KPICard
              label="Chat → Venta"
              value={`${chatKPIs.chatToSaleRate}%`}
              trend={{ pct: 5, up: true }}
              icon="💰"
              semantic="success"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-6 transition-all"
              style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <SectionTitle icon="📱" title="Chats por Canal" />
              <MiniBar
                items={Object.entries(chatKPIs.newChatsByChannel).map(([ch, v]) => ({
                  label: `${channelIcons[ch]} ${ch}`,
                  value: v,
                  max: Math.max(...Object.values(chatKPIs.newChatsByChannel)),
                  color: ch === "whatsapp" ? "bg-green-500" : ch === "instagram" ? "bg-pink-500" : ch === "facebook" ? "bg-blue-500" : "bg-violet-500",
                }))}
              />
            </div>
            <div className="border rounded-xl p-6 transition-all"
              style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <SectionTitle icon="⏱️" title="FRT por Canal" />
              <MiniBar
                items={Object.entries(chatKPIs.frtByChannel).map(([ch, v]) => ({
                  label: `${channelIcons[ch]} ${ch}`,
                  value: v,
                  max: Math.max(...Object.values(chatKPIs.frtByChannel)),
                  color: v > 60 ? "bg-red-500" : v > 30 ? "bg-amber-500" : "bg-emerald-500",
                }))}
              />
              <p className="text-xs mt-4" style={{ color: t.colors.textMuted }}>
                Valores en segundos. SLA: &lt;5 min WA, &lt;15 min IG/FB, &lt;1 min Web
              </p>
            </div>
          </div>
        </>
      )}

      {/* Ops Tab */}
      {tab === "ops" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Tiempo Despacho"
              value={`${opsKPIs.avgDispatchTime}h`}
              icon="📦"
              semantic={opsKPIs.avgDispatchTime > 24 ? "danger" : "success"}
            />
            <KPICard
              label="Entrega a Tiempo"
              value={`${opsKPIs.onTimeDeliveryRate}%`}
              icon="✅"
              semantic={opsKPIs.onTimeDeliveryRate > 90 ? "success" : "warning"}
            />
            <KPICard
              label="Incidencias Abiertas"
              value={String(Object.values(opsKPIs.incidentsByType).reduce((a, b) => a + b, 0))}
              icon="⚠️"
              semantic="danger"
            />
            <KPICard
              label="Devoluciones"
              value={String(opsKPIs.returnReasons.reduce((a, r) => a + r.count, 0))}
              icon="↩️"
              semantic="warning"
            />
          </div>

          <div className="border rounded-xl p-6 transition-all"
            style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
            <SectionTitle icon="📦" title="Pedidos por Estado" />
            <div className="flex flex-wrap gap-3">
              {Object.entries(opsKPIs.ordersByStatus).map(([s, n]) => (
                <div
                  key={s}
                  className={`px-5 py-4 rounded-xl ${statusColors[s] || (t.mode === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600")} flex flex-col items-center min-w-[100px]`}
                >
                  <span className="text-3xl font-bold">{n}</span>
                  <span className="text-xs mt-2 capitalize font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-6 transition-all"
              style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <SectionTitle icon="⚠️" title="Incidencias por Tipo" />
              <MiniBar
                items={Object.entries(opsKPIs.incidentsByType).map(([type, count]) => ({
                  label: type.replace(/_/g, " "),
                  value: count,
                  max: Math.max(...Object.values(opsKPIs.incidentsByType)),
                  color: "#EF4444",
                }))}
              />
            </div>
            <div className="border rounded-xl p-6 transition-all"
              style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <SectionTitle icon="↩️" title="Razones de Devolución" />
              <MiniBar
                items={opsKPIs.returnReasons.map((r) => ({
                  label: r.reason,
                  value: r.count,
                  max: Math.max(...opsKPIs.returnReasons.map((x) => x.count)),
                  color: "#F59E0B",
                }))}
              />
            </div>
          </div>

          <div className="border rounded-xl p-6 transition-all"
            style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
            <SectionTitle icon="🧾" title="Pedidos Recientes" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase tracking-wider border-b"
                    style={{ color: t.colors.textMuted, borderColor: t.colors.border }}>
                    <th className="text-left pb-4 font-semibold">ID</th>
                    <th className="text-left pb-4 font-semibold">Cliente</th>
                    <th className="text-left pb-4 font-semibold">Estado</th>
                    <th className="text-left pb-4 font-semibold">Canal</th>
                    <th className="text-right pb-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOrders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b last:border-0"
                      style={{ borderColor: t.colors.border }}>
                      <td className="py-4 font-mono text-xs" style={{ color: t.colors.textMuted }}>{o.id}</td>
                      <td className="py-4 font-semibold" style={{ color: t.colors.text }}>{o.customerName}</td>
                      <td className="py-4">
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${statusColors[o.status]}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm" style={{ color: t.colors.textMuted }}>
                        {o.channel ? `${channelIcons[o.channel]} ${o.channel}` : "—"}
                      </td>
                      <td className="py-4 text-right font-bold" style={{ color: t.colors.dorado }}>{formatCOPAdmin(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
