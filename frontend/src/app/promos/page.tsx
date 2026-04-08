"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import type { Promotion } from "@/lib/types";
import { PROMO_TYPES } from "@/lib/types";

function timeRemaining(endsAt: string | null) {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Finalizado";
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} día${days > 1 ? "s" : ""} restante${days > 1 ? "s" : ""}`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h restantes`;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/promos"))
      .then(r => r.ok ? r.json() : [])
      .then((data: Promotion[]) => setPromos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const typeInfo = (type: string) => PROMO_TYPES.find(t => t.type === type);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-poppins font-bold text-3xl mb-3" style={{ color: "#5E0B2B" }}>
          Promociones y Concursos
        </h1>
        <p className="text-humo max-w-lg mx-auto">
          Participa en nuestras rifas, ruletas y concursos. Gana premios increíbles.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-vino/20 border-t-vino rounded-full animate-spin" />
        </div>
      ) : promos.length === 0 ? (
        <div className="card-premium p-16 text-center mb-6">
          <p className="text-5xl mb-4">🎉</p>
          <p className="font-poppins font-semibold text-lg mb-2">Próximamente</p>
          <p className="text-humo text-sm">
            Estamos preparando promociones especiales para ti. ¡Vuelve pronto!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map(promo => {
            const ti = typeInfo(promo.type);
            const remaining = timeRemaining(promo.ends_at);
            return (
              <Link key={promo.id} href={`/promos/${promo.id}`} className="block group">
                <div className="card-premium overflow-hidden transition-all group-hover:shadow-lg group-hover:scale-[1.02]"
                  style={{ borderColor: ti?.color + "40" }}>
                  {/* Banner */}
                  {promo.banner_image ? (
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${promo.banner_image})` }} />
                  ) : (
                    <div className="h-40 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ti?.color}20, ${ti?.color}40)` }}>
                      <span className="text-6xl">{ti?.icon ?? "🎁"}</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{ backgroundColor: ti?.color + "20", color: ti?.color }}>
                        {ti?.label}
                      </span>
                      {remaining && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {remaining}
                        </span>
                      )}
                    </div>
                    <h2 className="font-poppins font-bold text-lg mb-1" style={{ color: "#1a1a1a" }}>
                      {promo.title}
                    </h2>
                    <p className="text-humo text-sm line-clamp-2 mb-3">
                      {promo.description || ti?.desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-humo">{promo.participant_count ?? 0} participantes</span>
                      <span className="btn-vino text-xs py-1.5 px-4 group-hover:bg-fucsia transition-colors">
                        Participar
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Envío gratis — siempre visible */}
      <div className="card-premium p-8 text-center mt-12">
        <span className="text-4xl block mb-3">🚚</span>
        <h2 className="font-poppins font-semibold text-xl mb-2">Envío gratis</h2>
        <p className="text-humo text-sm">En todas las compras superiores a $150.000 COP</p>
        <Link href="/tienda" className="btn-vino mt-4 inline-block">Ir a la tienda</Link>
      </div>
    </div>
  );
}
