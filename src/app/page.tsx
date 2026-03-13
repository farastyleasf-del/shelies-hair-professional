"use client";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products, testimonials, globalFAQ, routines } from "@/lib/data";
import { useChat } from "@/lib/chat-context";
import { useState } from "react";

export default function HomePage() {
  const { open } = useChat();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const topProducts = products.filter((p) => p.badges.includes("bestseller") || p.badges.includes("new")).slice(0, 6);

  return (
    <>
      {/* ═══════ HERO ═══════ */}
      <section className="bg-hero-glossy">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center">
          <h1 className="font-poppins font-bold text-4xl md:text-6xl leading-tight mb-5 text-carbon max-w-3xl">
            Cabello con brillo real y control de frizz
          </h1>
          <p className="text-humo text-lg md:text-xl max-w-xl mb-8">
            Rutinas en casa + asesoría para elegir lo ideal para tu cabello
          </p>
          <div className="flex gap-4">
            <Link href="/tienda" className="btn-vino">Comprar ahora</Link>
            <Link href="/resultados" className="btn-outline">Ver resultados</Link>
          </div>
        </div>
      </section>

      {/* ═══════ PRODUCTOS TOP ═══════ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-poppins font-bold text-2xl md:text-3xl">Más vendidos</h2>
            <p className="text-humo text-sm mt-1">Los favoritos de nuestra comunidad</p>
          </div>
          <Link href="/tienda" className="text-vino text-sm font-semibold hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ═══════ RUTINAS POR OBJETIVO ═══════ */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-poppins font-bold text-2xl md:text-3xl text-center mb-3">
            Elige tu rutina ideal
          </h2>
          <p className="text-humo text-center text-sm mb-10 max-w-lg mx-auto">
            Selecciona tu objetivo y te mostramos los productos perfectos para ti
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {routines.map((r) => (
              <Link
                key={r.slug}
                href={`/tienda?objective=${r.objective}`}
                className="card-premium p-8 text-center group hover:-translate-y-1 transition-transform"
              >
                <span className="text-5xl block mb-4">{r.icon}</span>
                <h3 className="font-poppins font-semibold text-lg mb-2 group-hover:text-vino transition-colors">
                  {r.title}
                </h3>
                <p className="text-humo text-sm">{r.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ RESULTADOS / TESTIMONIOS ═══════ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="font-poppins font-bold text-2xl md:text-3xl text-center mb-3">
          Resultados reales
        </h2>
        <p className="text-humo text-center text-sm mb-10">Lo que dicen quienes ya probaron nuestras rutinas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="card-premium p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-dorado" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-carbon/80 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <p className="text-xs font-semibold text-vino">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ REELS ═══════ */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-poppins font-bold text-2xl md:text-3xl text-center mb-3">
            Míranos en acción
          </h2>
          <p className="text-humo text-center text-sm mb-10 max-w-lg mx-auto">
            Resultados reales, técnicas profesionales y transformaciones que hablan por sí solas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { src: "/videos/reel-2.mp4", label: "Transformación capilar" },
              { src: "/videos/reel-4.mp4", label: "Alisado orgánico" },
              { src: "/videos/reel-5.mp4", label: "Resultados Shelie's" },
            ].map((reel) => (
              <div key={reel.src} className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-carbon shadow-card group">
                <video
                  src={reel.src}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-vino/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <span className="text-white text-xs font-semibold tracking-wide">{reel.label}</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ CORTO ═══════ */}
      <section className="bg-blush-light py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-poppins font-bold text-2xl text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {globalFAQ.slice(0, 4).map((f, i) => (
              <button
                key={i}
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full text-left bg-white rounded-2xl p-5 shadow-sm hover:shadow-card transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{f.question}</span>
                  <svg
                    className={`w-5 h-5 text-humo transition-transform ${faqOpen === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
                {faqOpen === i && (
                  <p className="mt-3 text-sm text-humo leading-relaxed">{f.answer}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-poppins font-bold text-2xl md:text-3xl mb-3">¿No sabes cuál elegir?</h2>
        <p className="text-humo text-sm mb-6 max-w-md mx-auto">
          Nuestro asesor inteligente te recomienda la rutina perfecta en menos de 1 minuto.
        </p>
        <button onClick={open} className="btn-vino text-base px-10 py-4">
          Hablar con el asesor IA
        </button>
      </section>
    </>
  );
}
