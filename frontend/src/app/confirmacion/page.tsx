"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCOP } from "@/lib/data";

interface OrderData {
  id: string;
  items: { name: string; qty: number; price: number }[];
  customer: { name: string; email: string };
  total: number;
  status: string;
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-20 text-center"><p className="text-humo">Cargando...</p></div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}

function ConfirmacionContent() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastOrder");
    if (raw) setOrder(JSON.parse(raw));
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="font-poppins font-bold text-3xl mb-2">¡Pedido confirmado!</h1>
      <p className="text-humo mb-1">Gracias por tu compra. Te enviamos la confirmación a tu email.</p>
      {orderId && <p className="font-mono text-sm text-vino font-semibold mb-6">#{orderId}</p>}

      {order && (
        <div className="card-premium p-6 text-left mb-8">
          <h3 className="font-poppins font-semibold mb-3">Resumen del pedido</h3>
          <div className="space-y-2 mb-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-humo">{item.name} × {item.qty}</span>
                <span>{formatCOP(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <hr className="border-blush/30 mb-3" />
          <div className="flex justify-between font-poppins font-bold">
            <span>Total pagado</span>
            <span>{formatCOP(order.total)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/mi-pedido" className="btn-vino">Ver estado del pedido</Link>
        <Link href="/tienda" className="btn-outline">Seguir comprando</Link>
      </div>
    </div>
  );
}
