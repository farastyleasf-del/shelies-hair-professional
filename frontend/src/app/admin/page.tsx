"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAdminTheme } from "@/lib/admin-theme";
import { formatCOPAdmin, statusColors } from "@/lib/admin-data";
import { apiUrl, authedFetch } from "@/lib/api";

interface DbOrder {
  id: number;
  order_number: string;
  client_name: string;
  total: string;
  status: string;
  created_at: string;
}

function KPICard({ label, value, icon }: { label: string; value: string; icon: string }) {
  const t = useAdminTheme();
  return (
    <div className="border rounded-xl p-5" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-medium" style={{ color: t.colors.textMuted }}>{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color: t.colors.text }}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const t = useAdminTheme();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch(apiUrl("/api/orders"))
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setOrders(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = orders.reduce((s, o) => s + parseFloat(o.total || "0"), 0);
  const nuevos = orders.filter((o) => o.status === "nuevo").length;
  const enviados = orders.filter((o) => o.status === "enviado").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold" style={{ color: t.colors.text }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>Resumen general de la operación</p>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: t.colors.textFaint }}>Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total pedidos" value={String(orders.length)} icon="📦" />
            <KPICard label="Pedidos nuevos" value={String(nuevos)} icon="🆕" />
            <KPICard label="Enviados" value={String(enviados)} icon="🚚" />
            <KPICard label="Ingresos totales" value={formatCOPAdmin(total)} icon="💰" />
          </div>

          {/* QR Web */}
          <div className="border rounded-xl p-5 flex items-center gap-5" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
            <div className="flex-shrink-0" style={{ background: "#fff", padding: 8, borderRadius: 12 }}>
              <Image src="/images/qr/qr-web-shelies.png" alt="QR shelies.asf.company" width={120} height={120} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: t.colors.text }}>QR de la página web</p>
              <p className="text-xs mt-1" style={{ color: t.colors.textMuted }}>Escanea para abrir shelies.asf.company</p>
              <p className="text-xs font-mono mt-2 px-2 py-1 rounded" style={{ backgroundColor: t.colors.bg, color: t.colors.textMuted }}>https://shelies.asf.company</p>
              <button onClick={() => {
                const a = document.createElement("a");
                a.href = "/images/qr/qr-web-shelies.png";
                a.download = "qr-shelies-web.png";
                a.click();
              }} className="text-xs font-semibold mt-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: t.colors.primaryLight, color: t.colors.primary }}>
                Descargar QR
              </button>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden" style={{ borderColor: t.colors.border }}>
            <div className="px-5 py-4 border-b" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <h2 className="font-semibold text-sm" style={{ color: t.colors.text }}>Pedidos recientes</h2>
            </div>
            {orders.length === 0 ? (
              <div className="p-12 text-center" style={{ backgroundColor: t.colors.bgCard, color: t.colors.textFaint }}>
                <p className="text-3xl mb-3">📦</p>
                <p className="text-sm">Sin pedidos aún</p>
              </div>
            ) : (
              <table className="w-full text-sm" style={{ backgroundColor: t.colors.bgCard }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                    {["Pedido", "Cliente", "Total", "Estado"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wider" style={{ color: t.colors.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((o) => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${t.colors.border}` }}>
                      <td className="px-5 py-3 font-mono text-xs" style={{ color: t.colors.textMuted }}>{o.order_number}</td>
                      <td className="px-5 py-3" style={{ color: t.colors.text }}>{o.client_name}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: t.colors.text }}>{formatCOPAdmin(parseFloat(o.total))}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusColors[o.status] ?? ""}`}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
