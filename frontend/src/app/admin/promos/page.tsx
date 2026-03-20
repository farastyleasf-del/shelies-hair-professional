"use client";
import { useState } from "react";
import { promos as initialPromos } from "@/lib/data";
import { Promo } from "@/lib/types";

export default function AdminPromos() {
  const [promosList, setPromosList] = useState<Promo[]>(initialPromos);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", discountPct: 10, validUntil: "2026-12-31" });

  function handleAdd() {
    const newPromo: Promo = {
      id: `p-${Date.now()}`,
      code: form.code.toUpperCase(),
      description: form.description,
      discountPct: form.discountPct,
      active: true,
      validUntil: form.validUntil,
    };
    setPromosList((prev) => [...prev, newPromo]);
    setShowForm(false);
    setForm({ code: "", description: "", discountPct: 10, validUntil: "2026-12-31" });
  }

  function toggleActive(id: string) {
    setPromosList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  }

  function handleDelete(id: string) {
    setPromosList((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-2xl">Promociones</h1>
        <button onClick={() => setShowForm(true)} className="btn-vino text-sm">+ Nueva promo</button>
      </div>

      {showForm && (
        <div className="card-premium p-6 mb-6 border-2 border-vino/20">
          <h2 className="font-poppins font-semibold mb-4">Nueva promoción</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-humo block mb-1">Código</label>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                className="w-full border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                placeholder="VERANO20" />
            </div>
            <div>
              <label className="text-xs text-humo block mb-1">Descuento (%)</label>
              <input type="number" value={form.discountPct} onChange={(e) => setForm((p) => ({ ...p, discountPct: Number(e.target.value) }))}
                className="w-full border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
            </div>
            <div>
              <label className="text-xs text-humo block mb-1">Descripción</label>
              <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30"
                placeholder="20% en productos de verano" />
            </div>
            <div>
              <label className="text-xs text-humo block mb-1">Válido hasta</label>
              <input type="date" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                className="w-full border border-blush/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} className="btn-vino text-sm">Crear</button>
            <button onClick={() => setShowForm(false)} className="btn-outline text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {promosList.map((promo) => (
          <div key={promo.id} className="card-premium p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-vino text-white w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <span className="font-poppins font-bold text-lg">{promo.discountPct}%</span>
              </div>
              <div>
                <p className="font-medium">{promo.description}</p>
                <p className="text-xs text-humo">
                  Código: <span className="font-mono font-bold text-vino">{promo.code}</span> · Hasta {promo.validUntil}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleActive(promo.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  promo.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {promo.active ? "Activa" : "Inactiva"}
              </button>
              <button onClick={() => handleDelete(promo.id)} className="text-xs text-red-500 hover:underline">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
