"use client";
import { useState } from "react";
import { testimonials as initialTestimonials, globalFAQ as initialFAQ } from "@/lib/data";

export default function AdminContenido() {
  const [testimonios, setTestimonios] = useState(initialTestimonials);
  const [faqs, setFaqs] = useState(initialFAQ);
  const [tab, setTab] = useState<"testimonios" | "faq" | "banners">("testimonios");

  const [newTestimonio, setNewTestimonio] = useState({ name: "", text: "", rating: 5 });
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  function addTestimonio() {
    if (!newTestimonio.name || !newTestimonio.text) return;
    setTestimonios((prev) => [...prev, { ...newTestimonio, id: `t-${Date.now()}` }]);
    setNewTestimonio({ name: "", text: "", rating: 5 });
  }

  function addFaq() {
    if (!newFaq.question || !newFaq.answer) return;
    setFaqs((prev) => [...prev, newFaq]);
    setNewFaq({ question: "", answer: "" });
  }

  return (
    <div>
      <h1 className="font-poppins font-bold text-2xl mb-6">Contenido</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["testimonios", "faq", "banners"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t ? "bg-vino text-white" : "bg-white text-humo hover:bg-blush/20"
            }`}
          >
            {t === "testimonios" ? "Testimonios" : t === "faq" ? "FAQ" : "Banners"}
          </button>
        ))}
      </div>

      {/* Testimonios */}
      {tab === "testimonios" && (
        <div>
          <div className="card-premium p-6 mb-4">
            <h3 className="font-poppins font-semibold mb-3">Agregar testimonio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input value={newTestimonio.name} onChange={(e) => setNewTestimonio((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre" className="border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              <input type="number" min={1} max={5} value={newTestimonio.rating} onChange={(e) => setNewTestimonio((p) => ({ ...p, rating: Number(e.target.value) }))}
                placeholder="Rating (1-5)" className="border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              <input value={newTestimonio.text} onChange={(e) => setNewTestimonio((p) => ({ ...p, text: e.target.value }))}
                placeholder="Testimonio" className="border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
            </div>
            <button onClick={addTestimonio} className="btn-vino text-sm">Agregar</button>
          </div>

          <div className="space-y-3">
            {testimonios.map((t) => (
              <div key={t.id} className="card-premium p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t.name} <span className="text-dorado">{"★".repeat(t.rating)}</span></p>
                  <p className="text-xs text-humo mt-1">{t.text}</p>
                </div>
                <button onClick={() => setTestimonios((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-xs text-red-500 hover:underline flex-shrink-0 ml-4">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {tab === "faq" && (
        <div>
          <div className="card-premium p-6 mb-4">
            <h3 className="font-poppins font-semibold mb-3">Agregar pregunta</h3>
            <div className="space-y-3 mb-3">
              <input value={newFaq.question} onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))}
                placeholder="Pregunta" className="w-full border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
              <textarea value={newFaq.answer} onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))} rows={2}
                placeholder="Respuesta" className="w-full border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30 resize-none" />
            </div>
            <button onClick={addFaq} className="btn-vino text-sm">Agregar</button>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="card-premium p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{f.question}</p>
                  <p className="text-xs text-humo mt-1">{f.answer}</p>
                </div>
                <button onClick={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500 hover:underline flex-shrink-0 ml-4">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banners */}
      {tab === "banners" && (
        <div className="card-premium p-6 text-center">
          <p className="text-humo text-sm">Módulo de banners — próximamente.</p>
          <p className="text-xs text-humo mt-2">Aquí podrás gestionar los banners del hero y secciones promocionales.</p>
        </div>
      )}
    </div>
  );
}
