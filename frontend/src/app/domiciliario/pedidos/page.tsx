"use client";

import { useEffect, useState, useCallback } from "react";
import { apiUrl, domiciliarioFetch } from "@/lib/api";
import type { DomUser } from "../layout";

// ─── Paleta ───────────────────────────────────────────────
const P = {
  bg:          "#FAF7F4",
  bgCard:      "#FFFFFF",
  bgSubtle:    "#F5F0EC",
  vino:        "#8B3A4A",
  vinoDeep:    "#5E2430",
  vinoLight:   "#F5EAEC",
  dorado:      "#C9A46A",
  doradoDeep:  "#A07C45",
  doradoLight: "#FDF6E8",
  green:       "#16A34A",
  greenLight:  "#F0FDF4",
  text:        "#1E0F0A",
  textMed:     "#5C3A30",
  textMuted:   "#957068",
  textFaint:   "#C4A99F",
  border:      "#EAE0DA",
  borderLight: "#F3EDE9",
  shadow:      "0 4px 20px rgba(94,36,48,0.07)",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  client_address: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_method: string;
  payment_ref: string;
  notes: string;
  delivered_by: string;
  delivery_date: string | null;
  created_at: string;
}

type Tab = "pendientes" | "en_ruta" | "todos";

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "ahora";
  if (diff < 60) return `hace ${diff}m`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function parseItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as OrderItem[]; } catch { return []; }
  }
  return [];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    nuevo:     { bg: "#EFF6FF", color: "#1D4ED8", label: "Nuevo" },
    enviado:   { bg: "#FEF9EC", color: "#A07C45", label: "Enviado" },
    en_ruta:   { bg: "#EEF2FF", color: "#4F46E5", label: "En ruta" },
    entregado: { bg: "#F0FDF4", color: "#16A34A", label: "Entregado" },
    cancelado: { bg: "#FEF2F2", color: "#DC2626", label: "Cancelado" },
  };
  const s = map[status] ?? { bg: P.bgSubtle, color: P.textMuted, label: status };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
      {s.label}
    </span>
  );
}

// ─── Delivery confirm form (inline) ──────────────────────
function DeliverForm({
  order,
  user,
  onDelivered,
  onCancel,
}: {
  order: Order;
  user: DomUser | null;
  onDelivered: (id: number) => void;
  onCancel: () => void;
}) {
  const isCod = order.payment_method === "cod";
  const [amount, setAmount] = useState(String(order.total));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function confirm() {
    setLoading(true); setErr("");
    try {
      const body: Record<string, unknown> = {
        status: "entregado",
        delivered_by: user?.name ?? "",
      };
      if (isCod) body.payment_ref = amount;

      const res = await domiciliarioFetch(apiUrl(`/api/orders/${order.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setErr("Error al actualizar pedido"); return; }
      onDelivered(order.id);
    } catch {
      setErr("Sin conexión al servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 16, padding: "16px", borderRadius: 12, border: `1.5px solid ${P.green}`, background: P.greenLight }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: P.green, margin: "0 0 12px" }}>Confirmar entrega</p>
      {isCod && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: P.textMed, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
            Monto recibido (COD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${P.border}`, fontSize: 15, color: P.text, background: "#fff", outline: "none", boxSizing: "border-box" }}
            onFocus={e => { e.target.style.borderColor = P.green; }}
            onBlur={e => { e.target.style.borderColor = P.border; }}
          />
        </div>
      )}
      {err && (
        <p style={{ fontSize: 12, color: "#DC2626", margin: "0 0 10px" }}>{err}</p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={confirm}
          disabled={loading}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: P.green, color: "#fff", fontSize: 13, fontWeight: 600,
            opacity: loading ? 0.6 : 1, transition: "opacity .15s",
          }}
        >
          {loading ? "Guardando…" : "Confirmar entrega"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${P.border}`, background: "transparent", color: P.textMuted, fontSize: 13, cursor: "pointer" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────
function OrderCard({
  order,
  user,
  onDelivered,
}: {
  order: Order;
  user: DomUser | null;
  onDelivered: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDeliverForm, setShowDeliverForm] = useState(false);

  const items = parseItems(order.items);
  const itemsStr = items.map(it => `${it.quantity}× ${it.name}`).join(", ");
  const isCod = order.payment_method === "cod";
  const canDeliver = order.status === "enviado" || order.status === "en_ruta";

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow, marginBottom: 12 }}>
      {/* Card header — always visible */}
      <div
        onClick={() => { setExpanded(v => !v); if (expanded) setShowDeliverForm(false); }}
        style={{ padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
      >
        {/* Row 1: order number + time + status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: P.vino }}>{order.order_number}</span>
            <span style={{ fontSize: 10, color: P.textFaint }}>{timeAgo(order.created_at)}</span>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Row 2: client name + phone */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: P.text, margin: 0 }}>{order.client_name}</p>
          {order.client_phone && (
            <a
              href={`tel:${order.client_phone}`}
              onClick={e => e.stopPropagation()}
              style={{ fontSize: 13, color: P.vino, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              {order.client_phone}
            </a>
          )}
        </div>

        {/* Row 3: address (prominent) */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: P.textMed, margin: 0, lineHeight: 1.4 }}>
            {order.client_address || "Sin dirección registrada"}
          </p>
        </div>

        {/* Row 4: items summary + total + payment badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <p style={{ fontSize: 11, color: P.textMuted, margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {itemsStr || "Sin productos"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
              background: isCod ? "#FEF9EC" : "#EFF6FF",
              color: isCod ? P.doradoDeep : "#1D4ED8",
            }}>
              {isCod ? "💵 Contra entrega" : "💳 Prepago"}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{fmt(Number(order.total))}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${P.borderLight}`, padding: "14px 16px", background: P.bgSubtle }}>
          {/* Full address + notes */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: P.textFaint, margin: "0 0 6px" }}>Dirección completa</p>
            <p style={{ fontSize: 13, color: P.textMed, margin: "0 0 4px" }}>{order.client_address || "No registrada"}</p>
            {order.notes && (
              <p style={{ fontSize: 12, color: P.textMuted, margin: 0, fontStyle: "italic" }}>Nota: {order.notes}</p>
            )}
          </div>

          {/* Items breakdown */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: P.textFaint, margin: "0 0 8px" }}>Productos</p>
            {items.length === 0 ? (
              <p style={{ fontSize: 12, color: P.textMuted, margin: 0 }}>Sin detalle de productos</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: P.text }}>
                    <span>{it.quantity}× {it.name}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(it.price * it.quantity)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: P.text, borderTop: `1px solid ${P.border}`, paddingTop: 6, marginTop: 4 }}>
                  <span>Total</span>
                  <span>{fmt(Number(order.total))}</span>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          {canDeliver && !showDeliverForm && (
            <button
              onClick={() => setShowDeliverForm(true)}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer",
                background: P.green, color: "#fff", fontSize: 14, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Marcar Entregado
            </button>
          )}

          {showDeliverForm && (
            <DeliverForm
              order={order}
              user={user}
              onDelivered={id => { onDelivered(id); setShowDeliverForm(false); setExpanded(false); }}
              onCancel={() => setShowDeliverForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────
export default function PedidosPage() {
  const [user, setUser]       = useState<DomUser | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("pendientes");
  const [toast, setToast]     = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("domiciliario_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await domiciliarioFetch(apiUrl("/api/orders?status=enviado&limit=100"));
      const data: Order[] = res.ok ? await res.json() : [];
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  function handleDelivered(id: number) {
    setOrders(prev => prev.filter(o => o.id !== id));
    setToast("Pedido marcado como entregado");
    setTimeout(() => setToast(null), 3500);
  }

  const pendientes = orders.filter(o => o.status === "enviado");
  const enRuta     = orders.filter(o => o.status === "en_ruta");
  const todos      = orders;

  const visibleOrders = tab === "pendientes" ? pendientes : tab === "en_ruta" ? enRuta : todos;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pendientes", label: "Pendientes", count: pendientes.length },
    { key: "en_ruta",    label: "En Ruta",    count: enRuta.length },
    { key: "todos",      label: "Todos",       count: todos.length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#16A34A", color: "#fff", padding: "12px 24px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,.2)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {toast}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textFaint, margin: "0 0 4px" }}>Domiciliario</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: P.text, margin: 0 }}>Pedidos</h1>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, border: `1px solid ${P.border}`, background: "transparent", color: P.textMuted, fontSize: 12, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? "spin .8s linear infinite" : "none" }}>
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, background: P.bgSubtle, borderRadius: 12, padding: 4 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer",
              background: tab === t.key ? P.bgCard : "transparent",
              color: tab === t.key ? P.text : P.textMuted,
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,.08)" : "none",
              transition: "background .15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20,
                background: tab === t.key ? P.vinoLight : P.bgSubtle,
                color: tab === t.key ? P.vino : P.textFaint,
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 14, background: P.bgSubtle, marginBottom: 12 }} />
          ))
        ) : visibleOrders.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <p style={{ fontSize: 14, color: P.textMuted, margin: 0 }}>Sin pedidos en esta categoría</p>
          </div>
        ) : (
          visibleOrders.map(order => (
            <OrderCard key={order.id} order={order} user={user} onDelivered={handleDelivered} />
          ))
        )}
      </div>
    </div>
  );
}
