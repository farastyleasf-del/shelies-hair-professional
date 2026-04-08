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

// ─── Turnos Section ──────────────────────────────────────────────────────────

interface SessionRow {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  session_date: string;
}

function TurnosSection({ t }: { t: ReturnType<typeof useAdminTheme> }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await authedFetch(apiUrl("/api/employees/sessions/today"));
      if (res.ok) setSessions(await res.json());
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { loadSessions(); }, []);

  async function handleReset(userId: number, userName: string) {
    if (!confirm(`Resetear turno de ${userName}? Se eliminarán las sesiones de hoy.`)) return;
    setResetting(userId);
    try {
      const res = await authedFetch(apiUrl(`/api/employees/sessions/reset?userId=${userId}`), { method: "DELETE" });
      if (res.ok) {
        setToast(`Turno de ${userName} reseteado`);
        setTimeout(() => setToast(""), 3000);
        loadSessions();
      }
    } catch {} finally { setResetting(null); }
  }

  function fmtTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  // Agrupar por usuario
  const byUser = sessions.reduce<Record<number, SessionRow[]>>((acc, s) => {
    (acc[s.user_id] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {toast && (
        <div className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: "#16A34A" }}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: t.colors.textMuted }}>
          Sesiones de hoy — {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <button onClick={loadSessions} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border font-medium disabled:opacity-50"
          style={{ borderColor: t.colors.border, color: t.colors.textMuted }}>
          {loading ? "..." : "Actualizar"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <span className="text-sm" style={{ color: t.colors.textMuted }}>Cargando...</span>
        </div>
      ) : Object.keys(byUser).length === 0 ? (
        <div className="text-center py-8 rounded-xl border" style={{ borderColor: t.colors.border }}>
          <p className="text-sm" style={{ color: t.colors.textMuted }}>Sin turnos registrados hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byUser).map(([uid, userSessions]) => {
            const userId = parseInt(uid);
            const name = userSessions[0].user_name;
            const active = userSessions.find(s => !s.ended_at);
            const ended = userSessions.filter(s => !!s.ended_at);

            return (
              <div key={uid} className="rounded-xl border p-4" style={{ borderColor: t.colors.border, backgroundColor: t.colors.bgCard }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${active ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-sm font-semibold" style={{ color: t.colors.text }}>{name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: active ? "#DCFCE7" : t.colors.border, color: active ? "#16A34A" : t.colors.textMuted }}>
                      {active ? "En turno" : "Finalizado"}
                    </span>
                  </div>
                  <button onClick={() => handleReset(userId, name)}
                    disabled={resetting === userId}
                    className="text-[11px] px-3 py-1 rounded-lg border font-medium hover:opacity-80 disabled:opacity-50"
                    style={{ borderColor: "#FCA5A5", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                    {resetting === userId ? "..." : "Resetear turno"}
                  </button>
                </div>

                {/* Sesiones del día */}
                <div className="space-y-1">
                  {active && (
                    <div className="flex items-center gap-3 text-xs py-1 px-2 rounded" style={{ backgroundColor: "#F0FDF4" }}>
                      <span style={{ color: "#16A34A" }} className="font-semibold">ACTIVA</span>
                      <span style={{ color: t.colors.textMuted }}>Inicio: {fmtTime(active.started_at)}</span>
                    </div>
                  )}
                  {ended.map(s => (
                    <div key={s.id} className="flex items-center gap-3 text-xs py-1 px-2 rounded" style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.03)" : "#F9FAFB" }}>
                      <span style={{ color: t.colors.textMuted }}>{fmtTime(s.started_at)} → {fmtTime(s.ended_at)}</span>
                      <span style={{ color: t.colors.textMuted }}>{s.duration_minutes ?? 0} min</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EquipoPage() {
  const t = useAdminTheme();
  const [tab, setTab] = useState<"stylists" | "users" | "turnos">("stylists");

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
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "agente" });
  const [userSaving, setUserSaving] = useState(false);
  const [userErr, setUserErr] = useState("");
  const [changingPwId, setChangingPwId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  async function handleCreateUser() {
    if (!userForm.name || !userForm.email || !userForm.password) { setUserErr("Nombre, email y contraseña son requeridos"); return; }
    setUserSaving(true); setUserErr("");
    try {
      const res = await authedFetch(apiUrl("/api/admin/users"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...userForm, avatar: "" }),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers(prev => [...prev, newUser]);
        setShowUserForm(false);
        setUserForm({ name: "", email: "", password: "", role: "agente" });
      } else {
        const e = await res.json() as { error?: string };
        setUserErr(e.error ?? "Error al crear usuario");
      }
    } catch { setUserErr("Error de conexión"); }
    finally { setUserSaving(false); }
  }

  async function handleDeleteUser(id: number, name: string) {
    if (!confirm(`¿Eliminar al usuario ${name}?`)) return;
    try {
      await authedFetch(apiUrl(`/api/admin/users?id=${id}`), { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { alert("Error al eliminar"); }
  }

  async function handleChangePassword(id: number) {
    if (!newPassword || newPassword.length < 6) { alert("La contraseña debe tener al menos 6 caracteres"); return; }
    setPwSaving(true);
    try {
      const res = await authedFetch(apiUrl(`/api/admin/users?id=${id}`), {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) { setChangingPwId(null); setNewPassword(""); alert("Contraseña actualizada"); }
      else alert("Error al cambiar contraseña");
    } catch { alert("Error de conexión"); }
    finally { setPwSaving(false); }
  }

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
        <button
          className="pb-3 text-sm font-medium transition-colors"
          style={tabStyle(tab === "turnos")}
          onClick={() => setTab("turnos")}
        >
          🕐 Turnos
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
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: t.colors.textMuted }}>{users.length} usuario{users.length !== 1 ? "s" : ""}</p>
            <button onClick={() => { setShowUserForm(!showUserForm); setUserErr(""); }}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
              style={{ backgroundColor: t.colors.primary }}>
              {showUserForm ? "Cancelar" : "+ Crear usuario"}
            </button>
          </div>

          {/* Create form */}
          {showUserForm && (
            <div className="border rounded-2xl p-5 space-y-3" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
              <p className="text-sm font-semibold" style={{ color: t.colors.text }}>Nuevo usuario admin</p>
              {userErr && <p className="text-xs text-red-500 rounded-lg px-3 py-2" style={{ backgroundColor: "#FEF2F2" }}>{userErr}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: t.colors.textMuted }}>Nombre completo *</label>
                  <input value={userForm.name} onChange={e => {
                    const name = e.target.value;
                    const parts = name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
                    const username = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0] ?? "";
                    setUserForm(f => ({ ...f, name, email: username }));
                  }}
                    placeholder="Gabriela Arango" className="w-full text-sm border rounded-xl px-3 py-2 outline-none"
                    style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text }} />
                </div>
                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: t.colors.textMuted }}>Usuario (login) *</label>
                  <input value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="gabriela.arango" className="w-full text-sm border rounded-xl px-3 py-2 outline-none font-mono"
                    style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text }} />
                  <p className="text-[9px] mt-0.5" style={{ color: t.colors.textFaint }}>Se genera automático, puedes editarlo</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: t.colors.textMuted }}>Contraseña *</label>
                  <input value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                    type="password" placeholder="Min. 6 caracteres" className="w-full text-sm border rounded-xl px-3 py-2 outline-none"
                    style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text }} />
                </div>
                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: t.colors.textMuted }}>Rol</label>
                  <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full text-sm border rounded-xl px-3 py-2 outline-none"
                    style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text }}>
                    <option value="admin">Admin</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="agente">Agente</option>
                    <option value="soporte">Soporte</option>
                  </select>
                </div>
              </div>
              <button onClick={handleCreateUser} disabled={userSaving || !userForm.name || !userForm.email || !userForm.password}
                className="px-6 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: t.colors.primary }}>
                {userSaving ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          )}

          {loadingUsers ? (
            <div className="text-center py-12" style={{ color: t.colors.textFaint }}>Cargando...</div>
          ) : users.length === 0 && !showUserForm ? (
            <div className="border rounded-2xl p-12 text-center" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border, color: t.colors.textFaint }}>
              <p className="text-sm">Sin usuarios registrados</p>
              <p className="text-xs mt-1">Crea el primer usuario con el botón de arriba</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-2xl p-5" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: t.colors.primary }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: t.colors.text }}>{user.name}</p>
                      <p className="text-xs truncate" style={{ color: t.colors.textMuted }}>{user.email}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${user.active ? "bg-green-400" : "bg-gray-400"}`} />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ backgroundColor: t.colors.primaryLight, color: t.colors.primary }}>{roleLabels[user.role] ?? user.role}</span>
                  </div>
                  {/* Cambiar contraseña */}
                  {changingPwId === user.id ? (
                    <div className="flex gap-1.5 mb-2">
                      <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="Nueva contraseña"
                        className="flex-1 text-xs border rounded-lg px-2 py-1.5 outline-none" style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text }} />
                      <button onClick={() => handleChangePassword(user.id)} disabled={pwSaving}
                        className="text-[10px] px-2 py-1.5 rounded-lg text-white font-semibold disabled:opacity-50" style={{ backgroundColor: "#16A34A" }}>
                        {pwSaving ? "..." : "OK"}
                      </button>
                      <button onClick={() => { setChangingPwId(null); setNewPassword(""); }}
                        className="text-[10px] px-2 py-1.5 rounded-lg font-medium" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.textMuted }}>
                        X
                      </button>
                    </div>
                  ) : null}
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => { setChangingPwId(user.id); setNewPassword(""); }}
                      className="flex-1 text-[10px] py-1.5 rounded-lg font-medium" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.textMuted }}>
                      Cambiar contraseña
                    </button>
                    <button onClick={() => handleDeleteUser(user.id, user.name)}
                      className="text-[10px] py-1.5 px-3 rounded-lg font-medium" style={{ border: "1px solid #FCA5A5", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TURNOS TAB ──────────────────────────────────────────────────── */}
      {tab === "turnos" && <TurnosSection t={t} />}

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
