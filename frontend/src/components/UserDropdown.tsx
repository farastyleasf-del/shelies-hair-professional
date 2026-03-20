"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAdminTheme } from "@/lib/admin-theme";

export default function UserDropdown({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const [name] = useState(() => typeof window !== "undefined" ? (sessionStorage.getItem("admin_name") || "Admin") : "Admin");
  const [email] = useState(() => typeof window !== "undefined" ? (sessionStorage.getItem("admin_email") || "admin@shelie.com") : "admin@shelie.com");
  const ref = useRef<HTMLDivElement | null>(null);
  const t = useAdminTheme();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    window.location.reload();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1 rounded-xl"
        style={{ backgroundColor: t.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: t.colors.primaryLight, color: t.colors.primaryText }}>
          {name.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <>
            <div className="text-sm font-medium" style={{ color: t.colors.text }}>{name}</div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl shadow-lg py-3 z-50 border"
          style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
          <div className="px-4 pb-2 border-b mb-2" style={{ borderColor: t.colors.border }}>
            <div className="font-medium text-sm" style={{ color: t.colors.text }}>{name}</div>
            <div className="text-[12px] truncate" style={{ color: t.colors.textMuted }}>{email}</div>
          </div>
          <div className="px-3 space-y-1">
            <button onClick={() => t.toggleMode()}
              className="w-full text-left px-3 py-2 rounded-lg text-sm"
              style={{ color: t.colors.textMuted }}>
              {t.mode === "dark" ? "🌙 Modo Oscuro" : "☀️ Modo Claro"}
            </button>
            <Link href="/admin/configuracion"
              className="block px-3 py-2 rounded-lg text-sm"
              style={{ color: t.colors.textMuted }}>
              Configuración
            </Link>
            <button onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-red-400 text-sm">
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
