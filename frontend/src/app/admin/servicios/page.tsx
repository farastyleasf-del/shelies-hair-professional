"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAdminTheme } from "@/lib/admin-theme";
import { apiUrl, authedFetch } from "@/lib/api";
import { formatCOP } from "@/lib/data";

/* ── Types ── */
interface DBService {
  id: number;
  title: string;
  type: string;
  duration: string | null;
  price: number | null;
  icon: string | null;
  description: string;
  highlights: string[];
  image: string | null;
  before_image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type FormState = Omit<DBService, "id" | "created_at" | "updated_at">;

function emptyForm(): FormState {
  return {
    title: "",
    type: "proceso",
    duration: null,
    price: null,
    icon: null,
    description: "",
    highlights: [],
    image: null,
    before_image: null,
    is_active: true,
  };
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authedFetch(apiUrl("/api/uploads"), { method: "POST", body: fd });
  const data = await res.json();
  return apiUrl(data.url as string);
}

/* ── Component ── */
export default function AdminServicios() {
  const t = useAdminTheme();
  const [list, setList] = useState<DBService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"closed" | "new" | "edit">("closed");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);

  /* ── Load services ── */
  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setApiError(null);
    try {
      const res = await authedFetch(apiUrl("/api/services"));
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al cargar servicios");
      setList(data.data as DBService[]);
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

  function openEdit(s: DBService) {
    setForm({
      title: s.title,
      type: s.type,
      duration: s.duration,
      price: s.price,
      icon: s.icon,
      description: s.description,
      highlights: s.highlights ?? [],
      image: s.image,
      before_image: s.before_image,
      is_active: s.is_active,
    });
    setEditId(s.id);
    setApiError(null);
    setPanel("edit");
  }

  /* ── Save ── */
  async function handleSave() {
    setSaving(true);
    setApiError(null);
    try {
      let res: Response;
      if (editId !== null) {
        res = await authedFetch(apiUrl(`/api/services/${editId}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await authedFetch(apiUrl("/api/services"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al guardar");
      await loadServices();
      setPanel("closed");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ── */
  async function handleDelete(id: number, title: string) {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setApiError(null);
    try {
      const res = await authedFetch(apiUrl(`/api/services/${id}`), { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al eliminar");
      setList((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  /* ── Image uploads ── */
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      setApiError("Error al subir la imagen principal");
    } finally {
      setUploadingImage(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  }

  async function handleBeforeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBefore(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, before_image: url }));
    } catch {
      setApiError("Error al subir la imagen 'antes'");
    } finally {
      setUploadingBefore(false);
      if (beforeFileRef.current) beforeFileRef.current.value = "";
    }
  }

  /* ── Form helpers ── */
  const upd = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toArr = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
  const fromArr = (a: string[] | null | undefined) => (a ?? []).join("\n");

  /* ── Styles ── */
  const input = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30`;
  const inputStyle = { backgroundColor: t.colors.bg, borderColor: t.colors.border, color: t.colors.text };
  const labelCls = `text-xs font-medium uppercase tracking-wider block mb-1`;
  const labelStyle = { color: t.colors.textMuted };

  const procesos = list.filter((s) => s.type === "proceso");
  const adicionales = list.filter((s) => s.type === "adicional");

  /* ── Service table row ── */
  function ServiceRow({ s, extraCol }: { s: DBService; extraCol: React.ReactNode }) {
    return (
      <tr className="border-t" style={{ borderColor: t.colors.border }}>
        <td className="p-4">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden" style={{ backgroundColor: t.colors.bgDeep }}>
            {s.image && (
              <Image src={s.image} alt={s.title} fill className="object-cover" sizes="56px" unoptimized />
            )}
          </div>
        </td>
        <td className="p-4">
          <p className="font-semibold">
            {s.icon && <span className="mr-1">{s.icon}</span>}
            {s.title}
          </p>
          <p className="text-xs mt-0.5 truncate max-w-[260px]" style={{ color: t.colors.textMuted }}>
            {s.description.slice(0, 90)}{s.description.length > 90 ? "…" : ""}
          </p>
        </td>
        {extraCol}
        <td className="p-4 text-center">
          <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
            s.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}>
            {s.is_active ? "Activo" : "Inactivo"}
          </span>
        </td>
        <td className="p-4 text-right">
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => openEdit(s)}
              className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity"
              style={{ borderColor: t.colors.border, color: t.colors.text }}
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(s.id, s.title)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity bg-red-500/10 text-red-400 border border-red-500/20"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ color: t.colors.text }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl" style={{ color: t.colors.text }}>
            Servicios
          </h1>
          <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>
            {loading ? "Cargando…" : `${procesos.length} procesos capilares · ${adicionales.length} adicionales`}
          </p>
        </div>
        <button onClick={openNew} className="btn-vino text-sm">
          + Nuevo servicio
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
          <span>Cargando servicios…</span>
        </div>
      ) : (
        <>
          {/* Procesos Capilares */}
          <h2 className="font-semibold text-base mb-3 border-l-4 border-fucsia pl-3">
            Procesos Capilares
          </h2>
          <div
            className="rounded-2xl border overflow-hidden mb-8"
            style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: t.colors.bgDeep, color: t.colors.textMuted }} className="text-xs uppercase tracking-wider">
                    <th className="p-4 text-left">Foto</th>
                    <th className="p-4 text-left">Servicio</th>
                    <th className="p-4 text-left">Duración</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {procesos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm" style={{ color: t.colors.textMuted }}>
                        No hay procesos capilares.
                      </td>
                    </tr>
                  )}
                  {procesos.map((s) => (
                    <ServiceRow
                      key={s.id}
                      s={s}
                      extraCol={
                        <td className="p-4 text-sm" style={{ color: t.colors.textMuted }}>
                          {s.duration || "—"}
                        </td>
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adicionales */}
          <h2 className="font-semibold text-base mb-3 border-l-4 border-rosa pl-3">
            Adicionales
          </h2>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: t.colors.bgDeep, color: t.colors.textMuted }} className="text-xs uppercase tracking-wider">
                    <th className="p-4 text-left">Foto</th>
                    <th className="p-4 text-left">Servicio</th>
                    <th className="p-4 text-left">Precio</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {adicionales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm" style={{ color: t.colors.textMuted }}>
                        No hay adicionales.
                      </td>
                    </tr>
                  )}
                  {adicionales.map((s) => (
                    <ServiceRow
                      key={s.id}
                      s={s}
                      extraCol={
                        <td className="p-4 font-semibold text-fucsia">
                          {s.price != null ? formatCOP(s.price) : "—"}
                        </td>
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
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
                {panel === "new" ? "Nuevo Servicio" : "Editar Servicio"}
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

              {/* Title */}
              <div>
                <label className={labelCls} style={labelStyle}>Título</label>
                <input
                  value={form.title}
                  onChange={(e) => upd("title", e.target.value)}
                  className={input}
                  style={inputStyle}
                  placeholder="Ej: Alisado Orgánico Efecto Shelie's"
                />
              </div>

              {/* Type */}
              <div>
                <label className={labelCls} style={labelStyle}>Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => upd("type", e.target.value)}
                  className={input}
                  style={inputStyle}
                >
                  <option value="proceso">Proceso Capilar</option>
                  <option value="adicional">Adicional</option>
                </select>
              </div>

              {/* Duration / Price / Icon */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>Duración</label>
                  <input
                    value={form.duration ?? ""}
                    onChange={(e) => upd("duration", e.target.value || null)}
                    className={input}
                    style={inputStyle}
                    placeholder="Ej: 5–6 meses"
                  />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Precio (COP)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price ?? ""}
                    onChange={(e) => upd("price", e.target.value ? Number(e.target.value) : null)}
                    className={input}
                    style={inputStyle}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Ícono (emoji)</label>
                  <input
                    value={form.icon ?? ""}
                    onChange={(e) => upd("icon", e.target.value || null)}
                    className={input}
                    style={inputStyle}
                    placeholder="Ej: ⚡"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls} style={labelStyle}>Descripción completa</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => upd("description", e.target.value)}
                  className={input}
                  style={inputStyle}
                  placeholder="Descripción detallada del servicio…"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className={labelCls} style={labelStyle}>Highlights / Beneficios (uno por línea)</label>
                <textarea
                  rows={5}
                  value={fromArr(form.highlights)}
                  onChange={(e) => upd("highlights", toArr(e.target.value))}
                  className={input}
                  style={inputStyle}
                  placeholder={"Beneficio 1\nBeneficio 2\n…"}
                />
              </div>

              {/* Image principal */}
              <div>
                <label className={labelCls} style={labelStyle}>Imagen principal</label>
                <div className="flex gap-2">
                  <input
                    value={form.image ?? ""}
                    onChange={(e) => upd("image", e.target.value || null)}
                    className={input}
                    style={inputStyle}
                    placeholder="https://… o /uploads/…"
                  />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => imageFileRef.current?.click()}
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
                {form.image && (
                  <div className="relative w-40 h-24 rounded-xl overflow-hidden mt-2" style={{ backgroundColor: t.colors.bgDeep }}>
                    <Image src={form.image} alt="preview" fill className="object-cover" sizes="160px" unoptimized />
                    <button
                      type="button"
                      onClick={() => upd("image", null)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-none flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Before image */}
              <div>
                <label className={labelCls} style={labelStyle}>Imagen &quot;Antes&quot; (opcional)</label>
                <div className="flex gap-2">
                  <input
                    value={form.before_image ?? ""}
                    onChange={(e) => upd("before_image", e.target.value || null)}
                    className={input}
                    style={inputStyle}
                    placeholder="https://… o /uploads/…"
                  />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    ref={beforeFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBeforeChange}
                  />
                  <button
                    type="button"
                    disabled={uploadingBefore}
                    onClick={() => beforeFileRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg border font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                    style={{ borderColor: t.colors.border, color: t.colors.text }}
                  >
                    {uploadingBefore ? "Subiendo…" : "Subir imagen"}
                  </button>
                  {uploadingBefore && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ color: t.colors.textMuted }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                </div>
                {form.before_image && (
                  <div className="relative w-40 h-24 rounded-xl overflow-hidden mt-2" style={{ backgroundColor: t.colors.bgDeep }}>
                    <Image src={form.before_image} alt="antes preview" fill className="object-cover" sizes="160px" unoptimized />
                    <button
                      type="button"
                      onClick={() => upd("before_image", null)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-none flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
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
                  <span className="text-sm font-medium">Servicio activo (visible en la web)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: t.colors.border }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-vino flex-1 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : panel === "new" ? "Crear servicio" : "Guardar cambios"}
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
