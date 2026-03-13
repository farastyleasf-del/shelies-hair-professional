"use client";
import { useState, useRef, useEffect } from "react";
import {
  conversations as convData, messagesDemo, adminCustomers, adminOrders,
  agents, templates, formatCOPAdmin, timeAgo, channelIcons, channelColors, statusColors,
} from "@/lib/admin-data";
import type { Conversation, Message } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";

/* ═══════════════════════════════════════════════════
   INBOX OMNICANAL — 3 columnas
   ═══════════════════════════════════════════════════ */

const statusLabels: Record<string, string> = {
  nuevo: "Nuevo", en_atencion: "En atención", espera_cliente: "Espera cliente",
  espera_equipo: "Espera equipo", cerrado: "Cerrado", convertido: "Convertido",
};

/* ── Column 1: Conversation List ── */
function ConversationList({
  conversations, selected, onSelect, filter, setFilter, channelFilter, setChannelFilter,
}: {
  conversations: Conversation[];
  selected: string | null;
  onSelect: (id: string) => void;
  filter: string; setFilter: (f: string) => void;
  channelFilter: string; setChannelFilter: (c: string) => void;
}) {
  const t = useAdminTheme();
  const filtered = conversations
    .filter((c) => !channelFilter || c.channel === channelFilter)
    .filter((c) => !filter || c.status === filter)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div className={`w-full md:w-80 flex-shrink-0 border-r ${t.border} flex flex-col ${t.bgDeep}`}>
      {/* Header */}
      <div className={`p-4 border-b ${t.border}`}>
        <h2 className={`text-lg font-poppins font-semibold mb-3 ${t.text}`}>💬 Inbox</h2>
        {/* Channel tabs */}
            <div className="flex gap-1 mb-2">
              {["", "whatsapp", "instagram", "facebook", "tiktok", "web"].map((ch) => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                channelFilter === ch ? `${t.mode === "dark" ? "bg-white/10" : "bg-gray-200"} ${t.text}` : `${t.textMuted} hover:opacity-80`
              }`}>
              {ch ? `${channelIcons[ch]}` : "Todos"}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {["", "nuevo", "en_atencion", "espera_cliente", "espera_equipo"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-[10px] px-2 py-0.5 rounded-lg transition-all ${
                filter === s ? `${t.accentBg} ${t.accentText}` : `${t.textFaint} hover:opacity-80`
              }`}>
              {s ? statusLabels[s] : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-auto">
        {filtered.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left p-4 border-b ${t.border} ${t.tableRowHover} transition-all ${
              selected === conv.id ? `${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} border-l-2 ${t.accentBorder}` : ""
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${channelColors[conv.channel]}`}>
                  {channelIcons[conv.channel]}
                </span>
                <span className={`text-sm font-medium truncate max-w-[120px] ${t.text}`}>{conv.customerName}</span>
              </div>
              <span className={`text-[10px] ${t.textFaint}`}>{timeAgo(conv.lastMessageAt)}</span>
            </div>
            <p className={`text-xs ${t.textMuted} truncate mb-1.5`}>{conv.lastMessage}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[conv.status] || `${t.mode === "dark" ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-500"}`}`}>
                {statusLabels[conv.status]}
              </span>
              {conv.unread > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
              {conv.isAI && <span className="text-[9px] text-purple-400">🤖 IA</span>}
              {conv.assignedTo && (
                <span className={`text-[9px] ${t.textFaint} ml-auto truncate max-w-[70px]`}>
                  {agents.find((a) => a.id === conv.assignedTo)?.name || ""}
                </span>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className={`p-8 text-center ${t.textFaint} text-sm`}>No hay conversaciones</div>
        )}
      </div>
    </div>
  );
}

/* ── Column 2: Chat Panel ── */
function ChatPanel({
  conversation, messages,
}: {
  conversation: Conversation | null;
  messages: Message[];
}) {
  const [input, setInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const [previewRole, setPreviewRole] = useState<string | null>(null);
  const t = useAdminTheme();

  useEffect(() => {
    try {
      const pr = sessionStorage.getItem("preview_role");
      setPreviewRole(pr);
    } catch (e) {
      setPreviewRole(null);
    }
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className={`flex-1 flex items-center justify-center ${t.textFaint}`}>
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p>Selecciona una conversación</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${t.bgCard}`}>
      {/* Chat Header */}
      <div className={`p-4 border-b ${t.border} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${t.mode === "dark" ? "bg-white/10" : "bg-gray-100"} flex items-center justify-center text-lg`}>
            {channelIcons[conversation.channel]}
          </div>
          <div>
            <p className={`font-medium ${t.text}`}>{conversation.customerName}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[conversation.status]}`}>
                {statusLabels[conversation.status]}
              </span>
              {conversation.assignedTo && (
                <span className={`text-[10px] ${t.textFaint}`}>
                  → {agents.find((a) => a.id === conversation.assignedTo)?.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {previewRole !== "colaborador" && (
            <>
              <select className={`${t.inputBg} border ${t.inputBorder} rounded-lg text-xs ${t.textMuted} px-2 py-1`}>
                <option>Asignar a...</option>
                {agents.filter((a) => a.role !== "soporte").map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select className={`${t.inputBg} border ${t.inputBorder} rounded-lg text-xs ${t.textMuted} px-2 py-1`}>
                <option>Cambiar estado...</option>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </>
          )}
          {previewRole === "colaborador" && (
            <div className={`text-xs ${t.textFaint} px-3 py-1 rounded-lg ${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"}`}>Vista colaborador</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
              msg.isInternal
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : msg.sender === "customer"
                  ? `${t.mode === "dark" ? "bg-white/5 text-white" : "bg-gray-100 text-gray-900"}`
                  : msg.sender === "ai"
                    ? "bg-purple-500/15 text-purple-200"
                    : `${t.accentBg} ${t.accentText}`
            }`}>
              {msg.isInternal && <p className="text-[9px] text-amber-400/60 mb-1">📝 Nota interna</p>}
              <p className="text-sm">{msg.text}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] opacity-40">{msg.senderName}</span>
                <span className="text-[10px] opacity-30">
                  {new Date(msg.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className={`mx-4 mb-2 ${t.bgCard} border ${t.borderHover} rounded-xl p-3 max-h-40 overflow-auto`}>
          <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>Plantillas rápidas</p>
          {templates.map((tpl) => (
            <button key={tpl.id} onClick={() => { setInput(tpl.text); setShowTemplates(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg ${t.tableRowHover} text-sm ${t.textMuted} transition-colors`}>
              <span className={`font-medium ${t.text}`}>{tpl.name}</span>
              <span className={`text-[11px] ${t.textFaint} block truncate`}>{tpl.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={`p-4 border-t ${t.border}`}>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(!showTemplates)}
            className={`p-2.5 ${t.mode === "dark" ? "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70" : "bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600"} rounded-xl text-sm transition-colors`}
            title="Plantillas">
            📋
          </button>
          <button className={`p-2.5 ${t.mode === "dark" ? "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70" : "bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600"} rounded-xl text-sm transition-colors`} title="Nota interna">
            📝
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-xl px-4 py-2.5 text-sm ${t.text} ${t.mode === "dark" ? "placeholder-white/20" : "placeholder-gray-400"} focus:outline-none focus:ring-2 focus:ring-vino/30`}
          />
          <button className="px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-80 transition-colors"
            style={{ backgroundColor: t.colors.primary }}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Column 3: Customer Panel ── */
function CustomerPanel({ conversation }: { conversation: Conversation | null }) {
  const t = useAdminTheme();
  if (!conversation) return null;

  const customer = adminCustomers.find((c) => c.id === conversation.customerId);
  const customerOrders = adminOrders.filter((o) => o.customerId === conversation.customerId);

  return (
    <div className={`w-full md:w-80 flex-shrink-0 border-l ${t.border} ${t.bgDeep} overflow-auto`}>
      <div className="p-4">
        {/* Customer info */}
        <div className="text-center mb-4">
          <div className={`w-16 h-16 rounded-full ${t.accentBg} flex items-center justify-center text-2xl mx-auto mb-2`}>
            {conversation.customerName.charAt(0)}
          </div>
          <h3 className={`font-poppins font-semibold text-lg ${t.text}`}>{conversation.customerName}</h3>
          {customer && (
            <div className="flex justify-center gap-1 mt-2 flex-wrap">
              {customer.tags.map((tg) => {
                const tagColor: Record<string, string> = {
                  vip: "bg-dorado/20 text-dorado", frecuente: "bg-green-500/20 text-green-400",
                  riesgo: "bg-red-500/20 text-red-400", mayorista: "bg-blue-500/20 text-blue-400",
                  nuevo: "bg-purple-500/20 text-purple-400",
                };
                return (
                  <span key={tg} className={`text-[10px] px-2 py-0.5 rounded-full ${tagColor[tg] || `${t.mode === "dark" ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500"}`}`}>
                    {tg.toUpperCase()}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer details */}
        {customer && (
          <div className="space-y-3 mb-6">
            <div className={`${t.bgCard} rounded-xl p-3 space-y-2`}>
              <Detail label="Teléfono" value={customer.phone} />
              <Detail label="Email" value={customer.email} />
              <Detail label="Ciudad" value={customer.city} />
              {customer.address && <Detail label="Dirección" value={customer.address} />}
            </div>

            <div className={`${t.bgCard} rounded-xl p-3 space-y-2`}>
              <Detail label="Total pedidos" value={String(customer.totalOrders)} />
              <Detail label="Total gastado" value={formatCOPAdmin(customer.totalSpent)} highlight />
              <Detail label="Último pedido" value={customer.lastOrderDate} />
              <Detail label="Cliente desde" value={customer.createdAt} />
            </div>

            {customer.lastProductViewed && (
              <div className={`${t.bgCard} rounded-xl p-3`}>
                <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-1`}>Último producto visto</p>
                <p className={`text-xs ${t.textMuted}`}>{customer.lastProductViewed}</p>
              </div>
            )}

            {customer.notes && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                <p className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">📝 Notas</p>
                <p className="text-xs text-amber-300/70">{customer.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Linked order */}
        {conversation.linkedOrderId && (
          <div className="mb-4">
            <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>📦 Pedido vinculado</p>
            {(() => {
              const order = adminOrders.find((o) => o.id === conversation.linkedOrderId);
              if (!order) return null;
              return (
                <div className={`${t.bgCard} rounded-xl p-3 space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-xs ${t.textMuted}`}>{order.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="text-xs text-dorado font-medium">{formatCOPAdmin(order.total)}</p>
                  <div className={`text-[10px] ${t.textFaint}`}>
                    {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Customer orders */}
        <div>
          <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>📋 Historial de pedidos</p>
          <div className="space-y-2">
            {customerOrders.slice(0, 4).map((o) => (
              <div key={o.id} className={`${t.bgCard} rounded-lg p-2.5 flex items-center justify-between`}>
                <div>
                  <p className={`font-mono text-[10px] ${t.textMuted}`}>{o.id}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[o.status]}`}>{o.status}</span>
                </div>
                <p className="text-xs text-dorado">{formatCOPAdmin(o.total)}</p>
              </div>
            ))}
            {customerOrders.length === 0 && (
              <p className={`text-xs ${t.textFaint}`}>Sin pedidos</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 space-y-2">
          <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>⚡ Acciones rápidas</p>
          <button className={`w-full ${t.accentBg} ${t.accentText} text-xs py-2 rounded-lg hover:opacity-80 transition-colors`}>
            Crear pedido
          </button>
          <button className={`w-full ${t.mode === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} text-xs py-2 rounded-lg transition-colors`}>
            Enviar link de pago
          </button>
          <button className={`w-full ${t.mode === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} text-xs py-2 rounded-lg transition-colors`}>
            Agregar nota
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const t = useAdminTheme();
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[10px] ${t.textFaint}`}>{label}</span>
      <span className={`text-xs ${highlight ? "text-dorado font-medium" : t.textMuted}`}>{value}</span>
    </div>
  );
}

/* ── Main Inbox Page ── */
export default function InboxPage() {
  const t = useAdminTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  // Vista activa en móvil: "list" | "chat" | "info"
  const [mobileTab, setMobileTab] = useState<"list" | "chat" | "info">("list");

  const selectedConv = convData.find((c) => c.id === selected) || null;
  const selectedMessages = messagesDemo.filter((m) => m.conversationId === selected);

  function handleSelect(id: string) {
    setSelected(id);
    setMobileTab("chat"); // en móvil, ir directo al chat
  }

  const tabBtn = (tab: "list" | "chat" | "info", label: string, emoji: string) => (
    <button
      onClick={() => setMobileTab(tab)}
      className={`flex-1 py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors ${
        mobileTab === tab
          ? "border-b-2 border-vino text-vino"
          : "border-b-2 border-transparent"
      }`}
      style={{ color: mobileTab === tab ? t.colors.primary : t.colors.textMuted }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className={`flex flex-col h-[calc(100vh-100px)] -m-4 md:-m-6 rounded-xl overflow-hidden border ${t.border}`}>

      {/* Tabs de navegación — solo móvil */}
      <div className={`flex md:hidden border-b ${t.border}`}
        style={{ backgroundColor: t.colors.bgCard }}>
        {tabBtn("list", "Chats", "💬")}
        {tabBtn("chat", "Mensaje", "✉️")}
        {tabBtn("info", "Cliente", "👤")}
      </div>

      {/* Layout escritorio: 3 columnas. Móvil: una columna visible a la vez */}
      <div className="flex flex-1 overflow-hidden">

        {/* Col 1 — Lista de conversaciones */}
        <div className={`${mobileTab === "list" ? "flex" : "hidden"} md:flex flex-col`}
          style={{ width: undefined }}>
          <ConversationList
            conversations={convData}
            selected={selected}
            onSelect={handleSelect}
            filter={statusFilter}
            setFilter={setStatusFilter}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
          />
        </div>

        {/* Col 2 — Chat */}
        <div className={`${mobileTab === "chat" ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden`}>
          {/* Botón volver en móvil */}
          {selected && (
            <div className={`md:hidden px-4 py-2 border-b ${t.border} flex items-center gap-2`}
              style={{ backgroundColor: t.colors.bgCard }}>
              <button onClick={() => setMobileTab("list")}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: t.colors.primary }}>
                ← Volver
              </button>
              <span className="text-xs" style={{ color: t.colors.textMuted }}>
                {selectedConv?.customerName}
              </span>
            </div>
          )}
          <ChatPanel conversation={selectedConv} messages={selectedMessages} />
        </div>

        {/* Col 3 — Info cliente */}
        <div className={`${mobileTab === "info" ? "flex" : "hidden"} md:flex flex-col overflow-hidden`}>
          <CustomerPanel conversation={selectedConv} />
        </div>

      </div>
    </div>
  );
}
