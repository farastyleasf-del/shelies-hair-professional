"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatCOP, getProduct } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/types";

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [mainImg, setMainImg] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const crossProducts = product.crossSell
    .map((id) => getProduct(id))
    .filter(Boolean) as Product[];

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex gap-2 text-xs text-humo mb-6">
        <Link href="/tienda" className="hover:text-vino">Tienda</Link>
        <span>/</span>
        <span className="text-carbon">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* ── GALERÍA ── */}
        <div>
          <div className="relative aspect-square rounded-card overflow-hidden bg-white mb-4">
            <Image
              src={product.images[mainImg]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImg(i)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  mainImg === i ? "border-vino" : "border-transparent hover:border-blush"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        </div>

        {/* ── INFO ── */}
        <div>
          {/* Badges */}
          <div className="flex gap-2 mb-3">
            {product.badges.map((b) => (
              <span key={b} className="badge-dorado">
                {b === "bestseller" ? "Más vendido" : b === "new" ? "Nuevo" : "Promo"}
              </span>
            ))}
          </div>

          <h1 className="font-poppins font-bold text-3xl mb-2">{product.name}</h1>
          <p className="text-humo mb-4">{product.tagline}</p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="precio text-3xl">{formatCOP(product.price)}</span>
            {product.comparePrice && (
              <span className="text-humo line-through text-lg">{formatCOP(product.comparePrice)}</span>
            )}
          </div>

          {/* Stock */}
          <p className="text-xs text-humo mb-6">
            {product.stock > 5
              ? <span className="text-green-600">✓ En stock ({product.stock} disponibles)</span>
              : product.stock > 0
              ? <span className="text-dorado">⚡ Últimas {product.stock} unidades</span>
              : <span className="text-red-500">Agotado</span>}
          </p>

          {/* Benefits chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.benefits.map((b) => (
              <span key={b} className="chip">{b}</span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex gap-3 mb-8">
            <button onClick={handleAdd} className="btn-vino flex-1" disabled={product.stock === 0}>
              {added ? "✓ Agregado" : "Agregar al carrito"}
            </button>
            <Link href="/carrito" onClick={handleAdd} className="btn-outline flex-1 text-center">
              Comprar ahora
            </Link>
          </div>

          {/* Para quién */}
          <div className="mb-6">
            <h3 className="font-poppins font-semibold text-sm mb-2">Para quién es</h3>
            <p className="text-sm text-humo leading-relaxed">{product.forWhom}</p>
          </div>

          {/* Cómo se usa */}
          <div className="mb-6">
            <h3 className="font-poppins font-semibold text-sm mb-2">Cómo se usa</h3>
            <ol className="space-y-2">
              {product.howToUse.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-humo">
                  <span className="bg-blush/30 text-vino font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Ingredientes */}
          {product.ingredients && (
            <div className="mb-6">
              <h3 className="font-poppins font-semibold text-sm mb-2">Ingredientes principales</h3>
              <p className="text-sm text-humo">{product.ingredients}</p>
            </div>
          )}

          {/* Precauciones */}
          {product.precautions && (
            <div className="mb-6 bg-blush-light rounded-xl p-4">
              <h3 className="font-poppins font-semibold text-sm mb-1">⚠ Precauciones</h3>
              <p className="text-sm text-humo">{product.precautions}</p>
            </div>
          )}

          {/* FAQ del producto */}
          {product.faq.length > 0 && (
            <div>
              <h3 className="font-poppins font-semibold text-sm mb-3">Preguntas frecuentes</h3>
              <div className="space-y-2">
                {product.faq.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full text-left bg-white rounded-xl p-4 border border-blush/20"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{f.q}</span>
                      <svg
                        className={`w-4 h-4 text-humo transition-transform ${faqOpen === i ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                    {faqOpen === i && (
                      <p className="mt-2 text-sm text-humo">{f.a}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CROSS-SELL ── */}
      {crossProducts.length > 0 && (
        <section>
          <h2 className="font-poppins font-bold text-2xl mb-6">Completa tu rutina</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {crossProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
