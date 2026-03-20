"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { getStoredProducts, saveProducts } from "@/lib/store";
import { formatCOP } from "@/lib/data";
import { useAdminTheme } from "@/lib/admin-theme";

const CATEGORIES = ["kit","shampoo","acondicionador","serum","mascarilla","ampolleta","aceite","tonico"] as const;
const BADGE_OPTIONS = ["bestseller","new","promo"] as const;
const HAIR_TYPES = ["liso","ondulado","rizado","muy-dañado","todos"] as const;
const OBJECTIVES = ["control-frizz","brillo-suavidad","reparacion","crecimiento-anticaida"] as const;

function emptyProduct(): Partial<Product> {
  return {
    id: "", slug: "", name: "", tagline: "", price: 0, comparePrice: undefined,
    images: [], badges: [], benefits: [], forWhom: "", howToUse: [],
    ingredients: "", faq: [], category: "shampoo",
    objective: [], hairType: ["todos"], stock: 0, crossSell: [],
  };
}

export default function AdminProductos() {
  const t = useAdminTheme();
  const [list, setList] = useState<Product[]>([]);
  const [panel, setPanel] = useState<"closed" | "new" | "edit">("closed");
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { setList(getStoredProducts()); }, []);

  function persist(next: Product[]) {
    setList(next);
    saveProducts(next);
  }

  function openNew() {
    setForm(emptyProduct());
    setEditId(null);
    setPanel("new");
  }

  function openEdit(p: Product) {
    setForm({ ...p });
    setEditId(p.id);
    setPanel("edit");
  }

  function handleSave() {
    const id = editId || form.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `prod-${Date.now()}`;
    const prod: Product = {
      ...emptyProduct(),
      ...form,
      id: editId || id,
      slug: editId ? (form.slug || id) : id,
    } as Product;
    if (editId) {
      persist(list.map((p) => (p.id === editId ? prod : p)));
    } else {
      persist([...list, prod]);
    }
    setPanel("closed");
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    persist(list.filter((p) => p.id !== id));
  }

  const upd = (key: keyof Product, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  // helpers for array fields from textarea
  const toArr = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
  const fromArr = (a?: string[]) => (a || []).join("\n");

  const input = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30`;
  const inputStyle = { backgroundColor: t.colors.bg, borderColor: t.colors.border, color: t.colors.text };
  const label = `text-xs font-medium uppercase tracking-wider block mb-1`;
  const labelStyle = { color: t.colors.textMuted };

  return (
    <div style={{ color: t.colors.text }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl" style={{ color: t.colors.text }}>Productos</h1>
          <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>
            {list.length} productos · <span style={{ color: t.colors.warning }}>Guardado en navegador (sin base de datos)</span>
          </p>
        </div>
        <button onClick={openNew} className="btn-vino text-sm">+ Nuevo producto</button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: t.colors.bgDeep, color: t.colors.textMuted }} className="text-xs uppercase tracking-wider">
                <th className="p-4 text-left">Foto</th>
                <th className="p-4 text-left">Producto</th>
                <th className="p-4 text-left">Categoría</th>
                <th className="p-4 text-right">Precio</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-center">Badges</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: t.colors.border }}>
                  <td className="p-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
                      {p.images[0] && (
                        <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="56px" />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: t.colors.textMuted }}>{p.tagline}</p>
                  </td>
                  <td className="p-4 capitalize" style={{ color: t.colors.textMuted }}>{p.category}</td>
                  <td className="p-4 text-right font-semibold text-fucsia">{formatCOP(p.price)}</td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      p.stock < 10 ? "bg-red-500/20 text-red-400" :
                      p.stock < 30 ? "bg-amber-500/20 text-amber-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>{p.stock}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {p.badges.map((b) => (
                        <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-dorado/20 text-dorado font-bold uppercase">{b}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity" style={{ borderColor: t.colors.border, color: t.colors.text }}>✏️ Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity bg-red-500/10 text-red-400 border border-red-500/20">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over panel */}
      {panel !== "closed" && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setPanel("closed")} />
          <div className="w-full max-w-2xl h-full overflow-y-auto border-l" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <h2 className="font-poppins font-bold text-lg" style={{ color: t.colors.text }}>
                {panel === "new" ? "Nuevo Producto" : "Editar Producto"}
              </h2>
              <button onClick={() => setPanel("closed")} className="text-2xl hover:opacity-60 transition-opacity" style={{ color: t.colors.textMuted }}>✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Nombre + Tagline */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={label} style={labelStyle}>Nombre del producto</label>
                  <input value={form.name || ""} onChange={(e) => upd("name", e.target.value)} className={input} style={inputStyle} placeholder="Ej: Shampoo Hidratante Blindaje" />
                </div>
                <div>
                  <label className={label} style={labelStyle}>Tagline (descripción corta)</label>
                  <input value={form.tagline || ""} onChange={(e) => upd("tagline", e.target.value)} className={input} style={inputStyle} placeholder="Ej: Control frizz desde el primer lavado" />
                </div>
              </div>

              {/* Precio + Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={label} style={labelStyle}>Precio (COP)</label>
                  <input type="number" value={form.price || 0} onChange={(e) => upd("price", Number(e.target.value))} className={input} style={inputStyle} />
                </div>
                <div>
                  <label className={label} style={labelStyle}>Precio tachado</label>
                  <input type="number" value={form.comparePrice || ""} onChange={(e) => upd("comparePrice", e.target.value ? Number(e.target.value) : undefined)} className={input} style={inputStyle} placeholder="Opcional" />
                </div>
                <div>
                  <label className={label} style={labelStyle}>Stock</label>
                  <input type="number" value={form.stock || 0} onChange={(e) => upd("stock", Number(e.target.value))} className={input} style={inputStyle} />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className={label} style={labelStyle}>Categoría</label>
                <select value={form.category || "shampoo"} onChange={(e) => upd("category", e.target.value)} className={input} style={inputStyle}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Badges */}
              <div>
                <label className={label} style={labelStyle}>Badges</label>
                <div className="flex gap-4 mt-1">
                  {BADGE_OPTIONS.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.colors.text }}>
                      <input type="checkbox" checked={(form.badges || []).includes(b)}
                        onChange={(e) => upd("badges", e.target.checked ? [...(form.badges||[]), b] : (form.badges||[]).filter((x) => x !== b))}
                        className="rounded" />
                      <span className="capitalize">{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Imágenes */}
              <div>
                <label className={label} style={labelStyle}>Imágenes (una URL por línea)</label>
                <textarea rows={3} value={fromArr(form.images)} onChange={(e) => upd("images", toArr(e.target.value))}
                  className={input} style={inputStyle} placeholder="/images/products/mi-producto.jpg" />
                {(form.images || []).length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(form.images || []).filter(Boolean).map((src, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
                        <Image src={src} alt="" fill className="object-cover" sizes="64px" onError={() => {}} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Para quién */}
              <div>
                <label className={label} style={labelStyle}>Para quién es</label>
                <textarea rows={3} value={form.forWhom || ""} onChange={(e) => upd("forWhom", e.target.value)}
                  className={input} style={inputStyle} placeholder="Describe el tipo de cabello ideal para este producto..." />
              </div>

              {/* Beneficios */}
              <div>
                <label className={label} style={labelStyle}>Beneficios (uno por línea)</label>
                <textarea rows={5} value={fromArr(form.benefits)} onChange={(e) => upd("benefits", toArr(e.target.value))}
                  className={input} style={inputStyle} placeholder="Control frizz&#10;Hidratación profunda&#10;..." />
              </div>

              {/* Modo de uso */}
              <div>
                <label className={label} style={labelStyle}>Modo de uso (un paso por línea)</label>
                <textarea rows={4} value={fromArr(form.howToUse)} onChange={(e) => upd("howToUse", toArr(e.target.value))}
                  className={input} style={inputStyle} placeholder="Paso 1&#10;Paso 2&#10;..." />
              </div>

              {/* Ingredientes */}
              <div>
                <label className={label} style={labelStyle}>Ingredientes</label>
                <input value={form.ingredients || ""} onChange={(e) => upd("ingredients", e.target.value)} className={input} style={inputStyle} placeholder="Ej: Aceite de argán, Aceite de aguacate..." />
              </div>

              {/* Tipo de cabello */}
              <div>
                <label className={label} style={labelStyle}>Tipo de cabello</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {HAIR_TYPES.map((h) => (
                    <label key={h} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.colors.text }}>
                      <input type="checkbox" checked={(form.hairType || []).includes(h)}
                        onChange={(e) => upd("hairType", e.target.checked ? [...(form.hairType||[]), h] : (form.hairType||[]).filter((x) => x !== h))}
                        className="rounded" />
                      <span className="capitalize">{h}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Objetivo */}
              <div>
                <label className={label} style={labelStyle}>Objetivo</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {OBJECTIVES.map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.colors.text }}>
                      <input type="checkbox" checked={(form.objective || []).includes(o)}
                        onChange={(e) => upd("objective", e.target.checked ? [...(form.objective||[]), o] : (form.objective||[]).filter((x) => x !== o))}
                        className="rounded" />
                      <span>{o.replace(/-/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: t.colors.border }}>
                <button onClick={handleSave} className="btn-vino flex-1">
                  {panel === "new" ? "Crear producto" : "Guardar cambios"}
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
