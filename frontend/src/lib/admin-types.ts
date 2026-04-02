/* ══════════════════════════════════════════════════════
   ADMIN TYPES — modelos completos para el panel admin
   ══════════════════════════════════════════════════════ */

/* ── Canales ── */
export type Channel = "whatsapp" | "instagram" | "facebook" | "tiktok" | "web";

/* ── Conversaciones ── */
export type ConversationStatus =
  | "nuevo"
  | "en_atencion"
  | "espera_cliente"
  | "espera_equipo"
  | "cerrado"
  | "convertido";

export interface Conversation {
  id: string;
  channel: Channel;
  status: ConversationStatus;
  assignedTo: string | null; // agent id
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  tags: string[];
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  linkedOrderId?: string;
  createdAt: string;
  closedAt?: string;
  firstResponseAt?: string;
  isAI: boolean;
}

/* ── Mensajes ── */
export type MessageSender = "customer" | "agent" | "ai" | "system";

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  sender: MessageSender;
  senderName: string;
  timestamp: string;
  type: "text" | "image" | "file" | "note" | "action";
  isInternal?: boolean; // nota interna
  channel?: Channel; // canal por donde llegó/se envió este mensaje
}

/* ── Clientes ── */
export type CustomerTag = "vip" | "frecuente" | "riesgo" | "mayorista" | "nuevo";

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  tags: CustomerTag[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  lastConversation?: string;
  lastProductViewed?: string;
  cartItems?: string[];
  createdAt: string;
  notes?: string;
}

/* ── Pedidos ── */
export type OrderStatus =
  | "nuevo"
  | "pagado"
  | "empacado"
  | "enviado"
  | "entregado"
  | "devuelto"
  | "cancelado"
  | "incidencia";

export type PaymentMethod = "card" | "pse" | "transfer" | "cod" | "nequi" | "daviplata";
export type IncidentType = "direccion" | "pago" | "demora" | "dano" | "producto_erroneo" | "otro";

export interface AdminOrder {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  items: { productId: string; name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  trackingCode?: string;
  trackingUrl?: string;
  address: string;
  city: string;
  conversationId?: string;
  channel?: Channel;
  notes: string[];
  incident?: { type: IncidentType; description: string; createdAt: string };
  returnReason?: string;
  timestamps: {
    created: string;
    paid?: string;
    packed?: string;
    shipped?: string;
    delivered?: string;
    returned?: string;
    cancelled?: string;
  };
}

/* ── Agentes / Equipo ── */
export type AgentRole = "admin" | "supervisor" | "agente" | "soporte";
export type AgentShift = "manana" | "tarde" | "noche" | "completo";

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  shift: AgentShift;
  avatar?: string;
  active: boolean;
  channels: Channel[];
  stats: {
    chatsToday: number;
    chatsMonth: number;
    avgFRT: number; // seconds
    avgResolution: number; // minutes
    slaCompliance: number; // %
    conversionsToday: number;
    conversionsMonth: number;
    satisfaction: number; // 1-5
    backlog: number;
  };
  goals: {
    chatsPerDay: number;
    slaTarget: number; // %
    conversionTarget: number; // %
  };
}

/* ── SLA ── */
export interface SLARule {
  channel: Channel;
  maxFirstResponse: number; // minutes
  maxResolution: number; // minutes
  priority: "normal" | "high" | "urgent";
}

/* ── Plantillas ── */
export interface Template {
  id: string;
  name: string;
  channel: Channel[];
  category: string;
  text: string;
  variables: string[];
  imageUrl?: string; // ruta pública (solo para plantillas de QR/imagen)
}

/* ── Reglas de asignación ── */
export interface AssignmentRule {
  id: string;
  name: string;
  condition: "channel" | "schedule" | "load" | "tag";
  value: string;
  assignTo: string; // agent id or "round-robin"
  active: boolean;
}

/* ── KPIs ── */
export interface SalesKPIs {
  revenueToday: number;
  revenueMonth: number;
  revenuePrevMonth: number;
  ordersToday: number;
  ordersMonth: number;
  aov: number; // average order value
  conversionRate: number;
  cartAbandonment: number;
  paidVsPending: { paid: number; pending: number };
  topProducts: { name: string; units: number; revenue: number }[];
}

export interface ChatKPIs {
  newChatsToday: number;
  newChatsByChannel: Record<Channel, number>;
  avgFRT: number; // seconds
  frtByChannel: Record<Channel, number>;
  avgResolution: number; // minutes
  backlog: number;
  handoffRate: number; // %
  chatToSaleRate: number; // %
}

export interface OpsKPIs {
  ordersByStatus: Record<OrderStatus, number>;
  avgDispatchTime: number; // hours
  onTimeDeliveryRate: number; // %
  incidentsByType: Record<IncidentType, number>;
  returnReasons: { reason: string; count: number }[];
}

export interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
  timestamp: string;
  dismissed: boolean;
}

/* ── Funnel ── */
export interface FunnelStep {
  name: string;
  count: number;
  rate: number; // % from previous
  dropoff: number;
}

/* ── Reporte de canal ── */
export interface ChannelReport {
  channel: Channel;
  revenue: number;
  orders: number;
  conversations: number;
  conversion: number;
  adSpend?: number;
  roas?: number;
}

/* ── Temas más preguntados ── */
export interface TopIntent {
  intent: string;
  count: number;
  pct: number;
  trend: "up" | "down" | "stable";
}
