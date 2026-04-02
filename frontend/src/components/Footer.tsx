import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-vino text-white/70 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/images/shelies-logo-real.jpg"
              alt="Shelie's Hair Professional"
              width={52}
              height={52}
              className="object-contain rounded-full"
            />
            <div>
              <h3 className="font-poppins font-bold text-lg text-white leading-tight">
                Shelie&apos;s
              </h3>
              <p className="text-xs text-blush">Hair Professional</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            Especialistas capilares. Alisados orgánicos, reparación y productos de última tecnología.
          </p>
        </div>

        {/* Tienda */}
        <div>
          <h4 className="font-poppins font-semibold text-white text-sm mb-4">Tienda</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/tienda" className="hover:text-rosa transition-colors">Todos los productos</Link></li>
            <li><Link href="/tienda?objective=control-frizz" className="hover:text-rosa transition-colors">Control Frizz</Link></li>
            <li><Link href="/tienda?objective=brillo-suavidad" className="hover:text-rosa transition-colors">Brillo y Suavidad</Link></li>
            <li><Link href="/tienda?objective=reparacion" className="hover:text-rosa transition-colors">Reparación</Link></li>
            <li><Link href="/tienda?objective=crecimiento-anticaida" className="hover:text-rosa transition-colors">Anti-caída</Link></li>
          </ul>
        </div>

        {/* Sedes */}
        <div>
          <h4 className="font-poppins font-semibold text-white text-sm mb-4">Nuestras Sedes</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <p className="text-white/90 font-medium">Sede Sur — Barrio Olarte</p>
              <p>Calle 56a Sur #71F-15</p>
            </li>
            <li>
              <p className="text-white/90 font-medium">Sede Norte — Barrio Gilmar</p>
              <p>Carrera 59 #160-06</p>
            </li>
            <li>
              <p className="text-white/90 font-medium">Bodega Principal</p>
              <p>Carrera 27c #71b-08</p>
            </li>
          </ul>
        </div>

        {/* Contacto & Redes */}
        <div>
          <h4 className="font-poppins font-semibold text-white text-sm mb-4">Contáctanos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://wa.me/573042741979"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rosa transition-colors"
              >
                WhatsApp: 304 274 1979
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/573246828585"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rosa transition-colors"
              >
                WhatsApp: 324 682 8585
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/shelie_siemprebellas"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rosa transition-colors"
              >
                Instagram @shelie_siemprebellas
              </a>
            </li>
            <li>
              <a
                href="https://tiktok.com/@shelieshely"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rosa transition-colors"
              >
                TikTok @shelieshely
              </a>
            </li>
          </ul>
          <p className="text-xs mt-6 text-white/40">© 2026 Shelie&apos;s Hair Professional. Todos los derechos reservados.</p>
          <div className="mt-4 flex flex-col gap-1 text-xs">
            <Link href="/politica-privacidad" className="hover:text-rosa transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/eliminacion-datos" className="hover:text-rosa transition-colors">
              Eliminación de Datos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
