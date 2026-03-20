"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ServiceItem, getStoredServices, saveServices } from "@/lib/store";
import { useAdminTheme } from "@/lib/admin-theme";

function emptyService(): ServiceItem {
  return {
    id: "", title: "", description: "", duration: "",
    highlights: [], image: "", before: undefined,
    type: "proceso", price: undefined, icon: undefined,
  };
}

export default function AdminServicios() {
  const t = useAdminTheme();
  const [list, setList] = useState<ServiceItem[]>([]);
  const [panel, setPanel] = useState<"closed" | "new" | "edit">("closed");
  const [form, setForm] = useState<ServiceItem>(emptyService());
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { setList(getStoredServices()); }, []);

  function persist(next: ServiceItem[]) {
    setList(next);
    saveServices(next);
  }

  function openNew() {
    setForm(emptyService());
    setEditId(null);
    setPanel("new");
  }

  function openEdit(s: ServiceItem) {
    setForm({ ...s });
    setEditId(s.id);
    setPanel("edit");
  }

  function handleSave() {
    const id = editId || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `srv-${Date.now()}`;
    const srv: ServiceItem = { ...form, id: editId || id };
    if (editId) {
      persist(list.map((s) => (s.id === editId ? srv : s)));
    } else {
      persist([...list, srv]);
    }
    setPanel("closed");
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    persist(list.filter((s) => s.id !== id));
  }

  const upd = <K extends keyof ServiceItem>(key: K, val: ServiceItem[K]) => setForm((f) => ({ ...f, [key]: val }));
  const toArr = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
  const fromArr = (a?: string[]) => (a || []).join("\n");

  const input = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30`;
  const inputStyle = { backgroundColor: t.colors.bg, borderColor: t.colors.border, color: t.colors.text };
  const label = `text-xs font-medium uppercase tracking-wider block mb-1`;
  const labelStyle = { color: t.colors.textMuted };

  const procesos = list.filter((s) => s.type === "proceso");
  const adicionales = list.filter((s) => s.type === "adicional");

  return (
    <div style={{ color: t.colors.text }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl">Servicios</h1>
          <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>
            {procesos.length} procesos capilares · {adicionales.length} adicionales ·{" "}
            <span style={{ color: t.colors.warning }}>Guardado en navegador</span>
          </p>
        </div>
        <button onClick={openNew} className="btn-vino text-sm">+ Nuevo servicio</button>
      </div>

      {/* Procesos */}
      <h2 className="font-semibold text-base mb-3 border-l-4 border-fucsia pl-3">Procesos Capilares</h2>
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: t.colors.bgDeep, color: t.colors.textMuted }} className="text-xs uppercase tracking-wider">
              <th className="p-4 text-left">Foto</th>
              <th className="p-4 text-left">Servicio</th>
              <th className="p-4 text-left">Duración</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {procesos.map((s) => (
              <tr key={s.id} className="border-t" style={{ borderColor: t.colors.border }}>
                <td className="p-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
                    {s.image && <Image src={s.image} alt={s.title} fill className="object-cover" sizes="56px" />}
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-xs mt-0.5 truncate max-w-[260px]" style={{ color: t.colors.textMuted }}>{s.description.slice(0, 80)}…</p>
                </td>
                <td className="p-4 text-sm" style={{ color: t.colors.textMuted }}>{s.duration}</td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(s)} className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:opacity-80" style={{ borderColor: t.colors.border, color: t.colors.text }}>✏️ Editar</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:opacity-80">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adicionales */}
      <h2 className="font-semibold text-base mb-3 border-l-4 border-rosa pl-3">Adicionales</h2>
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: t.colors.bgDeep, color: t.colors.textMuted }} className="text-xs uppercase tracking-wider">
              <th className="p-4 text-left">Foto</th>
              <th className="p-4 text-left">Servicio</th>
              <th className="p-4 text-left">Precio</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {adicionales.map((s) => (
              <tr key={s.id} className="border-t" style={{ borderColor: t.colors.border }}>
                <td className="p-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
                    {s.image && <Image src={s.image} alt={s.title} fill className="object-cover" sizes="56px" />}
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-semibold">{s.icon} {s.title}</p>
                  <p className="text-xs mt-0.5 truncate max-w-[260px]" style={{ color: t.colors.textMuted }}>{s.description.slice(0, 80)}…</p>
                </td>
                <td className="p-4 font-semibold text-fucsia">{s.price || "—"}</td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(s)} className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:opacity-80" style={{ borderColor: t.colors.border, color: t.colors.text }}>✏️ Editar</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:opacity-80">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over */}
      {panel !== "closed" && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setPanel("closed")} />
          <div className="w-full max-w-2xl h-full overflow-y-auto border-l" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <h2 className="font-poppins font-bold text-lg">{panel === "new" ? "Nuevo Servicio" : "Editar Servicio"}</h2>
              <button onClick={() => setPanel("closed")} className="text-2xl hover:opacity-60" style={{ color: t.colors.textMuted }}>✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={label} style={labelStyle}>Título</label>
                <input value={form.title} onChange={(e) => upd("title", e.target.value)} className={input} style={inputStyle} placeholder="Ej: Alisado Orgánico Efecto Shelie's" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label} style={labelStyle}>Tipo</label>
                  <select value={form.type} onChange={(e) => upd("type", e.target.value as "proceso" | "adicional")} className={input} style={inputStyle}>
                    <option value="proceso">Proceso Capilar</option>
                    <option value="adicional">Adicional</option>
                  </select>
                </div>
                <div>
                  <label className={label} style={labelStyle}>Duración</label>
                  <input value={form.duration} onChange={(e) => upd("duration", e.target.value)} className={input} style={inputStyle} placeholder="Ej: 5–6 meses" />
                </div>
              </div>

              {form.type === "adicional" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={label} style={labelStyle}>Precio</label>
                    <input value={form.price || ""} onChange={(e) => upd("price", e.target.value)} className={input} style={inputStyle} placeholder="Ej: $50.000" />
                  </div>
                  <div>
                    <label className={label} style={labelStyle}>Ícono (emoji)</label>
                    <input value={form.icon || ""} onChange={(e) => upd("icon", e.target.value)} className={input} style={inputStyle} placeholder="Ej: ⚡" />
                  </div>
                </div>
              )}

              <div>
                <label className={label} style={labelStyle}>Descripción completa</label>
                <textarea rows={4} value={form.description} onChange={(e) => upd("description", e.target.value)} className={input} style={inputStyle} />
              </div>

              <div>
                <label className={label} style={labelStyle}>Highlights / Beneficios (uno por línea)</label>
                <textarea rows={5} value={fromArr(form.highlights)} onChange={(e) => upd("highlights", toArr(e.target.value))} className={input} style={inputStyle} placeholder="Beneficio 1&#10;Beneficio 2&#10;..." />
              </div>

              <div>
                <label className={label} style={labelStyle}>Imagen principal (URL)</label>
                <input value={form.image} onChange={(e) => upd("image", e.target.value)} className={input} style={inputStyle} placeholder="/images/services/resultado-1.jpg" />
                {form.image && (
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden mt-2" style={{ backgroundColor: t.colors.bgDeep }}>
                    <Image src={form.image} alt="" fill className="object-cover" sizes="128px" onError={() => {}} />
                  </div>
                )}
              </div>

              <div>
                <label className={label} style={labelStyle}>Imagen "Antes" (URL, opcional)</label>
                <input value={form.before || ""} onChange={(e) => upd("before", e.target.value || undefined)} className={input} style={inputStyle} placeholder="/images/services/antes-1.jpg" />
              </div>

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: t.colors.border }}>
                <button onClick={handleSave} className="btn-vino flex-1">
                  {panel === "new" ? "Crear servicio" : "Guardar cambios"}
                </button>
                <button onClick={() => setPanel("closed")} className="btn-outline flex-1">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
