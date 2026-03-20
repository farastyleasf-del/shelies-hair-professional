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
