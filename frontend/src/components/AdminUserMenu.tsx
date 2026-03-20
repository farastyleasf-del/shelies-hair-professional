"use client";
import { useState, useEffect } from "react";
import { useAdminTheme } from "@/lib/admin-theme";

export default function AdminUserMenu({ collapsed }: { collapsed: boolean }) {
  const t = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => sessionStorage.getItem("admin_name") || "Admin");
  const [role, setRole] = useState(() => sessionStorage.getItem("admin_role") || "admin");

  useEffect(() => { sessionStorage.setItem("admin_name", name); }, [name]);
  useEffect(() => { sessionStorage.setItem("admin_role", role); }, [role]);

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    window.location.reload();
  }

  const inp = `rounded-lg px-3 py-2 text-sm border`;
  const inpStyle = { backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: t.colors.primaryLight, color: t.colors.primaryText }}>
          {name.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: t.colors.text }}>{name}</div>
            <div className="text-[11px]" style={{ color: t.colors.textFaint }}>
              {role === "admin" ? "Administrador" : "Colaborador"}
            </div>
          </div>
        )}
        <button onClick={() => setOpen((o) => !o)}
          className="text-xs px-2 py-1 rounded-lg hover:opacity-90"
          style={{ color: t.colors.textFaint }}>
          Perfil
        </button>
      </div>

      {open && !collapsed && (
        <div className="border rounded-xl p-3 space-y-3"
          style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
          <div className="space-y-1">
            <label className="text-[11px] block" style={{ color: t.colors.textMuted }}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} style={inpStyle} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] block" style={{ color: t.colors.textMuted }}>Tema</label>
            <button onClick={() => t.toggleMode()}
              className="px-3 py-1 rounded-lg text-sm border"
              style={{ backgroundColor: t.colors.bgDeep, borderColor: t.colors.border, color: t.colors.text }}>
              {t.mode === "dark" ? "🌙 Modo Oscuro" : "☀️ Modo Claro"}
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] block" style={{ color: t.colors.textMuted }}>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inp} style={inpStyle}>
              <option value="admin">Admin</option>
              <option value="colaborador">Colaborador</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={handleLogout}
              className="flex-1 text-sm bg-red-500 text-white rounded-lg px-3 py-2">
              Cerrar sesión
            </button>
            <button onClick={() => setOpen(false)}
              className="flex-1 text-sm border rounded-lg px-3 py-2"
              style={{ borderColor: t.colors.border, color: t.colors.text }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
