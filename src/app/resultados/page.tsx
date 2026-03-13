import { testimonials } from "@/lib/data";

export default function ResultadosPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-poppins font-bold text-3xl mb-3">Resultados Reales</h1>
        <p className="text-humo max-w-lg mx-auto">
          Estos son los resultados de personas reales que usan nuestras rutinas capilares.
        </p>
      </div>

      {/* Before/After visual cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {[
          { title: "Control de Frizz", subtitle: "Después de 4 semanas con el Kit Control Frizz", emoji: "💫" },
          { title: "Restauración Total", subtitle: "Cabello decolorado recuperado con Mascarilla Restauración", emoji: "🌟" },
          { title: "Brillo Espejo", subtitle: "Resultado después de 2 semanas con Sérum Brillo", emoji: "✨" },
          { title: "Hidratación Profunda", subtitle: "Cabello seco transformado con Shampoo Hidratante", emoji: "💧" },
        ].map((r) => (
          <div key={r.title} className="card-premium overflow-hidden">
            <div className="bg-hero-glossy p-8 text-center">
              <span className="text-5xl block mb-3">{r.emoji}</span>
              <h3 className="font-poppins font-semibold text-lg">{r.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-humo">{r.subtitle}</p>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 bg-blush/20 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-humo uppercase tracking-wider mb-1">Antes</p>
                  <p className="text-2xl">😔</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-humo uppercase tracking-wider mb-1">Después</p>
                  <p className="text-2xl">😍</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonios */}
      <h2 className="font-poppins font-bold text-2xl text-center mb-8">Lo que dicen nuestras clientas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t) => (
          <div key={t.id} className="card-premium p-6">
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: t.rating }).map((_, i) => (
                <svg key={i} className="w-4 h-4 text-dorado" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-carbon/80 mb-3 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
            <p className="text-xs font-semibold text-vino">{t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
