"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCOP } from "@/lib/data";
import { useState } from "react";

export default function CarritoPage() {
  const { items, count, subtotal, discount, shipping, total, updateQty, removeItem, appliedPromo, applyPromo, removePromo } = useCart();
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  function handleApplyPromo() {
    setPromoError("Cupón no válido o expirado");
  }

  if (count === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h1 className="font-poppins font-bold text-2xl mb-2">Tu carrito está vacío</h1>
        <p className="text-humo text-sm mb-6">Agrega productos y arma tu rutina ideal</p>
        <Link href="/tienda" className="btn-vino">Ir a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-poppins font-bold text-3xl mb-8">Carrito ({count})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="card-premium flex gap-4 p-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="96px" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/tienda/${item.product.slug}`} className="font-poppins font-semibold text-sm hover:text-vino">
                  {item.product.name}
                </Link>
                <p className="text-xs text-humo mt-1">{item.product.tagline}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-blush/40 rounded-full">
                    <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="px-3 py-1 text-sm hover:bg-blush/20 rounded-l-full">−</button>
                    <span className="px-3 text-sm font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="px-3 py-1 text-sm hover:bg-blush/20 rounded-r-full">+</button>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="text-xs text-humo hover:text-red-500">
                    Eliminar
                  </button>
                </div>
              </div>
              <span className="font-poppins font-bold text-sm whitespace-nowrap">
                {formatCOP(item.product.price * item.qty)}
              </span>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="card-premium p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-poppins font-semibold text-lg mb-4">Resumen</h2>

          <div className="space-y-2 text-sm mb-4">
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
              <span>{shipping === 0 ? <span className="text-green-600">Gratis</span> : formatCOP(shipping)}</span>
            </div>
            <hr className="border-blush/30" />
            <div className="flex justify-between font-poppins font-bold text-lg">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          {/* Promo */}
          {!appliedPromo ? (
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Código promo"
                  className="flex-1 border border-blush/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                />
                <button onClick={handleApplyPromo} className="text-sm font-semibold text-vino hover:underline">
                  Aplicar
                </button>
              </div>
              {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2 mb-4">
              <span className="text-xs text-green-700 font-medium">✓ {appliedPromo.code}</span>
              <button onClick={removePromo} className="text-xs text-red-500 hover:underline">Quitar</button>
            </div>
          )}

          {shipping > 0 && (
            <p className="text-xs text-humo mb-4">Envío gratis a partir de {formatCOP(150000)}</p>
          )}

          <Link href="/checkout" className="btn-vino w-full text-center block">
            Ir al checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
