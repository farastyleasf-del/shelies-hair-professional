"use client";

import { useEffect, useState, useCallback } from "react";
import { apiUrl, domiciliarioFetch } from "@/lib/api";

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
  text:        "#1E0F0A",
  textMed:     "#5C3A30",
  textMuted:   "#957068",
  textFaint:   "#C4A99F",
  border:      "#EAE0DA",
  borderLight: "#F3EDE9",
  shadow:      "0 4px 20px rgba(94,36,48,0.07)",
};

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string;
  client_address: string;
  total: number;
  status: string;
  payment_method: string;
  delivered_by: string;
  delivery_date: string | null;
  created_at: string;
}

type DateFilter = "hoy" | "semana";

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getGroupLabel(iso: string): string {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  const dateStr = iso.slice(0, 10);
  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";
  return new Date(iso).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

export default function HistorialPage() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("hoy");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await domiciliarioFetch(apiUrl("/api/orders?status=entregado&limit=50"));
      const data: Order[] = res.ok ? await res.json() : [];
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Filter orders by date range
  const today = toDateStr(new Date());
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - ((day + 6) % 7));
    return toDateStr(d);
  })();

  const filtered = orders.filter(o => {
    const dateStr = o.created_at.slice(0, 10);
    if (dateFilter === "hoy") return dateStr === today;
    if (dateFilter === "semana") return dateStr >= weekStart;
    return true;
  });

  // Summary stats
  const totalEntregas = filtered.length;
  const totalCobrado  = filtered
    .filter(o => o.payment_method === "cod")
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Group by date
  const groups: Record<string, Order[]> = {};
  for (const o of filtered) {
    const label = getGroupLabel(o.created_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(o);
  }

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: "hoy",    label: "Hoy" },
    { key: "semana", label: "Esta semana" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textFaint, margin: "0 0 4px" }}>Domiciliario</p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: P.text, margin: 0 }}>Historial</h1>
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

      {/* Date filter */}
      <div style={{ display: "flex", gap: 8 }}>
        {dateFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setDateFilter(f.key)}
            style={{
              padding: "8px 20px", borderRadius: 20, border: `1.5px solid ${dateFilter === f.key ? P.vino : P.border}`,
              background: dateFilter === f.key ? P.vinoLight : "transparent",
              color: dateFilter === f.key ? P.vinoDeep : P.textMuted,
              fontSize: 13, fontWeight: dateFilter === f.key ? 600 : 400, cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ borderRadius: 14, border: `1px solid ${P.border}`, background: P.bgCard, padding: "16px 20px", boxShadow: P.shadow }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: P.textFaint, margin: "0 0 6px" }}>Total entregas</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: P.text, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {loading ? "–" : totalEntregas}
          </p>
        </div>
        <div style={{ borderRadius: 14, border: `1px solid ${P.dorado}55`, background: `linear-gradient(135deg, ${P.doradoLight}, #fff)`, padding: "16px 20px", boxShadow: P.shadow }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: P.textFaint, margin: "0 0 6px" }}>Total cobrado (COD)</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: P.doradoDeep, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {loading ? "–" : fmt(totalCobrado)}
          </p>
        </div>
      </div>

      {/* Order list grouped by date */}
      {loading ? (
        [1, 2, 3].map(i => (
          <div key={i} style={{ height: 72, borderRadius: 12, background: P.bgSubtle }} />
        ))
      ) : filtered.length === 0 ? (
        <div style={{ padding: "56px 0", textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p style={{ fontSize: 14, color: P.textMuted, margin: 0 }}>Sin entregas en este período</p>
        </div>
      ) : (
        Object.entries(groups).map(([groupLabel, groupOrders]) => (
          <div key={groupLabel}>
            {/* Group header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: P.textMuted, margin: 0 }}>{groupLabel}</p>
              <div style={{ flex: 1, height: 1, background: P.borderLight }} />
              <span style={{ fontSize: 10, color: P.textFaint }}>{groupOrders.length} entrega{groupOrders.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Orders in this group */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {groupOrders.map(order => (
                <div
                  key={order.id}
                  style={{ borderRadius: 12, border: `1px solid ${P.border}`, background: P.bgCard, padding: "12px 16px", boxShadow: P.shadow }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    {/* Left: info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: P.vino }}>{order.order_number}</span>
                        <span style={{ fontSize: 10, color: P.textFaint }}>{formatDate(order.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>{order.client_name}</p>
                      <p style={{ fontSize: 12, color: P.textMuted, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {order.client_address || "Sin dirección"}
                      </p>
                      {order.delivered_by && (
                        <p style={{ fontSize: 11, color: P.textFaint, margin: 0 }}>Entregado por: {order.delivered_by}</p>
                      )}
                    </div>

                    {/* Right: total + payment badge */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: P.text, margin: "0 0 4px" }}>{fmt(Number(order.total))}</p>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        background: order.payment_method === "cod" ? "#FEF9EC" : "#EFF6FF",
                        color: order.payment_method === "cod" ? P.doradoDeep : "#1D4ED8",
                      }}>
                        {order.payment_method === "cod" ? "COD" : "Prepago"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
