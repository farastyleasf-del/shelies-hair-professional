"use client";
import { useState } from "react";
import { globalFAQ } from "@/lib/data";

export default function ContactoPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-poppins font-bold text-3xl mb-3">Contacto</h1>
        <p className="text-humo max-w-lg mx-auto">
          ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Info de contacto */}
        <div className="space-y-6">
          <div className="card-premium p-6">
            <h3 className="font-poppins font-semibold mb-3">📍 Sede Sur — Barrio Olarte</h3>
            <p className="text-sm text-humo">Calle 56a Sur #71F-15</p>
            <p className="text-sm text-humo">Bogotá, Colombia</p>
          </div>
          <div className="card-premium p-6">
            <h3 className="font-poppins font-semibold mb-3">📍 Sede Norte — Barrio Gilmar</h3>
            <p className="text-sm text-humo">Carrera 59 #160-06</p>
            <p className="text-sm text-humo">Bogotá, Colombia</p>
          </div>
          <div className="card-premium p-6">
            <h3 className="font-poppins font-semibold mb-3">📱 WhatsApp</h3>
            <a href="https://wa.me/573246828585" target="_blank" rel="noopener noreferrer" className="text-sm text-vino font-semibold hover:underline block">
              324 682 8585
            </a>
            <a href="https://wa.me/573197933287" target="_blank" rel="noopener noreferrer" className="text-sm text-vino font-semibold hover:underline block mt-1">
              319 793 3287
            </a>
          </div>
          <div className="card-premium p-6">
            <h3 className="font-poppins font-semibold mb-3">📸 Instagram</h3>
            <a href="https://instagram.com/shelie_siemprebellas" target="_blank" rel="noopener noreferrer" className="text-sm text-vino font-semibold hover:underline">
              @shelie_siemprebellas
            </a>
            <h3 className="font-poppins font-semibold mb-2 mt-4">🎵 TikTok</h3>
            <a href="https://tiktok.com/@shelieshely" target="_blank" rel="noopener noreferrer" className="text-sm text-vino font-semibold hover:underline">
              @shelieshely
            </a>
          </div>
        </div>

        {/* Formulario */}
        <div className="card-premium p-6">
          <h3 className="font-poppins font-semibold mb-4">Envíanos un mensaje</h3>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs text-humo block mb-1">Nombre</label>
              <input className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
            </div>
            <div>
              <label className="text-xs text-humo block mb-1">Email</label>
              <input type="email" className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
            </div>
            <div>
              <label className="text-xs text-humo block mb-1">Asunto</label>
              <input className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
            </div>
            <div>
              <label className="text-xs text-humo block mb-1">Mensaje</label>
              <textarea rows={4} className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30 resize-none" />
            </div>
            <button type="submit" className="btn-vino w-full">Enviar mensaje</button>
          </form>
        </div>
      </div>

      {/* FAQ */}
      <section id="faq">
        <h2 className="font-poppins font-bold text-2xl text-center mb-8">Preguntas Frecuentes</h2>
        <div className="max-w-2xl mx-auto space-y-3">
          {globalFAQ.map((f, i) => (
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
      </section>
    </div>
  );
}
