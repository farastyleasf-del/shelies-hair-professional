"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  messagesDemo, adminCustomers, adminOrders,
  agents, templates, formatCOPAdmin, timeAgo, channelIcons, channelColors, statusColors,
} from "@/lib/admin-data";
import type { Conversation, Message } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";

/* ═══════════════════════════════════════════════════
   INBOX OMNICANAL — 3 columnas + WhatsApp real
   ═══════════════════════════════════════════════════ */

const statusLabels: Record<string, string> = {
  nuevo: "Nuevo", en_atencion: "En atención", espera_cliente: "Espera cliente",
  espera_equipo: "Espera equipo", cerrado: "Cerrado", convertido: "Convertido",
};

/* ── Helpers para normalizar datos WA → tipos admin ── */
interface WaConvRaw {
  id: string; contact_name: string; contact_phone: string;
  status: string; unread: number; last_message: string;
  last_message_at: string; assigned_to: string | null;
}
interface WaMsgRaw {
  id: string; conversation_id: string; direction: "inbound" | "outbound";
  sender_name: string; text: string; created_at: string;
}

function waToConversation(wa: WaConvRaw): Conversation {
  return {
    id: wa.id,
    channel: "whatsapp",
    status: (wa.status as Conversation["status"]) || "nuevo",
    assignedTo: wa.assigned_to,
    customerId: wa.id,
    customerName: wa.contact_name || wa.contact_phone,
    tags: [],
    lastMessage: wa.last_message,
    lastMessageAt: wa.last_message_at,
    unread: wa.unread,
    isAI: false,
    createdAt: wa.last_message_at,
  };
}

function waMsgToMessage(m: WaMsgRaw): Message {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    text: m.text,
    sender: m.direction === "inbound" ? "customer" : "agent",
    senderName: m.sender_name,
    timestamp: m.created_at,
    type: "text",
    isInternal: false,
    channel: "whatsapp",
  };
}

/* ── Column 1: Conversation List ── */
function ConversationList({
  conversations, selected, onSelect, filter, setFilter, channelFilter, setChannelFilter, waConnected, onSeedTest,
}: {
  conversations: Conversation[]; selected: string | null; onSelect: (id: string) => void;
  filter: string; setFilter: (f: string) => void;
  channelFilter: string; setChannelFilter: (c: string) => void;
  waConnected: boolean; onSeedTest: () => Promise<void>;
}) {
  const t = useAdminTheme();
  const filtered = conversations
    .filter((c) => !channelFilter || c.channel === channelFilter)
    .filter((c) => !filter || c.status === filter)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div className={`w-full md:w-80 flex-shrink-0 border-r ${t.border} flex flex-col`} style={{ backgroundColor: t.colors.bgSidebar }}>
      {/* Header */}
      <div className={`p-4 border-b ${t.border}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-semibold ${t.text}`}>💬 Inbox</h2>
          {waConnected ? (
            <span className="text-[10px] bg-green-500/15 text-green-500 px-2 py-0.5 rounded-full font-medium border border-green-500/20">
              ● WA Live
            </span>
          ) : (
            <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
              WA sin config
            </span>
          )}
        </div>
        {/* Channel tabs */}
        <div className="flex gap-1 mb-2 flex-wrap">
          {["", "whatsapp", "instagram", "facebook", "tiktok", "web"].map((ch) => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                channelFilter === ch
                  ? `${t.mode === "dark" ? "bg-white/10" : "bg-gray-200"} ${t.text}`
                  : `${t.textMuted} hover:opacity-80`
              }`}>
              {ch ? channelIcons[ch] : "Todos"}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {["", "nuevo", "en_atencion", "espera_cliente"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-[10px] px-2 py-0.5 rounded-lg transition-all ${
                filter === s ? `${t.accentBg} ${t.accentText}` : `${t.textFaint} hover:opacity-80`
              }`}>
              {s ? statusLabels[s] : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Botón prueba — visible siempre para poder hacer demos */}
      <div className={`px-4 py-2 border-b ${t.border}`}>
        <button onClick={onSeedTest}
          className="w-full text-[10px] py-1.5 rounded-lg border border-dashed transition-colors text-center hover:opacity-80"
          style={{ borderColor: t.colors.border, color: t.colors.textFaint }}>
          🧪 Simular mensajes WA de prueba
        </button>
      </div>

      {/* Conversation items */}
      <div className="flex-1 overflow-auto">
        {filtered.map((conv) => (
          <button key={conv.id} onClick={() => onSelect(conv.id)}
            className={`w-full text-left p-4 border-b ${t.border} transition-all ${
              selected === conv.id
                ? `${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} border-l-2`
                : `${t.mode === "dark" ? "hover:bg-white/3" : "hover:bg-gray-50"}`
            }`}
            style={selected === conv.id ? { borderLeftColor: t.colors.primary } : {}}>
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${channelColors[conv.channel]}`}>
                  {channelIcons[conv.channel]}
                </span>
                <span className={`text-sm font-medium truncate max-w-[120px] ${t.text}`}>{conv.customerName}</span>
              </div>
              <span className={`text-[10px] ${t.textFaint} flex-shrink-0`}>{timeAgo(conv.lastMessageAt)}</span>
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
              {conv.assignedTo && (
                <span className={`text-[9px] ${t.textFaint} ml-auto truncate max-w-[70px]`}>
                  {agents.find((a) => a.id === conv.assignedTo)?.name ?? conv.assignedTo}
                </span>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className={`p-8 text-center ${t.textFaint} text-sm`}>
            {channelFilter === "whatsapp" ? "Sin mensajes de WhatsApp aún" : "No hay conversaciones"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Column 2: Chat Panel ── */
function ChatPanel({
  conversation, messages, onSend, sending, agentName,
}: {
  conversation: Conversation | null;
  messages: Message[];
  onSend: (text: string) => Promise<void>;
  sending: boolean;
  agentName: string;
}) {
  const [input, setInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const t = useAdminTheme();

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setShowTemplates(false);
    await onSend(text);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

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

  const isWa = conversation.channel === "whatsapp";

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: t.colors.bgCard }}>
      {/* Header */}
      <div className={`p-4 border-b ${t.border} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${t.mode === "dark" ? "bg-white/10" : "bg-gray-100"}`}>
            {channelIcons[conversation.channel]}
          </div>
          <div className="min-w-0">
            <p className={`font-medium ${t.text} truncate`}>{conversation.customerName}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[conversation.status] ?? ""}`}>
                {statusLabels[conversation.status]}
              </span>
              {isWa && (
                <span className="text-[10px] text-green-500 font-medium">📱 WhatsApp</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <select className={`${t.inputBg} border ${t.inputBorder} rounded-lg text-xs ${t.textMuted} px-2 py-1`}>
            <option>Asignar a...</option>
            {agents.filter((a) => a.role !== "soporte").map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select className={`${t.inputBg} border ${t.inputBorder} rounded-lg text-xs ${t.textMuted} px-2 py-1`}>
            <option>Estado...</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className={`text-center ${t.textFaint} text-sm py-12`}>
            {isWa ? "Sin mensajes aún. Cuando el cliente escriba aparecerán aquí." : "Sin mensajes en esta conversación."}
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
              msg.isInternal
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : msg.sender === "customer"
                  ? t.mode === "dark" ? "bg-white/5 text-white" : "bg-gray-100 text-gray-900"
                  : msg.sender === "ai"
                    ? "bg-purple-500/15 text-purple-200"
                    : `${t.accentBg} ${t.accentText}`
            }`}>
              {msg.isInternal && <p className="text-[9px] text-amber-400/60 mb-1">📝 Nota interna</p>}
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <div className="flex items-center justify-between mt-1 gap-3">
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
        <div className={`mx-4 mb-2 ${t.bgCard} border ${t.border} rounded-xl p-3 max-h-40 overflow-auto`}>
          <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>Plantillas rápidas</p>
          {templates.map((tpl) => (
            <button key={tpl.id} onClick={() => { setInput(tpl.text); setShowTemplates(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${t.textMuted} transition-colors ${t.mode === "dark" ? "hover:bg-white/5" : "hover:bg-gray-100"}`}>
              <span className={`font-medium ${t.text}`}>{tpl.name}</span>
              <span className={`text-[11px] ${t.textFaint} block truncate`}>{tpl.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={`p-4 border-t ${t.border}`}>
        {/* Agente enviando */}
        <div className={`flex items-center gap-2 mb-2`}>
          <span className={`text-[10px] ${t.textFaint}`}>Enviando como:</span>
          <span className={`text-[10px] font-medium ${t.textMuted}`}>{agentName}</span>
          {isWa && !isInternal && (
            <span className="ml-auto text-[10px] text-green-500">Enviará por WhatsApp</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(!showTemplates)}
            title="Plantillas"
            className={`p-2.5 rounded-xl text-sm transition-colors ${t.mode === "dark" ? "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70" : "bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}>
            📋
          </button>
          <button onClick={() => setIsInternal(!isInternal)}
            title="Nota interna"
            className={`p-2.5 rounded-xl text-sm transition-colors ${isInternal ? "bg-amber-500/20 text-amber-400" : t.mode === "dark" ? "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70" : "bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}>
            📝
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder={isInternal ? "Nota interna (no se envía al cliente)..." : "Escribe un mensaje... (Enter para enviar)"}
            className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-xl px-4 py-2.5 text-sm ${t.text} resize-none focus:outline-none focus:ring-2 ${t.mode === "dark" ? "placeholder-white/20" : "placeholder-gray-400"}`}
            style={{ focusRingColor: t.colors.primary } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
            style={{ backgroundColor: t.colors.primary }}>
            {sending ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Enviar"}
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
  const isWa = conversation.channel === "whatsapp";

  return (
    <div className={`w-full md:w-72 flex-shrink-0 border-l ${t.border} overflow-auto`} style={{ backgroundColor: t.colors.bgSidebar }}>
      <div className="p-4">
        {/* Avatar */}
        <div className="text-center mb-4">
          <div className={`w-16 h-16 rounded-full ${t.accentBg} flex items-center justify-center text-2xl mx-auto mb-2`}>
            {isWa && !customer ? "📱" : conversation.customerName.charAt(0).toUpperCase()}
          </div>
          <h3 className={`font-semibold text-base ${t.text}`}>{conversation.customerName}</h3>
          {isWa && (
            <a
              href={`https://wa.me/${conversation.customerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-green-500 hover:underline">
              📱 Abrir en WhatsApp
            </a>
          )}
          {customer && (
            <div className="flex justify-center gap-1 mt-2 flex-wrap">
              {customer.tags.map((tg) => {
                const tagColor: Record<string, string> = {
                  vip: "bg-yellow-500/20 text-yellow-400", frecuente: "bg-green-500/20 text-green-400",
                  riesgo: "bg-red-500/20 text-red-400", mayorista: "bg-blue-500/20 text-blue-400",
                  nuevo: "bg-purple-500/20 text-purple-400",
                };
                return (
                  <span key={tg} className={`text-[10px] px-2 py-0.5 rounded-full ${tagColor[tg] ?? `${t.mode === "dark" ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500"}`}`}>
                    {tg.toUpperCase()}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* WA contact info */}
        {isWa && !customer && (
          <div className={`${t.bgCard} rounded-xl p-3 mb-4 space-y-2`}>
            <Detail label="Teléfono" value={conversation.customerId} />
            <Detail label="Canal" value="WhatsApp Business" />
            <Detail label="Último mensaje" value={timeAgo(conversation.lastMessageAt)} />
          </div>
        )}

        {/* Customer info */}
        {customer && (
          <div className="space-y-3 mb-4">
            <div className={`${t.bgCard} rounded-xl p-3 space-y-2`}>
              <Detail label="Teléfono" value={customer.phone} />
              <Detail label="Email" value={customer.email} />
              <Detail label="Ciudad" value={customer.city} />
            </div>
            <div className={`${t.bgCard} rounded-xl p-3 space-y-2`}>
              <Detail label="Total pedidos" value={String(customer.totalOrders)} />
              <Detail label="Total gastado" value={formatCOPAdmin(customer.totalSpent)} highlight />
              <Detail label="Último pedido" value={customer.lastOrderDate} />
            </div>
            {customer.notes && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                <p className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">📝 Notas</p>
                <p className="text-xs text-amber-300/70">{customer.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Pedido vinculado */}
        {conversation.linkedOrderId && (
          <div className="mb-4">
            <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>📦 Pedido vinculado</p>
            {(() => {
              const order = adminOrders.find((o) => o.id === conversation.linkedOrderId);
              if (!order) return null;
              return (
                <div className={`${t.bgCard} rounded-xl p-3 space-y-1`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-xs ${t.textMuted}`}>{order.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="text-xs text-yellow-500 font-medium">{formatCOPAdmin(order.total)}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Historial */}
        {customerOrders.length > 0 && (
          <div className="mb-4">
            <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>📋 Historial</p>
            <div className="space-y-2">
              {customerOrders.slice(0, 3).map((o) => (
                <div key={o.id} className={`${t.bgCard} rounded-lg p-2.5 flex items-center justify-between`}>
                  <div>
                    <p className={`font-mono text-[10px] ${t.textMuted}`}>{o.id}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[o.status]}`}>{o.status}</span>
                  </div>
                  <p className="text-xs text-yellow-500">{formatCOPAdmin(o.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="space-y-2">
          <p className={`text-[10px] ${t.textFaint} uppercase tracking-wider mb-2`}>⚡ Acciones</p>
          {isWa && (
            <a href={`https://wa.me/${conversation.customerId}`} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-green-600/80 text-white text-xs py-2 rounded-lg hover:bg-green-600 transition-colors">
              Abrir chat en WhatsApp
            </a>
          )}
          <button className={`w-full ${t.accentBg} ${t.accentText} text-xs py-2 rounded-lg hover:opacity-80 transition-colors`}>
            Crear pedido
          </button>
          <button className={`w-full text-xs py-2 rounded-lg transition-colors ${t.mode === "dark" ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
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
    <div className="flex justify-between items-center gap-2">
      <span className={`text-[10px] ${t.textFaint} flex-shrink-0`}>{label}</span>
      <span className={`text-xs truncate text-right ${highlight ? "text-yellow-500 font-medium" : t.textMuted}`}>{value}</span>
    </div>
  );
}

/* ── Main Inbox Page ── */
export default function InboxPage() {
  const t = useAdminTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [mobileTab, setMobileTab] = useState<"list" | "chat" | "info">("list");

  // WhatsApp real data
  const [waConversations, setWaConversations] = useState<Conversation[]>([]);
  const [waMessages, setWaMessages]           = useState<Message[]>([]);
  const [waConnected, setWaConnected]          = useState(false);
  const [sending, setSending]                  = useState(false);

  // Agent name from localStorage
  const [agentName, setAgentName] = useState("Shelie Admin");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shelie_agent_name");
      if (saved) setAgentName(saved);
    } catch {}
  }, []);

  /* ── Fetch WA conversations ── */
  const fetchWaConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/conversations");
      if (!res.ok) return;
      const data = await res.json() as WaConvRaw[];
      if (Array.isArray(data)) {
        setWaConversations(data.map(waToConversation));
        setWaConnected(true);
      }
    } catch {}
  }, []);

  /* ── Fetch messages for selected WA conversation ── */
  const fetchWaMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/conversations?id=${convId}`);
      if (!res.ok) return;
      const data = await res.json() as { conversation: WaConvRaw; messages: WaMsgRaw[] } | null;
      if (data?.messages) {
        setWaMessages(data.messages.map(waMsgToMessage));
        // Marcar como leído
        await fetch("/api/whatsapp/conversations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: convId, action: "read" }),
        });
        setWaConversations((prev) =>
          prev.map((c) => c.id === convId ? { ...c, unread: 0 } : c)
        );
      }
    } catch {}
  }, []);

  /* ── Polling cada 5 segundos ── */
  useEffect(() => {
    fetchWaConversations();
    const interval = setInterval(fetchWaConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchWaConversations]);

  /* ── Polling de mensajes de la conv seleccionada ── */
  const selectedConvIsWa = waConversations.some((c) => c.id === selected);
  useEffect(() => {
    if (!selected || !selectedConvIsWa) return;
    fetchWaMessages(selected);
    const interval = setInterval(() => fetchWaMessages(selected), 5000);
    return () => clearInterval(interval);
  }, [selected, selectedConvIsWa, fetchWaMessages]);

  /* ── Merge: WA real primero, luego mock (otros canales) ── */
  const { conversations: convData, messagesDemo: demoMsgs } = (() => {
    // Importar conversaciones mock filtradas (sin whatsapp, ya tenemos las reales)
    const { conversations: mockConvs } = require("@/lib/admin-data");
    const filtered = (mockConvs as Conversation[]).filter((c) => c.channel !== "whatsapp");
    return { conversations: filtered, messagesDemo: [] };
  })();

  const allConversations: Conversation[] = [
    ...waConversations,
    ...convData,
  ];

  const selectedConv = allConversations.find((c) => c.id === selected) ?? null;

  // Mensajes: si es WA usamos los reales, si no el demo
  const selectedMessages: Message[] = selectedConvIsWa
    ? waMessages
    : messagesDemo.filter((m: Message) => m.conversationId === selected);

  function handleSelect(id: string) {
    setSelected(id);
    setMobileTab("chat");
    setWaMessages([]);
  }

  /* ── Seed test WA messages ── */
  async function handleSeedTest() {
    try {
      const res = await fetch("/api/whatsapp/test?force=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        await fetchWaConversations();
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Error al simular mensajes");
      }
    } catch {
      alert("Error de conexión al simular mensajes");
    }
  }

  /* ── Send handler ── */
  async function handleSend(text: string) {
    if (!selectedConv) return;

    if (selectedConv.channel === "whatsapp") {
      setSending(true);
      try {
        const res = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: selectedConv.id, text, agentName }),
        });
        if (res.ok) {
          // Optimistic update
          const newMsg: Message = {
            id: `out-${Date.now()}`,
            conversationId: selectedConv.id,
            text,
            sender: "agent",
            senderName: agentName,
            timestamp: new Date().toISOString(),
            type: "text",
            channel: "whatsapp",
          };
          setWaMessages((prev) => [...prev, newMsg]);
          setWaConversations((prev) =>
            prev.map((c) => c.id === selectedConv.id
              ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
              : c
            )
          );
        } else {
          const err = await res.json() as { error?: string };
          alert(err.error ?? "Error al enviar mensaje");
        }
      } catch {
        alert("Error de conexión al enviar mensaje");
      } finally {
        setSending(false);
      }
    }
  }

  const tabBtn = (tab: "list" | "chat" | "info", label: string, emoji: string) => (
    <button onClick={() => setMobileTab(tab)}
      className="flex-1 py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors"
      style={{
        borderBottom: mobileTab === tab ? `2px solid ${t.colors.primary}` : "2px solid transparent",
        color: mobileTab === tab ? t.colors.primary : t.colors.textMuted,
      }}>
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className={`flex flex-col h-[calc(100vh-100px)] -m-4 md:-m-6 rounded-xl overflow-hidden border ${t.border}`}>
      {/* Tabs móvil */}
      <div className={`flex md:hidden border-b ${t.border}`} style={{ backgroundColor: t.colors.bgCard }}>
        {tabBtn("list", "Chats", "💬")}
        {tabBtn("chat", "Mensaje", "✉️")}
        {tabBtn("info", "Cliente", "👤")}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Col 1 */}
        <div className={`${mobileTab === "list" ? "flex" : "hidden"} md:flex`}>
          <ConversationList
            conversations={allConversations}
            selected={selected}
            onSelect={handleSelect}
            filter={statusFilter}
            setFilter={setStatusFilter}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            waConnected={waConnected}
            onSeedTest={handleSeedTest}
          />
        </div>

        {/* Col 2 */}
        <div className={`${mobileTab === "chat" ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden`}>
          {selected && (
            <div className={`md:hidden px-4 py-2 border-b ${t.border} flex items-center gap-2`} style={{ backgroundColor: t.colors.bgCard }}>
              <button onClick={() => setMobileTab("list")} className="text-xs font-medium flex items-center gap-1" style={{ color: t.colors.primary }}>
                ← Volver
              </button>
              <span className={`text-xs ${t.textMuted}`}>{selectedConv?.customerName}</span>
            </div>
          )}
          <ChatPanel
            conversation={selectedConv}
            messages={selectedMessages}
            onSend={handleSend}
            sending={sending}
            agentName={agentName}
          />
        </div>

        {/* Col 3 */}
        <div className={`${mobileTab === "info" ? "flex" : "hidden"} md:flex flex-col overflow-hidden`}>
          <CustomerPanel conversation={selectedConv} />
        </div>
      </div>
    </div>
  );
}
