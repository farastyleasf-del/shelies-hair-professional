"use client";
import { apiUrl, authedFetch } from "@/lib/api";
import { useState, useRef, useEffect, useCallback } from "react";
import { products } from "@/lib/data";
import {
  templates,
  formatCOPAdmin, timeAgo, channelIcons, statusColors,
} from "@/lib/admin-data";
import type { Conversation, Message } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";

/* ═══════════════════════════════════════════════════════
   INBOX — WhatsApp real + cotizaciones + pedidos
   ═══════════════════════════════════════════════════════ */

const statusLabels: Record<string, string> = {
  nuevo: "Nuevo", en_atencion: "En atención", espera_cliente: "Espera cliente",
  espera_equipo: "Espera equipo", cerrado: "Cerrado", convertido: "Convertido",
};

/* ── Tipos WA raw ── */
interface WaConvRaw {
  id: string; contact_name: string; contact_phone: string;
  status: string; unread: number; last_message: string;
  last_message_at: string; assigned_to: string | null;
}
interface WaMsgRaw {
  id: string; conversation_id: string; direction: "inbound" | "outbound";
  sender_name: string; text: string; created_at: string;
}

/* ── Tipos cotización ── */
interface QuoteItem { name: string; description?: string; qty: number; price: number; type: "service" | "product" | "custom" }
interface Quote {
  id: number; quote_number: string; conversation_id: string | null;
  client_name: string; client_phone: string;
  items: QuoteItem[]; subtotal: number; discount: number; total: number;
  notes: string; status: string; created_by: string; created_at: string;
}

/* ── Tipos servicio (API) ── */
interface ApiService { id: number; title: string; price: number | null; icon: string | null; duration: string | null }

function waToConversation(wa: WaConvRaw): Conversation {
  return {
    id: wa.id, channel: "whatsapp",
    status: (wa.status as Conversation["status"]) || "nuevo",
    assignedTo: wa.assigned_to, customerId: wa.id,
    customerName: wa.contact_name || wa.contact_phone,
    tags: [], lastMessage: wa.last_message, lastMessageAt: wa.last_message_at,
    unread: wa.unread, isAI: false, createdAt: wa.last_message_at,
  };
}
function waMsgToMessage(m: WaMsgRaw): Message {
  return {
    id: m.id, conversationId: m.conversation_id, text: m.text,
    sender: m.direction === "inbound" ? "customer" : "agent",
    senderName: m.sender_name, timestamp: m.created_at, type: "text", channel: "whatsapp",
  };
}
function formatCOP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

/* ══════════════════════════════════════════════════════════
   MODAL COTIZACIÓN
   ══════════════════════════════════════════════════════════ */
function QuoteModal({
  conv, agentName, onSend, onClose,
}: {
  conv: Conversation;
  agentName: string;
  onSend: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useAdminTheme();
  const [services, setServices]   = useState<ApiService[]>([]);
  const [items, setItems]         = useState<QuoteItem[]>([]);
  const [discount, setDiscount]   = useState(0);
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [sendWa, setSendWa]       = useState(true);
  const [success, setSuccess]     = useState(false);
  const [tab, setTab]             = useState<"services" | "products" | "custom">("services");

  useEffect(() => {
    authedFetch(apiUrl("/api/services"))
      .then((r) => r.json())
      .then((d: { success: boolean; data: ApiService[] }) => { if (d.data) setServices(d.data); })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = Math.max(0, subtotal - discount);

  function addService(svc: ApiService) {
    if (items.some((i) => i.name === svc.title && i.type === "service")) return;
    setItems((prev) => [...prev, { name: svc.title, qty: 1, price: svc.price ?? 0, type: "service", description: svc.duration ?? "" }]);
  }
  function addProduct(p: typeof products[0]) {
    if (items.some((i) => i.name === p.name && i.type === "product")) return;
    setItems((prev) => [...prev, { name: p.name, qty: 1, price: p.price, type: "product" }]);
  }
  function addCustom() {
    setItems((prev) => [...prev, { name: "Item personalizado", qty: 1, price: 0, type: "custom" }]);
  }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof QuoteItem, value: string | number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  async function handleSave(sendWhatsapp: boolean) {
    if (!items.length) return;
    setSaving(true);
    try {
      const res = await authedFetch(apiUrl("/api/quotes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conv.id,
          client_name: conv.customerName,
          client_phone: conv.customerId,
          items, subtotal, discount, total, notes,
          created_by: agentName,
          send_whatsapp: sendWhatsapp,
        }),
      });
      if (!res.ok) { const e = await res.json() as { error?: string }; alert(e.error ?? "Error"); setSaving(false); return; }
      const q = await res.json() as Quote;

      if (sendWhatsapp) {
        // Optimistic update in chat
        const lines = items.map((i) => `• ${i.name} × ${i.qty} — ${formatCOP(i.price)}`).join("\n");
        const waText =
          `📋 *COTIZACIÓN SHELIE'S*\n🔖 ${q.quote_number}\n━━━━━━━━━━━━━━━━━━━\n` +
          `${lines}${discount > 0 ? `\n💸 Descuento: -${formatCOP(discount)}` : ""}\n━━━━━━━━━━━━━━━━━━━\n` +
          `💰 *Total: ${formatCOP(total)}*\n${notes ? `\n📝 ${notes}\n` : ""}\n` +
          `⏰ Válida por 48 horas\n💬 Responde para reservar\n\n_Shelie's Siempre Bellas_ ✨`;
        await onSend(waText);
      }
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full sm:max-w-2xl max-h-[95vh] overflow-auto rounded-t-3xl sm:rounded-3xl flex flex-col`}
        style={{ backgroundColor: t.colors.bgCard }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: t.colors.border }}>
          <div>
            <h2 className="font-poppins font-bold text-lg" style={{ color: t.colors.text }}>📋 Nueva Cotización</h2>
            <p className="text-xs mt-0.5" style={{ color: t.colors.textMuted }}>Para: {conv.customerName}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: t.colors.textFaint }}>✕</button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
            {(["services","products","custom"] as const).map((tb) => (
              <button key={tb} onClick={() => setTab(tb)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: tab === tb ? t.colors.primary : "transparent",
                  color: tab === tb ? "#fff" : t.colors.textMuted,
                }}>
                {tb === "services" ? "💆 Servicios" : tb === "products" ? "📦 Productos" : "✏️ Manual"}
              </button>
            ))}
          </div>

          {/* Servicios */}
          {tab === "services" && (
            <div className="grid grid-cols-2 gap-2">
              {services.length === 0 && (
                <p className="col-span-2 text-center text-xs py-6" style={{ color: t.colors.textFaint }}>
                  Cargando servicios… (requiere backend)
                </p>
              )}
              {services.map((svc) => (
                <button key={svc.id} onClick={() => addService(svc)}
                  className="text-left p-3 rounded-xl border transition-all hover:opacity-80"
                  style={{
                    borderColor: items.some((i) => i.name === svc.title) ? t.colors.primary : t.colors.border,
                    backgroundColor: items.some((i) => i.name === svc.title) ? t.colors.primary + "15" : "transparent",
                  }}>
                  <p className="text-sm font-medium" style={{ color: t.colors.text }}>{svc.icon} {svc.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: t.colors.textFaint }}>
                    {svc.price ? formatCOP(svc.price) : "Precio a convenir"} {svc.duration ? `· ${svc.duration}` : ""}
                  </p>
                </button>
              ))}
              {/* Servicios hardcoded de respaldo si no hay API */}
              {services.length === 0 && [
                { id: -1, title: "Alisado Orgánico", price: 150000, icon: "✨", duration: "3-4h" },
                { id: -2, title: "Hidratación Profunda", price: 80000, icon: "💧", duration: "1h" },
                { id: -3, title: "Corte de puntas", price: 30000, icon: "✂️", duration: "30min" },
                { id: -4, title: "Tinte vegetal", price: 120000, icon: "🌿", duration: "2h" },
                { id: -5, title: "Manicure", price: 25000, icon: "💅", duration: "45min" },
                { id: -6, title: "Pedicure", price: 35000, icon: "🦶", duration: "1h" },
              ].map((svc) => (
                <button key={svc.id} onClick={() => addService(svc as ApiService)}
                  className="text-left p-3 rounded-xl border transition-all hover:opacity-80"
                  style={{
                    borderColor: items.some((i) => i.name === svc.title) ? t.colors.primary : t.colors.border,
                    backgroundColor: items.some((i) => i.name === svc.title) ? t.colors.primary + "15" : "transparent",
                  }}>
                  <p className="text-sm font-medium" style={{ color: t.colors.text }}>{svc.icon} {svc.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: t.colors.textFaint }}>{formatCOP(svc.price)} · {svc.duration}</p>
                </button>
              ))}
            </div>
          )}

          {/* Productos */}
          {tab === "products" && (
            <div className="grid grid-cols-2 gap-2">
              {products.slice(0, 12).map((p) => (
                <button key={p.id} onClick={() => addProduct(p)}
                  className="text-left p-3 rounded-xl border transition-all hover:opacity-80"
                  style={{
                    borderColor: items.some((i) => i.name === p.name) ? t.colors.primary : t.colors.border,
                    backgroundColor: items.some((i) => i.name === p.name) ? t.colors.primary + "15" : "transparent",
                  }}>
                  <p className="text-xs font-medium" style={{ color: t.colors.text }}>{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: t.colors.textFaint }}>{formatCOP(p.price)}</p>
                </button>
              ))}
            </div>
          )}

          {/* Custom */}
          {tab === "custom" && (
            <button onClick={addCustom}
              className="w-full py-3 rounded-xl border border-dashed text-sm font-medium transition-colors hover:opacity-80"
              style={{ borderColor: t.colors.border, color: t.colors.textMuted }}>
              + Agregar línea personalizada
            </button>
          )}

          {/* Items seleccionados */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.colors.textFaint }}>Ítems seleccionados</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center p-3 rounded-xl" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f9f9f9" }}>
                  <div className="flex-1 min-w-0">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className="w-full text-sm font-medium bg-transparent focus:outline-none"
                      style={{ color: t.colors.text }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs" style={{ color: t.colors.textFaint }}>×</span>
                    <input type="number" min={1} value={item.qty}
                      onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 1)}
                      className="w-10 text-center text-xs rounded-lg border py-1 bg-transparent focus:outline-none"
                      style={{ borderColor: t.colors.border, color: t.colors.text }}
                    />
                    <span className="text-xs" style={{ color: t.colors.textFaint }}>$</span>
                    <input type="number" min={0} value={item.price}
                      onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right text-xs rounded-lg border py-1 px-2 bg-transparent focus:outline-none"
                      style={{ borderColor: t.colors.border, color: t.colors.text }}
                    />
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm pl-1">✕</button>
                  </div>
                </div>
              ))}

              {/* Descuento + notas */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: t.colors.textFaint }}>Descuento ($)</label>
                  <input type="number" min={0} value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 text-sm rounded-xl border px-3 py-2 bg-transparent focus:outline-none"
                    style={{ borderColor: t.colors.border, color: t.colors.text }}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: t.colors.textFaint }}>Notas</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condiciones, vigencia..."
                    className="w-full mt-1 text-sm rounded-xl border px-3 py-2 bg-transparent focus:outline-none"
                    style={{ borderColor: t.colors.border, color: t.colors.text }}
                  />
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl p-4" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f3f4f6" }}>
                {discount > 0 && (
                  <div className="flex justify-between text-xs mb-1" style={{ color: t.colors.textMuted }}>
                    <span>Subtotal</span><span>{formatCOP(subtotal)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-xs mb-1 text-green-500">
                    <span>Descuento</span><span>-{formatCOP(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-poppins font-bold text-base">
                  <span style={{ color: t.colors.text }}>Total</span>
                  <span style={{ color: t.colors.primary }}>{formatCOP(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t space-y-2" style={{ borderColor: t.colors.border }}>
          {success ? (
            <div className="w-full py-3 rounded-xl bg-green-500/15 text-green-500 text-sm font-medium text-center">
              ✅ Cotización guardada exitosamente
            </div>
          ) : (
            <>
              <button onClick={() => handleSave(true)} disabled={!items.length || saving}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: t.colors.primary }}>
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : "💬"}
                Guardar y enviar por WhatsApp
              </button>
              <button onClick={() => handleSave(false)} disabled={!items.length || saving}
                className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: t.colors.textMuted }}>
                Guardar sin enviar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL PEDIDO
   ══════════════════════════════════════════════════════════ */
function OrderModal({
  conv, agentName, onSend, onClose,
}: {
  conv: Conversation;
  agentName: string;
  onSend: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useAdminTheme();
  const [items, setItems]       = useState<Array<{ id: string; name: string; qty: number; price: number }>>([]);
  const [address, setAddress]   = useState("");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState<string | null>(null);
  const [search, setSearch]     = useState("");

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 12);
  const total    = items.reduce((s, i) => s + i.price * i.qty, 0);

  function toggleProduct(p: typeof products[0]) {
    if (items.some((i) => i.id === p.id)) {
      setItems((prev) => prev.filter((i) => i.id !== p.id));
    } else {
      setItems((prev) => [...prev, { id: p.id, name: p.name, qty: 1, price: p.price }]);
    }
  }
  function updateQty(id: string, qty: number) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  }

  async function handleCreate(sendConfirm: boolean) {
    if (!items.length) return;
    setSaving(true);
    try {
      const res = await authedFetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: conv.customerName,
          client_phone: conv.customerId,
          client_address: address,
          items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.qty, unit_price: i.price })),
          subtotal: total, discount: 0, total,
          payment_method: "whatsapp",
          notes,
        }),
      });
      if (!res.ok) { const e = await res.json() as { error?: string }; alert(e.error ?? "Error"); setSaving(false); return; }
      const order = await res.json() as { order_number: string };

      if (sendConfirm) {
        const lines = items.map((i) => `• ${i.name} × ${i.qty} — ${formatCOP(i.price * i.qty)}`).join("\n");
        const waText =
          `🛍️ *PEDIDO CONFIRMADO*\n📋 ${order.order_number}\n━━━━━━━━━━━━━━━━━━━\n` +
          `${lines}\n━━━━━━━━━━━━━━━━━━━\n💰 *Total: ${formatCOP(total)}*\n` +
          `${address ? `🚚 Entrega: ${address}\n` : ""}${notes ? `📝 ${notes}\n` : ""}` +
          `\n✅ Procesando tu pedido\n_Shelie's Siempre Bellas_ ✨`;
        await onSend(waText);
      }
      setSuccess(order.order_number);
      setTimeout(() => { setSuccess(null); onClose(); }, 2000);
    } catch {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-2xl max-h-[95vh] overflow-auto rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ backgroundColor: t.colors.bgCard }}>

        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: t.colors.border }}>
          <div>
            <h2 className="font-poppins font-bold text-lg" style={{ color: t.colors.text }}>🛍️ Nuevo Pedido</h2>
            <p className="text-xs mt-0.5" style={{ color: t.colors.textMuted }}>Para: {conv.customerName}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: t.colors.textFaint }}>✕</button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full text-sm rounded-xl border px-4 py-2.5 bg-transparent focus:outline-none"
            style={{ borderColor: t.colors.border, color: t.colors.text }}
          />

          <div className="grid grid-cols-2 gap-2">
            {filtered.map((p) => {
              const inCart = items.find((i) => i.id === p.id);
              return (
                <button key={p.id} onClick={() => toggleProduct(p)}
                  className="text-left p-3 rounded-xl border transition-all hover:opacity-80"
                  style={{
                    borderColor: inCart ? t.colors.primary : t.colors.border,
                    backgroundColor: inCart ? t.colors.primary + "15" : "transparent",
                  }}>
                  <p className="text-xs font-medium leading-tight" style={{ color: t.colors.text }}>{p.name}</p>
                  <p className="text-xs mt-1" style={{ color: t.colors.textFaint }}>{formatCOP(p.price)}</p>
                  {inCart && <p className="text-[10px] mt-1" style={{ color: t.colors.primary }}>✓ Agregado</p>}
                </button>
              );
            })}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.colors.textFaint }}>Productos seleccionados</p>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f9f9f9" }}>
                  <p className="flex-1 text-sm" style={{ color: t.colors.text }}>{item.name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-6 h-6 rounded-full text-center text-sm" style={{ backgroundColor: t.colors.border }}>-</button>
                    <span className="text-sm w-6 text-center" style={{ color: t.colors.text }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-6 h-6 rounded-full text-center text-sm" style={{ backgroundColor: t.colors.border }}>+</button>
                    <span className="text-xs w-20 text-right" style={{ color: t.colors.textMuted }}>{formatCOP(item.price * item.qty)}</span>
                    <button onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} className="text-red-400 text-sm pl-1">✕</button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 gap-2">
                <input value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección de entrega (opcional)"
                  className="w-full text-sm rounded-xl border px-4 py-2.5 bg-transparent focus:outline-none"
                  style={{ borderColor: t.colors.border, color: t.colors.text }}
                />
                <input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas para el pedido..."
                  className="w-full text-sm rounded-xl border px-4 py-2.5 bg-transparent focus:outline-none"
                  style={{ borderColor: t.colors.border, color: t.colors.text }}
                />
              </div>

              <div className="flex justify-between items-center font-poppins font-bold text-base p-4 rounded-xl"
                style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f3f4f6" }}>
                <span style={{ color: t.colors.text }}>Total</span>
                <span style={{ color: t.colors.primary }}>{formatCOP(total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t space-y-2" style={{ borderColor: t.colors.border }}>
          {success ? (
            <div className="w-full py-3 rounded-xl bg-green-500/15 text-green-500 text-sm font-medium text-center">
              ✅ Pedido {success} creado exitosamente
            </div>
          ) : (
            <>
              <button onClick={() => handleCreate(true)} disabled={!items.length || saving}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: t.colors.primary }}>
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : "💬"}
                Crear pedido y notificar por WhatsApp
              </button>
              <button onClick={() => handleCreate(false)} disabled={!items.length || saving}
                className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: t.colors.textMuted }}>
                Crear pedido sin notificar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COLUMNA 1 — Lista de conversaciones
   ══════════════════════════════════════════════════════════ */
function ConversationList({
  conversations, selected, onSelect, filter, setFilter, waConnected,
}: {
  conversations: Conversation[]; selected: string | null;
  onSelect: (id: string) => void; filter: string;
  setFilter: (f: string) => void; waConnected: boolean;
}) {
  const t = useAdminTheme();
  const filtered = conversations
    .filter((c) => !filter || c.status === filter)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div className="w-full sm:w-80 flex-shrink-0 border-r flex flex-col h-full overflow-hidden"
      style={{ borderColor: t.colors.border, backgroundColor: t.colors.bgSidebar }}>
      <div className="p-4 border-b" style={{ borderColor: t.colors.border }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: t.colors.text }}>💬 Inbox</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
            waConnected ? "bg-green-500/15 text-green-500 border-green-500/20" : "bg-amber-500/15 text-amber-500 border-amber-500/20"
          }`}>
            {waConnected ? "● WA Live" : "Sin config"}
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {["", "nuevo", "en_atencion", "espera_cliente"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="text-[10px] px-2.5 py-1 rounded-lg transition-all"
              style={{
                backgroundColor: filter === s ? t.colors.primary : "transparent",
                color: filter === s ? "#fff" : t.colors.textFaint,
              }}>
              {s ? statusLabels[s] : "Todos"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.map((conv) => (
          <button key={conv.id} onClick={() => onSelect(conv.id)}
            className="w-full text-left p-4 border-b transition-all"
            style={{
              borderColor: t.colors.border,
              backgroundColor: selected === conv.id ? (t.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f3f4f6") : "transparent",
              borderLeft: selected === conv.id ? `2px solid ${t.colors.primary}` : "2px solid transparent",
            }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate max-w-[160px]" style={{ color: t.colors.text }}>{conv.customerName}</span>
              <span className="text-[10px]" style={{ color: t.colors.textFaint }}>{timeAgo(conv.lastMessageAt)}</span>
            </div>
            <p className="text-xs truncate mb-1.5" style={{ color: t.colors.textMuted }}>{conv.lastMessage}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[conv.status] ?? ""}`}>
                {statusLabels[conv.status]}
              </span>
              {conv.unread > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{conv.unread}</span>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: t.colors.textFaint }}>
            {waConnected ? "Sin conversaciones aún" : "Backend desconectado"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COLUMNA 2 — Chat
   ══════════════════════════════════════════════════════════ */
function ChatPanel({
  conversation, messages, onSend, sending, agentName, onQuote, onOrder,
}: {
  conversation: Conversation | null; messages: Message[];
  onSend: (text: string) => Promise<void>; sending: boolean;
  agentName: string; onQuote: () => void; onOrder: () => void;
}) {
  const [input, setInput]     = useState("");
  const [showTpl, setShowTpl] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const t = useAdminTheme();

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput(""); setShowTpl(false);
    await onSend(text);
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4" style={{ color: t.colors.textFaint }}>
        <p className="text-5xl">💬</p>
        <p className="text-sm">Selecciona una conversación</p>
        <p className="text-xs opacity-60">Todos los chats de WhatsApp aparecen aquí</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: t.colors.bgCard }}>
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: t.colors.border }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#f3f4f6" }}>
          {channelIcons[conversation.channel]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm" style={{ color: t.colors.text }}>{conversation.customerName}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[conversation.status] ?? ""}`}>
              {statusLabels[conversation.status]}
            </span>
            <span className="text-[10px] text-green-500">📱 WhatsApp</span>
          </div>
        </div>
        {/* Quick action buttons in header */}
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onQuote} title="Nueva cotización"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: t.colors.primary + "20", color: t.colors.primary }}>
            📋 Cotizar
          </button>
          <button onClick={onOrder} title="Nuevo pedido"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: t.colors.textMuted }}>
            🛍️ Pedido
          </button>
          <select className="text-xs rounded-lg border px-2 py-1.5"
            style={{ backgroundColor: "transparent", borderColor: t.colors.border, color: t.colors.textMuted }}>
            <option>Estado...</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm py-16" style={{ color: t.colors.textFaint }}>
            Cuando el cliente escriba, los mensajes aparecerán aquí.
          </div>
        )}
        {messages.map((msg) => {
          const isQuote = msg.text.startsWith("📋 *COTIZACIÓN") || msg.text.startsWith("🛍️ *PEDIDO");
          return (
            <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isQuote
                  ? "border"
                  : msg.sender === "customer"
                  ? t.mode === "dark" ? "bg-white/5 text-white" : "bg-gray-100 text-gray-900"
                  : ""
              }`}
                style={isQuote
                  ? { backgroundColor: t.colors.primary + "15", borderColor: t.colors.primary + "40", color: t.colors.text }
                  : msg.sender !== "customer" ? { backgroundColor: t.colors.primary, color: "#fff" } : {}
                }>
                {isQuote && <p className="text-[10px] font-semibold mb-1 opacity-60">DOCUMENTO ENVIADO</p>}
                <p className="text-sm whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{msg.text}</p>
                <div className="flex justify-between mt-1.5 gap-3">
                  <span className="text-[10px] opacity-40">{msg.senderName}</span>
                  <span className="text-[10px] opacity-30">
                    {new Date(msg.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEnd} />
      </div>

      {/* Templates */}
      {showTpl && (
        <div className="mx-4 mb-2 border rounded-xl p-3 max-h-40 overflow-auto"
          style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
          {templates.map((tpl) => (
            <button key={tpl.id} onClick={() => { setInput(tpl.text); setShowTpl(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
              style={{ color: t.colors.textMuted }}>
              <span className="font-medium block" style={{ color: t.colors.text }}>{tpl.name}</span>
              <span className="text-[11px] truncate block" style={{ color: t.colors.textFaint }}>{tpl.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: t.colors.border }}>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px]" style={{ color: t.colors.textFaint }}>Como:</span>
          <span className="text-[10px] font-medium" style={{ color: t.colors.textMuted }}>{agentName}</span>
          <span className="ml-auto text-[10px] text-green-500">Enviará por WhatsApp</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTpl(!showTpl)} title="Plantillas"
            className="p-2.5 rounded-xl text-sm transition-colors"
            style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: t.colors.textFaint }}>
            📋
          </button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1} placeholder="Escribe un mensaje... (Enter para enviar)"
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#fff", borderColor: t.colors.border, color: t.colors.text }}
          />
          <button onClick={handleSend} disabled={!input.trim() || sending}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-colors"
            style={{ backgroundColor: t.colors.primary }}>
            {sending ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COLUMNA 3 — Panel cliente + historial
   ══════════════════════════════════════════════════════════ */
function CustomerPanel({
  conversation, onQuote, onOrder,
}: {
  conversation: Conversation | null;
  onQuote: () => void;
  onOrder: () => void;
}) {
  const t = useAdminTheme();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Array<{ id: number; order_number: string; total: number; status: string; created_at: string }>>([]);

  useEffect(() => {
    if (!conversation) return;
    const phone = conversation.customerId;
    authedFetch(apiUrl(`/api/quotes?conversation_id=${phone}`))
      .then((r) => r.json())
      .then((d: Quote[]) => Array.isArray(d) && setQuotes(d))
      .catch(() => {});
    authedFetch(apiUrl(`/api/orders?limit=5`))
      .then((r) => r.json())
      .then((d: Array<{ id: number; order_number: string; total: number; status: string; created_at: string; client_phone: string }>) => {
        if (Array.isArray(d)) setOrders(d.filter((o) => o.client_phone === phone).slice(0, 5));
      })
      .catch(() => {});
  }, [conversation]);

  const customer = null;

  if (!conversation) return (
    <div className="w-72 flex-shrink-0 border-l flex items-center justify-center"
      style={{ borderColor: t.colors.border, backgroundColor: t.colors.bgSidebar }}>
      <p className="text-xs" style={{ color: t.colors.textFaint }}>Sin conversación</p>
    </div>
  );

  const statusQuoteColor: Record<string, string> = {
    enviada: "bg-blue-500/15 text-blue-400",
    aceptada: "bg-green-500/15 text-green-400",
    rechazada: "bg-red-500/15 text-red-400",
    expirada: "bg-gray-500/15 text-gray-400",
  };

  return (
    <div className="w-72 flex-shrink-0 border-l overflow-auto"
      style={{ borderColor: t.colors.border, backgroundColor: t.colors.bgSidebar }}>
      <div className="p-4 space-y-4">
        {/* Avatar + nombre */}
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: t.colors.primary + "20", color: t.colors.primary }}>
            {conversation.customerName.charAt(0).toUpperCase()}
          </div>
          <p className="font-semibold text-sm" style={{ color: t.colors.text }}>{conversation.customerName}</p>
          <a href={`https://wa.me/${conversation.customerId}`} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-green-500 hover:underline mt-1 inline-block">
            📱 {conversation.customerId}
          </a>
        </div>

        {/* Datos de contacto */}
        <div className="rounded-xl p-3 space-y-1.5" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f9f9f9" }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.colors.textFaint }}>Contacto</p>
          <div className="flex justify-between text-xs">
            <span style={{ color: t.colors.textFaint }}>Teléfono</span>
            <span style={{ color: t.colors.textMuted }}>{conversation.customerId}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: t.colors.textFaint }}>Estado conv.</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[conversation.status] ?? ""}`}>
              {statusLabels[conversation.status]}
            </span>
          </div>
        </div>

        {/* Cotizaciones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: t.colors.textFaint }}>
              📋 Cotizaciones ({quotes.length})
            </p>
            <button onClick={onQuote}
              className="text-[10px] px-2 py-1 rounded-lg font-semibold"
              style={{ backgroundColor: t.colors.primary + "20", color: t.colors.primary }}>
              + Nueva
            </button>
          </div>
          {quotes.length === 0 ? (
            <button onClick={onQuote}
              className="w-full py-3 rounded-xl border border-dashed text-xs transition-colors hover:opacity-80"
              style={{ borderColor: t.colors.border, color: t.colors.textFaint }}>
              Sin cotizaciones — crear primera
            </button>
          ) : (
            <div className="space-y-2">
              {quotes.slice(0, 4).map((q) => (
                <div key={q.id} className="rounded-xl p-3"
                  style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f9f9f9" }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[10px]" style={{ color: t.colors.textMuted }}>{q.quote_number}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusQuoteColor[q.status] ?? ""}`}>{q.status}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: t.colors.primary }}>{formatCOP(q.total)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.colors.textFaint }}>
                    {q.items.length} ítem{q.items.length !== 1 ? "s" : ""} · {timeAgo(q.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: t.colors.textFaint }}>
              🛍️ Pedidos ({orders.length})
            </p>
            <button onClick={onOrder}
              className="text-[10px] px-2 py-1 rounded-lg font-semibold"
              style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f3f4f6", color: t.colors.textMuted }}>
              + Nuevo
            </button>
          </div>
          {orders.length === 0 ? (
            <button onClick={onOrder}
              className="w-full py-3 rounded-xl border border-dashed text-xs transition-colors hover:opacity-80"
              style={{ borderColor: t.colors.border, color: t.colors.textFaint }}>
              Sin pedidos — crear primero
            </button>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl p-3"
                  style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f9f9f9" }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[10px]" style={{ color: t.colors.textMuted }}>{o.order_number}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusColors[o.status] ?? ""}`}>{o.status}</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: t.colors.primary }}>{formatCOP(Number(o.total))}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.colors.textFaint }}>{timeAgo(o.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: t.colors.border }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: t.colors.textFaint }}>⚡ Acciones rápidas</p>
          <a href={`https://wa.me/${conversation.customerId}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
            📱 Abrir en WhatsApp
          </a>
          <button onClick={onQuote}
            className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors"
            style={{ backgroundColor: t.colors.primary + "15", color: t.colors.primary }}>
            📋 Nueva cotización de servicios
          </button>
          <button onClick={onOrder}
            className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors"
            style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f3f4f6", color: t.colors.textMuted }}>
            🛍️ Crear pedido de productos
          </button>
        </div>

        {/* Asignar agente */}
        <div className="pt-2 border-t" style={{ borderColor: t.colors.border }}>
          <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.colors.textFaint }}>👤 Asignar a</p>
          <select className="w-full text-xs rounded-xl border px-3 py-2"
            style={{ backgroundColor: "transparent", borderColor: t.colors.border, color: t.colors.textMuted }}>
            <option>Sin asignar</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN — InboxPage
   ══════════════════════════════════════════════════════════ */
export default function InboxPage() {
  const t = useAdminTheme();
  const [selected, setSelected]   = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [mobileTab, setMobileTab] = useState<"list" | "chat" | "info">("list");

  const [waConversations, setWaConversations] = useState<Conversation[]>([]);
  const [waMessages, setWaMessages]           = useState<Message[]>([]);
  const [waConnected, setWaConnected]          = useState(false);
  const [sending, setSending]                  = useState(false);

  const [agentName, setAgentName] = useState("Shelie Admin");
  const [showQuote, setShowQuote] = useState(false);
  const [showOrder, setShowOrder] = useState(false);

  useEffect(() => {
    try {
      const n = localStorage.getItem("shelie_agent_name");
      if (n) setAgentName(n);
    } catch {}
  }, []);

  const fetchConvs = useCallback(async () => {
    try {
      const res = await authedFetch(apiUrl("/api/whatsapp/conversations"));
      if (!res.ok) return;
      const data = await res.json() as WaConvRaw[];
      if (Array.isArray(data)) { setWaConversations(data.map(waToConversation)); setWaConnected(true); }
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await authedFetch(apiUrl(`/api/whatsapp/conversations?id=${convId}`));
      if (!res.ok) return;
      const data = await res.json() as { conversation: WaConvRaw; messages: WaMsgRaw[] } | null;
      if (data?.messages) {
        setWaMessages(data.messages.map(waMsgToMessage));
        await authedFetch(apiUrl("/api/whatsapp/conversations"), {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: convId, action: "read" }),
        });
        setWaConversations((prev) => prev.map((c) => c.id === convId ? { ...c, unread: 0 } : c));
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

  const selectedConv = waConversations.find((c) => c.id === selected) ?? null;

  function handleSelect(id: string) {
    setSelected(id); setWaMessages([]); setMobileTab("chat");
  }

  async function handleSend(text: string) {
    if (!selectedConv) return;
    setSending(true);
    try {
      const res = await authedFetch(apiUrl("/api/whatsapp/send"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedConv.id, text, agentName }),
      });
      if (res.ok) {
        const newMsg: Message = {
          id: `out-${Date.now()}`, conversationId: selectedConv.id, text,
          sender: "agent", senderName: agentName,
          timestamp: new Date().toISOString(), type: "text", channel: "whatsapp",
        };
        setWaMessages((prev) => [...prev, newMsg]);
        setWaConversations((prev) =>
          prev.map((c) => c.id === selectedConv.id
            ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() } : c)
        );
      } else {
        const err = await res.json() as { error?: string };
        alert(err.error ?? "Error al enviar");
      }
    } catch { alert("Error de conexión"); }
    finally { setSending(false); }
  }

  const tabBtn = (tab: "list" | "chat" | "info", label: string, emoji: string) => (
    <button onClick={() => setMobileTab(tab)}
      className="flex-1 py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5"
      style={{
        borderBottom: mobileTab === tab ? `2px solid ${t.colors.primary}` : "2px solid transparent",
        color: mobileTab === tab ? t.colors.primary : t.colors.textMuted,
      }}>
      <span>{emoji}</span><span>{label}</span>
    </button>
  );

  return (
    <>
      <div className={`flex flex-col h-[calc(100vh-100px)] -m-4 md:-m-6 rounded-xl overflow-hidden border`}
        style={{ borderColor: t.colors.border }}>
        {/* Mobile tabs */}
        <div className="flex md:hidden border-b" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
          {tabBtn("list", "Chats", "💬")}
          {tabBtn("chat", "Chat", "✉️")}
          {tabBtn("info", "Cliente", "👤")}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Col 1 */}
          <div className={`${mobileTab === "list" ? "flex" : "hidden"} md:flex`}>
            <ConversationList
              conversations={waConversations} selected={selected} onSelect={handleSelect}
              filter={statusFilter} setFilter={setStatusFilter} waConnected={waConnected}
            />
          </div>

          {/* Col 2 */}
          <div className={`${mobileTab === "chat" ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden`}>
            {selected && (
              <div className="md:hidden px-4 py-2 border-b flex items-center gap-2"
                style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                <button onClick={() => setMobileTab("list")} className="text-xs font-medium" style={{ color: t.colors.primary }}>
                  ← Volver
                </button>
                <span className="text-xs" style={{ color: t.colors.textMuted }}>{selectedConv?.customerName}</span>
              </div>
            )}
            <ChatPanel
              conversation={selectedConv} messages={waMessages}
              onSend={handleSend} sending={sending} agentName={agentName}
              onQuote={() => setShowQuote(true)} onOrder={() => setShowOrder(true)}
            />
          </div>

          {/* Col 3 */}
          <div className={`${mobileTab === "info" ? "flex" : "hidden"} md:flex flex-col overflow-hidden`}>
            <CustomerPanel
              conversation={selectedConv}
              onQuote={() => setShowQuote(true)}
              onOrder={() => setShowOrder(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQuote && selectedConv && (
        <QuoteModal
          conv={selectedConv} agentName={agentName}
          onSend={handleSend} onClose={() => setShowQuote(false)}
        />
      )}
      {showOrder && selectedConv && (
        <OrderModal
          conv={selectedConv} agentName={agentName}
          onSend={handleSend} onClose={() => setShowOrder(false)}
        />
      )}
    </>
  );
}
