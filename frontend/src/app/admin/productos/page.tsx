"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAdminTheme } from "@/lib/admin-theme";
import { apiUrl, authedFetch } from "@/lib/api";
import { formatCOP } from "@/lib/data";

/* ── Types ── */
interface DBProduct {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  compare_price: number | null;
  category: string;
  stock: number;
  images: string[];
  badges: string[];
  benefits: string[];
  for_whom: string;
  how_to_use: string;
  ingredients: string;
  hair_type: string[];
  objective: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type FormState = Omit<DBProduct, "id" | "created_at" | "updated_at">;

/* ── Constants ── */
const CATEGORIES = ["kit", "shampoo", "acondicionador", "serum", "mascarilla", "ampolleta", "aceite", "tonico"] as const;
const BADGE_OPTIONS = ["bestseller", "new", "promo"] as const;
const HAIR_TYPES = ["liso", "ondulado", "rizado", "muy-dañado", "todos"] as const;
const OBJECTIVES = ["control-frizz", "brillo-suavidad", "reparacion", "crecimiento-anticaida"] as const;

function emptyForm(): FormState {
  return {
    slug: "",
    name: "",
    tagline: "",
    description: "",
    price: 0,
    compare_price: null,
    category: "shampoo",
    stock: 0,
    images: [],
    badges: [],
    benefits: [],
    for_whom: "",
    how_to_use: "",
    ingredients: "",
    hair_type: ["todos"],
    objective: [],
    is_active: true,
  };
}

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authedFetch(apiUrl("/api/uploads"), { method: "POST", body: fd });
  const data = await res.json();
  return apiUrl(data.url as string);
}

/* ── Component ── */
export default function AdminProductos() {
  const t = useAdminTheme();
  const [list, setList] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"closed" | "new" | "edit">("closed");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load products ── */
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setApiError(null);
    try {
      const res = await authedFetch(apiUrl("/api/products"));
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al cargar productos");
      setList(data.data as DBProduct[]);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  /* ── Panel helpers ── */
  function openNew() {
    setForm(emptyForm());
    setEditId(null);
    setApiError(null);
    setPanel("new");
  }

  function openEdit(p: DBProduct) {
    setForm({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      price: p.price,
      compare_price: p.compare_price,
      category: p.category,
      stock: p.stock,
      images: p.images ?? [],
      badges: p.badges ?? [],
      benefits: p.benefits ?? [],
      for_whom: p.for_whom ?? "",
      how_to_use: p.how_to_use ?? "",
      ingredients: p.ingredients ?? "",
      hair_type: p.hair_type ?? [],
      objective: p.objective ?? [],
      is_active: p.is_active,
    });
    setEditId(p.id);
    setApiError(null);
    setPanel("edit");
  }

  /* ── Save ── */
  async function handleSave() {
    setSaving(true);
    setApiError(null);
    try {
      const slug = form.slug || makeSlug(form.name) || `prod-${Date.now()}`;
      const payload = { ...form, slug };

      let res: Response;
      if (editId !== null) {
        res = await authedFetch(apiUrl(`/api/products/${editId}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await authedFetch(apiUrl("/api/products"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al guardar");
      await loadProducts();
      setPanel("closed");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(id: number, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setApiError(null);
    try {
      const res = await authedFetch(apiUrl(`/api/products/${id}`), { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al eliminar");
      setList((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  /* ── Image upload ── */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, images: [...f.images, url] }));
    } catch {
      setApiError("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ── Form field helpers ── */
  const upd = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toArr = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
  const fromArr = (a: string[]) => (a ?? []).join("\n");

  function toggleArr<T extends string>(arr: T[], val: T, checked: boolean): T[] {
    return checked ? [...arr, val] : arr.filter((x) => x !== val);
  }

  /* ── Styles ── */
  const input = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30`;
  const inputStyle = { backgroundColor: t.colors.bg, borderColor: t.colors.border, color: t.colors.text };
  const labelCls = `text-xs font-medium uppercase tracking-wider block mb-1`;
  const labelStyle = { color: t.colors.textMuted };

  /* ── Render ── */
  return (
    <div style={{ color: t.colors.text }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl" style={{ color: t.colors.text }}>
            Productos
          </h1>
          <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>
            {loading ? "Cargando…" : `${list.length} productos en base de datos`}
          </p>
        </div>
        <button onClick={openNew} className="btn-vino text-sm">
          + Nuevo producto
        </button>
      </div>

      {/* Global error */}
      {apiError && !panel && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm border" style={{ backgroundColor: t.colors.dangerLight, borderColor: t.colors.danger, color: t.colors.dangerText }}>
          {apiError}
        </div>
      )}

      {/* Loading spinner */}
      {loading ? (
        <div className="flex items-center justify-center py-24" style={{ color: t.colors.textMuted }}>
          <svg className="animate-spin w-8 h-8 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Cargando productos…</span>
        </div>
      ) : (
        /* Table */
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
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Badges</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center" style={{ color: t.colors.textMuted }}>
                      No hay productos. Crea el primero.
                    </td>
                  </tr>
                )}
                {list.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: t.colors.border }}>
                    <td className="p-4">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
                        {p.images?.[0] && (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: t.colors.textMuted }}>
                        {p.tagline}
                      </p>
                    </td>
                    <td className="p-4 capitalize" style={{ color: t.colors.textMuted }}>
                      {p.category}
                    </td>
                    <td className="p-4 text-right font-semibold text-fucsia">
                      {formatCOP(p.price)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        p.stock < 10
                          ? "bg-red-500/20 text-red-400"
                          : p.stock < 30
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        p.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {p.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(p.badges ?? []).map((b) => (
                          <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-dorado/20 text-dorado font-bold uppercase">
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity"
                          style={{ borderColor: t.colors.border, color: t.colors.text }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity bg-red-500/10 text-red-400 border border-red-500/20"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over panel */}
      {panel !== "closed" && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => !saving && setPanel("closed")} />
          <div
            className="w-full max-w-2xl h-full overflow-y-auto border-l"
            style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}
          >
            {/* Panel header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}
            >
              <h2 className="font-poppins font-bold text-lg" style={{ color: t.colors.text }}>
                {panel === "new" ? "Nuevo Producto" : "Editar Producto"}
              </h2>
              <button
                onClick={() => !saving && setPanel("closed")}
                className="text-2xl hover:opacity-60 transition-opacity"
                style={{ color: t.colors.textMuted }}
              >
                ✕
              </button>
            </div>

            {/* Panel body */}
            <div className="p-6 space-y-5">
              {/* API error inside panel */}
              {apiError && (
                <div className="px-4 py-3 rounded-xl text-sm border" style={{ backgroundColor: t.colors.dangerLight, borderColor: t.colors.danger, color: t.colors.dangerText }}>
                  {apiError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className={labelCls} style={labelStyle}>Nombre del producto</label>
                <input
                  value={form.name}
                  onChange={(e) => upd("name", e.target.value)}
                  className={input}
                  style={inputStyle}
                  placeholder="Ej: Shampoo Hidratante Blindaje"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className={labelCls} style={labelStyle}>Tagline (descripción corta)</label>
                <input
                  value={form.tagline}
                  onChange={(e) => upd("tagline", e.target.value)}
                  className={input}
                  style={inputStyle}
                  placeholder="Ej: Control frizz desde el primer lavado"
                />
              </div>

              {/* Price / Compare price / Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>Precio (COP)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => upd("price", Number(e.target.value))}
                    className={input}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Precio tachado</label>
                  <input
                    type="number"
                    min={0}
                    value={form.compare_price ?? ""}
                    onChange={(e) => upd("compare_price", e.target.value ? Number(e.target.value) : null)}
                    className={input}
                    style={inputStyle}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => upd("stock", Number(e.target.value))}
                    className={input}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={labelCls} style={labelStyle}>Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => upd("category", e.target.value)}
                  className={input}
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Badges */}
              <div>
                <label className={labelCls} style={labelStyle}>Badges</label>
                <div className="flex gap-4 mt-1">
                  {BADGE_OPTIONS.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.colors.text }}>
                      <input
                        type="checkbox"
                        checked={(form.badges ?? []).includes(b)}
                        onChange={(e) => upd("badges", toggleArr(form.badges, b, e.target.checked))}
                        className="rounded"
                      />
                      <span className="capitalize">{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className={labelCls} style={labelStyle}>Imágenes (una URL por línea)</label>
                <textarea
                  rows={3}
                  value={fromArr(form.images)}
                  onChange={(e) => upd("images", toArr(e.target.value))}
                  className={input}
                  style={inputStyle}
                  placeholder="https://… o /uploads/…"
                />
                {/* Upload button */}
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    style={{ borderColor: t.colors.border, color: t.colors.text }}
                  >
                    {uploadingImage ? "Subiendo…" : "Subir imagen"}
                  </button>
                  {uploadingImage && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ color: t.colors.textMuted }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                </div>
                {/* Image previews */}
                {form.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.filter(Boolean).map((src, i) => (
                      <div key={i} className="relative group">
                        <div
                          className="relative w-16 h-16 rounded-lg overflow-hidden"
                          style={{ backgroundColor: t.colors.bgDeep }}
                        >
                          <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized />
                        </div>
                        <button
                          type="button"
                          onClick={() => upd("images", form.images.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div>
                <label className={labelCls} style={labelStyle}>Beneficios (uno por línea)</label>
                <textarea
                  rows={5}
                  value={fromArr(form.benefits)}
                  onChange={(e) => upd("benefits", toArr(e.target.value))}
                  className={input}
                  style={inputStyle}
                  placeholder={"Control frizz\nHidratación profunda\n…"}
                />
              </div>

              {/* For whom */}
              <div>
                <label className={labelCls} style={labelStyle}>Para quién es</label>
                <textarea
                  rows={3}
                  value={form.for_whom}
                  onChange={(e) => upd("for_whom", e.target.value)}
                  className={input}
                  style={inputStyle}
                  placeholder="Describe el tipo de cabello ideal para este producto…"
                />
              </div>

              {/* How to use */}
              <div>
                <label className={labelCls} style={labelStyle}>Modo de uso</label>
                <textarea
                  rows={4}
                  value={form.how_to_use}
                  onChange={(e) => upd("how_to_use", e.target.value)}
                  className={input}
                  style={inputStyle}
                  placeholder={"Paso 1\nPaso 2\n…"}
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className={labelCls} style={labelStyle}>Ingredientes</label>
                <input
                  value={form.ingredients}
                  onChange={(e) => upd("ingredients", e.target.value)}
                  className={input}
                  style={inputStyle}
                  placeholder="Ej: Aceite de argán, Aceite de aguacate…"
                />
              </div>

              {/* Hair type */}
              <div>
                <label className={labelCls} style={labelStyle}>Tipo de cabello</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {HAIR_TYPES.map((h) => (
                    <label key={h} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.colors.text }}>
                      <input
                        type="checkbox"
                        checked={(form.hair_type ?? []).includes(h)}
                        onChange={(e) => upd("hair_type", toggleArr(form.hair_type, h, e.target.checked))}
                        className="rounded"
                      />
                      <span className="capitalize">{h}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className={labelCls} style={labelStyle}>Objetivo</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {OBJECTIVES.map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.colors.text }}>
                      <input
                        type="checkbox"
                        checked={(form.objective ?? []).includes(o)}
                        onChange={(e) => upd("objective", toggleArr(form.objective, o, e.target.checked))}
                        className="rounded"
                      />
                      <span>{o.replace(/-/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* is_active */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer" style={{ color: t.colors.text }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => upd("is_active", e.target.checked)}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-sm font-medium">Producto activo (visible en la tienda)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: t.colors.border }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-vino flex-1 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : panel === "new" ? "Crear producto" : "Guardar cambios"}
                </button>
                <button
                  onClick={() => !saving && setPanel("closed")}
                  disabled={saving}
                  className="btn-outline flex-1 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
