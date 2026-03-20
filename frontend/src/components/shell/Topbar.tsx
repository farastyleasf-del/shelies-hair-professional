"use client";
import { useAdminTheme } from "@/lib/admin-theme";
import AdminUserMenu from "@/components/AdminUserMenu";

export default function Topbar({ onToggleNav, breadcrumb }: { onToggleNav: () => void; breadcrumb?: React.ReactNode }) {
  const t = useAdminTheme();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="flex items-center justify-between px-4 h-full">
        {/* IZQUIERDA */}
        <div className="flex items-center gap-3 min-w-[360px]">
          <button onClick={onToggleNav} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-lg">
            <span className="sr-only">Abrir menú</span>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="6" width="16" height="2" rx="1"/><rect x="4" y="11" width="16" height="2" rx="1"/><rect x="4" y="16" width="16" height="2" rx="1"/></svg>
          </button>
          <span className="font-poppins font-bold text-lg text-white">Atlas</span>
          <AdminUserMenu collapsed={false} />
        </div>
        {/* CENTRO (opcional buscador) */}
        <div className="flex-1" />
        {/* DERECHA */}
        <div className="flex items-center gap-3">
          {breadcrumb && <div className="text-xs text-white/70">{breadcrumb}</div>}
          {/* Notificaciones, ayuda, etc. */}
        </div>
      </div>
    </header>
  );
}
