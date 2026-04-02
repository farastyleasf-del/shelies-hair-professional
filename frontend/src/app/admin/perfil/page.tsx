"use client";
import { useState, useEffect } from "react";
import { useAdminTheme } from "@/lib/admin-theme";

/* ═══════════════════════════════════════════════
   MÓDULO PERFIL — Agente / Usuario
   ═══════════════════════════════════════════════ */

const ROLES = ["Administrador", "Agente de ventas", "Especialista", "Colaborador"];
const AVATARS = ["💎", "👩‍💼", "💅", "✂️", "🌸", "💄", "👑", "🌟"];

interface AgentProfile {
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  bio: string;
}

const DEFAULT_PROFILE: AgentProfile = {
  name: "Shelie Admin",
  role: "Administrador",
  avatar: "💎",
  email: "admin@shelie.com",
  phone: "",
  bio: "",
};

export default function PerfilPage() {
  const t = useAdminTheme();
  const [profile, setProfile]     = useState<AgentProfile>(DEFAULT_PROFILE);
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState<AgentProfile>(DEFAULT_PROFILE);
  const [saved, setSaved]         = useState(false);

  // Cargar perfil guardado
  useEffect(() => {
    try {
      const raw = localStorage.getItem("shelie_agent_profile");
      if (raw) {
        const p = JSON.parse(raw) as AgentProfile;
        setProfile(p);
        setDraft(p);
        localStorage.setItem("shelie_agent_name", p.name);
      }
    } catch {}
  }, []);

  function startEdit() {
    setDraft({ ...profile });
    setEditing(true);
    setSaved(false);
  }

  function handleSave() {
    setProfile({ ...draft });
    try {
      localStorage.setItem("shelie_agent_profile", JSON.stringify(draft));
      localStorage.setItem("shelie_agent_name", draft.name); // usado en Inbox
    } catch {}
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleCancel() {
    setDraft({ ...profile });
    setEditing(false);
  }

  const cardStyle = {
    backgroundColor: t.colors.bgCard,
    borderColor: t.colors.border,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${t.text}`}>Mi Perfil</h1>
        <p className={`text-sm ${t.textMuted} mt-1`}>
          Tu identidad en el panel. El nombre aparece como remitente en los mensajes de Inbox.
        </p>
      </div>

      {/* Card principal */}
      <div className="rounded-2xl border p-6 space-y-6" style={cardStyle}>
        {/* Avatar + nombre */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ backgroundColor: t.colors.primary + "22" }}>
              {editing ? draft.avatar : profile.avatar}
            </div>
            {editing && (
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-1.5 flex flex-wrap gap-1 w-36"
                style={{ borderColor: t.colors.border, zIndex: 10 }}>
                {AVATARS.map((em) => (
                  <button key={em}
                    onClick={() => setDraft((d) => ({ ...d, avatar: em }))}
                    className={`w-7 h-7 text-xl rounded-lg flex items-center justify-center transition-colors ${draft.avatar === em ? "bg-gray-200 dark:bg-white/20" : "hover:bg-gray-100 dark:hover:bg-white/10"}`}>
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className={`w-full text-xl font-bold bg-transparent border-b-2 pb-1 focus:outline-none ${t.text}`}
                style={{ borderColor: t.colors.primary }}
                placeholder="Tu nombre"
              />
            ) : (
              <h2 className={`text-xl font-bold ${t.text}`}>{profile.name}</h2>
            )}
            <div className="mt-1">
              {editing ? (
                <select
                  value={draft.role}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                  className={`text-sm ${t.inputBg} border ${t.inputBorder} rounded-lg px-2 py-1 ${t.textMuted} focus:outline-none`}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              ) : (
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: t.colors.primary + "22", color: t.colors.primary }}>
                  {profile.role}
                </span>
              )}
            </div>
          </div>
          {!editing && (
            <button
              onClick={startEdit}
              className="px-4 py-2 text-sm rounded-xl border font-medium transition-colors hover:opacity-80"
              style={{ borderColor: t.colors.border, color: t.colors.textMuted }}>
              ✏️ Editar
            </button>
          )}
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" icon="📧"
            value={editing ? draft.email : profile.email}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
            type="email" />
          <Field label="Teléfono" icon="📱"
            value={editing ? draft.phone : profile.phone}
            editing={editing}
            onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
            placeholder="+57 300 000 0000" />
        </div>

        <div>
          <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>
            📝 Biografía / Notas
          </label>
          {editing ? (
            <textarea
              value={draft.bio}
              onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
              rows={3}
              placeholder="Especialidades, horario, etc."
              className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-4 py-2.5 text-sm ${t.text} resize-none focus:outline-none`}
            />
          ) : (
            <p className={`text-sm ${profile.bio ? t.textMuted : t.textFaint} min-h-[3rem]`}>
              {profile.bio || "Sin notas"}
            </p>
          )}
        </div>

        {/* Acciones */}
        {editing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors hover:opacity-80"
              style={{ backgroundColor: t.colors.primary }}>
              Guardar cambios
            </button>
            <button
              onClick={handleCancel}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${t.mode === "dark" ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
              Cancelar
            </button>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            ✅ Perfil guardado. Tu nombre aparecerá en los mensajes del Inbox.
          </div>
        )}
      </div>

      {/* Card WhatsApp config */}
      <div className="rounded-2xl border p-6" style={cardStyle}>
        <h3 className={`font-semibold ${t.text} mb-1`}>⚙️ Configuración WhatsApp Business</h3>
        <p className={`text-sm ${t.textMuted} mb-4`}>
          Variables de entorno necesarias para recibir y enviar mensajes reales de WhatsApp.
        </p>
        <div className="space-y-3">
          <ConfigVar name="WHATSAPP_ACCESS_TOKEN" description="Token permanente de Meta Business Manager" />
          <ConfigVar name="WHATSAPP_PHONE_NUMBER_ID" description="ID del número de teléfono registrado en Meta" />
          <ConfigVar name="WHATSAPP_VERIFY_TOKEN" description="Token de verificación del webhook (puedes inventarlo)" />
        </div>
        <div className={`mt-4 p-4 rounded-xl text-sm space-y-1 ${t.mode === "dark" ? "bg-white/3" : "bg-gray-50"} border ${t.border}`}>
          <p className={`font-medium ${t.text}`}>URL del Webhook para registrar en Meta:</p>
          <code className={`text-xs ${t.textMuted} break-all`}>
            https://shelies.asf.company/api/whatsapp/webhook
          </code>
          <p className={`text-xs ${t.textFaint} mt-2`}>
            Ir a Meta Business Manager → WhatsApp → Configuración → Webhooks → Editar
          </p>
        </div>
      </div>

      {/* Card Sesión */}
      <div className="rounded-2xl border p-6" style={cardStyle}>
        <h3 className={`font-semibold ${t.text} mb-4`}>🔐 Sesión</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${t.textMuted}`}>Usuario autenticado como administrador</p>
            <p className={`text-xs ${t.textFaint} mt-0.5`}>admin@shelie.com</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              window.location.href = "/admin";
            }}
            className="px-4 py-2 text-sm rounded-xl border font-medium transition-colors text-red-500 border-red-500/30 hover:bg-red-500/10">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, icon, value, editing, onChange, type = "text", placeholder,
}: {
  label: string; icon: string; value: string; editing: boolean;
  onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  const t = useAdminTheme();
  return (
    <div>
      <label className={`block text-xs font-medium ${t.textFaint} uppercase tracking-wider mb-1.5`}>
        {icon} {label}
      </label>
      {editing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          placeholder={placeholder}
          className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-4 py-2.5 text-sm ${t.text} focus:outline-none`}
        />
      ) : (
        <p className={`text-sm ${value ? t.textMuted : t.textFaint}`}>{value || "—"}</p>
      )}
    </div>
  );
}

function ConfigVar({ name, description }: { name: string; description: string }) {
  const t = useAdminTheme();
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${t.mode === "dark" ? "bg-white/3" : "bg-gray-50"} border ${t.border}`}>
      <code className="text-xs font-mono text-green-500 flex-shrink-0 mt-0.5">{name}</code>
      <span className={`text-xs ${t.textMuted}`}>{description}</span>
    </div>
  );
}
