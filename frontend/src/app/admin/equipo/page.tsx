"use client";
import { useEffect, useRef, useState } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { apiUrl, authedFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DBStylist {
  id: number;
  name: string;
  role: string;
  photo: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const roleLabels: Record<string, string> = {
  admin: "👑 Admin",
  supervisor: "⭐ Supervisor",
  agente: "💬 Agente",
  soporte: "🤖 Soporte",
};

const EMPTY_FORM = {
  name: "",
  role: "",
  specialties: "",
  is_active: true,
  photo: "",
};

// ─── Upload helper ─────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authedFetch(apiUrl("/api/uploads"), { method: "POST", body: fd });
  const data = (await res.json()) as { url: string };
  return apiUrl(data.url);
}

// ─── StylistCard ──────────────────────────────────────────────────────────────

function StylistCard({
  stylist,
  t,
  onEdit,
  onDelete,
}: {
  stylist: DBStylist;
  t: ReturnType<typeof useAdminTheme>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="border rounded-2xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}
    >
      {/* Header: foto + nombre + estado */}
      <div className="flex items-center gap-3">
        {stylist.photo ? (
          <img
            src={stylist.photo}
            alt={stylist.name}
            width={64}
            height={64}
            className="rounded-full object-cover flex-shrink-0"
            style={{ width: 64, height: 64 }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl flex-shrink-0"
            style={{ backgroundColor: t.colors.primary }}
          >
            {stylist.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: t.colors.text }}>
            {stylist.name}
          </p>
          <p className="text-xs truncate" style={{ color: t.colors.textMuted }}>
            {stylist.role}
          </p>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            stylist.is_active ? "bg-green-400" : "bg-gray-400"
          }`}
          title={stylist.is_active ? "Activa" : "Inactiva"}
        />
      </div>

      {/* Especialidades */}
      {stylist.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {stylist.specialties.map((s) => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: t.colors.primary + "22",
                color: t.colors.primary,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Estado badge */}
      <div>
        <span
          className="text-[10px] px-2 py-0.5 rounded font-medium"
          style={
            stylist.is_active
              ? { backgroundColor: "#16a34a22", color: "#16a34a" }
              : { backgroundColor: "#6b728022", color: "#6b7280" }
          }
        >
          {stylist.is_active ? "Activa" : "Inactiva"}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 mt-auto pt-2 border-t" style={{ borderColor: t.colors.border }}>
        <button
          onClick={onEdit}
          className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: t.colors.primary + "22", color: t.colors.primary }}
        >
          ✏️ Editar
        </button>
        <button
          onClick={onDelete}
          className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#ef444422", color: "#ef4444" }}
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
}

// ─── StylistModal ─────────────────────────────────────────────────────────────

function StylistModal({
  t,
  initial,
  onClose,
  onSave,
}: {
  t: ReturnType<typeof useAdminTheme>;
  initial: DBStylist | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          role: initial.role,
          specialties: initial.specialties.join("\n"),
          is_active: initial.is_active,
          photo: initial.photo ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      set("photo", url);
    } catch {
      setError("Error al subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      setError("Nombre y rol son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      specialties: form.specialties
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      is_active: form.is_active,
      photo: form.photo.trim() || null,
    };
    try {
      const url = initial
        ? apiUrl(`/api/services/stylists/${initial.id}`)
        : apiUrl("/api/services/stylists");
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error del servidor");
      onSave();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-opacity-40";
  const inputStyle = {
    backgroundColor: t.colors.bg,
    borderColor: t.colors.border,
    color: t.colors.text,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: t.colors.bgCard }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: t.colors.border }}
        >
          <h2 className="font-semibold text-base" style={{ color: t.colors.text }}>
            {initial ? "Editar estilista" : "Nueva estilista"}
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: t.colors.textMuted }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: t.colors.textMuted }}>
              Nombre *
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. María García"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: t.colors.textMuted }}>
              Rol *
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Ej. Estilista Senior"
            />
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: t.colors.textMuted }}>
              Especialidades (una por línea)
            </label>
            <textarea
              className={inputClass}
              style={{ ...inputStyle, resize: "vertical" }}
              rows={4}
              value={form.specialties}
              onChange={(e) => set("specialties", e.target.value)}
              placeholder={"Corte\nColoración\nTratamientos"}
            />
          </div>

          {/* Foto */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: t.colors.textMuted }}>
              Foto
            </label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                style={inputStyle}
                value={form.photo}
                onChange={(e) => set("photo", e.target.value)}
                placeholder="https://... o subir archivo"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: t.colors.primary + "22", color: t.colors.primary }}
              >
                {uploading ? "..." : "📎"}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            {form.photo && (
              <img
                src={form.photo}
                alt="preview"
                className="mt-2 w-16 h-16 rounded-full object-cover border"
                style={{ borderColor: t.colors.border }}
              />
            )}
          </div>

          {/* Activa */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label
              htmlFor="is_active"
              className="text-sm cursor-pointer"
              style={{ color: t.colors.text }}
            >
              Estilista activa
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: t.colors.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: t.colors.border, color: t.colors.textMuted }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: t.colors.primary }}
          >
            {saving ? "Guardando..." : initial ? "Guardar cambios" : "Crear estilista"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EquipoPage() {
  const t = useAdminTheme();
  const [tab, setTab] = useState<"stylists" | "users">("stylists");

  // Stylists state
  const [stylists, setStylists] = useState<DBStylist[]>([]);
  const [loadingStylists, setLoadingStylists] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<DBStylist | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Admin users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // ── Load stylists ──────────────────────────────────────────────────────────
  function loadStylists() {
    setLoadingStylists(true);
    authedFetch(apiUrl("/api/services/stylists/list"))
      .then((r) => r.json())
      .then((d: { success: boolean; data: DBStylist[] }) => {
        if (d.success && Array.isArray(d.data)) setStylists(d.data);
      })
      .catch(() => {})
      .finally(() => setLoadingStylists(false));
  }

  useEffect(() => {
    loadStylists();
  }, []);

  // ── Load admin users (lazy, on tab switch) ─────────────────────────────────
  useEffect(() => {
    if (tab === "users" && !usersLoaded) {
      setLoadingUsers(true);
      authedFetch(apiUrl("/api/admin/users"))
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setUsers(d);
        })
        .catch(() => {})
        .finally(() => {
          setLoadingUsers(false);
          setUsersLoaded(true);
        });
    }
  }, [tab, usersLoaded]);

  // ── Delete stylist ─────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta estilista?")) return;
    setDeletingId(id);
    try {
      await authedFetch(apiUrl(`/api/services/stylists/${id}`), { method: "DELETE" });
      setStylists((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("No se pudo eliminar. Intenta de nuevo.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Tab styles ─────────────────────────────────────────────────────────────
  function tabStyle(active: boolean) {
    return {
      color: active ? t.colors.primary : t.colors.textMuted,
      borderBottomColor: active ? t.colors.primary : "transparent",
      borderBottomWidth: 2,
      borderBottomStyle: "solid" as const,
    };
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-poppins font-bold"
          style={{ color: t.colors.text }}
        >
          👥 Equipo
        </h1>
        <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>
          Gestiona estilistas y usuarios del panel admin
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-6 border-b"
        style={{ borderColor: t.colors.border }}
      >
        <button
          className="pb-3 text-sm font-medium transition-colors"
          style={tabStyle(tab === "stylists")}
          onClick={() => setTab("stylists")}
        >
          ✂️ Estilistas
        </button>
        <button
          className="pb-3 text-sm font-medium transition-colors"
          style={tabStyle(tab === "users")}
          onClick={() => setTab("users")}
        >
          🔐 Usuarios Admin
        </button>
      </div>

      {/* ── ESTILISTAS TAB ──────────────────────────────────────────────────── */}
      {tab === "stylists" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: t.colors.textMuted }}>
              {stylists.length} estilista{stylists.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => {
                setEditingStylist(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: t.colors.primary }}
            >
              + Nueva estilista
            </button>
          </div>

          {/* Content */}
          {loadingStylists ? (
            <div
              className="text-center py-12"
              style={{ color: t.colors.textFaint }}
            >
              Cargando...
            </div>
          ) : stylists.length === 0 ? (
            <div
              className="border rounded-2xl p-12 text-center"
              style={{
                backgroundColor: t.colors.bgCard,
                borderColor: t.colors.border,
                color: t.colors.textFaint,
              }}
            >
              <p className="text-4xl mb-3">✂️</p>
              <p className="text-sm">Sin estilistas registradas</p>
              <p className="text-xs mt-1" style={{ color: t.colors.textFaint }}>
                Usa el botón <strong>+ Nueva estilista</strong> para agregar la primera
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stylists.map((stylist) => (
                <div
                  key={stylist.id}
                  style={{ opacity: deletingId === stylist.id ? 0.5 : 1, transition: "opacity 0.2s" }}
                >
                  <StylistCard
                    stylist={stylist}
                    t={t}
                    onEdit={() => {
                      setEditingStylist(stylist);
                      setModalOpen(true);
                    }}
                    onDelete={() => handleDelete(stylist.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── USUARIOS ADMIN TAB ──────────────────────────────────────────────── */}
      {tab === "users" && (
        <div>
          {loadingUsers ? (
            <div
              className="text-center py-12"
              style={{ color: t.colors.textFaint }}
            >
              Cargando...
            </div>
          ) : users.length === 0 ? (
            <div
              className="border rounded-2xl p-12 text-center"
              style={{
                backgroundColor: t.colors.bgCard,
                borderColor: t.colors.border,
                color: t.colors.textFaint,
              }}
            >
              <p className="text-4xl mb-3">👥</p>
              <p className="text-sm">Sin usuarios registrados</p>
              <p className="text-xs mt-1" style={{ color: t.colors.textFaint }}>
                Agrega usuarios desde <strong>Usuarios</strong>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-2xl p-5"
                  style={{
                    backgroundColor: t.colors.bgCard,
                    borderColor: t.colors.border,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: t.colors.primary }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: t.colors.text }}
                      >
                        {user.name}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: t.colors.textMuted }}
                      >
                        {user.email}
                      </p>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.active ? "bg-green-400" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-medium bg-vino/20 text-vino"
                  >
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <StylistModal
          t={t}
          initial={editingStylist}
          onClose={() => {
            setModalOpen(false);
            setEditingStylist(null);
          }}
          onSave={() => {
            setModalOpen(false);
            setEditingStylist(null);
            loadStylists();
          }}
        />
      )}
    </div>
  );
}
