"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/* ══════════════════════════════════════════════════════
   CONFIRMACIÓN — Resultado de pago MercadoPago
   Parámetros que envía MP:
     ?status=approved|pending|rejected
     ?order=shelies-xxx
     ?payment_id=xxx (MP lo agrega automáticamente)
   ══════════════════════════════════════════════════════ */

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-20 text-center"><p className="text-humo">Cargando...</p></div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}

function ConfirmacionContent() {
  const params    = useSearchParams();
  const status    = params.get("status");
  const orderId   = params.get("order");
  const paymentId = params.get("payment_id");
  const { clear } = useCart();

  // Limpiar carrito solo si el pago fue aprobado
  useEffect(() => {
    if (status === "approved") clear();
  }, [status, clear]);

  if (status === "approved") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="font-poppins font-bold text-3xl mb-2 text-green-700">¡Pago exitoso!</h1>
        <p className="text-humo mb-6">Tu pedido ha sido confirmado y está en proceso.</p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left space-y-2 mb-8">
          {orderId && (
            <div className="flex justify-between text-sm">
              <span className="text-humo">Número de pedido</span>
              <span className="font-mono font-medium text-xs">{orderId}</span>
            </div>
          )}
          {paymentId && (
            <div className="flex justify-between text-sm">
              <span className="text-humo">ID de pago MP</span>
              <span className="font-mono font-medium text-xs">{paymentId}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-humo">Estado</span>
            <span className="text-green-600 font-semibold">✅ Aprobado</span>
          </div>
        </div>

        <p className="text-sm text-humo mb-8">
          Recibirás un email de confirmación. Te contactaremos por WhatsApp para coordinar la entrega.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/tienda" className="btn-vino">Seguir comprando</Link>
          <Link href="/" className="btn-outline-vino">Ir al inicio</Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">⏳</span>
        </div>
        <h1 className="font-poppins font-bold text-3xl mb-2 text-amber-700">Pago en proceso</h1>
        <p className="text-humo mb-6">
          Tu pago está pendiente de confirmación. Esto puede tomar unos minutos.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-2 mb-8">
          {orderId && (
            <div className="flex justify-between text-sm">
              <span className="text-humo">Número de pedido</span>
              <span className="font-mono font-medium text-xs">{orderId}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-humo">Estado</span>
            <span className="text-amber-600 font-semibold">⏳ Pendiente</span>
          </div>
        </div>

        <p className="text-sm text-humo mb-8">
          Si pagaste en efectivo (Efecty, Baloto), el pago se confirmará al acreditarse.
          Te notificaremos por email y WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/tienda" className="btn-vino">Seguir comprando</Link>
          <Link href="/" className="btn-outline-vino">Ir al inicio</Link>
        </div>
      </div>
    );
  }

  // Estado por defecto / sin parámetros (visita directa)
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-5xl">🛍️</span>
      </div>
      <h1 className="font-poppins font-bold text-3xl mb-2">¡Gracias por tu compra!</h1>
      <p className="text-humo mb-8">
        {orderId
          ? `Tu pedido ${orderId} está siendo procesado.`
          : "Tu pedido está siendo procesado. Te contactaremos pronto."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/tienda" className="btn-vino">Seguir comprando</Link>
        <Link href="/" className="btn-outline-vino">Ir al inicio</Link>
      </div>
    </div>
  );
}
