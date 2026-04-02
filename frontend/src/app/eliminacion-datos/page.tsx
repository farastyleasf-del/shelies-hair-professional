import Link from "next/link";

export const metadata = {
  title: "Eliminación de Datos — Shelie's Hair Professional",
  description: "Solicita la eliminación de tus datos personales de Shelie's Hair Professional. Proceso sencillo conforme a la Ley 1581 de 2012 y los requisitos de Meta.",
};

const EMAIL = "sheilys16@gmail.com";
const WA1 = "573042741979";
const SUBJECT = encodeURIComponent("Solicitud de eliminación de datos personales");
const BODY = encodeURIComponent(
  "Hola, solicito la eliminación de mis datos personales de los sistemas de Shelie's Hair Professional.\n\n" +
  "Nombre completo: \n" +
  "Correo electrónico registrado: \n" +
  "Número de teléfono registrado: \n\n" +
  "Confirmo que soy el titular de estos datos o actúo en representación del titular."
);

export default function EliminacionDatosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-10">
        <span className="chip mb-4 inline-block">Legal</span>
        <h1 className="font-poppins font-bold text-3xl mb-2">Eliminación de Datos Personales</h1>
        <p className="text-humo text-sm max-w-xl">
          Tienes derecho a solicitar la eliminación de tus datos personales en cualquier momento.
          Procesamos todas las solicitudes en un plazo máximo de <strong>15 días hábiles</strong>.
        </p>
      </div>

      {/* Pasos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {[
          {
            step: "1",
            title: "Envía tu solicitud",
            desc: "Escríbenos por WhatsApp o correo electrónico con tu nombre, teléfono o correo registrado.",
          },
          {
            step: "2",
            title: "Verificamos tu identidad",
            desc: "Confirmamos que eres el titular de los datos para proteger tu información.",
          },
          {
            step: "3",
            title: "Eliminamos tus datos",
            desc: "Removemos tus datos de nuestros sistemas en un plazo máximo de 15 días hábiles y te enviamos confirmación.",
          },
        ].map((item) => (
          <div key={item.step} className="card-premium p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-vino text-white font-poppins font-bold text-lg flex items-center justify-center mx-auto mb-4">
              {item.step}
            </div>
            <h3 className="font-poppins font-semibold mb-2">{item.title}</h3>
            <p className="text-humo text-sm">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Canales de solicitud */}
      <h2 className="font-poppins font-bold text-xl mb-6 border-l-4 border-vino pl-4">
        Canales para solicitar eliminación
      </h2>

      <div className="space-y-4 mb-12">
        {/* WhatsApp */}
        <div className="card-premium p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-poppins font-semibold mb-1">WhatsApp (canal más rápido)</h3>
            <p className="text-humo text-sm">
              Envíanos un mensaje con el texto:{" "}
              <span className="italic font-medium text-carbon">
                &ldquo;Solicito la eliminación de mis datos personales&rdquo;
              </span>
              , junto con tu nombre completo y el número o correo con que te registraste.
            </p>
          </div>
          <a
            href={`https://wa.me/${WA1}?text=${encodeURIComponent("Solicito la eliminación de mis datos personales.\n\nNombre: \nCorreo o teléfono registrado: ")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-vino whitespace-nowrap shrink-0"
          >
            Abrir WhatsApp →
          </a>
        </div>

        {/* Email */}
        <div className="card-premium p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-poppins font-semibold mb-1">Correo electrónico</h3>
            <p className="text-humo text-sm">
              Envía un correo a{" "}
              <a href={`mailto:${EMAIL}`} className="text-vino font-semibold hover:underline">
                {EMAIL}
              </a>{" "}
              con el asunto <span className="italic font-medium text-carbon">«Solicitud de eliminación de datos»</span>{" "}
              e incluye tu nombre completo, correo y/o teléfono registrado.
            </p>
          </div>
          <a
            href={`mailto:${EMAIL}?subject=${SUBJECT}&body=${BODY}`}
            className="btn-vino whitespace-nowrap shrink-0"
          >
            Enviar correo →
          </a>
        </div>
      </div>

      {/* Qué se elimina */}
      <h2 className="font-poppins font-bold text-xl mb-5 border-l-4 border-vino pl-4">
        ¿Qué datos eliminamos?
      </h2>
      <div className="card-premium p-6 mb-10">
        <ul className="space-y-3">
          {[
            { icon: "✓", label: "Nombre, correo electrónico y número de teléfono." },
            { icon: "✓", label: "Dirección de entrega y datos de pedidos históricos." },
            { icon: "✓", label: "Historial de comunicaciones enviadas (newsletter, notificaciones)." },
            { icon: "✓", label: "Datos asociados a tu cuenta en este sitio web." },
            { icon: "✓", label: "Datos de eventos enviados al Píxel de Meta vinculados a tu dispositivo." },
          ].map((item) => (
            <li key={item.label} className="flex items-start gap-3 text-sm">
              <span className="text-vino font-bold mt-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Excepciones */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
        <h3 className="font-poppins font-semibold mb-3 text-amber-800">Excepciones a la eliminación</h3>
        <p className="text-sm text-amber-700 leading-relaxed">
          De acuerdo con la <strong>Ley 1581 de 2012</strong> y la normativa tributaria colombiana, algunos datos
          pueden ser retenidos cuando sea necesario para:
        </p>
        <ul className="mt-3 space-y-1 list-disc pl-5 text-sm text-amber-700">
          <li>Cumplir obligaciones legales o tributarias (facturas y registros contables hasta 5 años).</li>
          <li>Resolver disputas o reclamaciones pendientes.</li>
          <li>Cumplir órdenes de autoridades competentes.</li>
        </ul>
        <p className="mt-3 text-sm text-amber-700">
          En estos casos, te informaremos qué datos no pudieron ser eliminados y el motivo.
        </p>
      </div>

      {/* Datos de Meta / Facebook Login */}
      <h2 className="font-poppins font-bold text-xl mb-5 border-l-4 border-blush pl-4">
        Datos relacionados con Meta (Facebook / Instagram)
      </h2>
      <div className="card-premium p-6 mb-10 space-y-3 text-sm text-humo leading-relaxed">
        <p>
          Si interactuaste con nuestras páginas de Facebook o Instagram, o si datos tuyos fueron recopilados
          a través del <strong>Píxel de Meta</strong>, puedes gestionar y eliminar esa información directamente
          desde Meta:
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <a
              href="https://www.facebook.com/off_facebook_activity"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vino hover:underline font-medium"
            >
              Actividad fuera de Facebook
            </a>{" "}
            — ver y eliminar la actividad de tu dispositivo enviada a Meta desde sitios externos.
          </li>
          <li>
            <a
              href="https://www.facebook.com/ads/preferences"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vino hover:underline font-medium"
            >
              Preferencias de anuncios
            </a>{" "}
            — controlar cómo Meta usa tus datos para mostrarte publicidad.
          </li>
          <li>
            <a
              href="https://www.facebook.com/help/contact/540977946302970"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vino hover:underline font-medium"
            >
              Formulario de solicitud de datos de Meta
            </a>{" "}
            — solicitar acceso, corrección o eliminación de datos en Meta Platforms.
          </li>
        </ul>
        <p>
          Para más información sobre cómo Meta maneja tus datos, consulta la{" "}
          <a
            href="https://www.facebook.com/privacy/policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-vino hover:underline font-medium"
          >
            Política de Privacidad de Meta
          </a>.
        </p>
      </div>

      {/* Confirmación */}
      <div className="bg-blush/20 rounded-2xl p-6 text-center">
        <p className="font-poppins font-semibold mb-2">¿Recibiré confirmación?</p>
        <p className="text-sm text-humo mb-1">
          Sí. Una vez procesada tu solicitud, te enviaremos confirmación por el mismo medio que usaste para solicitarla,
          dentro de los <strong>15 días hábiles</strong> siguientes a la recepción.
        </p>
        <p className="text-sm text-humo mt-3">
          ¿Tienes dudas sobre el proceso? Revisa nuestra{" "}
          <Link href="/politica-privacidad" className="text-vino font-semibold hover:underline">
            Política de Privacidad
          </Link>{" "}
          o escríbenos directamente.
        </p>
      </div>
    </div>
  );
}
