// src/lib/store.ts
// Provides localStorage persistence for admin CRUD operations
// Falls back to data.ts defaults when localStorage is empty

import { Product } from "./types";
import { products as defaultProducts } from "./data";

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  duration: string;
  highlights: string[];
  image: string;
  before?: string;
  type: "proceso" | "adicional";
  price?: string;
  icon?: string;
};

const defaultServices: ServiceItem[] = [
  {
    id: "alisado-organico",
    title: "Alisado Orgánico Efecto Shelie's",
    description: "Procedimiento de alisado y reparación — liso perfecto y transformación capilar. Enriquecido con aceite de MURUMURU (maravilla anti-edad del Amazonas), mezcla de aminoácidos que repara y nutre, y aceite de AGUACATE para hidratación intensa. Nuestro activo alisador es el TANINO: 0% Formol, no expulsa vapores tóxicos. 100% Orgánico.",
    duration: "5–6 meses",
    highlights: ["0% Formol — sin vapores tóxicos", "100% Orgánico (activo: TANINO)", "No se plancha con el producto aplicado", "Apto para mujeres en estado de embarazo", "Apto para mujeres lactantes", "Apto para niñas a partir de 6 años"],
    image: "/images/services/resultado-3.jpg",
    before: "/images/services/antes-2.jpg",
    type: "proceso",
  },
  {
    id: "botox-capilar-servicio",
    title: "Botox Capilar Canela",
    description: "Multibeneficios para todo tipo de hebra, especialmente las más procesadas y maltratadas químicamente — cabellos sin vida y sin movimiento. Sus ingredientes principales son Canela, Moringa y Argán. Tiene un costo dependiendo del largo y la cantidad del cabello.",
    duration: "1–2 meses (60% liso)",
    highlights: ["Restauración capilar", "Hidratación capilar", "Brillo intenso y reparación", "Liso 60% durante 1–2 meses", "Transformación capilar", "Efecto anti-edad capilar"],
    image: "/images/services/resultado-modelo-1.jpg",
    before: "/images/services/antes-1.jpg",
    type: "proceso",
  },
  {
    id: "terapia-scalp",
    title: "Terapia Total Scalp",
    description: "Tratamiento dirigido al cuero cabelludo — el remedio capilar que ayuda a aliviar irritaciones, dermatitis seborreica, alopecia y caída excesiva. Además estimula el crecimiento y funciona como desintoxicante del cuero cabelludo, proporcionando a su vez muchos nutrientes.",
    duration: "Según valoración",
    highlights: ["Alivia irritaciones y dermatitis seborreica", "Combate la alopecia", "Reduce la caída excesiva", "Desintoxica el cuero cabelludo", "Estimula el crecimiento capilar", "Aporta nutrientes al folículo"],
    image: "/images/services/aplicacion-1.jpg",
    type: "proceso",
  },
  {
    id: "reconstruccion",
    title: "Terapia de Reconstrucción",
    description: "Tratamiento reparador intensivo Shelie's — fórmula perfecta con la misma composición del cabello. Provee Vitamina B7, biotina, keratina, péptidos y proteínas directamente al córtex capilar. Proporciona resultados inmediatos en recuperación de elasticidad y vitalidad, restaurando hasta un 80% en la primera sesión. Dirigido a cabellos con daños profundos, sin elasticidad ni resistencia (efecto chicle). NO ALISA.",
    duration: "1 sesión (60–80% recuperación)",
    highlights: ["Penetra hasta el córtex capilar", "Vitamina B7, biotina, keratina, péptidos y proteínas", "Recupera elasticidad 60–80% en la primera sesión", "Para cabellos sin elasticidad — efecto chicle", "Resultados inmediatos y visibles"],
    image: "/images/services/resultado-modelo-2.jpg",
    before: "/images/services/antes-3.jpg",
    type: "proceso",
  },
  {
    id: "repolarizacion",
    title: "Repolarización — Cronograma Capilar",
    description: "Procedimiento reparador y nutritivo dirigido a todo tipo de hebra capilar. Recupera el brillo, la suavidad y la vida de las hebras más maltratadas, procesadas y secas. Suaviza y aporta un brillo extremo. Se puede mantener con tratamientos hidratantes en casa para mayor duración.",
    duration: "1–2 meses",
    highlights: ["Para cabellos procesados, secos y maltratados", "Recupera brillo extremo y suavidad", "Durabilidad de 1–2 meses", "Complementar con tratamientos en casa", "Todo tipo de hebra capilar"],
    image: "/images/services/aplicacion-2.jpg",
    type: "proceso",
  },
  {
    id: "nano-cristalizacion",
    title: "Nano Cristalización",
    description: "Terapia exclusiva Shelie's que potencializa cualquier tratamiento aplicado. Funciona como reconstructor capilar aportando un brillo tridimensional, flexibilidad y estimulando el crecimiento del cabello.",
    duration: "Variable",
    highlights: ["Potencializa cualquier tratamiento", "Brillo tridimensional", "Flexibilidad capilar", "Estimula el crecimiento"],
    image: "/images/services/resultado-3.jpg",
    type: "adicional",
    price: "$50.000",
    icon: "⚡",
  },
  {
    id: "corte-bordado",
    title: "Corte Bordado",
    description: "Se realiza con una máquina especial diseñada para retirar la horquilla del cabello sin afectar su longitud. Elimina puntas abiertas y secas ayudando a oxigenar el cabello para un crecimiento sano.",
    duration: "Variable",
    highlights: ["Elimina puntas abiertas", "Sin afectar la longitud", "Oxigena el cabello", "Estimula crecimiento sano"],
    image: "/images/services/aplicacion-1.jpg",
    type: "adicional",
    price: "$40.000",
    icon: "✂️",
  },
  {
    id: "luz-fotonica",
    title: "Luz Fotónica / Infrarroja",
    description: "Luz infrarroja: aumenta el flujo sanguíneo al cuero cabelludo promoviendo el crecimiento. Luz fotónica azul: expande la molécula del producto para mayor adherencia, alisa la cutícula y elimina el frizz.",
    duration: "Variable",
    highlights: ["Aumenta flujo sanguíneo", "Expande moléculas del producto", "Alisa la cutícula", "Elimina el frizz"],
    image: "/images/services/resultado-1.jpg",
    type: "adicional",
    price: "$40.000",
    icon: "🔵",
  },
  {
    id: "terapia-ozono",
    title: "Terapia de Ozono",
    description: "Favorece el transporte de nutrientes al folículo piloso. Limpia profundamente el cuero cabelludo, regenera las células de la dermis, sana la cutícula, combate la caída y promueve el crecimiento. Mejora la circulación sanguínea del folículo.",
    duration: "Variable",
    highlights: ["Limpieza profunda del cuero cabelludo", "Regenera células de la dermis", "Sana la cutícula", "Promueve el crecimiento"],
    image: "/images/services/antes-1.jpg",
    type: "adicional",
    price: "$50.000",
    icon: "💨",
  },
];

const PRODUCTS_KEY = "shelies_products";
const SERVICES_KEY = "shelies_services";

export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") return defaultProducts;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {}
  return defaultProducts;
}

export function saveProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch {}
}

export function getStoredServices(): ServiceItem[] {
  if (typeof window === "undefined") return defaultServices;
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (raw) return JSON.parse(raw) as ServiceItem[];
  } catch {}
  return defaultServices;
}

export function saveServices(services: ServiceItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  } catch {}
}

export { defaultServices };
