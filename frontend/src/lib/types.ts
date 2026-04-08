/* ── Shelie Siempre Bellas — Tipos centrales ── */

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  comparePrice?: number;
  images: string[];
  badges: Badge[];
  benefits: string[];
  forWhom: string;
  howToUse: string[];
  ingredients?: string;
  precautions?: string;
  faq: { q: string; a: string }[];
  category: Category;
  objective: Objective[];
  hairType: HairType[];
  stock: number;
  crossSell: string[]; // product ids
}

export type Badge = "bestseller" | "new" | "promo";
export type Category = "kit" | "shampoo" | "tratamiento" | "acondicionador" | "serum" | "mascarilla" | "aceite" | "ampolleta" | "tonico";
export type Objective = "control-frizz" | "brillo-suavidad" | "reparacion" | "crecimiento-anticaida";
export type HairType = "liso" | "ondulado" | "rizado" | "muy-dañado" | "todos";

export interface CartItem {
  product: Product;
  qty: number;
}

export interface Order {
  id: string;
  items: { productId: string; name: string; qty: number; price: number }[];
  customer: Customer;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  trackingCode?: string;
  createdAt: string;
}

export type OrderStatus = "pagado" | "empacado" | "enviado" | "entregado";

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface Promo {
  id: string;
  code: string;
  description: string;
  discountPct: number;
  active: boolean;
  validUntil: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  image?: string;
  before?: string;
  after?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: ChatAction[];
  timestamp: number;
}

export interface ChatAction {
  type: "add_to_cart" | "view_product" | "track_order" | "handoff";
  label: string;
  payload: string; // productId or orderId
}

/* Admin */
export interface AdminUser {
  email: string;
  password: string;
  role: "admin" | "staff";
}

/* Promociones */
export type PromoType =
  | "rifa" | "ruleta" | "concurso_metricas" | "codigo" | "raspa_gana"
  | "trivia" | "referidos" | "puntos" | "sorteo_instantaneo" | "reto";

export type PromoStatus = "borrador" | "activa" | "pausada" | "finalizada";

export interface Promotion {
  id: number;
  title: string;
  description: string;
  type: PromoType;
  config: Record<string, unknown>;
  status: PromoStatus;
  starts_at: string | null;
  ends_at: string | null;
  banner_image: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

export interface PromoParticipant {
  id: number;
  promo_id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  entry_type: string;
  entry_data: Record<string, unknown>;
  result: string;
  created_at: string;
}

export const PROMO_TYPES: { type: PromoType; label: string; icon: string; desc: string; color: string }[] = [
  { type: "rifa",                label: "Rifa por números",    icon: "🎟️", desc: "Se asigna un número al comprar/agendar, sorteo random",     color: "#8B5CF6" },
  { type: "ruleta",              label: "Ruleta de premios",   icon: "🎡", desc: "Gira la ruleta y descubre tu premio",                       color: "#EC4899" },
  { type: "concurso_metricas",   label: "Concurso",            icon: "🏆", desc: "Quien más agende o compre en el período gana",              color: "#F59E0B" },
  { type: "codigo",              label: "Código descuento",    icon: "🏷️", desc: "Código con % o valor fijo de descuento",                    color: "#10B981" },
  { type: "raspa_gana",          label: "Raspa y gana",        icon: "✨", desc: "Tarjeta digital que se raspa para revelar premio",          color: "#6366F1" },
  { type: "trivia",              label: "Trivia / Quiz",       icon: "❓", desc: "Responde preguntas y gana puntos o premios",                color: "#3B82F6" },
  { type: "referidos",           label: "Referidos",           icon: "👯", desc: "Trae a una amiga y ambas ganan recompensa",                 color: "#14B8A6" },
  { type: "puntos",              label: "Puntos de lealtad",   icon: "⭐", desc: "Acumula puntos por compra/reserva, canjea premios",         color: "#F97316" },
  { type: "sorteo_instantaneo",  label: "Sorteo instantáneo",  icon: "⚡", desc: "Cada N-ésima compra/reserva gana automáticamente",          color: "#EF4444" },
  { type: "reto",                label: "Reto / Challenge",    icon: "🎯", desc: "Completa acciones para desbloquear un premio",              color: "#8B5CF6" },
];
