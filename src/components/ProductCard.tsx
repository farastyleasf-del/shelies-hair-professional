"use client";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCOP } from "@/lib/data";
import { useCart } from "@/lib/cart-context";

const badgeLabels: Record<string, string> = {
  bestseller: "Más vendido",
  new: "Nuevo",
  promo: "Promo",
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="card-premium group flex flex-col">
      {/* Image */}
      <Link href={`/tienda/${product.slug}`} className="relative aspect-square overflow-hidden">
        <Image
          src={product.images && product.images.length > 0 ? product.images[0] : "/images/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.badges.map((b) => (
            <span key={b} className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider ${
              b === "bestseller" ? "bg-dorado/20 text-dorado" :
              b === "promo" ? "bg-vino/15 text-vino" :
              "bg-carbon/10 text-carbon"
            }`}>
              {badgeLabels[b]}
            </span>
          ))}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="font-poppins font-semibold text-sm leading-snug mb-1 group-hover:text-vino transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-humo mb-3 line-clamp-1">{product.tagline}</p>

        {/* Benefits mini */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.benefits.slice(0, 2).map((b) => (
            <span key={b} className="chip">{b}</span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="precio text-base">{formatCOP(product.price)}</span>
            {product.comparePrice && (
              <span className="block text-xs text-humo line-through">{formatCOP(product.comparePrice)}</span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            className="btn-gradient text-xs px-4 py-2"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
