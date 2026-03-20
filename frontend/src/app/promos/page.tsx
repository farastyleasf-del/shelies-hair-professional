import Link from "next/link";
import { promos } from "@/lib/data";

export default function PromosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-poppins font-bold text-3xl mb-3">Promociones</h1>
        <p className="text-humo max-w-lg mx-auto">
          Aprovecha nuestras ofertas especiales y ahorra en tu rutina capilar.
        </p>
      </div>

      <div className="space-y-6 mb-12">
        {promos.filter((p) => p.active).map((promo) => (
          <div key={promo.id} className="card-premium p-8 flex flex-col md:flex-row items-center gap-6 bg-hero-glossy">
            <div className="flex-shrink-0 bg-vino text-white w-24 h-24 rounded-full flex flex-col items-center justify-center">
              <span className="font-poppins font-bold text-2xl">{promo.discountPct}%</span>
              <span className="text-[10px] uppercase tracking-wider">OFF</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-poppins font-semibold text-xl mb-1">{promo.description}</h2>
              <p className="text-humo text-sm mb-3">
                Usa el código <span className="font-mono font-bold text-vino bg-white px-2 py-0.5 rounded">{promo.code}</span> en el checkout
              </p>
              <p className="text-xs text-humo">Válido hasta {new Date(promo.validUntil).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <Link href="/tienda" className="btn-vino flex-shrink-0">Ir a comprar</Link>
          </div>
        ))}
      </div>

      {/* Envío gratis */}
      <div className="card-premium p-8 text-center">
        <span className="text-4xl block mb-3">🚚</span>
        <h2 className="font-poppins font-semibold text-xl mb-2">Envío gratis</h2>
        <p className="text-humo text-sm">En todas las compras superiores a $150.000 COP</p>
      </div>
    </div>
  );
}
