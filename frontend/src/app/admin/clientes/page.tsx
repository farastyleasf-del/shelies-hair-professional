"use client";
import { useAdminTheme } from "@/lib/admin-theme";

export default function ClientesPage() {
  const t = useAdminTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold" style={{ color: t.colors.text }}>👤 Clientes</h1>
        <p className="text-sm mt-1" style={{ color: t.colors.textMuted }}>Base de datos de clientes</p>
      </div>

      <div className="border rounded-2xl p-16 text-center" style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
        <p className="text-5xl mb-4">👤</p>
        <p className="text-lg font-semibold mb-2" style={{ color: t.colors.text }}>Sin clientes registrados</p>
        <p className="text-sm" style={{ color: t.colors.textMuted }}>Los clientes aparecerán aquí cuando realicen pedidos o se registren por WhatsApp.</p>
      </div>
    </div>
  );
}
