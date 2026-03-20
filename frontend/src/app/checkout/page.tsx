"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatCOP } from "@/lib/data";
import { apiUrl } from "@/lib/api";

/* ══════════════════════════════════════════════════════
   CHECKOUT — MercadoPago Production
   ══════════════════════════════════════════════════════ */

export default function CheckoutPage() {
  const { items, count, subtotal, discount, shipping, total, appliedPromo } = useCart();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", notes: "",
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState("");

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handlePagar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }
    setError("");
    setProcessing(true);

    try {
      const res = await fetch(apiUrl("/api/payments/create-preference"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id:          String(i.product.id),
            name:        i.product.name,
            quantity:    i.qty,
            unit_price:  i.product.price,
            picture_url: i.product.images?.[0] ?? undefined,
            category_id: "beauty_care",
          })),
          payer: {
            name:  form.name.split(" ")[0],
            surname: form.name.split(" ").slice(1).join(" ") || "",
            email: form.email,
            phone: form.phone,
          },
          shipping_address: {
            street_name: form.address,
            city:        form.city,
          },
          notes: form.notes,
        }),
      });

      const data = await res.json() as {
        init_point?: string;
        sandbox_init_point?: string;
        error?: string;
      };

      if (!res.ok || !data.init_point) {
        setError(data.error ?? "Error al iniciar el pago. Intenta de nuevo.");
        setProcessing(false);
        return;
      }

      // Redirigir al checkout de MercadoPago
      window.location.href = data.init_point;

    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
      setProcessing(false);
    }
  }

  if (count === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="font-poppins font-bold text-2xl mb-3">No hay productos en el carrito</h1>
        <a href="/tienda" className="btn-vino inline-block">Ir a la tienda</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-poppins font-bold text-3xl mb-2">Checkout</h1>
      <p className="text-humo text-sm mb-8">Completa tus datos y paga con MercadoPago</p>

      <form onSubmit={handlePagar} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Formulario datos ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-6">
            <h2 className="font-poppins font-semibold mb-4">Datos de entrega</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-humo block mb-1">Nombre completo *</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)}
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                  placeholder="Tu nombre completo" />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                  placeholder="tu@email.com" />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Teléfono / WhatsApp *</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)}
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                  placeholder="300 000 0000" />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Ciudad *</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)}
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                  placeholder="Bogotá, Medellín…" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-humo block mb-1">Dirección completa *</label>
                <input value={form.address} onChange={(e) => update("address", e.target.value)}
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                  placeholder="Calle, número, barrio, apto…" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-humo block mb-1">Notas de entrega</label>
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)}
                  rows={2} placeholder="Instrucciones especiales, horario, etc."
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30 resize-none" />
              </div>
            </div>
          </div>

          {/* Métodos de pago disponibles (informativo — MP los maneja) */}
          <div className="card-premium p-5">
            <h2 className="font-poppins font-semibold mb-3">Métodos de pago aceptados</h2>
            <div className="flex flex-wrap gap-2">
              {["💳 Tarjeta crédito", "💳 Tarjeta débito", "🏦 PSE", "📱 Nequi", "💰 Daviplata", "🏪 Efecty"].map((m) => (
                <span key={m} className="text-xs bg-blush-light text-vino px-3 py-1.5 rounded-lg font-medium">
                  {m}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-humo mt-3">
              Al hacer clic en "Pagar con MercadoPago" serás redirigido de forma segura para completar el pago.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* ── Resumen pedido ── */}
        <div className="card-premium p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-poppins font-semibold text-lg mb-4">Tu pedido</h2>

          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between text-sm gap-2">
                <span className="text-humo truncate">{item.product.name} × {item.qty}</span>
                <span className="flex-shrink-0 font-medium">{formatCOP(item.product.price * item.qty)}</span>
              </div>
            ))}
          </div>

          <hr className="border-blush/30 mb-3" />

          <div className="space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-humo">Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            {appliedPromo && (
              <div className="flex justify-between text-green-600">
                <span>Descuento ({appliedPromo.code})</span>
                <span>−{formatCOP(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-humo">Envío</span>
              <span>{shipping === 0 ? "Gratis 🎉" : formatCOP(shipping)}</span>
            </div>
            <hr className="border-blush/30" />
            <div className="flex justify-between font-poppins font-bold text-xl">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          {/* Botón MercadoPago */}
          <button type="submit" disabled={processing}
            className="w-full rounded-xl py-3.5 font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#009EE3", color: "#fff" }}>
            {processing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirigiendo a MercadoPago…
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#009EE3"/>
                  <path d="M10 24C10 16.27 16.27 10 24 10C28.42 10 32.38 11.97 35.07 15.07L28.5 19.5C27.24 18.57 25.68 18 24 18C19.58 18 16 21.58 16 26C16 30.42 19.58 34 24 34C27.5 34 30.5 31.91 31.65 29H24V22H39C39.34 23.26 39.5 24.61 39.5 26C39.5 33.73 33.23 40 25.5 40C17.77 40 10 33.73 10 26V24Z" fill="white"/>
                </svg>
                Pagar {formatCOP(total)} con MercadoPago
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-[10px] text-humo">🔒 Pago 100% seguro y encriptado</span>
          </div>
        </div>
      </form>
    </div>
  );
}
