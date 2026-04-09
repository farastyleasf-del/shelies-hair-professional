"use client";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { products, testimonials, globalFAQ, routines } from "@/lib/data";
import { useChat } from "@/lib/chat-context";
import { useState, useRef, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import type { Product } from "@/lib/types";

// ── DB types ──────────────────────────────────────────────────────────────────
interface DBProduct {
  id: number; slug: string; name: string; tagline: string;
  price: number; compare_price: number | null;
  category: string; stock: number; images: string[]; badges: string[];
  benefits: string[]; for_whom: string; is_active: boolean;
  objective?: string[]; hair_type?: string[];
}

function toProduct(p: DBProduct): Product {
  return {
    id: String(p.id), slug: p.slug, name: p.name,
    tagline: p.tagline, price: p.price, comparePrice: p.compare_price ?? undefined,
    images: p.images, badges: p.badges as Product["badges"],
    benefits: p.benefits, forWhom: p.for_whom,
    howToUse: [], faq: [], category: p.category as Product["category"],
    objective: (p.objective ?? []) as Product["objective"],
    hairType: (p.hair_type ?? []) as Product["hairType"],
    stock: p.stock, crossSell: [],
  };
}

/* ── Video con lazy load ─────────────────────────────── */
function VideoReel({ src, label, tag }: { src: string; label: string; tag: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { video.load(); video.play().catch(() => {}); }
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-carbon group shadow-lg hover:shadow-xl transition-shadow duration-300">
      <video ref={ref} src={src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loop muted playsInline preload="none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <span className="absolute top-4 left-4 text-[10px] bg-black/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-full border border-white/20 font-medium tracking-wide">
        {tag}
      </span>
      <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-0 transition-opacity duration-300">
        <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <p className="absolute bottom-5 left-5 text-white font-poppins font-semibold text-sm drop-shadow-sm">{label}</p>
    </div>
  );
}

/* ── Separador decorativo entre secciones ────────────── */
function Divider({ from, to }: { from: string; to: string }) {
  return <div className={`h-12 bg-gradient-to-b ${from} ${to}`} />;
}

/* ── Página principal ────────────────────────────────── */
export default function HomePage() {
  const { open } = useChat();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [dbProducts, setDbProducts] = useState<DBProduct[] | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/products"))
      .then((r) => r.json())
      .then((d: { success: boolean; data: DBProduct[] }) => {
        if (d.success) setDbProducts(d.data.filter((p) => p.is_active));
      })
      .catch(() => {});
  }, []);

  const sourceProducts: DBProduct[] = dbProducts ?? products.map((p) => ({
    id: parseInt(p.id) || 0, slug: p.slug, name: p.name, tagline: p.tagline ?? "",
    price: p.price, compare_price: p.comparePrice ?? null,
    category: p.category, stock: p.stock ?? 0,
    images: p.images, badges: p.badges, benefits: p.benefits,
    for_whom: p.forWhom, is_active: true,
    objective: p.objective, hair_type: p.hairType,
  } as DBProduct));

  const topProducts = sourceProducts
    .filter((p) => p.badges.includes("bestseller") || p.badges.includes("new"))
    .slice(0, 6);

  return (
    <>
      {/* ═══════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blush-light via-white to-white">
        {/* Orbs decorativos de fondo */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blush/40 blur-[120px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blush/30 blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* ── Texto ── */}
          <div>
            <span className="inline-block text-[11px] tracking-[0.3em] text-fucsia uppercase font-semibold mb-5 px-3 py-1.5 bg-blush/60 rounded-full border border-blush">
              Shelie&apos;s Hair Professional · Colombia
            </span>
            <h1 className="font-poppins font-bold text-4xl md:text-5xl lg:text-[3.5rem] text-carbon leading-[1.08] mb-6">
              Cuida tu cabello<br />
              como una{" "}
              <span className="relative inline-block">
                <span className="text-vino">profesional</span>
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 4 Q50 1 100 3 Q150 5 198 2" stroke="#D93879" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
            </h1>
            <p className="text-humo text-lg leading-relaxed max-w-md mb-9">
              Productos capilares profesionales con resultados reales. Alisado orgánico, hidratación profunda y tratamientos diseñados para tu cabello.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/tienda" className="btn-vino text-center">
                Ver productos
              </Link>
              <Link href="/servicios" className="btn-outline text-center">
                Servicios del salón
              </Link>
            </div>

            {/* Métricas */}
            <div className="flex gap-0 mt-10 pt-8 border-t border-blush/60 divide-x divide-blush/50">
              {[
                { num: "+1.200", label: "clientas satisfechas" },
                { num: "+7 años", label: "de experiencia" },
                { num: "30+",    label: "productos pro" },
              ].map((s) => (
                <div key={s.label} className="flex-1 text-center first:text-left last:text-right px-4 first:pl-0 last:pr-0">
                  <p className="font-poppins font-bold text-2xl text-vino leading-none">{s.num}</p>
                  <p className="text-[11px] text-humo mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Imagen ── */}
          <div className="relative">
            {/* Marco decorativo desplazado */}
            <div className="absolute -top-3 -right-3 w-full h-full rounded-3xl border-2 border-blush/60 pointer-events-none" />
            <div className="relative h-[440px] md:h-[540px] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(94,11,43,0.15)]">
              <Image
                src="/images/products/sheliss-therapy-modelo.jpg"
                alt="Resultado Shelie's"
                fill
                className="object-cover object-top"
                sizes="(max-width:1024px) 100vw, 50vw"
                priority
              />
              {/* Overlay sutil en la parte baja */}
              <div className="absolute inset-0 bg-gradient-to-t from-vino/20 via-transparent to-transparent" />
            </div>
            {/* Badge flotante */}
            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl border border-blush/40">
              <p className="text-[10px] text-humo uppercase tracking-wider mb-0.5">Tratamiento estrella</p>
              <p className="font-poppins font-bold text-sm text-vino">Sheliss Therapy</p>
              <p className="text-[11px] text-fucsia font-medium mt-0.5">0% formol · resultados en 1 sesión</p>
            </div>
          </div>
        </div>
      </section>

      <Divider from="from-white" to="to-blush-light" />

      {/* ═══════════════════════════════════════════════
          PRODUCTOS MÁS VENDIDOS
          ═══════════════════════════════════════════════ */}
      <section className="bg-blush-light py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">

          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-fucsia uppercase font-semibold mb-2">Tienda online</p>
              <h2 className="font-poppins font-bold text-3xl md:text-4xl text-carbon">Más vendidos</h2>
            </div>
            <Link href="/tienda"
              className="mt-5 sm:mt-0 inline-flex items-center gap-1.5 text-sm text-vino font-semibold border-b border-vino/30 hover:border-vino pb-0.5 transition-colors">
              Ver catálogo completo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {dbProducts === null ? (
            /* Skeleton loading sutil mientras carga la API */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-premium flex flex-col overflow-hidden animate-pulse">
                  <div className="aspect-square bg-blush/40 rounded-t-2xl" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-4 bg-blush/50 rounded-full w-3/4" />
                    <div className="h-3 bg-blush/30 rounded-full w-full" />
                    <div className="h-3 bg-blush/30 rounded-full w-2/3" />
                    <div className="h-8 bg-blush/40 rounded-xl mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topProducts.map((p) => (
                <ProductCard key={p.id} product={toProduct(p)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Divider from="from-blush-light" to="to-vino" />

      {/* ═══════════════════════════════════════════════
          SERVICIOS DEL SALÓN
          ═══════════════════════════════════════════════ */}
      <section className="bg-vino py-20 md:py-28 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-fucsia/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-fucsia/8 blur-[80px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-rosa/70 uppercase font-semibold mb-2">Salón profesional</p>
              <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white">Nuestros servicios</h2>
            </div>
            <Link href="/servicios"
              className="mt-5 sm:mt-0 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
              Ver todos los servicios
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "✨", title: "Alisado Orgánico Efecto Shelie's", desc: "Sin formol · resultados hasta 8 meses", tag: "Más pedido" },
              { icon: "💆‍♀️", title: "Botox Capilar Canela",            desc: "Restauración, brillo y efecto anti-edad capilar", tag: "" },
              { icon: "🌿", title: "Terapia de Reconstrucción",        desc: "Repara fibra dañada desde adentro", tag: "" },
              { icon: "💅", title: "Repolarización Capilar",           desc: "Cronograma capilar completo", tag: "Nuevo" },
            ].map((s) => (
              <Link key={s.title} href="/servicios"
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.12] hover:border-white/25 p-6 transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                {s.tag && (
                  <span className="absolute top-4 right-4 text-[10px] bg-fucsia/25 text-rosa px-2 py-0.5 rounded-full border border-fucsia/20 font-medium">
                    {s.tag}
                  </span>
                )}
                {/* Accent line top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-fucsia/0 via-fucsia/60 to-fucsia/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl block mb-5">{s.icon}</span>
                <h3 className="font-poppins font-semibold text-white text-[13px] mb-2 leading-snug flex-1">{s.title}</h3>
                <p className="text-white/45 text-xs leading-relaxed mb-4">{s.desc}</p>
                <span className="inline-flex items-center gap-1 text-rosa text-xs font-semibold group-hover:gap-2 transition-all">
                  Reservar cita
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Divider from="from-vino" to="to-white" />

      {/* ═══════════════════════════════════════════════
          RUTINAS POR OBJETIVO
          ═══════════════════════════════════════════════ */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.3em] text-fucsia uppercase font-semibold mb-2">Encuentra tu rutina</p>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-carbon">¿Cuál es tu objetivo?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {routines.map((r) => (
              <Link key={r.slug} href={`/tienda?objective=${r.objective}`}
                className="group card-premium p-7 text-center hover:-translate-y-2 hover:shadow-card-hover transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blush-light group-hover:bg-blush transition-colors mx-auto mb-4 flex items-center justify-center text-3xl">
                  {r.icon}
                </div>
                <h3 className="font-poppins font-semibold text-sm text-carbon mb-2 group-hover:text-vino transition-colors leading-snug">{r.title}</h3>
                <p className="text-xs text-humo leading-relaxed">{r.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TRANSFORMACIONES — Reels
          ═══════════════════════════════════════════════ */}
      <section className="bg-blush-light py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.3em] text-fucsia uppercase font-semibold mb-2">Resultados reales</p>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-carbon">Míranos en acción</h2>
            <p className="text-humo mt-3 max-w-sm mx-auto text-sm leading-relaxed">Técnicas profesionales aplicadas en el salón — antes y después reales</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <VideoReel src="/videos/reel-2.mp4" label="Transformación capilar" tag="Antes & Después" />
            <VideoReel src="/videos/reel-4.mp4" label="Alisado orgánico"       tag="Tratamiento" />
            <VideoReel src="/videos/reel-5.mp4" label="Resultados Shelie's"    tag="Resultado final" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIOS
          ═══════════════════════════════════════════════ */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.3em] text-fucsia uppercase font-semibold mb-2">Reseñas verificadas</p>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-carbon">Lo que dicen ellas</h2>
            {/* Estrellas globales */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-dorado" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-carbon">4.9</span>
              <span className="text-sm text-humo">· +1.200 reseñas</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <div key={t.id}
                className={`relative rounded-2xl p-6 overflow-hidden border ${
                  i % 2 === 0
                    ? "bg-blush-light border-blush/50"
                    : "bg-vino border-vino/50"
                }`}>
                {/* Acento de borde superior */}
                <div className={`absolute top-0 left-6 right-6 h-[2px] rounded-b-full ${i % 2 === 0 ? "bg-fucsia/30" : "bg-rosa/40"}`} />
                <div className="flex gap-0.5 mb-4 mt-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <svg key={j} className="w-3.5 h-3.5 text-dorado" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className={`text-sm leading-relaxed mb-5 ${i % 2 === 0 ? "text-carbon/75" : "text-white/80"}`}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i % 2 === 0 ? "bg-vino text-white" : "bg-white/20 text-white"
                  }`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${i % 2 === 0 ? "text-vino" : "text-white"}`}>{t.name}</p>
                    <p className={`text-[10px] ${i % 2 === 0 ? "text-humo" : "text-white/45"}`}>Clienta verificada</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════════ */}
      <section className="bg-blush-light py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.3em] text-fucsia uppercase font-semibold mb-2">¿Tienes dudas?</p>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-carbon">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-2">
            {globalFAQ.slice(0, 5).map((f, i) => (
              <div key={i}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${faqOpen === i ? "shadow-card ring-1 ring-blush" : "hover:shadow-card"}`}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left flex justify-between items-center px-6 py-4 gap-4"
                >
                  <span className="font-poppins font-medium text-sm text-carbon">{f.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${faqOpen === i ? "bg-vino rotate-180" : "bg-blush-light"}`}>
                    <svg className={`w-4 h-4 ${faqOpen === i ? "text-white" : "text-vino"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5 border-t border-blush/40">
                    <p className="text-sm text-humo leading-relaxed pt-4">{f.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA FINAL
          ═══════════════════════════════════════════════ */}
      <section className="relative bg-vino py-24 md:py-32 overflow-hidden">
        {/* Decoración */}
        <div className="absolute inset-0 bg-gradient-to-br from-vino via-vino to-fucsia/30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-fucsia/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-8 right-12 w-32 h-32 rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute bottom-8 left-12 w-20 h-20 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <p className="text-[11px] tracking-[0.3em] text-white/35 uppercase font-semibold mb-5">Asesoría gratuita</p>
          <h2 className="font-poppins font-bold text-3xl md:text-5xl text-white mb-5 leading-tight">
            ¿No sabes qué producto<br />necesitas?
          </h2>
          <p className="text-white/55 mb-10 max-w-sm mx-auto text-base leading-relaxed">
            Habla con nuestra asesora y te recomendamos la rutina ideal para tu tipo de cabello.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={open}
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full bg-white text-vino font-poppins font-semibold text-sm hover:bg-blush-light transition-colors shadow-lg hover:shadow-xl">
              Chatear ahora
            </button>
            <Link href="/servicios"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full border border-white/25 text-white font-poppins font-semibold text-sm hover:bg-white/10 hover:border-white/40 transition-all">
              Reservar cita
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
