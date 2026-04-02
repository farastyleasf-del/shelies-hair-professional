"use client";
import { useState } from "react";
import { formatCOP } from "@/lib/data";
import { Order } from "@/lib/types";
import { apiUrl } from "@/lib/api";

const statusSteps: Record<string, number> = { pagado: 1, empacado: 2, enviado: 3, entregado: 4 };
const statusLabels = ["Pagado", "Empacado", "Enviado", "Entregado"];

export default function MiPedidoPage() {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    fetch(apiUrl(`/api/orders/track?q=${encodeURIComponent(q)}`))
      .then((r) => r.json())
      .then((d) => { setFound(d?.id ? d : null); setSearched(true); })
      .catch(() => { setFound(null); setSearched(true); });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-poppins font-bold text-3xl text-center mb-3">Mi Pedido</h1>
      <p className="text-humo text-center text-sm mb-8">
        Ingresa tu número de orden, email o teléfono para ver el estado.
      </p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: ORD-20260201-001 o tu email"
          className="flex-1 border border-blush/40 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
        />
        <button type="submit" className="btn-vino">Buscar</button>
      </form>

      {searched && !found && (
        <div className="text-center py-10">
          <p className="text-humo">No encontramos un pedido con esa información.</p>
          <p className="text-xs text-humo mt-2">Prueba con: ORD-20260201-001, laura@email.com o 3101234567</p>
        </div>
      )}

      {found && (
        <div className="card-premium p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-poppins font-semibold text-lg">{found.id}</h2>
              <p className="text-xs text-humo">{new Date(found.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <span className="chip capitalize">{found.status}</span>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            {statusLabels.map((label, i) => {
              const step = i + 1;
              const current = statusSteps[found.status];
              const done = step <= current;
              return (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    done ? "bg-vino text-white" : "bg-blush/30 text-humo"
                  }`}>
                    {done ? "✓" : step}
                  </div>
                  <span className={`text-[10px] ${done ? "text-vino font-semibold" : "text-humo"}`}>{label}</span>
                  {i < 3 && (
                    <div className={`hidden sm:block absolute h-0.5 w-full ${done ? "bg-vino" : "bg-blush/30"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tracking */}
          {found.trackingCode && (
            <div className="bg-blush-light rounded-xl p-4 mb-6">
              <p className="text-sm"><span className="font-semibold">Código de rastreo:</span> {found.trackingCode}</p>
            </div>
          )}

          {/* Items */}
          <h3 className="font-poppins font-semibold text-sm mb-3">Productos</h3>
          <div className="space-y-2 mb-4">
            {found.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-humo">{item.name} × {item.qty}</span>
                <span>{formatCOP(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <hr className="border-blush/30 mb-3" />
          <div className="flex justify-between font-poppins font-bold">
            <span>Total</span>
            <span>{formatCOP(found.total)}</span>
          </div>

          {/* Envío */}
          <div className="mt-6 text-sm text-humo">
            <p><span className="font-medium text-carbon">Envío a:</span> {found.customer.address}, {found.customer.city}</p>
            <p><span className="font-medium text-carbon">Cliente:</span> {found.customer.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
