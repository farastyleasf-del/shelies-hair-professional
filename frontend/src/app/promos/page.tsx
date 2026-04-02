import Link from "next/link";

export default function PromosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-poppins font-bold text-3xl mb-3">Promociones</h1>
        <p className="text-humo max-w-lg mx-auto">
          Aprovecha nuestras ofertas especiales y ahorra en tu rutina capilar.
        </p>
      </div>

      <div className="card-premium p-16 text-center mb-6">
        <p className="text-4xl mb-4">🏷️</p>
        <p className="font-poppins font-semibold text-lg mb-2">Próximamente</p>
        <p className="text-humo text-sm">
          Estamos preparando ofertas especiales para ti. ¡Vuelve pronto!
        </p>
      </div>

      {/* Envío gratis */}
      <div className="card-premium p-8 text-center">
        <span className="text-4xl block mb-3">🚚</span>
        <h2 className="font-poppins font-semibold text-xl mb-2">Envío gratis</h2>
        <p className="text-humo text-sm">En todas las compras superiores a $150.000 COP</p>
        <Link href="/tienda" className="btn-vino mt-4 inline-block">Ir a la tienda</Link>
      </div>
    </div>
  );
}
