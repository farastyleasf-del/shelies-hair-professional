"use client";
import { useState, useEffect, useCallback } from "react";
import { apiUrl, authedFetch } from "@/lib/api";
import {
  formatCOPAdmin, channelIcons, channelColors, statusColors, timeAgo,
} from "@/lib/admin-data";
import type { AdminOrder, OrderStatus, PaymentMethod, Channel } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";

const statusFlow: OrderStatus[] = ["nuevo", "pagado", "empacado", "enviado", "entregado"];
const statusSpecial: OrderStatus[] = ["devuelto", "cancelado", "incidencia"];
const allStatuses = [...statusFlow, ...statusSpecial];

const statusEmoji: Record<string, string> = {
  nuevo: "🆕", pagado: "💳", empacado: "📦", enviado: "🚚", entregado: "✅",
  devuelto: "↩️", cancelado: "❌", incidencia: "⚠️",
};

/* ── DB row → AdminOrder ── */
interface DbOrder {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_address: string;
  items: Array<{ id?: string; name?: string; title?: string; quantity?: number; qty?: number; unit_price?: number; price?: number }>;
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  status: string;
  payment_method: string;
  payment_ref?: string;
  tracking_code?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

function dbToAdminOrder(row: DbOrder): AdminOrder {
  const items = Array.isArray(row.items) ? row.items : [];
  return {
    id: row.order_number || String(row.id),
    customerId: row.client_phone || String(row.id),
    customerName: row.client_name || "Cliente",
    status: (row.status as OrderStatus) || "nuevo",
    items: items.map((i) => ({
      productId: i.id || "",
      name: i.name || i.title || "Producto",
      qty: i.quantity || i.qty || 1,
      price: i.unit_price || i.price || 0,
    })),
    subtotal: Number(row.subtotal) || 0,
    discount: Number(row.discount) || 0,
    shipping: 0,
    total: Number(row.total) || 0,
    paymentMethod: (row.payment_method as PaymentMethod) || "card",
    paymentRef: row.payment_ref || undefined,
    trackingCode: row.tracking_code || undefined,
    address: row.client_address || "",
    city: "",
    channel: undefined as Channel | undefined,
    notes: row.notes ? [row.notes] : [],
    timestamps: {
      created: row.created_at,
    },
  };
}

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
      {order.trackingCode && (
        <div className={`mt-1 text-[10px] ${t.textFaint}`}>🔗 {order.trackingCode}</div>
      )}
    </button>
  );
}

function OrderDetail({
  order, onClose, onStatusChange,
}: {
  order: AdminOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const t = useAdminTheme();
  const [updating, setUpdating] = useState(false);
  const stages = ["created", "paid", "packed", "shipped", "delivered"] as const;
  const stageLabels = ["Creado", "Pagado", "Empacado", "Enviado", "Entregado"];
  const paymentLabels: Record<string, string> = {
    card: "💳 Tarjeta", pse: "🏦 PSE", transfer: "🏦 Transferencia",
    cod: "💵 Contra entrega", nequi: "📱 Nequi", daviplata: "📱 Daviplata",
    mercadopago: "💳 MercadoPago", whatsapp: "💬 WhatsApp",
  };

  async function advance(newStatus: OrderStatus) {
    setUpdating(true);
    await onStatusChange(order.id, newStatus);
    setUpdating(false);
    onClose();
  }

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
            {order.items.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between py-2 border-b ${t.border} last:border-0`}>
                <div>
                  <p className={`text-sm ${t.text}`}>{item.name}</p>
                  <p className={`text-[10px] ${t.textFaint}`}>× {item.qty}</p>
                </div>
                <p className="text-sm text-dorado">{formatCOPAdmin(item.price * item.qty)}</p>
              </div>
            ))}
            <div className={`mt-3 pt-3 border-t ${t.borderHover} space-y-1`}>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-green-400">
                  <span>Descuento</span><span>-{formatCOPAdmin(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-dorado pt-1">
                <span>Total</span><span>{formatCOPAdmin(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes.length > 0 && (
            <div className={`${t.bgCard} rounded-xl p-4 mb-6 space-y-2`}>
              <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider`}>📝 Notas</p>
              {order.notes.map((n, i) => (
                <p key={i} className={`text-xs ${t.textMuted}`}>• {n}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {order.status === "nuevo" && (
              <button disabled={updating} onClick={() => advance("pagado")}
                className="flex-1 bg-emerald-500/20 text-emerald-400 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                ✓ Marcar como Pagado
              </button>
            )}
            {order.status === "pagado" && (
              <button disabled={updating} onClick={() => advance("empacado")}
                className="flex-1 bg-amber-500/20 text-amber-400 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50">
                📦 Marcar como Empacado
              </button>
            )}
            {order.status === "empacado" && (
              <button disabled={updating} onClick={() => advance("enviado")}
                className="flex-1 bg-sky-500/20 text-sky-400 py-2.5 rounded-xl text-sm font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50">
                🚚 Marcar como Enviado
              </button>
            )}
            {order.status === "enviado" && (
              <button disabled={updating} onClick={() => advance("entregado")}
                className="flex-1 bg-green-500/20 text-green-400 py-2.5 rounded-xl text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50">
                ✅ Marcar como Entregado
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
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await authedFetch(apiUrl("/api/orders"));
      if (!res.ok) return;
      const rows = await res.json() as DbOrder[];
      setOrders(rows.map(dbToAdminOrder));
    } catch {
      // fallback: empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    try {
      const res = await authedFetch(apiUrl(`/api/orders/${orderId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
        );
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-poppins font-bold ${t.text}`}>📦 Pedidos</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>
            {loading ? "Cargando..." : `${orders.length} pedidos totales`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders}
            className={`px-3 py-2 rounded-xl text-sm ${t.mode === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} transition-colors`}>
            ↺ Actualizar
          </button>
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

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className={`${t.bgCard} border ${t.border} rounded-2xl p-16 text-center`}>
          <p className="text-5xl mb-4">📦</p>
          <p className={`${t.textMuted} text-sm`}>No hay pedidos aún. Los pedidos de la tienda y del Inbox aparecerán aquí.</p>
        </div>
      )}

      {/* Kanban View */}
      {!loading && orders.length > 0 && view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {allStatuses.map((status) => {
            const cols = orders.filter((o) => o.status === status);
            return (
              <div key={status} className="min-w-[260px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <span>{statusEmoji[status]}</span>
                  <span className={`text-sm font-medium capitalize ${t.text}`}>{status}</span>
                  <span className={`${t.mode === "dark" ? "bg-white/10 text-white/40" : "bg-gray-200 text-gray-500"} text-[10px] px-2 py-0.5 rounded-full`}>{cols.length}</span>
                </div>
                <div className="space-y-2">
                  {cols.map((order) => (
                    <OrderCard key={order.id} order={order} onSelect={() => setSelectedOrder(order)} />
                  ))}
                  {cols.length === 0 && (
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
      {!loading && orders.length > 0 && view === "table" && (
        <div className={`${t.bgCard} border ${t.border} rounded-2xl overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`${t.textFaint} text-[11px] uppercase tracking-wider ${t.bgDeep}`}>
                <th className="text-left p-4">Pedido</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Pago</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => setSelectedOrder(o)}
                  className={`border-t ${t.border} ${t.tableRowHover} cursor-pointer transition-colors`}>
                  <td className={`p-4 font-mono text-xs ${t.textMuted}`}>{o.id}</td>
                  <td className={`p-4 ${t.text}`}>{o.customerName}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-lg ${statusColors[o.status]}`}>
                      {statusEmoji[o.status]} {o.status}
                    </span>
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
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
