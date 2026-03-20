"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatCOP } from "@/lib/data";

export default function CheckoutPage() {
  const { items, count, subtotal, discount, shipping, total, appliedPromo, clear } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", notes: "",
  });
  const [payMethod, setPayMethod] = useState<"card" | "transfer">("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }
    setError("");
    setProcessing(true);

    // Simular procesamiento de pago (en producción: llamar a la pasarela)
    await new Promise((r) => setTimeout(r, 2000));

    const orderId = `ORD-${Date.now()}`;

    // Guardar en sessionStorage para la confirmación
    sessionStorage.setItem("lastOrder", JSON.stringify({
      id: orderId,
      items: items.map((i) => ({ name: i.product.name, qty: i.qty, price: i.product.price })),
      customer: form,
      subtotal, discount, shipping, total,
      promo: appliedPromo?.code || null,
      status: "pagado",
      createdAt: new Date().toISOString(),
    }));

    clear();
    router.push(`/confirmacion?order=${orderId}`);
  }

  if (count === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-poppins font-bold text-2xl mb-3">No hay productos en el carrito</h1>
        <a href="/tienda" className="btn-vino inline-block">Ir a la tienda</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-poppins font-bold text-3xl mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-6">
            <h2 className="font-poppins font-semibold mb-4">Datos de envío</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-humo block mb-1">Nombre completo *</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Teléfono *</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Ciudad / Barrio *</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-humo block mb-1">Dirección completa *</label>
                <input value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-humo block mb-1">Notas de entrega</label>
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30 resize-none" placeholder="Apto, piso, indicaciones…" />
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="card-premium p-6">
            <h2 className="font-poppins font-semibold mb-4">Método de pago</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPayMethod("card")}
                className={`flex-1 border-2 rounded-xl p-4 text-sm text-center font-medium transition-all ${
                  payMethod === "card" ? "border-vino bg-vino/5 text-vino" : "border-blush/30 text-humo"
                }`}
              >
                💳 Tarjeta de crédito/débito
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("transfer")}
                className={`flex-1 border-2 rounded-xl p-4 text-sm text-center font-medium transition-all ${
                  payMethod === "transfer" ? "border-vino bg-vino/5 text-vino" : "border-blush/30 text-humo"
                }`}
              >
                🏦 Transferencia / PSE
              </button>
            </div>
            {payMethod === "card" && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-humo block mb-1">Número de tarjeta</label>
                  <input placeholder="0000 0000 0000 0000" className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
                </div>
                <div>
                  <label className="text-xs text-humo block mb-1">Vencimiento</label>
                  <input placeholder="MM/AA" className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
                </div>
                <div>
                  <label className="text-xs text-humo block mb-1">CVV</label>
                  <input placeholder="123" className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
                </div>
              </div>
            )}
            {payMethod === "transfer" && (
              <p className="mt-4 text-sm text-humo bg-blush-light rounded-xl p-4">
                Serás redirigido a tu banco para completar el pago por PSE/transferencia.
              </p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Resumen pedido */}
        <div className="card-premium p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-poppins font-semibold text-lg mb-4">Tu pedido</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-humo">{item.product.name} × {item.qty}</span>
                <span>{formatCOP(item.product.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <hr className="border-blush/30 mb-3" />
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-humo">Subtotal</span><span>{formatCOP(subtotal)}</span></div>
            {appliedPromo && (
              <div className="flex justify-between text-green-600"><span>Descuento</span><span>−{formatCOP(discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-humo">Envío</span><span>{shipping === 0 ? "Gratis" : formatCOP(shipping)}</span></div>
            <hr className="border-blush/30" />
            <div className="flex justify-between font-poppins font-bold text-lg"><span>Total</span><span>{formatCOP(total)}</span></div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="btn-vino w-full text-center disabled:opacity-60"
          >
            {processing ? "Procesando..." : `Pagar ${formatCOP(total)}`}
          </button>
          <p className="text-[10px] text-humo text-center mt-3">
            🔒 Pago seguro. Tus datos están protegidos.
          </p>
        </div>
      </form>
    </div>
  );
}
