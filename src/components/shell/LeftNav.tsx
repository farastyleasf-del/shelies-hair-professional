"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminTheme } from "@/lib/admin-theme";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "" },
  { href: "/admin/inbox", label: "Inbox", icon: "" },
  { href: "/admin/citas", label: "Citas", icon: "📅" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "" },
  { href: "/admin/clientes", label: "Clientes", icon: "" },
  { href: "/admin/catalogo", label: "Catálogo", icon: "" },
  { href: "/admin/equipo", label: "Equipo", icon: "" },
  { href: "/admin/reportes", label: "Reportes", icon: "" },
  { href: "/admin/configuracion", label: "Config", icon: "" },
];

export default function LeftNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const t = useAdminTheme();
  return (
    <nav className={`h-full flex flex-col items-center py-2 ${collapsed ? "w-72" : "w-20"} bg-black/60 border-r border-white/10 transition-all duration-300`}>
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} title={item.label}
            className={`my-1 flex items-center justify-center w-14 h-14 rounded-xl transition-all ${active ? "bg-white/10 shadow-lg" : "hover:bg-white/5"}`}
          >
            <span className={`text-base font-semibold ${active ? "text-white" : "text-white/60"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
