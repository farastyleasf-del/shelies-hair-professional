import { Product, Badge, Category, Objective, HairType, Testimonial, FAQItem, Promo, Order } from "./types";

/* ════════════════════════════════════════════
   PRODUCTOS — catálogo Shelie's Hair Professional
   ════════════════════════════════════════════ */
export const products: Product[] = [
  {
    id: "shampoo-hidratante-blindaje",
    slug: "shampoo-hidratante-blindaje",
    name: "Shampoo Hidratante Blindaje",
    tagline: "Limpieza hidratante sin efecto rigidez, control frizz desde el lavado",
    price: 27000,
    comparePrice: undefined,
    images: [
      "/images/products/shampoo-blindaje-pink.jpg",
      "/images/products/shampoo-blindaje-white.jpg",
    ],
    badges: ["bestseller"],
    benefits: [
      "Libre de sales",
      "Tecnología Active Liss",
      "Realinea la hebra en cada lavado",
      "Controla el frizz",
      "Mayor flexibilidad",
    ],
    forWhom: "Cabello con frizz, sin movimiento o con rigidez. Ideal para uso diario con resultados visibles desde el primer lavado.",
    howToUse: [
      "Humedece bien el cabello con agua tibia.",
      "Aplica el shampoo en el cuero cabelludo masajeando suavemente.",
      "Enjuaga con abundante agua.",
      "Complementa con el Tratamiento Natural Blindaje.",
    ],
    faq: [
      { q: "¿Tiene sulfatos?", a: "No, es libre de sales y sulfatos agresivos." },
      { q: "¿Está disponible en qué tamaños?", a: "500ml por $27.000 y 1 litro por $50.000." },
    ],
    category: "shampoo",
    objective: ["control-frizz", "brillo-suavidad"],
    hairType: ["todos"],
    stock: 50,
    crossSell: ["tratamiento-natural-blindaje", "protector-termico-blindaje"],
  },
  {
    id: "tratamiento-natural-blindaje",
    slug: "tratamiento-natural-blindaje",
    name: "Tratamiento Natural Blindaje",
    tagline: "Aceite de ricino + aloe vera para una suavidad efecto seda",
    price: 27000,
    comparePrice: undefined,
    images: [
      "/images/products/tratamiento-natural-teal.jpg",
      "/images/products/tratamiento-natural.jpg",
    ],
    badges: ["bestseller"],
    benefits: [
      "Aceite de ricino y aloe vera",
      "Suavidad efecto seda",
      "Protege de agentes externos",
      "Hidratación profunda",
      "Brillo mágico",
    ],
    forWhom: "Todo tipo de cabello que necesita hidratación, suavidad y protección. Ideal como complemento del Shampoo Blindaje.",
    howToUse: [
      "Después del shampoo, aplica el tratamiento de medios a puntas.",
      "Deja actuar 3–5 minutos.",
      "Enjuaga con agua fría para sellar la cutícula.",
    ],
    ingredients: "Aceite de ricino, Aloe vera, Proteínas hidrolizadas.",
    faq: [
      { q: "¿Sirve como acondicionador?", a: "Sí, es el acondicionador ideal para complementar la línea Blindaje." },
      { q: "¿Qué tamaños maneja?", a: "500ml por $27.000 y 1 litro por $50.000." },
    ],
    category: "acondicionador",
    objective: ["brillo-suavidad", "reparacion"],
    hairType: ["todos"],
    stock: 50,
    crossSell: ["shampoo-hidratante-blindaje", "mascarilla-kanechom"],
  },
  {
    id: "protector-termico-blindaje",
    slug: "protector-termico-blindaje",
    name: "Protector Térmico Blindaje",
    tagline: "Protección térmica en spray con perfume capilar + prolonga el alisado",
    price: 30000,
    images: [
      "/images/products/protector-termico-white.jpg",
      "/images/products/protector-termico.jpg",
    ],
    badges: ["new"],
    benefits: [
      "Protección térmica todo el día",
      "Sin sensación grasosa",
      "Perfume capilar de larga duración",
      "Prolonga el alisado",
      "Controla el frizz y da brillo mágico",
    ],
    forWhom: "Cualquier tipo de cabello que use plancha, secador o rizadora. Especial para quienes tienen alisado y quieren prolongarlo.",
    howToUse: [
      "Aplica en spray sobre cabello húmedo o seco antes de usar calor.",
      "Distribuye uniformemente de medios a puntas.",
      "Peina o plancha como de costumbre.",
    ],
    faq: [
      { q: "¿Se puede usar a diario?", a: "Sí, es de uso diario sin acumulación." },
      { q: "¿Cuánto dura el aroma?", a: "El aroma perdura varias horas actuando como perfume capilar." },
    ],
    category: "serum",
    objective: ["control-frizz", "brillo-suavidad"],
    hairType: ["liso", "ondulado", "todos"],
    stock: 40,
    crossSell: ["shampoo-hidratante-blindaje", "sheliss-therapy"],
  },
  {
    id: "sheliss-therapy",
    slug: "sheliss-therapy",
    name: "Sheliss Therapy — Alisado Nutritivo",
    tagline: "Alisado nutritivo 0% formol con extracto de karité, aminoácidos y óleos naturales",
    price: 320000,
    images: [
      "/images/products/sheliss-therapy-modelo-a.jpg",
      "/images/products/sheliss-therapy-purple.jpg",
    ],
    badges: ["new"],
    benefits: [
      "0% Formol — 100% seguro",
      "Alisado nutritivo de larga duración",
      "Extracto de Karité — hidratación profunda",
      "Aminoácidos de queratina — reparación",
      "Mezcla de óleos naturales",
      "By Dudanani Hair Cosmetics",
    ],
    forWhom: "Cabellos con frizz, ondulados o rizados que buscan alisado nutritivo sin químicos agresivos. Apto para uso profesional en casa.",
    howToUse: [
      "Lava el cabello con shampoo clarificante.",
      "Seca completamente.",
      "Aplica el producto sección por sección.",
      "Sella con plancha a temperatura media.",
      "No lavar las primeras 48–72 horas.",
    ],
    ingredients: "Extracto de Karité, Aminoácidos de Queratina, Mezcla de Óleos Naturales. 0% Formol.",
    faq: [
      { q: "¿Cuánto dura el alisado?", a: "De 3 a 5 meses dependiendo del tipo de cabello y los cuidados en casa." },
      { q: "¿Cuánto trae?", a: "1 litro por $320.000 — alcanza para varios servicios." },
    ],
    category: "kit",
    objective: ["control-frizz", "brillo-suavidad"],
    hairType: ["ondulado", "rizado", "todos"],
    stock: 15,
    crossSell: ["shampoo-hidratante-blindaje", "protector-termico-blindaje"],
  },
  {
    id: "mascarilla-kanechom",
    slug: "mascarilla-kanechom",
    name: "Mascarillas Kanechom",
    tagline: "Hidratación, nutrición y reparación capilar en un solo producto",
    price: 37000,
    images: [
      "/images/products/kanechom-clean.png",
      "/images/products/kanechom.jpg",
    ],
    badges: ["bestseller"],
    benefits: [
      "3 en 1: Hidratación, Nutrición y Reparación",
      "Ideal para todo tipo de cabello",
      "Cambios radicales desde la primera aplicación",
      "Acción profunda en la cutícula",
    ],
    forWhom: "Todo tipo de cabello. Las 3 opciones cubren las principales necesidades capilares: hidratación, nutrición y reparación.",
    howToUse: [
      "Aplica la mascarilla en el largo del cabello (no tocar cuero cabelludo).",
      "Sobre el cabello limpio y húmedo.",
      "Deja actuar 30 a 40 minutos.",
      "Retira con abundante agua.",
      "Aplica el tratamiento acondicionador.",
      "Usa 2 a 3 veces por semana para cambios radicales.",
    ],
    faq: [
      { q: "¿Qué variedad debo usar?", a: "Hidratación para cabellos secos, Nutrición para cabellos débiles y Reparación para cabellos dañados." },
      { q: "¿Cuánto trae el pote?", a: "Presentación de 1kg por $37.000." },
    ],
    category: "mascarilla",
    objective: ["brillo-suavidad", "reparacion"],
    hairType: ["todos"],
    stock: 35,
    crossSell: ["sheliss-therapy", "tratamiento-natural-blindaje"],
  },
  {
    id: "elixir-capilar",
    slug: "elixir-capilar",
    name: "Elixir Capilar",
    tagline: "Tónico con células madre y ácido hialurónico que combate la caída sin minoxidil",
    price: 52000,
    images: [
      "/images/products/elixir-capilar-clean.png",
      "/images/products/elixir-capilar.jpg",
    ],
    badges: ["new"],
    benefits: [
      "Combate la caída excesiva",
      "Fortalece la hebra",
      "Estimula el crecimiento",
      "Sin minoxidil — sin dependencia",
      "Células madre + ácido hialurónico",
    ],
    forWhom: "Personas con caída excesiva, cabellos débiles o con dificultad para crecer. Sin efectos secundarios ni dependencia.",
    howToUse: [
      "Aplica sobre el cuero cabelludo todas las noches.",
      "Realiza masaje suave en la piel cabelluda para estimular la absorción.",
      "No es necesario retirar al siguiente día.",
    ],
    ingredients: "Células madre, Ácido hialurónico.",
    faq: [
      { q: "¿Causa dependencia?", a: "No, no contiene minoxidil. Sus ingredientes son naturales." },
      { q: "¿Cuánto tiempo tarda en verse el resultado?", a: "Con uso regular se observan resultados en 4–6 semanas." },
    ],
    category: "tonico",
    objective: ["crecimiento-anticaida"],
    hairType: ["todos"],
    stock: 30,
    crossSell: ["sheliss-therapy", "botox-capilar"],
  },
  {
    id: "botox-capilar",
    slug: "botox-capilar",
    name: "Botox Capilar Canela",
    tagline: "Restauración, hidratación, brillo y transformación capilar con Canela, Moringa y Argán",
    price: 280000,
    images: [
      "/images/products/botox-capilar.jpg",
    ],
    badges: ["new"],
    benefits: [
      "Restauración capilar",
      "Hidratación capilar",
      "Brillo intenso y reparación",
      "Transformación capilar",
      "Efecto anti-edad capilar",
      "Canela + Moringa + Argán",
    ],
    forWhom: "Todo tipo de hebra, especialmente las más procesadas y maltratadas químicamente, cabellos sin vida y sin movimiento. NO ALISA.",
    howToUse: [
      "Aplica sobre el cabello limpio y húmedo.",
      "Sella con plancha.",
      "Lava después de 24–48 horas.",
    ],
    ingredients: "Canela, Moringa, Argán.",
    faq: [
      { q: "¿Alisa el cabello?", a: "No. Restaura, hidrata y da brillo pero no alisa." },
      { q: "¿Cuánto trae?", a: "1kg por $280.000." },
    ],
    category: "kit",
    objective: ["brillo-suavidad", "reparacion"],
    hairType: ["todos"],
    stock: 20,
    crossSell: ["sheliss-therapy", "elixir-capilar"],
  },
  {
    id: "tratamiento-reparador",
    slug: "tratamiento-reparador",
    name: "Tratamiento Reparador Intensivo Shelie's",
    tagline: "Repara hasta un 80% en la primera sesión — keratina, biotina y proteínas al córtex capilar",
    price: 320000,
    images: [
      "/images/products/tratamiento-reparador.png",
    ],
    badges: ["bestseller"],
    benefits: [
      "Vitamina B7, biotina, keratina, péptidos y proteínas",
      "Penetra directamente al córtex capilar",
      "Recupera elasticidad 60–80% en la primera sesión",
      "Para cabellos sin elasticidad — efecto chicle",
      "Resultados inmediatos y visibles",
      "NO ALISA",
    ],
    forWhom: "Cabellos con daños profundos, sin elasticidad ni resistencia (efecto chicle). Dirigido a restaurar la fibra desde adentro.",
    howToUse: [
      "Aplica sobre el cabello limpio.",
      "Distribuye de medios a puntas.",
      "Deja actuar 30–40 minutos.",
      "Sella con calor.",
      "Enjuaga bien.",
    ],
    ingredients: "Vitamina B7, Biotina, Keratina, Péptidos, Proteínas.",
    faq: [
      { q: "¿Alisa?", a: "No, es un tratamiento reparador. No alisa." },
      { q: "¿Cuánto trae?", a: "1 litro por $320.000." },
    ],
    category: "kit",
    objective: ["reparacion"],
    hairType: ["muy-dañado", "todos"],
    stock: 15,
    crossSell: ["sheliss-therapy", "botox-capilar"],
  },
];

/* ════════════════════════════════════════════
   TESTIMONIOS
   ════════════════════════════════════════════ */
export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Camila R.",
    text: "Llevaba años con frizz incontrolable. Con el Shampoo Blindaje y el Tratamiento Natural llevo 2 meses y mi cabello se ve increíble.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Valentina M.",
    text: "El Oro Líquido es adictivo. No pesa nada, el cabello queda suave y brillante todo el día.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Daniela P.",
    text: "Tenía el cabello destruido por la decoloración. Las Mascarillas Cronograma lo devolvieron a la vida desde la primera aplicación.",
    rating: 5,
  },
  {
    id: "t4",
    name: "Mariana S.",
    text: "El Elixir Capilar es increíble. Llevaba meses con caída y en pocas semanas noté la diferencia. Sin efectos secundarios.",
    rating: 5,
  },
];

/* ════════════════════════════════════════════
   FAQ GLOBAL
   ════════════════════════════════════════════ */
export const globalFAQ: FAQItem[] = [
  {
    question: "¿Cuánto tarda el envío?",
    answer: "Envíos nacionales: 2-5 días hábiles. Bogotá y principales ciudades: 1-3 días hábiles.",
  },
  {
    question: "¿Tiene costo el envío?",
    answer: "Envío gratis en compras superiores a $150.000. Para montos menores, el costo varía según la ciudad.",
  },
  {
    question: "¿Puedo devolver un producto?",
    answer: "Sí, tienes 15 días para devoluciones. El producto debe estar sin abrir y en su empaque original.",
  },
  {
    question: "¿Cómo sé qué producto me sirve?",
    answer: "Usa nuestro chat de asesoría — te preguntamos tu tipo de cabello, objetivo y nivel de daño, y te recomendamos la rutina ideal.",
  },
  {
    question: "¿Los productos son aptos para cabello teñido?",
    answer: "Sí, todos nuestros productos son seguros para cabello con color.",
  },
  {
    question: "¿Cómo rastreo mi pedido?",
    answer: "En la sección 'Mi Pedido' puedes ingresar tu número de orden o email para ver el estado en tiempo real.",
  },
];

/* ════════════════════════════════════════════
   RUTINAS (colecciones por objetivo)
   ════════════════════════════════════════════ */
export const routines = [
  {
    slug: "control-frizz",
    title: "Control Frizz",
    description: "Domina el frizz y disfruta de un cabello definido y suave todo el día.",
    icon: "💆‍♀️",
    objective: "control-frizz" as const,
  },
  {
    slug: "brillo-suavidad",
    title: "Brillo y Suavidad",
    description: "Recupera el brillo natural y la suavidad que tu cabello merece.",
    icon: "✨",
    objective: "brillo-suavidad" as const,
  },
  {
    slug: "reparacion",
    title: "Reparación / Restauración",
    description: "Devuelve la vida a tu cabello dañado por calor, tintes o químicos.",
    icon: "🔧",
    objective: "reparacion" as const,
  },
  {
    slug: "crecimiento-anticaida",
    title: "Crecimiento & Anti-caída",
    description: "Fortalece la hebra, combate la caída excesiva y estimula el crecimiento.",
    icon: "🌱",
    objective: "crecimiento-anticaida" as const,
  },
];

/* helpers */
export function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(n);
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

/* ── Fetch productos desde API (server-side) ── */
const API = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_INTERNAL_URL || "http://shelie_spa_back:3001";

interface DBProduct {
  id: number; slug: string; name: string; tagline: string; price: string;
  compare_price: string | null; category: string; stock: number;
  images: string[]; badges: string[]; benefits: string[];
  for_whom: string; how_to_use: string; ingredients: string;
  hair_type: string[]; objective: string[]; is_active: boolean;
}

function dbToProduct(p: DBProduct): Product {
  return {
    id: p.slug || String(p.id),
    slug: p.slug || String(p.id),
    name: p.name,
    tagline: p.tagline ?? "",
    price: Number(p.price),
    comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
    images: p.images ?? [],
    badges: (p.badges ?? []) as Badge[],
    benefits: p.benefits ?? [],
    forWhom: p.for_whom ?? "",
    howToUse: p.how_to_use ? (typeof p.how_to_use === "string" ? [p.how_to_use] : p.how_to_use) : [],
    ingredients: p.ingredients ?? "",
    faq: [],
    category: (p.category ?? "kit") as Category,
    objective: (p.objective ?? []) as Objective[],
    hairType: (p.hair_type ?? ["todos"]) as HairType[],
    stock: p.stock ?? 0,
    crossSell: [],
  };
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/api/products`, { next: { revalidate: 60 } });
    if (!res.ok) return products;
    const data = await res.json();
    const list: DBProduct[] = data.data ?? (Array.isArray(data) ? data : []);
    if (list.length === 0) return products;
    return list.filter(p => p.is_active).map(dbToProduct);
  } catch {
    return products; // fallback a hardcoded
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/products/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return getProductBySlug(slug) ?? null;
    const data = await res.json();
    const p = data.data ?? data;
    if (!p || !p.slug) return getProductBySlug(slug) ?? null;
    return dbToProduct(p);
  } catch {
    return getProductBySlug(slug) ?? null;
  }
}
