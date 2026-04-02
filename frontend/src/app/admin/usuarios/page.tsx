"use client";
import { apiUrl, authedFetch } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useAdminTheme } from "@/lib/admin-theme";

/* ═══════════════════════════════════════════════
   MÓDULO USUARIOS — Gestión de agentes del panel
   ═══════════════════════════════════════════════ */

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "agente" | "especialista" | "colaborador";
  avatar: string;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLES: { value: AdminUser["role"]; label: string; color: string }[] = [
  { value: "admin",        label: "Administrador", color: "bg-red-500/15 text-red-500" },
  { value: "agente",       label: "Agente ventas",  color: "bg-blue-500/15 text-blue-400" },
  { value: "especialista", label: "Especialista",   color: "bg-purple-500/15 text-purple-400" },
  { value: "colaborador",  label: "Colaborador",    color: "bg-gray-500/15 text-gray-400" },
];

const AVATARS = ["💎", "👩‍💼", "💅", "✂️", "🌸", "💄", "👑", "🌟", "🎨", "✨", "🦋", "🌺"];

const EMPTY_FORM = {
  name: "", email: "", password: "", role: "agente" as AdminUser["role"],
  avatar: "👩‍💼", phone: "", bio: "",
};

function roleInfo(role: string) {
  return ROLES.find((r) => r.value === role) ?? ROLES[1];
}

/* ── Modal crear / editar usuario ── */
function UserModal({
  user, onSave, onClose,
}: {
  user: AdminUser | null;
  onSave: (data: typeof EMPTY_FORM & { id?: number }) => Promise<void>;
  onClose: () => void;
}) {
  const t = useAdminTheme();
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(user ?? {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!user;

  function set(k: keyof typeof EMPTY_FORM, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nombre y email son requeridos");
      return;
    }
    if (!isEdit && !form.password.trim()) {
      setError("La contraseña es requerida para nuevos usuarios");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, phone: form.phone ?? "", bio: form.bio ?? "", id: user?.id });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl border shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: t.colors.border }}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-bold ${t.text}`}>
              {isEdit ? `Editar: ${user!.name}` : "Crear nuevo usuario"}
            </h2>
            <button onClick={onClose} className={`text-2xl leading-none ${t.textFaint} hover:opacity-70`}>×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-auto">
          {/* Avatar */}
          <div>
            <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-2`}>Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((em) => (
                <button key={em} type="button"
                  onClick={() => set("avatar", em)}
                  className={`w-9 h-9 text-xl rounded-xl flex items-center justify-center transition-colors border ${form.avatar === em ? "" : "border-transparent"}`}
                  style={form.avatar === em ? { borderColor: t.colors.primary, backgroundColor: t.colors.primary + "22" } : {}}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre + Rol */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>Nombre</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2.5 text-sm ${t.text} focus:outline-none`}
                placeholder="Nombre completo" />
            </div>
            <div>
              <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>Rol</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value as AdminUser["role"])}
                className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2.5 text-sm ${t.textMuted} focus:outline-none`}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>Email</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)}
              type="email" disabled={isEdit}
              className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2.5 text-sm ${t.text} focus:outline-none ${isEdit ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="usuario@shelie.com" />
            {isEdit && <p className={`text-[10px] ${t.textFaint} mt-1`}>El email no se puede cambiar</p>}
          </div>

          {/* Contraseña */}
          <div>
            <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>
              {isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
            </label>
            <input value={form.password} onChange={(e) => set("password", e.target.value)}
              type="password"
              className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2.5 text-sm ${t.text} focus:outline-none`}
              placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"} />
          </div>

          {/* Teléfono */}
          <div>
            <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>Teléfono (opcional)</label>
            <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)}
              className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2.5 text-sm ${t.text} focus:outline-none`}
              placeholder="+57 300 000 0000" />
          </div>

          {/* Bio */}
          <div>
            <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>Notas / Especialidad</label>
            <textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)}
              rows={2}
              className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2.5 text-sm ${t.text} resize-none focus:outline-none`}
              placeholder="Horario, especialidades, etc." />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}
        </form>

        <div className="p-6 border-t flex gap-3" style={{ borderColor: t.colors.border }}>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: t.colors.primary }}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${t.mode === "dark" ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function UsuariosPage() {
  const t = useAdminTheme();
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState<"create" | AdminUser | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast]       = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authedFetch(apiUrl("/api/admin/users"));
      const data = await res.json() as AdminUser[];
      setUsers(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSave(data: typeof EMPTY_FORM & { id?: number }) {
    const isEdit = !!data.id;
    const payload: Record<string, unknown> = {
      name: data.name, role: data.role, avatar: data.avatar,
      phone: data.phone || null, bio: data.bio || null,
    };
    if (!isEdit) { payload.email = data.email; payload.password = data.password; }
    if (isEdit && data.password) payload.password = data.password;

    const res = isEdit
      ? await fetch(`/api/admin/users?id=${data.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await authedFetch(apiUrl("/api/admin/users"), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, email: data.email, password: data.password }),
        });

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? "Error al guardar");
    }
    await fetchUsers();
    showToast(isEdit ? "Usuario actualizado" : "Usuario creado exitosamente");
  }

  async function handleToggleActive(user: AdminUser) {
    setDeleting(user.id);
    try {
      await fetch(`/api/admin/users?id=${user.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      await fetchUsers();
      showToast(user.is_active ? "Usuario desactivado" : "Usuario activado");
    } catch {}
    setDeleting(null);
  }

  const activeUsers   = users.filter((u) => u.is_active);
  const inactiveUsers = users.filter((u) => !u.is_active);

  const cardStyle = { backgroundColor: t.colors.bgCard, borderColor: t.colors.border };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${t.text}`}>Usuarios</h1>
          <p className={`text-sm ${t.textMuted} mt-1`}>
            {activeUsers.length} activo{activeUsers.length !== 1 ? "s" : ""} · Gestiona quién accede al panel
          </p>
        </div>
        <button onClick={() => setModal("create")}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-80 transition-colors flex items-center gap-2"
          style={{ backgroundColor: t.colors.primary }}>
          + Nuevo usuario
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white text-sm px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          ✅ {toast}
        </div>
      )}

      {/* Lista activos */}
      <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
        <div className="px-6 py-4 border-b" style={{ borderColor: t.colors.border }}>
          <h2 className={`font-semibold ${t.text}`}>Usuarios activos</h2>
        </div>

        {loading ? (
          <div className={`p-12 text-center ${t.textFaint}`}>Cargando usuarios...</div>
        ) : activeUsers.length === 0 ? (
          <div className={`p-12 text-center ${t.textFaint}`}>
            <p className="text-3xl mb-3">👥</p>
            <p className="text-sm">No hay usuarios. Crea el primero.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: t.colors.border }}>
            {activeUsers.map((user) => (
              <UserRow key={user.id} user={user}
                onEdit={() => setModal(user)}
                onToggle={() => handleToggleActive(user)}
                toggling={deleting === user.id}
                t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Inactivos */}
      {inactiveUsers.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ ...cardStyle, opacity: 0.7 }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: t.colors.border }}>
            <h2 className={`font-semibold ${t.textMuted}`}>Usuarios desactivados ({inactiveUsers.length})</h2>
          </div>
          <div className="divide-y" style={{ borderColor: t.colors.border }}>
            {inactiveUsers.map((user) => (
              <UserRow key={user.id} user={user}
                onEdit={() => setModal(user)}
                onToggle={() => handleToggleActive(user)}
                toggling={deleting === user.id}
                t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <UserModal
          user={modal === "create" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/* ── Fila de usuario ── */
function UserRow({
  user, onEdit, onToggle, toggling, t,
}: {
  user: AdminUser;
  onEdit: () => void;
  onToggle: () => void;
  toggling: boolean;
  t: ReturnType<typeof useAdminTheme>;
}) {
  const ri = roleInfo(user.role);
  return (
    <div className={`flex items-center gap-4 px-6 py-4 ${!user.is_active ? "opacity-50" : ""}`}>
      {/* Avatar */}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: t.colors.primary + "22" }}>
        {user.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold ${t.text}`}>{user.name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ri.color}`}>
            {ri.label}
          </span>
          {!user.is_active && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">Inactivo</span>
          )}
        </div>
        <p className={`text-xs ${t.textMuted} mt-0.5`}>{user.email}</p>
        {user.phone && <p className={`text-xs ${t.textFaint} mt-0.5`}>📱 {user.phone}</p>}
      </div>

      {/* Fecha */}
      <div className="hidden md:block text-right flex-shrink-0">
        <p className={`text-[10px] ${t.textFaint}`}>Creado</p>
        <p className={`text-xs ${t.textMuted}`}>
          {new Date(user.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onEdit}
          className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors hover:opacity-80`}
          style={{ borderColor: t.colors.border, color: t.colors.textMuted }}>
          ✏️ Editar
        </button>
        <button onClick={onToggle} disabled={toggling}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-40 ${
            user.is_active
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          }`}>
          {toggling ? "..." : user.is_active ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}
