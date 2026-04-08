"use client";
import { apiUrl, agenteFetch } from "@/lib/api";
import { useState, useRef, useEffect, useCallback } from "react";
import { timeAgo, templates } from "@/lib/admin-data";
import type { Conversation, Message } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";
import Image from "next/image";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

/* ── Helpers de avatar ── */
const AVATAR_COLORS = ["#B39DDB","#80CBC4","#A5D6A7","#FFE082","#FFAB91","#CE93D8","#90CAF9","#F48FB1"];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

const statusLabels: Record<string, string> = {
  nuevo: "Nuevo", en_atencion: "En atención", espera_cliente: "Espera cliente",
  espera_equipo: "Espera equipo", cerrado: "Cerrado", convertido: "Convertido",
};
const statusDotColor: Record<string, string> = {
  nuevo: "#8696A0", en_atencion: "#00A884", espera_cliente: "#FFA726",
  espera_equipo: "#42A5F5", cerrado: "#EF5350", convertido: "#66BB6A",
};

interface WaConvRaw {
  id: string; contact_name: string; contact_phone: string;
  status: string; unread: number; last_message: string;
  last_message_at: string; assigned_to: string | null;
}
interface WaMsgRaw {
  id: string; conversation_id: string; direction: "inbound" | "outbound";
  sender_name: string; text: string; created_at: string;
}

function waToConv(wa: WaConvRaw): Conversation {
  return {
    id: wa.id, channel: "whatsapp",
    status: (wa.status as Conversation["status"]) || "nuevo",
    assignedTo: wa.assigned_to, customerId: wa.id,
    customerName: wa.contact_name || wa.contact_phone,
    tags: [], lastMessage: wa.last_message,
    lastMessageAt: wa.last_message_at,
    unread: wa.unread, isAI: false, createdAt: wa.last_message_at,
  };
}
function waMsgToMsg(m: WaMsgRaw): Message {
  return {
    id: m.id, conversationId: m.conversation_id, text: m.text,
    sender: m.direction === "inbound" ? "customer" : "agent",
    senderName: m.sender_name, timestamp: m.created_at, type: "text", channel: "whatsapp",
  };
}

/* ── Paleta estilo WhatsApp ── */
function useWA() {
  const t = useAdminTheme();
  return t.mode === "dark" ? {
    mode: "dark" as const,
    sidebarBg: "#111B21",     headerBg: "#202C33",
    chatBg: "#0B141A",
    inboundBg: "#202C33",     outboundBg: "#005C4B",
    inputAreaBg: "#202C33",   inputFieldBg: "#2A3942",
    text: "#E9EDEF",          textMuted: "#8696A0",     textFaint: "#667781",
    green: "#00A884",         border: "#222D34",
    unreadBg: "#00A884",      hoverBg: "rgba(255,255,255,0.04)",
    selectedBg: "rgba(255,255,255,0.07)",
    panelItemBg: "#182229",
    timeColor: "rgba(233,237,239,0.45)",
    checkColor: "#53BDEB",
  } : {
    mode: "light" as const,
    sidebarBg: "#FFFFFF",     headerBg: "#F0F2F5",
    chatBg: "#EFEAE2",
    inboundBg: "#FFFFFF",     outboundBg: "#D9FDD3",
    inputAreaBg: "#F0F2F5",   inputFieldBg: "#FFFFFF",
    text: "#111B21",          textMuted: "#667781",     textFaint: "#8696A0",
    green: "#25D366",         border: "#E9EDEF",
    unreadBg: "#25D366",      hoverBg: "#F5F6F6",
    selectedBg: "#F0F2F5",
    panelItemBg: "#F8F9FA",
    timeColor: "rgba(17,27,33,0.35)",
    checkColor: "#53BDEB",
  };
}

/* ═══════════════════════════════════════════
   LISTA DE CONVERSACIONES
═══════════════════════════════════════════ */
/* ── Barra de turno del agente ── */
function AgenteTurnoBar({ userId, convCount }: { userId: number; convCount: number }) {
  const wa = useWA();
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftEnded, setShiftEnded]   = useState(false);
  const [startedAt, setStartedAt]     = useState<string | null>(null);
  const [endedAt, setEndedAt]         = useState<string | null>(null);
  const [elapsed, setElapsed]         = useState("00:00:00");
  const [loading, setLoading]         = useState(false);
  const [confirmAction, setConfirmAction] = useState<"start" | "end" | null>(null);

  // Verificar estado del turno hoy al montar
  useEffect(() => {
    if (!userId) return;
    agenteFetch(apiUrl("/api/employees/sessions/today"))
      .then(r => r.json())
      .then((sessions: Array<{ user_id?: number; ended_at: string | null; started_at: string }>) => {
        const mySessions = sessions.filter((s) => Number(s.user_id) === userId);
        const active = mySessions.find((s) => !s.ended_at);
        const ended = mySessions.find((s) => !!s.ended_at);
        if (active) {
          setShiftActive(true);
          setStartedAt(active.started_at);
        } else if (ended) {
          // Ya tuvo turno hoy y lo cerró
          setShiftEnded(true);
          setStartedAt(ended.started_at);
          setEndedAt(ended.ended_at);
        }
      })
      .catch(() => {});
  }, [userId]);

  // Timer
  useEffect(() => {
    if (!shiftActive || !startedAt) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [shiftActive, startedAt]);

  async function handleStart() {
    if (!userId) return;
    setLoading(true);
    try {
      const name  = sessionStorage.getItem("agente_name") ?? "Agente";
      const email = sessionStorage.getItem("agente_email") ?? "";
      const res = await agenteFetch(apiUrl("/api/employees/sessions/start"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName: name, userEmail: email }),
      });
      if (res.ok) {
        const d = await res.json() as { started_at: string };
        setShiftActive(true); setStartedAt(d.started_at);
      }
    } catch {} finally { setLoading(false); setConfirmAction(null); }
  }

  async function handleEnd() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await agenteFetch(apiUrl("/api/employees/sessions/end"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const d = await res.json() as { ended_at?: string };
        setShiftActive(false);
        setShiftEnded(true);
        setEndedAt(d.ended_at ?? new Date().toISOString());
        setElapsed("00:00:00");
      }
    } catch {} finally { setLoading(false); setConfirmAction(null); }
  }

  function fmtTime(iso: string | null) {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }

  // Ya terminó turno hoy - solo muestra resumen
  if (shiftEnded && !shiftActive) {
    return (
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ backgroundColor: wa.headerBg, borderBottom: `1px solid ${wa.border}` }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-500" />
          <div className="min-w-0 text-[10px]" style={{ color: wa.textFaint }}>
            Turno finalizado · {fmtTime(startedAt)} → {fmtTime(endedAt)}
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: wa.mode === "dark" ? "#2A3942" : "#DFE5E7", color: wa.textFaint }}>
          Completado
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-shrink-0"
      style={{ backgroundColor: wa.headerBg, borderBottom: `1px solid ${wa.border}` }}>
      <div className="flex items-center justify-between px-3 py-2">
        {/* Estado + métricas */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${shiftActive ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
          {shiftActive ? (
            <div className="min-w-0">
              <span className="text-[11px] font-mono font-semibold" style={{ color: "#25D366" }}>{elapsed}</span>
              <span className="text-[10px] ml-2" style={{ color: wa.textFaint }}>Inicio: {fmtTime(startedAt)} · {convCount} conv</span>
            </div>
          ) : (
            <span className="text-[10px]" style={{ color: wa.textFaint }}>Sin turno activo — marca tu inicio de jornada</span>
          )}
        </div>
        {/* Botón */}
        {!confirmAction ? (
          <button onClick={() => setConfirmAction(shiftActive ? "end" : "start")}
            className="px-2.5 py-1 rounded-lg text-white text-[10px] font-semibold transition-all flex-shrink-0"
            style={{ backgroundColor: shiftActive ? "#EF5350" : "#25D366" }}>
            {shiftActive ? "Finalizar turno" : "Iniciar turno"}
          </button>
        ) : null}
      </div>

      {/* Confirmación explícita */}
      {confirmAction && (
        <div className="flex items-center gap-2 px-3 py-2 border-t"
          style={{ borderColor: wa.border, backgroundColor: confirmAction === "end" ? (wa.mode === "dark" ? "#3a1a1a" : "#fef2f2") : (wa.mode === "dark" ? "#0f2a1f" : "#f0fdf4") }}>
          <span className="text-[10px] flex-1" style={{ color: wa.text }}>
            {confirmAction === "start"
              ? `Se registrará tu inicio de turno a las ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
              : `Se registrará fin de turno a las ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
            }
          </span>
          <button onClick={() => setConfirmAction(null)}
            className="px-2 py-1 rounded text-[10px] font-medium"
            style={{ color: wa.textMuted }}>
            Cancelar
          </button>
          <button onClick={confirmAction === "start" ? handleStart : handleEnd}
            disabled={loading}
            className="px-3 py-1 rounded-lg text-white text-[10px] font-semibold disabled:opacity-50"
            style={{ backgroundColor: confirmAction === "start" ? "#25D366" : "#EF5350" }}>
            {loading ? "..." : "Confirmar"}
          </button>
        </div>
      )}
    </div>
  );
}

function ConvList({ convs, selected, onSelect, waConnected, agenteName, onLogout, agentUserId }: {
  convs: Conversation[]; selected: string | null;
  onSelect: (id: string) => void; waConnected: boolean;
  agenteName: string; onLogout: () => void; agentUserId: number;
}) {
  const wa = useWA();
  const { toggleMode, mode } = useAdminTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const filtered = convs
    .filter(c => !filter || c.status === filter)
    .filter(c => !search ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.includes(search))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div className="w-full sm:w-80 flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: wa.sidebarBg, borderRight: `1px solid ${wa.border}` }}>

      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
        style={{ backgroundColor: wa.headerBg }}>
        {/* Avatar agente */}
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: avatarColor(agenteName) }}>
          {initials(agenteName)}
        </div>
        {/* Título + estado */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: wa.text }}>Shelie&apos;s Chat</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: waConnected ? wa.green : "#FFA726" }} />
            <span className="text-[10px] truncate" style={{ color: wa.textFaint }}>
              {agenteName} · {waConnected ? "Conectado" : "Sin conexión"}
            </span>
          </div>
        </div>
        {/* Acciones — tema + logout */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Toggle tema */}
          <button onClick={toggleMode}
            title={mode === "dark" ? "Modo claro" : "Modo oscuro"}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
            style={{ color: wa.textMuted }}>
            {mode === "dark" ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 011.06-1.06l1.59 1.59a.75.75 0 01-1.06 1.061L6.166 6.166z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
          {/* Logout */}
          <button onClick={onLogout}
            title="Cerrar sesión"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
            style={{ color: wa.textMuted }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Barra de turno */}
      <AgenteTurnoBar userId={agentUserId} convCount={convs.length} />

      {/* Buscador */}
      <div className="px-3 py-2 flex-shrink-0" style={{ backgroundColor: wa.sidebarBg }}>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ backgroundColor: wa.mode === "dark" ? "#2A3942" : "#F0F2F5" }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: wa.textFaint }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversación"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: wa.text }}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
        {["", "nuevo", "en_atencion", "cerrado"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-all"
            style={{
              backgroundColor: filter === s ? wa.green : (wa.mode === "dark" ? "#2A3942" : "#F0F2F5"),
              color: filter === s ? "#fff" : wa.textMuted,
            }}>
            {s ? statusLabels[s] : "Todos"}
          </button>
        ))}
      </div>

      {/* Conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(conv => (
          <button key={conv.id} onClick={() => onSelect(conv.id)}
            className="w-full text-left transition-colors"
            style={{ backgroundColor: selected === conv.id ? wa.selectedBg : "transparent" }}
            onMouseEnter={e => { if (selected !== conv.id) (e.currentTarget as HTMLElement).style.backgroundColor = wa.hoverBg; }}
            onMouseLeave={e => { if (selected !== conv.id) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: `1px solid ${wa.border}` }}>
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: avatarColor(conv.customerName) }}>
                {initials(conv.customerName)}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate" style={{ color: wa.text }}>
                    {conv.customerName}
                  </span>
                  <span className="text-[10px] flex-shrink-0 ml-2"
                    style={{ color: conv.unread > 0 ? wa.green : wa.textFaint }}>
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusDotColor[conv.status] ?? wa.textFaint }} />
                    <span className="text-xs truncate" style={{ color: wa.textMuted }}>
                      {conv.lastMessage || "Sin mensajes"}
                    </span>
                  </div>
                  {conv.unread > 0 && (
                    <span className="ml-2 flex-shrink-0 text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center"
                      style={{ backgroundColor: wa.unreadBg }}>
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-sm" style={{ color: wa.textFaint }}>
              {waConnected
                ? (search ? "Sin resultados" : "Sin conversaciones aún")
                : "Backend no conectado"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SELECTOR DE PLANTILLAS
═══════════════════════════════════════════ */
const TPL_CATS = [
  { key: "saludo",    label: "Saludo"    },
  { key: "citas",     label: "Citas"     },
  { key: "pedidos",   label: "Pedidos"   },
  { key: "servicios", label: "Servicios" },
  { key: "productos", label: "Productos" },
  { key: "ubicacion", label: "Ubicación" },
  { key: "pagos",     label: "Pagos 💳"  },
];

function TemplatePanel({ wa, onSelectText, onSendImage }: {
  wa: ReturnType<typeof useWA>;
  onSelectText: (text: string) => void;
  onSendImage: (imageUrl: string, caption: string) => Promise<void>;
}) {
  const [cat, setCat] = useState(TPL_CATS[0].key);
  const [imgSending, setImgSending] = useState(false);
  const filtered = templates.filter(tp => tp.category === cat);

  return (
    <div className="mx-3 mb-2 rounded-2xl overflow-hidden shadow-xl"
      style={{ backgroundColor: wa.inputFieldBg, border: `1px solid ${wa.border}` }}>
      {/* Tabs categoría */}
      <div className="flex overflow-x-auto border-b"
        style={{ borderColor: wa.border, backgroundColor: wa.headerBg }}>
        {TPL_CATS.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            className="flex-shrink-0 px-3.5 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors"
            style={{
              color: cat === c.key ? wa.green : wa.textFaint,
              borderBottom: cat === c.key ? `2px solid ${wa.green}` : "2px solid transparent",
              backgroundColor: "transparent",
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="max-h-52 overflow-y-auto">
        {filtered.map(tpl => (
          <div key={tpl.id}
            className="flex items-start gap-3 px-3 py-2.5"
            style={{ borderBottom: `1px solid ${wa.border}` }}>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold mb-1" style={{ color: wa.text }}>{tpl.name}</p>
              {tpl.imageUrl
                ? <img src={tpl.imageUrl} alt={tpl.name}
                    className="w-14 h-20 object-contain rounded-lg border"
                    style={{ borderColor: wa.border }} />
                : <p className="text-[10px] line-clamp-2 leading-relaxed" style={{ color: wa.textFaint }}>
                    {tpl.text}
                  </p>
              }
            </div>
            {tpl.imageUrl ? (
              <button
                disabled={imgSending}
                onClick={async () => { setImgSending(true); await onSendImage(tpl.imageUrl!, tpl.text); setImgSending(false); }}
                className="flex-shrink-0 mt-1 text-[10px] font-semibold px-3 py-1.5 rounded-full text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: wa.green }}>
                {imgSending ? "…" : "Enviar QR"}
              </button>
            ) : (
              <button
                onClick={() => onSelectText(tpl.text)}
                className="flex-shrink-0 mt-1 text-[10px] font-semibold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: wa.green }}>
                Usar
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-[11px] py-4" style={{ color: wa.textFaint }}>
            Sin plantillas en esta categoría
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PANEL DE CHAT
═══════════════════════════════════════════ */
function ChatPanel({ conv, messages, onSend, onSendImage, sending, agenteName }: {
  conv: Conversation | null; messages: Message[];
  onSend: (text: string) => Promise<void>;
  onSendImage: (imageUrl: string, caption: string) => Promise<void>;
  sending: boolean; agenteName: string;
}) {
  const wa = useWA();
  const [input, setInput]         = useState("");
  const [showTpl, setShowTpl]     = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [panelTab, setPanelTab]   = useState<"rastrear" | "crear" | "encuesta" | "cita" | "calendario">("rastrear");
  const [surveySent, setSurveySent] = useState(false);

  // Citas
  interface ServiceOpt { id: number; title: string; price: string; }
  interface StylistOpt { id: number; name: string; }
  interface AppointmentRow { id: number; client_name: string; date: string; time_slot: string; status: string; notes: string; service_name?: string; }
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [stylists, setStylists] = useState<StylistOpt[]>([]);
  const [allAppts, setAllAppts] = useState<AppointmentRow[]>([]);
  const [citaForm, setCitaForm] = useState({ servicio: "", estilista: "", fecha: "", hora: "08:00" });
  const [citaSaving, setCitaSaving] = useState(false);
  const [citaDone, setCitaDone] = useState<string | null>(null);
  const [citaErr, setCitaErr] = useState("");
  const CITA_HOURS = ["08:00", "12:00", "16:00"];
  const CITA_HOUR_LABELS: Record<string, string> = { "08:00": "8:00 AM", "12:00": "12:00 PM", "16:00": "4:00 PM" };

  // Cargar servicios y estilistas
  useEffect(() => {
    agenteFetch(apiUrl("/api/services"))
      .then(r => r.json())
      .then((d: { data?: ServiceOpt[] } | ServiceOpt[]) => {
        const arr = Array.isArray(d) ? d : d.data ?? [];
        setServices(arr);
      }).catch(() => {});
    agenteFetch(apiUrl("/api/services/stylists/list"))
      .then(r => r.json())
      .then((d: { data?: StylistOpt[] } | StylistOpt[]) => {
        const arr = Array.isArray(d) ? d : (d as { data?: StylistOpt[] }).data ?? [];
        setStylists(arr);
      }).catch(() => {});
  }, []);

  // Cargar todas las citas para el calendario
  function loadAppointments() {
    agenteFetch(apiUrl("/api/appointments"))
      .then(r => r.json())
      .then((d: { data?: AppointmentRow[] } | AppointmentRow[]) => {
        const arr = Array.isArray(d) ? d : (d as { data?: AppointmentRow[] }).data ?? [];
        setAllAppts(arr.map(a => ({ ...a, date: a.date ? String(a.date).slice(0, 10) : "" })));
      }).catch(() => {});
  }
  useEffect(() => { loadAppointments(); }, []);

  async function handleCreateCita() {
    if (!citaForm.servicio || !citaForm.fecha || !citaForm.hora) { setCitaErr("Servicio, fecha y hora son obligatorios."); return; }
    if (!conv) return;
    setCitaSaving(true); setCitaErr(""); setCitaDone(null);
    try {
      const svc = services.find(s => s.title === citaForm.servicio);
      const res = await agenteFetch(apiUrl("/api/appointments"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: svc?.id ?? null,
          stylist_id: stylists.find(s => s.name === citaForm.estilista)?.id ?? null,
          client_name: conv.customerName, client_phone: conv.customerId, client_email: "",
          date: citaForm.fecha, time_slot: citaForm.hora,
          status: "pendiente", notes: `Servicio: ${citaForm.servicio} | Estilista: ${citaForm.estilista || "Sin preferencia"} | Agendada por agente`,
          service_name: citaForm.servicio, stylist_name: citaForm.estilista || "",
        }),
      });
      if (res.ok) {
        setCitaDone(`${citaForm.servicio} — ${citaForm.fecha} ${CITA_HOUR_LABELS[citaForm.hora]}`);
        setCitaForm({ servicio: "", estilista: "", fecha: "", hora: "08:00" });
        loadAppointments();
      } else {
        const e = await res.json() as { error?: string };
        setCitaErr(e.error ?? "Error al crear cita.");
      }
    } catch { setCitaErr("Error de conexión."); }
    finally { setCitaSaving(false); }
  }
  const messagesEnd = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [trackQ, setTrackQ]               = useState("");
  const [trackResult, setTrackResult]     = useState<Record<string, unknown> | null>(null);
  const [trackError, setTrackError]       = useState("");
  const [trackLoading, setTrackLoading]   = useState(false);

  interface OrderItem { product_id: number; name: string; price: number; qty: number; }
  interface Product { id: number; name: string; price: number; slug: string; stock: number; }

  const blankOrder = {
    client_name: "", client_phone: "", client_email: "",
    ciudad: "", barrio: "", direccion: "", indicaciones: "",
    notes: "", payment_method: "mercadopago",
  };
  const [orderForm, setOrderForm]   = useState(blankOrder);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderDone, setOrderDone]   = useState<{ order_number: string } | null>(null);
  const [orderErr, setOrderErr]     = useState("");

  // Cargar productos al montar
  useEffect(() => {
    if (productsLoaded) return;
    agenteFetch(apiUrl("/api/products"))
      .then(r => r.json())
      .then((raw: Product[] | { data: Product[] }) => {
        const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        setProducts(arr.map(p => ({ ...p, price: Number(p.price) })));
      })
      .catch(() => {})
      .finally(() => setProductsLoaded(true));
  }, [productsLoaded]);

  function addProduct(productId: number) {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const existing = orderItems.find(x => x.product_id === productId);
    if (existing) {
      setOrderItems(prev => prev.map(x => x.product_id === productId ? { ...x, qty: x.qty + 1 } : x));
    } else {
      setOrderItems(prev => [...prev, { product_id: p.id, name: p.name, price: p.price, qty: 1 }]);
    }
  }

  function removeProduct(productId: number) {
    setOrderItems(prev => prev.filter(x => x.product_id !== productId));
  }

  function updateQty(productId: number, qty: number) {
    if (qty < 1) return removeProduct(productId);
    setOrderItems(prev => prev.map(x => x.product_id === productId ? { ...x, qty } : x));
  }

  const orderSubtotal = orderItems.reduce((sum, x) => sum + x.price * x.qty, 0);
  const orderTotal = orderSubtotal;

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (conv) {
      setOrderForm(f => ({ ...f, client_name: conv.customerName ?? "", client_phone: conv.customerId ?? "" }));
      setTrackQ(conv.customerId ?? "");
      setTrackResult(null); setTrackError("");
      setOrderDone(null); setOrderErr(""); setOrderItems([]); setSurveySent(false);
    }
  }, [conv?.id]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput(""); setShowTpl(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await onSend(text);
  }

  async function handleTrack() {
    const q = trackQ.trim();
    if (!q) return;
    setTrackLoading(true); setTrackError(""); setTrackResult(null);
    try {
      const res = await agenteFetch(apiUrl(`/api/orders/track?q=${encodeURIComponent(q.toLowerCase())}`));
      if (res.ok) setTrackResult(await res.json());
      else setTrackError("Pedido no encontrado con ese dato.");
    } catch { setTrackError("Error de conexión."); }
    finally { setTrackLoading(false); }
  }

  async function handleCreateOrder() {
    if (!orderForm.client_name) { setOrderErr("El nombre del cliente es obligatorio."); return; }
    if (orderItems.length === 0) { setOrderErr("Agrega al menos un producto al pedido."); return; }
    if (!orderForm.ciudad || !orderForm.barrio || !orderForm.direccion) {
      setOrderErr("Ciudad, barrio y dirección son obligatorios."); return;
    }
    setOrderSaving(true); setOrderErr(""); setOrderDone(null);
    try {
      const items = orderItems.map(x => ({ name: x.name, qty: x.qty, price: x.price, product_id: x.product_id }));
      const address = [orderForm.direccion, orderForm.barrio, orderForm.ciudad, orderForm.indicaciones].filter(Boolean).join(" | ");
      const res = await agenteFetch(apiUrl("/api/orders"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: orderForm.client_name, client_phone: orderForm.client_phone,
          client_email: orderForm.client_email, client_address: address,
          items, subtotal: orderSubtotal, discount: 0,
          total: orderTotal, payment_method: orderForm.payment_method,
          notes: orderForm.notes, status: "nuevo",
        }),
      });
      if (res.ok) { const d = await res.json() as { order_number: string }; setOrderDone(d); setOrderForm(blankOrder); setOrderItems([]); }
      else { const e = await res.json() as { error?: string }; setOrderErr(e.error ?? "Error al crear pedido."); }
    } catch { setOrderErr("Error de conexión."); }
    finally { setOrderSaving(false); }
  }

  const orderStatusLabel: Record<string, string> = {
    nuevo: "🆕 Nuevo", procesando: "⚙️ En proceso",
    enviado: "🚚 Enviado", entregado: "✅ Entregado", cancelado: "❌ Cancelado",
  };

  /* ── Empty state ── */
  if (!conv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: wa.chatBg }}>
        <div className="w-20 h-20 rounded-full overflow-hidden"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          <Image src="/images/shelies-logo-real.jpg" alt="Shelie's" width={80} height={80}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-semibold" style={{ color: wa.text }}>Shelie&apos;s Chat</p>
          <p className="text-sm" style={{ color: wa.textMuted }}>
            Selecciona una conversación para comenzar
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full"
          style={{ backgroundColor: wa.mode === "dark" ? "#202C33" : "#DFE5E7" }}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: wa.textFaint }}>
            <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 2c4.962 0 9 4.038 9 9s-4.038 9-9 9-9-4.038-9-9 4.038-9 9-9zm-.5 4v5.5l4.5 2.7.8-1.3-4-2.4V7h-1.3z" />
          </svg>
          <span className="text-[10px]" style={{ color: wa.textFaint }}>
            Actualización cada 5 segundos
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Chat principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header del chat */}
        <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
          style={{ backgroundColor: wa.headerBg, borderBottom: `1px solid ${wa.border}` }}>
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: avatarColor(conv.customerName) }}>
            {initials(conv.customerName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: wa.text }}>
              {conv.customerName}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusDotColor[conv.status] ?? wa.textFaint }} />
              <span className="text-[10px] truncate" style={{ color: wa.textMuted }}>
                {statusLabels[conv.status]} · {conv.customerId}
              </span>
            </div>
          </div>
          {/* Acciones */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => { setShowPanel(!showPanel); setPanelTab("rastrear"); }}
              title="Rastrear pedido"
              className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-colors"
              style={{
                backgroundColor: showPanel && panelTab === "rastrear" ? wa.green + "30" : "transparent",
                color: showPanel && panelTab === "rastrear" ? wa.green : wa.textMuted,
              }}>
              📦
            </button>
            <button
              onClick={() => { setShowPanel(!showPanel); setPanelTab("crear"); }}
              title="Crear pedido"
              className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-colors"
              style={{
                backgroundColor: showPanel && panelTab === "crear" ? "#05966930" : "transparent",
                color: showPanel && panelTab === "crear" ? "#059669" : wa.textMuted,
              }}>
              ➕
            </button>
            <button
              onClick={() => { setShowPanel(!showPanel); setPanelTab("cita"); setCitaDone(null); setCitaErr(""); }}
              title="Agendar cita"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: showPanel && panelTab === "cita" ? "#3B82F630" : "transparent",
                color: showPanel && panelTab === "cita" ? "#3B82F6" : wa.textMuted,
              }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            <button
              onClick={() => { setShowPanel(!showPanel); setPanelTab("calendario"); loadAppointments(); }}
              title="Ver calendario"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: showPanel && panelTab === "calendario" ? "#F59E0B30" : "transparent",
                color: showPanel && panelTab === "calendario" ? "#F59E0B" : wa.textMuted,
              }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
            <button
              onClick={() => { setShowPanel(!showPanel); setPanelTab("encuesta"); setSurveySent(false); }}
              title="Encuesta de satisfacción"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: showPanel && panelTab === "encuesta" ? "#8B5CF630" : "transparent",
                color: showPanel && panelTab === "encuesta" ? "#8B5CF6" : wa.textMuted,
              }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </button>
            <a href={`https://wa.me/${conv.customerId}`} target="_blank" rel="noopener noreferrer"
              title="Abrir en WhatsApp"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
              style={{ color: wa.green }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.557 4.118 1.528 5.845L.057 23.736a.563.563 0 0 0 .69.69l5.904-1.47A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.003-1.37l-.36-.213-3.503.874.888-3.505-.233-.372A9.818 9.818 0 1 1 12 21.818z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 relative" style={{ backgroundColor: wa.chatBg }}>
          {/* Watermark logo — fijo en el centro del área de chat */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: wa.mode === "dark" ? 0.04 : 0.06, pointerEvents: "none", zIndex: 0 }}>
            <Image src="/images/shelies-logo-real.jpg" alt="" width={280} height={280} style={{ borderRadius: "50%" }} />
          </div>
          <div className="absolute inset-0 overflow-y-auto px-4 py-3" style={{ zIndex: 1 }}>
          {messages.length === 0 && (
            <div className="flex justify-center mt-4">
              <span className="text-[11px] px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: wa.mode === "dark" ? "#182229cc" : "#ffffffcc",
                  color: wa.textFaint,
                }}>
                🔒 Los mensajes están cifrados de extremo a extremo
              </span>
            </div>
          )}

          {(() => {
            const groups: Array<{ date: string; msgs: Message[] }> = [];
            messages.forEach(msg => {
              const d = new Date(msg.timestamp).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
              const last = groups[groups.length - 1];
              if (!last || last.date !== d) groups.push({ date: d, msgs: [msg] });
              else last.msgs.push(msg);
            });
            return groups.map(group => (
              <div key={group.date}>
                {/* Separador de fecha */}
                <div className="flex justify-center my-4">
                  <span className="text-[10px] capitalize px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: wa.mode === "dark" ? "#182229" : "#ffffffcc",
                      color: wa.textFaint,
                    }}>
                    {group.date}
                  </span>
                </div>

                {/* Burbujas */}
                {group.msgs.map((msg, i) => {
                  const isOut  = msg.sender !== "customer";
                  const prev   = group.msgs[i - 1];
                  const isFirst = !prev || prev.sender !== msg.sender;

                  return (
                    <div key={msg.id}
                      className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                      style={{ marginTop: isFirst && i > 0 ? "6px" : "2px" }}>
                      <div className="max-w-[72%]">
                        <div className="px-3 py-2 shadow-sm"
                          style={{
                            backgroundColor: isOut ? wa.outboundBg : wa.inboundBg,
                            borderRadius: isFirst
                              ? isOut ? "12px 2px 12px 12px" : "2px 12px 12px 12px"
                              : "12px",
                          }}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed"
                            style={{ color: wa.text }}>
                            {msg.text}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="text-[10px]" style={{ color: wa.timeColor }}>
                              {new Date(msg.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isOut && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 18 18" fill="none">
                                <path d="M1 9l4 4L11 5" stroke={wa.checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6 9l4 4 6-8" stroke={wa.checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
          <div ref={messagesEnd} />
        </div>
        </div>

        {/* Plantillas */}
        {showTpl && (
          <TemplatePanel
            wa={wa}
            onSelectText={text => { setInput(text); setShowTpl(false); textareaRef.current?.focus(); }}
            onSendImage={async (imageUrl, caption) => { setShowTpl(false); await onSendImage(imageUrl, caption); }}
          />
        )}

        {/* Barra de entrada */}
        <div className="flex items-end gap-2 px-3 py-2 flex-shrink-0"
          style={{ backgroundColor: wa.inputAreaBg, borderTop: `1px solid ${wa.border}` }}>

          {/* Botón plantillas */}
          <button onClick={() => setShowTpl(!showTpl)}
            title="Plantillas de respuesta"
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all text-lg"
            style={{
              backgroundColor: showTpl ? wa.green : "transparent",
              color: showTpl ? "#fff" : wa.textMuted,
            }}>
            📋
          </button>

          {/* Input */}
          <div className="flex-1 flex items-end rounded-3xl px-4 py-2.5 min-h-[42px]"
            style={{ backgroundColor: wa.inputFieldBg }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 130) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows={1}
              placeholder="Escribe un mensaje"
              className="flex-1 bg-transparent text-sm resize-none outline-none leading-5 max-h-32"
              style={{ color: wa.text, caretColor: wa.green }}
            />
          </div>

          {/* Enviar */}
          <button onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: input.trim() ? wa.green : (wa.mode === "dark" ? "#2A3942" : "#DFE5E7") }}>
            {sending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : (
                <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )
            }
          </button>
        </div>

        {/* Agente label */}
        <div className="py-1 text-center flex-shrink-0"
          style={{ backgroundColor: wa.inputAreaBg }}>
          <span className="text-[9px]" style={{ color: wa.textFaint }}>
            Enviando como <strong>{agenteName}</strong> · WhatsApp Business
          </span>
        </div>
      </div>

      {/* ═══ Panel lateral (pedidos) ═══ */}
      {showPanel && (
        <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ backgroundColor: wa.sidebarBg, borderLeft: `1px solid ${wa.border}` }}>
          {/* Tabs */}
          <div className="flex border-b flex-shrink-0"
            style={{ backgroundColor: wa.headerBg, borderColor: wa.border }}>
            <button onClick={() => setPanelTab("rastrear")}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: panelTab === "rastrear" ? wa.green : wa.textFaint,
                borderBottom: panelTab === "rastrear" ? `2px solid ${wa.green}` : "2px solid transparent",
              }}>
              📦 Rastrear
            </button>
            <button onClick={() => setPanelTab("crear")}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: panelTab === "crear" ? "#059669" : wa.textFaint,
                borderBottom: panelTab === "crear" ? "2px solid #059669" : "2px solid transparent",
              }}>
              Crear
            </button>
            <button onClick={() => { setPanelTab("cita"); setCitaDone(null); setCitaErr(""); }}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: panelTab === "cita" ? "#3B82F6" : wa.textFaint,
                borderBottom: panelTab === "cita" ? "2px solid #3B82F6" : "2px solid transparent",
              }}>
              Cita
            </button>
            <button onClick={() => { setPanelTab("calendario"); loadAppointments(); }}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: panelTab === "calendario" ? "#F59E0B" : wa.textFaint,
                borderBottom: panelTab === "calendario" ? "2px solid #F59E0B" : "2px solid transparent",
              }}>
              Agenda
            </button>
            <button onClick={() => { setPanelTab("encuesta"); setSurveySent(false); }}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: panelTab === "encuesta" ? "#8B5CF6" : wa.textFaint,
                borderBottom: panelTab === "encuesta" ? "2px solid #8B5CF6" : "2px solid transparent",
              }}>
              Encuesta
            </button>
            <button onClick={() => setShowPanel(false)}
              className="px-3 text-sm opacity-40 hover:opacity-70"
              style={{ color: wa.text }}>✕</button>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {/* ── Rastrear pedido ── */}
            {panelTab === "rastrear" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: wa.textMuted }}>
                  Buscar por N° orden, email o teléfono
                </p>
                <div className="flex gap-1">
                  <input value={trackQ}
                    onChange={e => setTrackQ(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleTrack()}
                    placeholder="ORD-123 / email / cel"
                    className="flex-1 text-xs rounded-lg px-3 py-2 outline-none border"
                    style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }} />
                  <button onClick={handleTrack} disabled={trackLoading}
                    className="px-3 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-40"
                    style={{ backgroundColor: wa.green }}>
                    {trackLoading ? "…" : "Buscar"}
                  </button>
                </div>
                {trackError && (
                  <p className="text-xs text-red-500 rounded-lg px-3 py-2"
                    style={{ backgroundColor: wa.mode === "dark" ? "#ff000020" : "#fff5f5" }}>
                    {trackError}
                  </p>
                )}
                {trackResult && (() => {
                  const o = trackResult;
                  return (
                    <div className="rounded-xl border p-3 space-y-2 text-xs"
                      style={{ borderColor: wa.border, backgroundColor: wa.panelItemBg }}>
                      <p className="font-bold text-sm" style={{ color: wa.text }}>📦 {String(o.order_number)}</p>
                      <p style={{ color: wa.textMuted }}>
                        Estado: <span className="font-semibold">{orderStatusLabel[String(o.status)] ?? String(o.status)}</span>
                      </p>
                      <p style={{ color: wa.textMuted }}>
                        Cliente: <span className="font-medium" style={{ color: wa.text }}>{String(o.client_name)}</span>
                      </p>
                      <p style={{ color: wa.textMuted }}>
                        Total: <span className="font-semibold text-emerald-500">{fmtCOP(Number(o.total))}</span>
                      </p>
                      {String(o.tracking_code ?? "") && (
                        <p style={{ color: wa.textMuted }}>Guía: <span className="font-mono">{String(o.tracking_code)}</span></p>
                      )}
                      <button
                        onClick={() => onSend(`📦 Pedido ${o.order_number}\nEstado: ${orderStatusLabel[String(o.status)] ?? String(o.status)}\nTotal: ${fmtCOP(Number(o.total))}`)}
                        className="w-full text-xs py-2 rounded-xl text-white font-semibold"
                        style={{ backgroundColor: wa.green }}>
                        Enviar info al cliente
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Crear pedido ── */}
            {/* ── Agendar cita ── */}
            {panelTab === "cita" && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold" style={{ color: wa.textMuted }}>Agendar cita para el cliente</p>

                {citaDone ? (
                  <div className="rounded-xl p-3 text-xs space-y-1.5"
                    style={{ backgroundColor: wa.mode === "dark" ? "#3B82F620" : "#EFF6FF", border: "1px solid #3B82F6aa" }}>
                    <p className="font-bold" style={{ color: "#3B82F6" }}>Cita agendada</p>
                    <p style={{ color: wa.textMuted }}>{citaDone}</p>
                    <button
                      onClick={() => onSend(`Tu cita ha sido agendada:\n${citaDone}\n\nTe esperamos en Shelie's Hair Studio.`)}
                      className="w-full py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: wa.green }}>
                      Enviar confirmación al cliente
                    </button>
                    <button onClick={() => setCitaDone(null)}
                      className="w-full py-1 text-xs hover:underline" style={{ color: "#3B82F6" }}>
                      Agendar otra
                    </button>
                  </div>
                ) : (
                  <>
                    {citaErr && (
                      <p className="text-xs text-red-500 rounded-lg px-3 py-2"
                        style={{ backgroundColor: wa.mode === "dark" ? "#ff000020" : "#fff5f5" }}>
                        {citaErr}
                      </p>
                    )}
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>Servicio *</label>
                      <select value={citaForm.servicio}
                        onChange={e => setCitaForm(f => ({ ...f, servicio: e.target.value }))}
                        className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none"
                        style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }}>
                        <option value="">Seleccionar servicio...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.title}>{s.title} — {fmtCOP(Number(s.price))}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>Estilista</label>
                      <select value={citaForm.estilista}
                        onChange={e => setCitaForm(f => ({ ...f, estilista: e.target.value }))}
                        className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none"
                        style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }}>
                        <option value="">Sin preferencia</option>
                        {stylists.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>Fecha *</label>
                      <input type="date" value={citaForm.fecha}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={e => setCitaForm(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none"
                        style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>Hora *</label>
                      <div className="flex gap-1.5">
                        {CITA_HOURS.map(h => {
                          const isOccupied = allAppts.some(a => a.date === citaForm.fecha && a.time_slot === h && a.status !== "cancelado");
                          return (
                            <button key={h} onClick={() => !isOccupied && setCitaForm(f => ({ ...f, hora: h }))}
                              disabled={isOccupied}
                              className="flex-1 py-2 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30"
                              style={{
                                backgroundColor: citaForm.hora === h ? "#3B82F6" : (wa.mode === "dark" ? "#2A3942" : "#F3F4F6"),
                                color: citaForm.hora === h ? "#fff" : wa.text,
                                border: citaForm.hora === h ? "2px solid #3B82F6" : `1px solid ${wa.border}`,
                              }}>
                              {CITA_HOUR_LABELS[h]}
                              {isOccupied && <span className="block text-[8px]" style={{ color: "#EF4444" }}>Ocupado</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Info de cliente */}
                    <div className="rounded-lg p-2 text-[10px]" style={{ backgroundColor: wa.panelItemBg }}>
                      <p style={{ color: wa.textFaint }}>Cliente:</p>
                      <p className="font-semibold" style={{ color: wa.text }}>{conv?.customerName ?? "—"}</p>
                      <p style={{ color: wa.textFaint }}>{conv?.customerId ?? ""}</p>
                    </div>
                    <button onClick={handleCreateCita} disabled={citaSaving || !citaForm.servicio || !citaForm.fecha}
                      className="w-full py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40"
                      style={{ backgroundColor: "#3B82F6" }}>
                      {citaSaving ? "Agendando…" : "Agendar cita"}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Calendario / Agenda ── */}
            {panelTab === "calendario" && (() => {
              const today = new Date().toISOString().slice(0, 10);
              // Agrupar por fecha los próximos 7 días
              const days: string[] = [];
              for (let i = 0; i < 7; i++) {
                const d = new Date(); d.setDate(d.getDate() + i);
                days.push(d.toISOString().slice(0, 10));
              }
              const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
              return (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: wa.textMuted }}>Agenda — Próximos 7 días</p>
                  {days.map(day => {
                    const dayAppts = allAppts.filter(a => a.date === day && a.status !== "cancelado");
                    const d = new Date(day + "T12:00:00");
                    const label = day === today ? "Hoy" : `${dayNames[d.getDay()]} ${d.getDate()}`;
                    return (
                      <div key={day}>
                        <p className="text-[10px] font-semibold mb-1 mt-1" style={{ color: wa.text }}>
                          {label}
                          <span className="ml-1 font-normal" style={{ color: wa.textFaint }}>
                            ({dayAppts.length} cita{dayAppts.length !== 1 ? "s" : ""})
                          </span>
                        </p>
                        {/* Slots */}
                        <div className="space-y-1">
                          {CITA_HOURS.map(h => {
                            const slotAppts = dayAppts.filter(a => a.time_slot === h);
                            const free = slotAppts.length === 0;
                            return (
                              <div key={h} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px]"
                                style={{ backgroundColor: free ? (wa.mode === "dark" ? "#0f2a1f" : "#F0FDF4") : wa.panelItemBg }}>
                                <span className="font-mono font-semibold w-12" style={{ color: wa.textMuted }}>{CITA_HOUR_LABELS[h]}</span>
                                {free ? (
                                  <span style={{ color: "#16A34A" }} className="font-medium">Disponible</span>
                                ) : (
                                  <div className="flex-1 min-w-0">
                                    {slotAppts.map(a => (
                                      <p key={a.id} className="truncate" style={{ color: wa.text }}>
                                        {a.client_name} {a.notes ? `· ${a.notes.split("|")[0]?.trim()}` : ""}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── Encuesta de satisfacción ── */}
            {panelTab === "encuesta" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold" style={{ color: wa.textMuted }}>Encuesta de satisfacción</p>

                {surveySent ? (
                  <div className="rounded-xl p-3 text-xs space-y-1.5"
                    style={{ backgroundColor: wa.mode === "dark" ? "#8B5CF620" : "#F5F3FF", border: "1px solid #8B5CF6aa" }}>
                    <p className="font-bold" style={{ color: "#8B5CF6" }}>Encuesta enviada</p>
                    <p style={{ color: wa.textMuted }}>El cliente recibirá el mensaje con el enlace de la encuesta.</p>
                    <button onClick={() => setSurveySent(false)}
                      className="w-full py-1 text-xs hover:underline" style={{ color: "#8B5CF6" }}>
                      Enviar otra
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] leading-relaxed" style={{ color: wa.textFaint }}>
                      Envía una encuesta rápida al cliente para evaluar la atención recibida. El mensaje se envía por WhatsApp.
                    </p>

                    {/* Preview del mensaje */}
                    <div className="rounded-xl p-3 text-xs space-y-2"
                      style={{ backgroundColor: wa.panelItemBg, border: `1px solid ${wa.border}` }}>
                      <p className="font-semibold text-[11px]" style={{ color: wa.text }}>Vista previa del mensaje:</p>
                      <div className="rounded-lg p-2.5 text-[11px] leading-relaxed"
                        style={{ backgroundColor: wa.mode === "dark" ? "#005C4B" : "#D9FDD3", color: wa.text }}>
                        <p style={{ margin: 0 }}>Hola {conv?.customerName?.split(" ")[0] ?? ""},</p>
                        <p style={{ margin: "6px 0 0" }}>Queremos saber cómo fue tu experiencia con nosotros. Tu opinión nos ayuda a mejorar.</p>
                        <p style={{ margin: "8px 0 2px", fontWeight: 600 }}>Califica tu atención:</p>
                        <p style={{ margin: 0 }}>1 - Muy mala</p>
                        <p style={{ margin: 0 }}>2 - Mala</p>
                        <p style={{ margin: 0 }}>3 - Regular</p>
                        <p style={{ margin: 0 }}>4 - Buena</p>
                        <p style={{ margin: 0 }}>5 - Excelente</p>
                        <p style={{ margin: "8px 0 0" }}>Responde con el número del 1 al 5. Gracias por confiar en Shelie&apos;s Hair Studio.</p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const surveyMsg = `Hola ${conv?.customerName?.split(" ")[0] ?? ""},\n\nQueremos saber cómo fue tu experiencia con nosotros. Tu opinión nos ayuda a mejorar.\n\n*Califica tu atención:*\n1 - Muy mala\n2 - Mala\n3 - Regular\n4 - Buena\n5 - Excelente\n\nResponde con el número del 1 al 5. Gracias por confiar en *Shelie's Hair Studio*.`;
                        await onSend(surveyMsg);
                        setSurveySent(true);
                      }}
                      disabled={sending}
                      className="w-full py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40"
                      style={{ backgroundColor: "#8B5CF6" }}>
                      {sending ? "Enviando…" : "Enviar encuesta al cliente"}
                    </button>
                  </>
                )}
              </div>
            )}

            {panelTab === "crear" && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold" style={{ color: wa.textMuted }}>Nuevo pedido manual</p>

                {orderDone && (
                  <div className="rounded-xl p-3 text-xs space-y-1.5"
                    style={{ backgroundColor: wa.mode === "dark" ? "#05966920" : "#f0fdf4", border: "1px solid #059669aa" }}>
                    <p className="font-bold" style={{ color: "#059669" }}>✅ Pedido creado</p>
                    <p style={{ color: wa.textMuted }}>N°: <span className="font-mono font-bold" style={{ color: wa.text }}>{orderDone.order_number}</span></p>
                    <button
                      onClick={() => onSend(`✅ Tu pedido fue registrado.\nN° de orden: ${orderDone.order_number}\nTe invitamos a visitar nuestra página web: https://shelies.asf.company`)}
                      className="w-full py-1.5 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: wa.green }}>
                      Enviar confirmación al cliente
                    </button>
                    <button onClick={() => setOrderDone(null)}
                      className="w-full py-1 text-xs hover:underline"
                      style={{ color: "#059669" }}>
                      Crear otro
                    </button>
                  </div>
                )}

                {!orderDone && (
                  <>
                    {orderErr && (
                      <p className="text-xs text-red-500 rounded-lg px-3 py-2"
                        style={{ backgroundColor: wa.mode === "dark" ? "#ff000020" : "#fff5f5" }}>
                        {orderErr}
                      </p>
                    )}

                    {/* ── Cliente ── */}
                    {(["client_name", "client_phone", "client_email"] as const).map(f => (
                      <div key={f}>
                        <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>
                          {f === "client_name" ? "Nombre *" : f === "client_phone" ? "Teléfono" : "Email"}
                        </label>
                        <input value={orderForm[f]}
                          onChange={e => setOrderForm(p => ({ ...p, [f]: e.target.value }))}
                          className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none"
                          style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }} />
                      </div>
                    ))}

                    {/* ── Dirección (obligatorio) ── */}
                    <div className="pt-1 border-t" style={{ borderColor: wa.border }}>
                      <p className="text-[10px] font-semibold mb-1.5" style={{ color: wa.textMuted }}>Dirección de envío *</p>
                      {(["ciudad", "barrio", "direccion", "indicaciones"] as const).map(f => (
                        <div key={f} className="mb-1.5">
                          <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>
                            {f === "ciudad" ? "Ciudad *" : f === "barrio" ? "Barrio *" : f === "direccion" ? "Dirección *" : "Indicaciones adicionales"}
                          </label>
                          {f === "indicaciones" ? (
                            <textarea rows={1} value={orderForm[f]}
                              onChange={e => setOrderForm(p => ({ ...p, [f]: e.target.value }))}
                              placeholder="Ej: casa azul, timbre no funciona"
                              className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none resize-none"
                              style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }} />
                          ) : (
                            <input value={orderForm[f]}
                              onChange={e => setOrderForm(p => ({ ...p, [f]: e.target.value }))}
                              placeholder={f === "ciudad" ? "Bogotá" : f === "barrio" ? "Chapinero" : "Cra 10 #45-60"}
                              className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none"
                              style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* ── Productos ── */}
                    <div className="pt-1 border-t" style={{ borderColor: wa.border }}>
                      <p className="text-[10px] font-semibold mb-1.5" style={{ color: wa.textMuted }}>Productos *</p>
                      <select
                        value=""
                        onChange={e => { const id = parseInt(e.target.value); if (id) addProduct(id); }}
                        className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none mb-2"
                        style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }}>
                        <option value="">Seleccionar producto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — {fmtCOP(p.price)}</option>
                        ))}
                      </select>

                      {orderItems.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {orderItems.map(item => (
                            <div key={item.product_id} className="flex items-center gap-1.5 rounded-lg p-1.5"
                              style={{ backgroundColor: wa.panelItemBg }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-medium truncate" style={{ color: wa.text }}>{item.name}</p>
                                <p className="text-[9px]" style={{ color: wa.textFaint }}>{fmtCOP(item.price)} c/u</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => updateQty(item.product_id, item.qty - 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                                  style={{ backgroundColor: wa.border, color: wa.text }}>−</button>
                                <span className="text-[10px] font-semibold w-4 text-center" style={{ color: wa.text }}>{item.qty}</span>
                                <button onClick={() => updateQty(item.product_id, item.qty + 1)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                                  style={{ backgroundColor: wa.border, color: wa.text }}>+</button>
                                <button onClick={() => removeProduct(item.product_id)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] ml-1"
                                  style={{ color: "#EF5350" }}>✕</button>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] font-semibold" style={{ color: wa.textMuted }}>Total:</span>
                            <span className="text-xs font-bold" style={{ color: "#059669" }}>{fmtCOP(orderTotal)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Pago y notas ── */}
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>Método de pago</label>
                      <select value={orderForm.payment_method}
                        onChange={e => setOrderForm(p => ({ ...p, payment_method: e.target.value }))}
                        className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none"
                        style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }}>
                        <option value="mercadopago">MercadoPago</option>
                        <option value="nequi">Nequi</option>
                        <option value="daviplata">Daviplata</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="contraentrega">Contraentrega</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: wa.textFaint }}>Notas</label>
                      <textarea rows={2} value={orderForm.notes}
                        onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Instrucciones especiales..."
                        className="w-full text-xs border rounded-lg px-3 py-1.5 outline-none resize-none"
                        style={{ backgroundColor: wa.inputFieldBg, borderColor: wa.border, color: wa.text }} />
                    </div>
                    <button onClick={handleCreateOrder} disabled={orderSaving || orderItems.length === 0}
                      className="w-full py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40"
                      style={{ backgroundColor: "#059669" }}>
                      {orderSaving ? "Creando…" : `Crear pedido — ${fmtCOP(orderTotal)}`}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════ */
export default function AgentePage() {
  const wa = useWA();
  const [convs, setConvs]       = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending]   = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [agenteName, setAgenteName]     = useState("Agente");
  const [agentUserId, setAgentUserId]   = useState(0);
  const [mobileView, setMobileView]     = useState<"list" | "chat">("list");

  useEffect(() => {
    try {
      const n = localStorage.getItem("shelie_agent_name") ?? sessionStorage.getItem("agente_name");
      if (n) setAgenteName(n);
      const uid = parseInt(sessionStorage.getItem("agente_user_id") ?? "0");
      if (uid) setAgentUserId(uid);
    } catch {}
  }, []);

  function handleLogout() {
    try {
      // No cerramos el turno automáticamente — el agente debe marcarlo manualmente
      sessionStorage.removeItem("agente_auth");
      sessionStorage.removeItem("agente_name");
      sessionStorage.removeItem("agente_user_id");
      sessionStorage.removeItem("agente_email");
      localStorage.removeItem("shelie_agent_name");
    } catch {}
    window.location.reload();
  }

  const fetchConvs = useCallback(async () => {
    try {
      const res = await agenteFetch(apiUrl("/api/whatsapp/conversations"));
      if (!res.ok) return;
      const data = await res.json() as WaConvRaw[];
      if (Array.isArray(data)) { setConvs(data.map(waToConv)); setWaConnected(true); }
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await agenteFetch(apiUrl(`/api/whatsapp/conversations?id=${convId}`));
      if (!res.ok) return;
      const data = await res.json() as { conversation: WaConvRaw; messages: WaMsgRaw[] } | null;
      if (data?.messages) {
        setMessages(data.messages.map(waMsgToMsg));
        await agenteFetch(apiUrl("/api/whatsapp/conversations"), {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: convId, action: "read" }),
        });
        setConvs(prev => prev.map(c => c.id === convId ? { ...c, unread: 0 } : c));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchConvs();
    const iv = setInterval(fetchConvs, 5000);
    return () => clearInterval(iv);
  }, [fetchConvs]);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected);
    const iv = setInterval(() => fetchMessages(selected), 5000);
    return () => clearInterval(iv);
  }, [selected, fetchMessages]);

  function handleSelect(id: string) { setSelected(id); setMessages([]); setMobileView("chat"); }

  async function handleSend(text: string) {
    if (!selected) return;
    setSending(true);
    try {
      const res = await agenteFetch(apiUrl("/api/whatsapp/send"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selected, text, agentName: agenteName }),
      });
      if (res.ok) {
        const newMsg: Message = {
          id: `out-${Date.now()}`, conversationId: selected, text,
          sender: "agent", senderName: agenteName,
          timestamp: new Date().toISOString(), type: "text", channel: "whatsapp",
        };
        setMessages(prev => [...prev, newMsg]);
        setConvs(prev => prev.map(c => c.id === selected
          ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() } : c));
      } else {
        const err = await res.json() as { error?: string };
        alert(err.error ?? "Error al enviar");
      }
    } catch { alert("Error de conexión"); }
    finally { setSending(false); }
  }

  async function handleSendImage(imageUrl: string, caption: string) {
    if (!selected) return;
    setSending(true);
    try {
      const fullImageUrl = typeof window !== "undefined"
        ? `${window.location.origin}${imageUrl}` : imageUrl;
      const res = await agenteFetch(apiUrl("/api/whatsapp/send"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selected, imageUrl: fullImageUrl, text: caption, agentName: agenteName }),
      });
      if (res.ok) {
        const newMsg: Message = {
          id: `out-${Date.now()}`, conversationId: selected, text: `📷 ${caption}`,
          sender: "agent", senderName: agenteName,
          timestamp: new Date().toISOString(), type: "text", channel: "whatsapp",
        };
        setMessages(prev => [...prev, newMsg]);
        setConvs(prev => prev.map(c => c.id === selected
          ? { ...c, lastMessage: `📷 ${caption}`, lastMessageAt: new Date().toISOString() } : c));
      } else {
        const err = await res.json() as { error?: string };
        alert(err.error ?? "Error al enviar imagen");
      }
    } catch { alert("Error de conexión"); }
    finally { setSending(false); }
  }

  const selectedConv = convs.find(c => c.id === selected) ?? null;

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: wa.chatBg }}>
      {/* Mobile nav */}
      {selected && (
        <div className="sm:hidden w-full absolute top-0 left-0 z-20 flex border-b"
          style={{ backgroundColor: wa.headerBg, borderColor: wa.border }}>
          <button onClick={() => setMobileView("list")}
            className="flex-1 py-2.5 text-xs font-semibold"
            style={{ color: mobileView === "list" ? wa.green : wa.textMuted }}>
            ← Chats
          </button>
          <button onClick={() => setMobileView("chat")}
            className="flex-1 py-2.5 text-xs font-semibold"
            style={{ color: mobileView === "chat" ? wa.green : wa.textMuted }}>
            Chat →
          </button>
        </div>
      )}

      <div className={`${mobileView === "list" ? "flex" : "hidden"} sm:flex h-full`}>
        <ConvList convs={convs} selected={selected} onSelect={handleSelect} waConnected={waConnected} agenteName={agenteName} onLogout={handleLogout} agentUserId={agentUserId} />
      </div>
      <div className={`${mobileView === "chat" ? "flex" : "hidden"} sm:flex flex-1 overflow-hidden`}>
        <ChatPanel
          conv={selectedConv}
          messages={messages}
          onSend={handleSend}
          onSendImage={handleSendImage}
          sending={sending}
          agenteName={agenteName}
        />
      </div>
    </div>
  );
}
