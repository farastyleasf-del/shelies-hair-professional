import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — Shelie's Hair Professional",
  description: "Política de privacidad y tratamiento de datos personales de Shelie's Hair Professional, conforme a la Ley 1581 de 2012 y los requisitos de Meta.",
};

const LAST_UPDATE = "28 de febrero de 2026";
const COMPANY = "Shelie's Hair Professional";
const EMAIL = "sheilys16@gmail.com";
const WA1 = "573246828585";
const WA2 = "573197933287";

export default function PoliticaPrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-10">
        <span className="chip mb-4 inline-block">Legal</span>
        <h1 className="font-poppins font-bold text-3xl mb-2">Política de Privacidad</h1>
        <p className="text-humo text-sm">
          Última actualización: <strong>{LAST_UPDATE}</strong>
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-8 text-carbon/80 leading-relaxed">

        {/* 1 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">1. Responsable del tratamiento</h2>
          <p>
            <strong>{COMPANY}</strong> (en adelante «Shelie's» o «nosotros»), con sedes en Bogotá, Colombia, es
            responsable del tratamiento de los datos personales que usted nos proporciona a través de este sitio web,
            nuestras redes sociales, nuestro servicio de WhatsApp o cualquier otro canal de comunicación.
          </p>
          <ul className="mt-3 space-y-1 list-none pl-0">
            <li><strong>Correo electrónico:</strong> <a href={`mailto:${EMAIL}`} className="text-vino hover:underline">{EMAIL}</a></li>
            <li><strong>WhatsApp:</strong>{" "}
              <a href={`https://wa.me/${WA1}`} target="_blank" rel="noopener noreferrer" className="text-vino hover:underline">
                324 682 8585
              </a>{" / "}
              <a href={`https://wa.me/${WA2}`} target="_blank" rel="noopener noreferrer" className="text-vino hover:underline">
                319 793 3287
              </a>
            </li>
            <li><strong>Instagram:</strong>{" "}
              <a href="https://instagram.com/shelie_siemprebellas" target="_blank" rel="noopener noreferrer" className="text-vino hover:underline">
                @shelie_siemprebellas
              </a>
            </li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">2. Datos personales que recopilamos</h2>
          <p>Recopilamos únicamente los datos necesarios para prestar nuestros servicios:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Datos de contacto:</strong> nombre, número de teléfono, correo electrónico.</li>
            <li><strong>Datos de entrega:</strong> dirección, ciudad y notas de envío, cuando realizas un pedido.</li>
            <li><strong>Datos de navegación:</strong> dirección IP, tipo de dispositivo, páginas visitadas y
              tiempo de permanencia, recopilados automáticamente mediante cookies y el Píxel de Meta (Facebook/Instagram).</li>
            <li><strong>Comunicaciones:</strong> mensajes que nos envías a través del formulario de contacto,
              WhatsApp o Instagram.</li>
            <li><strong>Datos de transacción:</strong> historial de pedidos y productos adquiridos.</li>
          </ul>
          <p className="mt-3">
            <strong>No recopilamos</strong> datos sensibles como información financiera de tarjetas de crédito
            (los pagos se procesan a través de plataformas externas certificadas), ni datos de categorías especiales
            según la Ley 1581 de 2012.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">3. Finalidades del tratamiento</h2>
          <p>Sus datos son utilizados para las siguientes finalidades:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Procesar, confirmar y entregar sus pedidos.</li>
            <li>Brindarle atención al cliente y responder sus consultas.</li>
            <li>Enviarle información sobre promociones, nuevos productos o servicios, cuando haya dado su consentimiento.</li>
            <li>Mejorar la experiencia de navegación en nuestro sitio web.</li>
            <li>Mostrarle publicidad personalizada a través de Meta (Facebook e Instagram) mediante el Píxel de Meta,
              de acuerdo con las políticas de privacidad de Meta Platforms, Inc.</li>
            <li>Cumplir con obligaciones legales aplicables en Colombia.</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">4. Base legal del tratamiento</h2>
          <p>El tratamiento de sus datos se realiza bajo las siguientes bases legales, conforme a la Ley 1581 de 2012
            y el Decreto 1377 de 2013:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Ejecución de contrato:</strong> cuando sus datos son necesarios para procesar y entregar un pedido.</li>
            <li><strong>Consentimiento:</strong> para el envío de comunicaciones comerciales y el uso del Píxel de Meta.</li>
            <li><strong>Interés legítimo:</strong> para mejorar nuestros servicios y prevenir fraudes.</li>
            <li><strong>Obligación legal:</strong> cuando la ley colombiana nos exige conservar ciertos registros.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">5. Píxel de Meta y cookies</h2>
          <p>
            Este sitio web utiliza el <strong>Píxel de Meta</strong> (herramienta de análisis de Meta Platforms, Inc.),
            que nos permite medir la efectividad de nuestras campañas publicitarias en Facebook e Instagram, y
            mostrarte anuncios relevantes. El Píxel puede recopilar datos como eventos de navegación
            (visitas a páginas, adición al carrito, compras) y asociarlos con tu cuenta de Facebook cuando estás
            conectado.
          </p>
          <p className="mt-3">
            Puedes controlar las preferencias publicitarias de Meta en:{" "}
            <a
              href="https://www.facebook.com/ads/preferences"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vino hover:underline"
            >
              facebook.com/ads/preferences
            </a>.
          </p>
          <p className="mt-3">
            Adicionalmente, usamos cookies técnicas necesarias para el funcionamiento del sitio (carrito de compras,
            sesión) y cookies analíticas para medir el tráfico. Puedes desactivar las cookies desde la configuración
            de tu navegador, aunque esto puede afectar la funcionalidad del sitio.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">6. Transferencia a terceros</h2>
          <p>Sus datos pueden ser compartidos con:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Meta Platforms, Inc.</strong> (Facebook / Instagram): para publicidad segmentada, conforme a la
              {" "}<a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-vino hover:underline">
                Política de Privacidad de Meta
              </a>.</li>
            <li><strong>Operadores logísticos y mensajería:</strong> nombre y dirección de entrega para el despacho de pedidos.</li>
            <li><strong>Proveedores de infraestructura tecnológica:</strong> servicios de hosting y plataforma web, bajo
              acuerdos de confidencialidad.</li>
            <li><strong>Autoridades competentes:</strong> cuando así lo exija la ley colombiana.</li>
          </ul>
          <p className="mt-3">
            <strong>No vendemos ni cedemos</strong> sus datos personales a terceros con fines comerciales no relacionados
            con la prestación de nuestros servicios.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">7. Retención de datos</h2>
          <p>
            Conservamos sus datos durante el tiempo necesario para cumplir las finalidades descritas:
          </p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Datos de pedidos:</strong> hasta 5 años, por obligaciones contables y tributarias.</li>
            <li><strong>Datos de navegación (Píxel/cookies):</strong> hasta 180 días, según la configuración de Meta.</li>
            <li><strong>Comunicaciones de marketing:</strong> hasta que retire su consentimiento.</li>
            <li><strong>Solicitudes de contacto:</strong> hasta 2 años.</li>
          </ul>
          <p className="mt-3">
            Una vez vencidos estos plazos, sus datos serán eliminados o anonimizados de forma segura.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">8. Derechos del titular</h2>
          <p>De conformidad con la Ley 1581 de 2012, usted tiene derecho a:</p>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li><strong>Conocer</strong> qué datos personales suyos tenemos y cómo los usamos.</li>
            <li><strong>Actualizar o corregir</strong> sus datos cuando sean inexactos o incompletos.</li>
            <li><strong>Suprimir</strong> sus datos cuando no sean necesarios para las finalidades para las que fueron recopilados.</li>
            <li><strong>Revocar el consentimiento</strong> otorgado para el tratamiento de sus datos.</li>
            <li><strong>Oponerse</strong> al tratamiento de sus datos para fines de marketing directo.</li>
            <li><strong>Presentar una queja</strong> ante la Superintendencia de Industria y Comercio (SIC) si considera
              que sus derechos han sido vulnerados.</li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos, consulte nuestra{" "}
            <Link href="/eliminacion-datos" className="text-vino font-semibold hover:underline">
              página de eliminación de datos
            </Link>{" "}
            o contáctenos directamente.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">9. Seguridad de los datos</h2>
          <p>
            Implementamos medidas técnicas y organizativas razonables para proteger sus datos personales contra
            acceso no autorizado, pérdida, alteración o divulgación. Sin embargo, ningún sistema de transmisión
            por Internet es completamente seguro; por lo tanto, no podemos garantizar la seguridad absoluta.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">10. Menores de edad</h2>
          <p>
            Nuestros servicios no están dirigidos a menores de 14 años. No recopilamos conscientemente datos
            personales de menores. Si eres padre o tutor y crees que tu hijo nos ha proporcionado información
            personal, contáctanos para eliminarla.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">11. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política periódicamente. La versión más reciente siempre estará disponible
            en esta página con la fecha de última actualización. Te recomendamos revisarla con regularidad.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="font-poppins font-semibold text-lg text-carbon mb-3">12. Contacto</h2>
          <p>Para cualquier consulta sobre esta política o para ejercer tus derechos, contáctanos:</p>
          <ul className="mt-3 space-y-2 list-none pl-0">
            <li>
              <strong>Correo electrónico:</strong>{" "}
              <a href={`mailto:${EMAIL}`} className="text-vino hover:underline">{EMAIL}</a>
            </li>
            <li>
              <strong>WhatsApp:</strong>{" "}
              <a href={`https://wa.me/${WA1}`} target="_blank" rel="noopener noreferrer" className="text-vino hover:underline">
                324 682 8585
              </a>
            </li>
            <li>
              <strong>Instagram:</strong>{" "}
              <a href="https://instagram.com/shelie_siemprebellas" target="_blank" rel="noopener noreferrer" className="text-vino hover:underline">
                @shelie_siemprebellas
              </a>
            </li>
          </ul>
        </section>

        {/* Eliminacion */}
        <div className="bg-blush/20 rounded-2xl p-6 mt-6">
          <p className="font-poppins font-semibold mb-2">¿Deseas eliminar tus datos?</p>
          <p className="text-sm text-humo mb-4">
            Puedes solicitar la eliminación de tus datos personales en cualquier momento.
          </p>
          <Link href="/eliminacion-datos" className="btn-vino inline-block">
            Solicitar eliminación de datos →
          </Link>
        </div>

      </div>
    </div>
  );
}
