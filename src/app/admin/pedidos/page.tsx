"use client";
import { useState } from "react";
import {
  adminOrders, formatCOPAdmin, channelIcons, channelColors, statusColors, timeAgo,
} from "@/lib/admin-data";
import type { AdminOrder, OrderStatus } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";

const statusFlow: OrderStatus[] = ["nuevo", "pagado", "empacado", "enviado", "entregado"];
const statusSpecial: OrderStatus[] = ["devuelto", "cancelado", "incidencia"];
const allStatuses = [...statusFlow, ...statusSpecial];

const statusEmoji: Record<string, string> = {
  nuevo: "🆕", pagado: "💳", empacado: "📦", enviado: "🚚", entregado: "✅",
  devuelto: "↩️", cancelado: "❌", incidencia: "⚠️",
};

function OrderCard({ order, onSelect }: { order: AdminOrder; onSelect: () => void }) {
  const t = useAdminTheme();
  return (
    <button onClick={onSelect}
      className={`w-full text-left ${t.bgCard} border ${t.border} rounded-xl p-3 hover:${t.borderHover} transition-all group`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-mono text-[10px] ${t.textMuted}`}>{order.id}</span>
        {order.channel && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${channelColors[order.channel]}`}>
            {channelIcons[order.channel]}
          </span>
        )}
      </div>
      <p className={`text-sm font-medium mb-1 ${t.text} group-hover:opacity-80 transition-colors`}>{order.customerName}</p>
      <div className={`text-[10px] ${t.textMuted} mb-2 line-clamp-1`}>
        {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-dorado font-medium">{formatCOPAdmin(order.total)}</span>
        <span className={`text-[10px] ${t.textFaint}`}>{timeAgo(order.timestamps.created)}</span>
      </div>
      {order.incident && (
        <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
          <p className="text-[10px] text-red-400 truncate">⚠️ {order.incident.description}</p>
        </div>
      )}
      {order.trackingCode && (
        <div className={`mt-1 text-[10px] ${t.textFaint}`}>🔗 {order.trackingCode}</div>
      )}
    </button>
  );
}

function OrderDetail({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const t = useAdminTheme();
  const stages = ["created", "paid", "packed", "shipped", "delivered"] as const;
  const stageLabels = ["Creado", "Pagado", "Empacado", "Enviado", "Entregado"];
  const paymentLabels: Record<string, string> = {
    card: "💳 Tarjeta", pse: "🏦 PSE", transfer: "🏦 Transferencia",
    cod: "💵 Contra entrega", nequi: "📱 Nequi", daviplata: "📱 Daviplata",
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${t.bgDeep} border ${t.borderHover} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-poppins font-bold ${t.text}`}>{order.id}</h2>
              <span className={`text-xs px-2 py-1 rounded-lg ${statusColors[order.status]}`}>
                {statusEmoji[order.status]} {order.status}
              </span>
            </div>
            <button onClick={onClose} className={`${t.textFaint} hover:${t.text} text-xl`}>✕</button>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider mb-3`}>📍 Timeline</p>
            <div className="flex items-center gap-1">
              {stages.map((stage, i) => {
                const ts = order.timestamps[stage];
                const active = !!ts;
                return (
                  <div key={stage} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${
                      active ? "bg-green-500/20 text-green-400" : `${t.mode === "dark" ? "bg-white/5 text-white/20" : "bg-gray-100 text-gray-400"}`
                    }`}>
                      {active ? "✓" : i + 1}
                    </div>
                    <p className={`text-[10px] ${active ? t.textMuted : t.textFaint}`}>{stageLabels[i]}</p>
                    {ts && <p className={`text-[9px] ${t.textFaint}`}>{new Date(ts).toLocaleDateString("es-CO")}</p>}
                    {i < stages.length - 1 && (
                      <div className={`absolute w-full h-0.5 ${active ? "bg-green-500/30" : t.border}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Payment */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`${t.bgCard} rounded-xl p-4 space-y-2`}>
              <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider`}>👤 Cliente</p>
              <p className={`text-sm font-medium ${t.text}`}>{order.customerName}</p>
              <p className={`text-xs ${t.textMuted}`}>{order.city}</p>
              <p className={`text-xs ${t.textMuted}`}>{order.address}</p>
            </div>
            <div className={`${t.bgCard} rounded-xl p-4 space-y-2`}>
              <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider`}>💰 Pago</p>
              <p className={`text-sm ${t.text}`}>{paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
              {order.paymentRef && <p className={`text-xs ${t.textMuted} font-mono`}>{order.paymentRef}</p>}
              {order.trackingCode && (
                <p className={`text-xs ${t.textMuted}`}>🔗 {order.trackingCode}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className={`${t.bgCard} rounded-xl p-4 mb-6`}>
            <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider mb-3`}>📋 Productos</p>
            {order.items.map((item) => (
              <div key={item.productId} className={`flex items-center justify-between py-2 border-b ${t.border} last:border-0`}>
                <div>
                  <p className={`text-sm ${t.text}`}>{item.name}</p>
                  <p className={`text-[10px] ${t.textFaint}`}>× {item.qty}</p>
                </div>
                <p className="text-sm text-dorado">{formatCOPAdmin(item.price * item.qty)}</p>
              </div>
            ))}
            <div className={`mt-3 pt-3 border-t ${t.borderHover} space-y-1`}>
              <div className={`flex justify-between text-xs ${t.textMuted}`}>
                <span>Subtotal</span><span>{formatCOPAdmin(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-green-400">
                  <span>Descuento</span><span>-{formatCOPAdmin(order.discount)}</span>
                </div>
              )}
              <div className={`flex justify-between text-xs ${t.textMuted}`}>
                <span>Envío</span><span>{order.shipping === 0 ? "Gratis" : formatCOPAdmin(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-dorado pt-1">
                <span>Total</span><span>{formatCOPAdmin(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(order.notes.length > 0 || order.incident || order.returnReason) && (
            <div className={`${t.bgCard} rounded-xl p-4 space-y-2`}>
              <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider`}>📝 Notas</p>
              {order.notes.map((n, i) => (
                <p key={i} className={`text-xs ${t.textMuted}`}>• {n}</p>
              ))}
              {order.incident && (
                <div className="bg-red-500/10 rounded-lg p-2 mt-2">
                  <p className="text-xs text-red-400">⚠️ Incidencia ({order.incident.type}): {order.incident.description}</p>
                </div>
              )}
              {order.returnReason && (
                <div className="bg-amber-500/10 rounded-lg p-2 mt-2">
                  <p className="text-xs text-amber-400">↩️ Devolución: {order.returnReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            {order.status === "nuevo" && (
              <button className="flex-1 bg-emerald-500/20 text-emerald-400 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                ✓ Marcar como Pagado
              </button>
            )}
            {order.status === "pagado" && (
              <button className="flex-1 bg-amber-500/20 text-amber-400 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors">
                📦 Marcar como Empacado
              </button>
            )}
            {order.status === "empacado" && (
              <button className="flex-1 bg-sky-500/20 text-sky-400 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-500/30 transition-colors">
                🚚 Marcar como Enviado
              </button>
            )}
            {order.conversationId && (
              <button className={`px-4 py-2.5 ${t.mode === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} rounded-xl text-sm transition-colors`}>
                💬 Ver conversación
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PedidosPage() {
  const t = useAdminTheme();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-poppins font-bold ${t.text}`}>📦 Pedidos</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>{adminOrders.length} pedidos totales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("kanban")}
            className={`px-4 py-2 rounded-xl text-sm ${view === "kanban" ? `${t.accent} text-white` : `${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} ${t.textMuted}`}`}>
            Kanban
          </button>
          <button onClick={() => setView("table")}
            className={`px-4 py-2 rounded-xl text-sm ${view === "table" ? `${t.accent} text-white` : `${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} ${t.textMuted}`}`}>
            Tabla
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {allStatuses.map((status) => {
            const orders = adminOrders.filter((o) => o.status === status);
            return (
              <div key={status} className="min-w-[260px] flex-shrink-0">
                <div className={`flex items-center gap-2 mb-3 px-2`}>
                  <span>{statusEmoji[status]}</span>
                  <span className={`text-sm font-medium capitalize ${t.text}`}>{status}</span>
                  <span className={`${t.mode === "dark" ? "bg-white/10 text-white/40" : "bg-gray-200 text-gray-500"} text-[10px] px-2 py-0.5 rounded-full`}>{orders.length}</span>
                </div>
                <div className="space-y-2">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} onSelect={() => setSelectedOrder(order)} />
                  ))}
                  {orders.length === 0 && (
                    <div className={`${t.mode === "dark" ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-200"} border border-dashed rounded-xl p-6 text-center`}>
                      <p className={`${t.textFaint} text-xs`}>Sin pedidos</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className={`${t.bgCard} border ${t.border} rounded-2xl overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`${t.textFaint} text-[11px] uppercase tracking-wider ${t.bgDeep}`}>
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Canal</th>
                <th className="text-left p-4">Pago</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {adminOrders.map((o) => (
                <tr key={o.id} onClick={() => setSelectedOrder(o)}
                  className={`border-t ${t.border} ${t.tableRowHover} cursor-pointer transition-colors`}>
                  <td className={`p-4 font-mono text-xs ${t.textMuted}`}>{o.id}</td>
                  <td className={`p-4 ${t.text}`}>{o.customerName}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-lg ${statusColors[o.status]}`}>
                      {statusEmoji[o.status]} {o.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {o.channel ? (
                      <span className={`text-xs px-2 py-1 rounded ${channelColors[o.channel]}`}>
                        {channelIcons[o.channel]} {o.channel}
                      </span>
                    ) : "—"}
                  </td>
                  <td className={`p-4 text-xs ${t.textMuted} capitalize`}>{o.paymentMethod}</td>
                  <td className="p-4 text-right text-dorado font-medium">{formatCOPAdmin(o.total)}</td>
                  <td className={`p-4 text-right ${t.textFaint} text-xs`}>{timeAgo(o.timestamps.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
