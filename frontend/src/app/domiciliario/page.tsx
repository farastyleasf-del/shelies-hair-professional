"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl, domiciliarioFetch } from "@/lib/api";
import type { DomUser } from "./layout";

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
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  payment_method: string;
  payment_ref: string;
  notes: string;
  delivered_by: string;
  delivery_date: string | null;
  created_at: string;
}

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

export default function DomiciliarioDashboard() {
  const [user, setUser]               = useState<DomUser | null>(null);
  const [pending, setPending]         = useState<Order[]>([]);
  const [deliveredToday, setDeliveredToday] = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("domiciliario_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pendRes, delivRes] = await Promise.all([
          domiciliarioFetch(apiUrl("/api/orders?limit=200")),
          domiciliarioFetch(apiUrl("/api/orders?status=entregado&today=true")),
        ]);
        const allData: Order[] = pendRes.ok ? await pendRes.json() : [];
        const delivData: Order[] = delivRes.ok ? await delivRes.json() : [];
        const pendData = allData.filter(o => ["nuevo", "pagado", "empacado", "alistamiento", "enviado", "en_ruta"].includes(o.status));
        setPending(pendData);
        setDeliveredToday(delivData);
      } catch {
        // silent fail — show zeros
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalCobradoHoy = deliveredToday
    .filter(o => o.payment_method === "cod")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const recentPending = pending.slice(0, 5);

  const kpis = [
    {
      label: "Pendientes",
      value: loading ? "–" : pending.length,
      sub: "pedidos enviados",
      accent: false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
    },
    {
      label: "Entregados hoy",
      value: loading ? "–" : deliveredToday.length,
      sub: "completados hoy",
      accent: false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
    {
      label: "Total cobrado hoy",
      value: loading ? "–" : fmt(totalCobradoHoy),
      sub: "contra entrega (COD)",
      accent: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* Page header */}
      <div>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.35em", color: P.textFaint, margin: "0 0 4px" }}>Panel Domiciliario</p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: P.text, margin: "0 0 4px" }}>
          Hola{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>
          {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            borderRadius: 16,
            border: `1px solid ${k.accent ? P.dorado + "55" : P.border}`,
            background: k.accent ? `linear-gradient(135deg, ${P.doradoLight}, #fff)` : P.bgCard,
            padding: "20px 22px",
            boxShadow: P.shadow,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: P.textFaint, margin: 0 }}>{k.label}</p>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: k.accent ? P.doradoLight : P.vinoLight, display: "flex", alignItems: "center", justifyContent: "center", color: k.accent ? P.doradoDeep : P.vino }}>
                {k.icon}
              </div>
            </div>
            <p style={{ fontSize: typeof k.value === "number" ? 36 : 24, fontWeight: 700, color: k.accent ? P.doradoDeep : P.text, margin: "0 0 4px", fontFamily: "'Playfair Display', Georgia, serif" }}>{k.value}</p>
            <p style={{ fontSize: 11, color: P.textMuted, margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent pending orders */}
      <div style={{ borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, overflow: "hidden", boxShadow: P.shadow }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${P.borderLight}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: P.text, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.vino} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Pedidos recientes
          </h2>
          <Link href="/domiciliario/pedidos" style={{ fontSize: 11, color: P.vino, textDecoration: "none", fontWeight: 500 }}>
            Ver todos →
          </Link>
        </div>

        <div style={{ padding: "12px 12px" }}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: 64, borderRadius: 10, background: P.bgSubtle, marginBottom: 6 }} />
            ))
          ) : recentPending.length === 0 ? (
            <div style={{ padding: "36px 0", textAlign: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p style={{ fontSize: 13, color: P.textMuted, margin: 0 }}>Sin pedidos pendientes</p>
            </div>
          ) : (
            recentPending.map(order => (
              <Link
                key={order.id}
                href="/domiciliario/pedidos"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, marginBottom: 6, background: P.bgSubtle, textDecoration: "none", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.vinoLight; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = P.bgSubtle; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: P.vino, margin: 0 }}>{order.order_number}</p>
                    <span style={{ fontSize: 10, color: P.textFaint }}>{timeAgo(order.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>{order.client_name}</p>
                  <p style={{ fontSize: 11, color: P.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {order.client_address || "Sin dirección"}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: P.text, margin: "0 0 2px" }}>{fmt(Number(order.total))}</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Link
          href="/domiciliario/pedidos"
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, textDecoration: "none", boxShadow: P.shadow }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = P.vino)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = P.border)}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: P.vinoLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.vino} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>Mis Pedidos</p>
            <p style={{ fontSize: 12, color: P.textMuted, margin: 0 }}>Gestionar entregas pendientes</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}><polyline points="9 18 15 12 9 6"/></svg>
        </Link>

        <Link
          href="/domiciliario/historial"
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderRadius: 16, border: `1px solid ${P.border}`, background: P.bgCard, textDecoration: "none", boxShadow: P.shadow }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = P.dorado)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = P.border)}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: P.doradoLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.doradoDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: P.text, margin: "0 0 2px" }}>Historial</p>
            <p style={{ fontSize: 12, color: P.textMuted, margin: 0 }}>Entregas completadas</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      </div>
    </div>
  );
}
