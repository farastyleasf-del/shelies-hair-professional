"use client";
import { useState } from "react";
import { globalFAQ } from "@/lib/data";
import { apiUrl } from "@/lib/api";

export default function ContactoPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error,   setError]     = useState("");

  function update(field: string, val: string) {
    setForm((p) => ({ ...p, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Por favor completa nombre, email y mensaje.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Error al enviar");
      }
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

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
            <a href="https://wa.me/573042741979" target="_blank" rel="noopener noreferrer" className="text-sm text-vino font-semibold hover:underline block">
              304 274 1979
            </a>
            <a href="https://wa.me/573246828585" target="_blank" rel="noopener noreferrer" className="text-sm text-vino font-semibold hover:underline block mt-1">
              324 682 8585
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

          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="font-poppins font-semibold text-carbon">¡Mensaje enviado!</p>
                <p className="text-sm text-humo mt-1">Te responderemos a la brevedad por email o WhatsApp.</p>
              </div>
              <button onClick={() => setSuccess(false)} className="text-sm text-vino font-semibold hover:underline">
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs text-humo block mb-1">Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Asunto</label>
                <input
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  placeholder="¿En qué te podemos ayudar?"
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                />
              </div>
              <div>
                <label className="text-xs text-humo block mb-1">Mensaje *</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Escribe tu mensaje aquí…"
                  className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button type="submit" disabled={sending} className="btn-vino w-full disabled:opacity-60 flex items-center justify-center gap-2">
                {sending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Enviando…
                  </>
                ) : "Enviar mensaje"}
              </button>
            </form>
          )}
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
