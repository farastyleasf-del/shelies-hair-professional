"use client";
import { useState } from "react";
import {
  adminCustomers, adminOrders, conversations as convData,
  formatCOPAdmin, timeAgo, channelIcons, statusColors,
} from "@/lib/admin-data";
import type { AdminCustomer, CustomerTag } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";

const tagColors: Record<CustomerTag, string> = {
  vip: "bg-dorado/20 text-dorado border-dorado/30",
  frecuente: "bg-green-500/20 text-green-400 border-green-500/30",
  riesgo: "bg-red-500/20 text-red-400 border-red-500/30",
  mayorista: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  nuevo: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function CustomerCard({ customer, onSelect }: { customer: AdminCustomer; onSelect: () => void }) {
  const t = useAdminTheme();
  return (
    <button onClick={onSelect}
      className={`w-full text-left ${t.bgCard} border ${t.border} rounded-2xl p-5 hover:${t.borderHover} transition-all group`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${t.accentBg} flex items-center justify-center text-lg font-poppins font-bold ${t.accentText} flex-shrink-0`}>
          {customer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-medium ${t.text} group-hover:opacity-80 transition-colors`}>{customer.name}</p>
          </div>
          <div className="flex gap-1 mb-2 flex-wrap">
            {customer.tags.map((tg) => (
              <span key={tg} className={`text-[9px] px-2 py-0.5 rounded-full border ${tagColors[tg]}`}>
                {tg.toUpperCase()}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-dorado">{customer.totalOrders}</p>
              <p className={`text-[9px] ${t.textFaint}`}>Pedidos</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${t.textMuted}`}>{formatCOPAdmin(customer.totalSpent)}</p>
              <p className={`text-[9px] ${t.textFaint}`}>Total</p>
            </div>
            <div>
              <p className={`text-xs ${t.textMuted}`}>{customer.city}</p>
              <p className={`text-[9px] ${t.textFaint}`}>Ciudad</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function CustomerProfile({ customer, onClose }: { customer: AdminCustomer; onClose: () => void }) {
  const t = useAdminTheme();
  const orders = adminOrders.filter((o) => o.customerId === customer.id);
  const convos = convData.filter((c) => c.customerId === customer.id);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${t.bgDeep} border ${t.borderHover} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full ${t.accentBg} flex items-center justify-center text-2xl font-poppins font-bold ${t.accentText}`}>
                {customer.name.charAt(0)}
              </div>
              <div>
                <h2 className={`text-xl font-poppins font-bold ${t.text}`}>{customer.name}</h2>
                <div className="flex gap-1 mt-1">
                  {customer.tags.map((tg) => (
                    <span key={tg} className={`text-[10px] px-2 py-0.5 rounded-full border ${tagColors[tg]}`}>
                      {tg.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={onClose} className={`${t.textFaint} hover:${t.text} text-xl`}>✕</button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className={`${t.bgCard} rounded-xl p-4 text-center`}>
              <p className="text-2xl font-bold text-dorado">{customer.totalOrders}</p>
              <p className={`text-[10px] ${t.textFaint} uppercase`}>Pedidos</p>
            </div>
            <div className={`${t.bgCard} rounded-xl p-4 text-center`}>
              <p className={`text-lg font-bold ${t.text}`}>{formatCOPAdmin(customer.totalSpent)}</p>
              <p className={`text-[10px] ${t.textFaint} uppercase`}>Total gastado</p>
            </div>
            <div className={`${t.bgCard} rounded-xl p-4 text-center`}>
              <p className={`text-sm font-bold ${t.textMuted}`}>
                {customer.totalOrders > 0 ? formatCOPAdmin(customer.totalSpent / customer.totalOrders) : "$0"}
              </p>
              <p className={`text-[10px] ${t.textFaint} uppercase`}>Ticket promedio</p>
            </div>
            <div className={`${t.bgCard} rounded-xl p-4 text-center`}>
              <p className={`text-sm font-bold ${t.textMuted}`}>{customer.lastOrderDate}</p>
              <p className={`text-[10px] ${t.textFaint} uppercase`}>Último pedido</p>
            </div>
          </div>

          {/* Contact info */}
          <div className={`${t.bgCard} rounded-xl p-4 mb-6 grid grid-cols-2 gap-4`}>
            <div className="space-y-2">
              <DetailRow label="📱 Teléfono" value={customer.phone} />
              <DetailRow label="📧 Email" value={customer.email} />
              <DetailRow label="📍 Ciudad" value={customer.city} />
              {customer.address && <DetailRow label="🏠 Dirección" value={customer.address} />}
            </div>
            <div className="space-y-2">
              <DetailRow label="📅 Cliente desde" value={customer.createdAt} />
              {customer.lastProductViewed && (
                <DetailRow label="👁️ Último visto" value={customer.lastProductViewed} />
              )}
              {customer.cartItems && customer.cartItems.length > 0 && (
                <DetailRow label="🛒 En carrito" value={customer.cartItems.join(", ")} />
              )}
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 mb-6">
              <p className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">📝 Notas</p>
              <p className="text-sm text-amber-300/70">{customer.notes}</p>
            </div>
          )}

          {/* Orders & Conversations */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`${t.bgCard} rounded-xl p-4`}>
              <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider mb-3`}>📦 Historial de Pedidos</p>
              <div className="space-y-2 max-h-60 overflow-auto">
                {orders.map((o) => (
                  <div key={o.id} className={`flex items-center justify-between py-2 border-b ${t.border} last:border-0`}>
                    <div>
                      <p className={`font-mono text-[10px] ${t.textMuted}`}>{o.id}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[o.status]}`}>{o.status}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-dorado font-medium">{formatCOPAdmin(o.total)}</p>
                      <p className={`text-[10px] ${t.textFaint}`}>{timeAgo(o.timestamps.created)}</p>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className={`text-xs ${t.textFaint}`}>Sin pedidos</p>}
              </div>
            </div>

            <div className={`${t.bgCard} rounded-xl p-4`}>
              <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider mb-3`}>💬 Conversaciones</p>
              <div className="space-y-2 max-h-60 overflow-auto">
                {convos.map((c) => (
                  <div key={c.id} className={`flex items-center justify-between py-2 border-b ${t.border} last:border-0`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{channelIcons[c.channel]}</span>
                      <div className="min-w-0">
                        <p className={`text-xs ${t.textMuted} truncate`}>{c.lastMessage}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[c.status]}`}>{c.status}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] ${t.textFaint} flex-shrink-0`}>{timeAgo(c.lastMessageAt)}</span>
                  </div>
                ))}
                {convos.length === 0 && <p className={`text-xs ${t.textFaint}`}>Sin conversaciones</p>}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-6">
            <button className={`flex-1 ${t.accentBg} ${t.accentText} py-2.5 rounded-xl text-sm font-medium hover:opacity-80 transition-colors`}>
              💬 Iniciar conversación
            </button>
            <button className={`flex-1 ${t.mode === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} py-2.5 rounded-xl text-sm transition-colors`}>
              📦 Crear pedido
            </button>
            <button className={`flex-1 ${t.mode === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} py-2.5 rounded-xl text-sm transition-colors`}>
              📝 Agregar nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const t = useAdminTheme();
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[11px] ${t.textFaint}`}>{label}</span>
      <span className={`text-xs ${t.textMuted}`}>{value}</span>
    </div>
  );
}

export default function ClientesPage() {
  const t = useAdminTheme();
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const allTags: CustomerTag[] = ["vip", "frecuente", "mayorista", "nuevo", "riesgo"];

  const filtered = adminCustomers
    .filter((c) => !tagFilter || c.tags.includes(tagFilter as CustomerTag))
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-poppins font-bold ${t.text}`}>👤 Clientes</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>{adminCustomers.length} clientes registrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className={`${t.inputBg} border ${t.inputBorder} rounded-xl px-4 py-2 text-sm ${t.text} ${t.mode === "dark" ? "placeholder-white/20" : "placeholder-gray-400"} focus:outline-none focus:ring-2 focus:ring-vino/30 w-64`}
        />
        <div className="flex gap-1">
          <button onClick={() => setTagFilter("")}
            className={`text-xs px-3 py-1.5 rounded-lg ${!tagFilter ? `${t.mode === "dark" ? "bg-white/10" : "bg-gray-200"} ${t.text}` : `${t.textMuted} hover:opacity-80`}`}>
            Todos
          </button>
          {allTags.map((tg) => (
            <button key={tg} onClick={() => setTagFilter(tg)}
              className={`text-xs px-3 py-1.5 rounded-lg border ${
                tagFilter === tg ? tagColors[tg] : `border-transparent ${t.textMuted} hover:opacity-80`
              }`}>
              {tg.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <CustomerCard key={c.id} customer={c} onSelect={() => setSelected(c)} />
        ))}
      </div>

      {/* Profile modal */}
      {selected && (
        <CustomerProfile customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
