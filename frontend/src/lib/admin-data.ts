/* ══════════════════════════════════════════════════════
   ADMIN UTILS — helpers y mapas de UI (sin datos mock)
   ══════════════════════════════════════════════════════ */

/* ── Formateo ── */
export function formatCOPAdmin(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(n);
}

/* ── Tiempo relativo (tiempo real) ── */
export function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/* ── Canal ── */
export const channelIcons: Record<string, string> = {
  whatsapp: "📱", instagram: "📸", facebook: "💬", web: "🌐", tiktok: "🎵",
};

export const channelColors: Record<string, string> = {
  whatsapp: "bg-green-500/20 text-green-400",
  instagram: "bg-pink-500/20 text-pink-400",
  facebook: "bg-blue-500/20 text-blue-400",
  web: "bg-purple-500/20 text-purple-400",
  tiktok: "bg-black/20 text-[#69C9D0]",
};

/* ── Estado conversación/pedido ── */
export const statusColors: Record<string, string> = {
  nuevo: "bg-blue-500/20 text-blue-400",
  en_atencion: "bg-yellow-500/20 text-yellow-300",
  espera_cliente: "bg-orange-500/20 text-orange-400",
  espera_equipo: "bg-red-500/20 text-red-400",
  cerrado: "bg-zinc-500/20 text-zinc-400",
  convertido: "bg-green-500/20 text-green-400",
  pagado: "bg-emerald-500/20 text-emerald-400",
  empacado: "bg-amber-500/20 text-amber-400",
  enviado: "bg-sky-500/20 text-sky-400",
  entregado: "bg-green-500/20 text-green-400",
  devuelto: "bg-red-500/20 text-red-400",
  cancelado: "bg-zinc-600/20 text-zinc-500",
  incidencia: "bg-rose-500/20 text-rose-400",
};

/* ── Plantillas de respuesta rápida (chat) ── */
import type { Template } from "./admin-types";

export const templates: Template[] = [
  /* ── SALUDO ── */
  {
    id: "tpl-s1", name: "Saludo bienvenida",
    channel: ["whatsapp"], category: "saludo", variables: [],
    text: "Hola hablas con Katherine 🦄✨ es un gusto atenderte, cuéntame en qué te puedo ayudar ?? 🌸💫",
  },

  /* ── CITAS ── */
  {
    id: "tpl-c1", name: "Datos para agendar cita",
    channel: ["whatsapp"], category: "citas", variables: [],
    text: "si gustas agendar envíame 🦄✨\n\nNOMBRE COMPLETO\nCEDULA\nDIRECCION\nCELULAR\nCORREO ELECTRONICO\nFECHA DE LA CITA\nSEDE EN QUE DESEAS LA CITA\nHORA DE LA CITA\nPROCEDIMIENTO\nVALOR ACORDADO\n\nNUESTRAS TRES FRANJAS HORARIAS 8:00 am  1:00pm  y 4:00 pm\nSEDE SUR Y SEDE NORTE",
  },
  {
    id: "tpl-c2", name: "Confirmación abono + reglas",
    channel: ["whatsapp"], category: "citas", variables: [],
    text: "🦄Gracias por confiar en nuestro trabajo 💕✨ recuerda que para agendar tu cita debes realizar un abono de $30.000 anticipado, AL QR enviado, del cual es descontable del valor de tu procedimiento, recuerda que si no asistes a la cita , y no avisas con mínimo 1 día antes , el abono no tiene devolución✅💕💕 Hermosa te recordamos que, NO DEBES ASISTIR CON ACOMPAÑANTES, de ser así , el acompañante no tiene ingreso y debe esperar afuera ( en la calle)⚠️",
  },
  {
    id: "tpl-c3", name: "Cita agendada ✅",
    channel: ["whatsapp"], category: "citas", variables: [],
    text: "⚠️‼️Gracias por agendar recuerda que te atendio Katherine, Por favor, omita cualquier mensaje que reciba por correo con cambios de fecha u hora. La cita válida es la confirmada por este medio⚠️‼️",
  },
  {
    id: "tpl-c4", name: "Indicaciones pre-cita",
    channel: ["whatsapp"], category: "citas", variables: [],
    text: "A tener en cuenta antes de agendar tu cita ⚠️\n\n✅ Recuerda el día de la cita ser muy sincera con tu profesional acerca de todos los procesos químicos de color y alisados anteriores que tengas o hayas tenido para que de esa manera la profesional pueda determinar cómo manejar tu cabello y el proceso ideal.\n✅ El abono realizado no tiene devolución bajo ningún motivó. Por esto solicitamos que tengas claro que puedas asistir el día y la hora de la cita 👍🦄\n✅ Recuerda que cualquier proceso que realicemos debe tener unos cuidados en casa, principalmente alisados, debes usar el pos cuidado o kit de mantenimiento.",
  },
  {
    id: "tpl-c5", name: "Confirmar fecha",
    channel: ["whatsapp"], category: "citas", variables: [],
    text: "Confírmame para cuando deseas agendar ? ✨",
  },

  /* ── PEDIDOS ── */
  {
    id: "tpl-p1", name: "Datos para pedido",
    channel: ["whatsapp"], category: "pedidos", variables: [],
    text: "Para agendar tu pedido envíame estos datos por favor 🦄✨\n\nNOMBRE COMPLETO\nCEDULA\nDIRECCION\n(Si es conjunto, nombre del conjunto, torre y apartamento)\nCELULAR\nCORREO ELECTRONICO\nTeléfono de respaldo:\nBarrio:\nProductos:\n\nNOTA: FAVOR CONSIGNAR AL QR ENVIADO, recuerda que debes realizar la consignación total de los productos, domicilio para Bogotá y Soacha tiene un costo de $10.000\n\n⚠️ IMPORTANTE EL PEDIDO DEMORA DE 2 A 3 DIAS HABILES",
  },

  /* ── UBICACIÓN ── */
  {
    id: "tpl-u1", name: "Ubicación + cómo llegar",
    channel: ["whatsapp"], category: "ubicacion", variables: [],
    text: "✨🦄 Estamos ubicados en Bogotá: Barrio Olarte CALLE 56 A SUR # 71 F – 15 (Diagonal a la iglesia: Parroquia Ntra Sra. De Monserrat)\n\n✨ En Transmilenio por el portal sur (alimentador Olarte-Timiza, la última parada)",
  },

  /* ── SERVICIOS ── */
  {
    id: "tpl-sv1", name: "Catálogo de tratamientos",
    channel: ["whatsapp"], category: "servicios", variables: [],
    text: "Hermosa manejamos todo lo que es reparación capilar y alisados orgánicos 🌸\n\n🌸 BOTOX CAPILAR\n🌸 TERAPIA DE RECONSTRUCCIÓN\n🌸 REPOLARIZACIÓN\n🌸 TERAPIA ANTI CAÍDA\n🌸 ALISADO ORGÁNICO",
  },
  {
    id: "tpl-sv2", name: "Botox Capilar",
    channel: ["whatsapp"], category: "servicios", variables: [],
    text: "🌸🦄 Botox Capilar: los beneficios del botox capilar son dirigidos a todo tipo de hebra, pero en especial a las hebras más procesadas y maltratadas químicamente.\n\nMULTIBENEFICIOS:\n🦄 Restauración capilar\n🦄 Hidratación capilar\n🦄 Brillo intenso y reparación\n🦄 Transformación capilar\n🦄 Efecto anti-edad capilar\n\nSus ingredientes principales son: CANELA • MORINGA • ARGAN • NO ALISA\n\nTiene un costo dependiendo el largo y la cantidad del cabello ✨💞",
  },
  {
    id: "tpl-sv3", name: "Terapia de Reconstrucción",
    channel: ["whatsapp"], category: "servicios", variables: [],
    text: "✨ TRATAMIENTO REPARADOR INTENSIVO SHELIÉ'S ✨\nTERAPIA DE RECONSTRUCCIÓN\n\n🦄 Fórmula avanzada con vitamina B7 (biotina), queratina, péptidos y proteínas, diseñada para reconstruir el córtex capilar (capa interna de la hebra). Proporciona resultados inmediatos, recuperando elasticidad y vitalidad, con una restauración de hasta un 80% desde la primera sesión.\n\n📌 INDICADO PARA: Cabellos con daño profundo, sin elasticidad ni resistencia (efecto chicle).\n🔔 NO ALISA – ES UN TRATAMIENTO REPARADOR.",
  },
  {
    id: "tpl-sv4", name: "Repolarización",
    channel: ["whatsapp"], category: "servicios", variables: [],
    text: "REPOLARIZACIÓN: es un procedimiento reparador y nutritivo dirigido a todo tipo de hebra capilar, recupera la elasticidad, brillo, suavidad y vida de las hebras más maltratadas y procesadas, repara a profundidad, suaviza y aporta un brillo extremo. Tiene una duración de 1-2 meses (se puede mantener con tratamientos hidratantes para mayor duración) ✨",
  },
  {
    id: "tpl-sv5", name: "Corte Bordado",
    channel: ["whatsapp"], category: "servicios", variables: [],
    text: "CORTE BORDADO 💇🏻‍♀️ Se realiza con una máquina especial, diseñada para retirar la horquilla del cabello sin afectar su longitud, eliminando así puntas abiertas y secas ayudando a oxigenar el cabello para crecimiento sano. ❇",
  },
  {
    id: "tpl-sv6", name: "Terapia Total Scalp",
    channel: ["whatsapp"], category: "servicios", variables: [],
    text: "TERAPIA TOTAL SCALP 🤒💊\nTratamiento dirigido al cuero cabelludo que ayuda a aliviar irritaciones, dermatitis seborreica, alopecia, caída excesiva, además estimula el crecimiento y funciona como un desintoxicante al cuero cabelludo, proporcionando muchos nutrientes.",
  },
  {
    id: "tpl-sv7", name: "Solicitar foto del cabello",
    channel: ["whatsapp"], category: "servicios", variables: [],
    text: "Para poder cotizar correctamente el procedimiento, por favor envíanos una foto de tu cabello suelto y de espalda.\nAsí evaluamos largo, cantidad y estado del cabello, y te damos el valor exacto para agendar 🦄💗",
  },

  /* ── PRODUCTOS ── */
  {
    id: "tpl-pr1", name: "Kits de mantenimiento",
    channel: ["whatsapp"], category: "productos", variables: [],
    text: "Recuerda que cualquier proceso debe tener cuidados en casa. Te recomendamos nuestros kits:\n\n🌸 Kit básico: shampoo + acondicionador 500ml → $54.000\n🌸 Kit básico: shampoo + acondicionador litro → $100.000\n🌸 Kit protección: shampoo + acondicionador + termoprot. → $84.000\n🌸 Kit cuidado total: shampoo + acondicionador + termoprot. + mascarilla → $121.000\n🌸 Aceite de coco → $22.000 | Aceite de ricino → $14.000",
  },
  {
    id: "tpl-pr2", name: "Línea profesional",
    channel: ["whatsapp"], category: "productos", variables: [],
    text: "💇🏻‍♀️ Para la venta de nuestro producto LÍNEA PROFESIONAL escríbenos al 3197933287 ☺️",
  },

  /* ── PAGOS ── */
  {
    id: "tpl-pg1", name: "Datos de pago (Nequi / Daviplata)",
    channel: ["whatsapp"], category: "pagos", variables: [],
    text: "NEQUI / DAVIPLATA: 3246828585\n\nTe enviamos el QR de pago a continuación 🦄✨",
  },
  {
    id: "tpl-pg2", name: "QR — Shelie S Hair Studio",
    channel: ["whatsapp"], category: "pagos", variables: [],
    text: "QR de pago — Shelie S Hair Studio SAS 🦄",
    imageUrl: "/images/qr/qr-nequi.jpeg",
  },
  {
    id: "tpl-pg3", name: "QR — ADL Cosméticos",
    channel: ["whatsapp"], category: "pagos", variables: [],
    text: "QR de pago — ADL Cosméticos SAS 🦄",
    imageUrl: "/images/qr/qr-redeban.jpeg",
  },
];
