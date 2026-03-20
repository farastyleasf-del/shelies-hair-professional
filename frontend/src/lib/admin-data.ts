/* ══════════════════════════════════════════════════════
   ADMIN MOCK DATA — datos realistas para todos los módulos
   ══════════════════════════════════════════════════════ */
import {
  Conversation, Message, AdminCustomer, AdminOrder, Agent,
  SLARule, Template, AssignmentRule, SalesKPIs, ChatKPIs,
  OpsKPIs, Alert, FunnelStep, ChannelReport, TopIntent,
} from "./admin-types";

/* ── AGENTES ── */
export const agents: Agent[] = [
  {
    id: "ag-1", name: "Carolina M.", email: "carolina@shelie.com",
    role: "supervisor", shift: "completo", active: true,
    channels: ["whatsapp", "instagram", "web"],
    stats: { chatsToday: 34, chatsMonth: 487, avgFRT: 45, avgResolution: 12, slaCompliance: 96, conversionsToday: 8, conversionsMonth: 112, satisfaction: 4.8, backlog: 2 },
    goals: { chatsPerDay: 40, slaTarget: 95, conversionTarget: 25 },
  },
  {
    id: "ag-2", name: "Daniela R.", email: "daniela@shelie.com",
    role: "agente", shift: "manana", active: true,
    channels: ["whatsapp", "facebook"],
    stats: { chatsToday: 28, chatsMonth: 390, avgFRT: 62, avgResolution: 18, slaCompliance: 89, conversionsToday: 5, conversionsMonth: 78, satisfaction: 4.5, backlog: 5 },
    goals: { chatsPerDay: 35, slaTarget: 90, conversionTarget: 20 },
  },
  {
    id: "ag-3", name: "Valentina S.", email: "valentina@shelie.com",
    role: "agente", shift: "tarde", active: true,
    channels: ["instagram", "web"],
    stats: { chatsToday: 22, chatsMonth: 310, avgFRT: 38, avgResolution: 10, slaCompliance: 98, conversionsToday: 7, conversionsMonth: 95, satisfaction: 4.9, backlog: 1 },
    goals: { chatsPerDay: 30, slaTarget: 95, conversionTarget: 25 },
  },
  {
    id: "ag-4", name: "Agente IA", email: "ia@shelie.com",
    role: "soporte", shift: "completo", active: true,
    channels: ["whatsapp", "instagram", "facebook", "web"],
    stats: { chatsToday: 67, chatsMonth: 1240, avgFRT: 3, avgResolution: 4, slaCompliance: 100, conversionsToday: 12, conversionsMonth: 198, satisfaction: 4.2, backlog: 0 },
    goals: { chatsPerDay: 100, slaTarget: 100, conversionTarget: 15 },
  },
];

/* ── CLIENTES ── */
export const adminCustomers: AdminCustomer[] = [
  {
    id: "c-1", name: "Laura García", phone: "3101234567", email: "laura@email.com",
    city: "Bogotá", address: "Cra 15 #80-20 Apto 501", tags: ["vip", "frecuente"],
    totalOrders: 8, totalSpent: 1420000, lastOrderDate: "2026-02-10",
    lastProductViewed: "Kit Control Frizz Total", cartItems: [],
    createdAt: "2025-06-15", notes: "Clienta recurrente, le gusta el control frizz.",
  },
  {
    id: "c-2", name: "Paola Mejía", phone: "3009876543", email: "paola@email.com",
    city: "Medellín", address: "Calle 50 #30-15", tags: ["frecuente"],
    totalOrders: 4, totalSpent: 680000, lastOrderDate: "2026-02-05",
    createdAt: "2025-09-20",
  },
  {
    id: "c-3", name: "Sofía Torres", phone: "3157654321", email: "sofia@email.com",
    city: "Cali", tags: ["nuevo"],
    totalOrders: 1, totalSpent: 189000, lastOrderDate: "2026-02-11",
    lastProductViewed: "Sérum Brillo Capilar", cartItems: ["serum-brillo"],
    createdAt: "2026-02-10",
  },
  {
    id: "c-4", name: "Camila Ruiz", phone: "3201112233", email: "camila@email.com",
    city: "Barranquilla", tags: ["riesgo"],
    totalOrders: 2, totalSpent: 247000, lastOrderDate: "2026-01-18",
    createdAt: "2025-11-05", notes: "Tuvo incidencia con envío anterior. Seguimiento.",
  },
  {
    id: "c-5", name: "María López", phone: "3004445566", email: "maria@email.com",
    city: "Bucaramanga", address: "Cra 27 #36-50", tags: ["mayorista"],
    totalOrders: 12, totalSpent: 4560000, lastOrderDate: "2026-02-08",
    createdAt: "2025-03-10", notes: "Compra al por mayor para su salón.",
  },
];

/* ── CONVERSACIONES ── */
export const conversations: Conversation[] = [
  {
    id: "conv-1", channel: "whatsapp", status: "en_atencion", assignedTo: "ag-1",
    customerId: "c-1", customerName: "Laura García", tags: ["envío", "pedido"],
    lastMessage: "¿Ya despacharon mi pedido?", lastMessageAt: "2026-02-12T09:15:00Z",
    unread: 1, linkedOrderId: "ORD-20260210-003", createdAt: "2026-02-12T09:10:00Z",
    firstResponseAt: "2026-02-12T09:11:30Z", isAI: false,
  },
  {
    id: "conv-9", channel: "tiktok", status: "nuevo", assignedTo: null,
    customerId: "c-6", customerName: "Valentina TikTok", tags: ["viral", "pedido"],
    lastMessage: "¡Hola! Vi tu producto en TikTok, ¿cómo lo compro?", lastMessageAt: "2026-02-12T10:00:00Z",
    unread: 2, createdAt: "2026-02-12T09:59:00Z", isAI: false,
  },
  {
    id: "conv-10", channel: "tiktok", status: "en_atencion", assignedTo: "ag-2",
    customerId: "c-7", customerName: "Andrea Viral", tags: ["viral", "envío"],
    lastMessage: "¿Cuánto tarda el envío a Bogotá?", lastMessageAt: "2026-02-12T10:05:00Z",
    unread: 1, createdAt: "2026-02-12T10:03:00Z", firstResponseAt: "2026-02-12T10:04:00Z", isAI: false,
  },
  {
    id: "conv-2", channel: "instagram", status: "nuevo", assignedTo: null,
    customerId: "c-3", customerName: "Sofía Torres", tags: ["precio", "uso producto"],
    lastMessage: "Hola, quiero saber si el sérum sirve para cabello rizado",
    lastMessageAt: "2026-02-12T09:30:00Z", unread: 3,
    createdAt: "2026-02-12T09:25:00Z", isAI: false,
  },
  {
    id: "conv-3", channel: "web", status: "en_atencion", assignedTo: "ag-4",
    customerId: "c-3", customerName: "Sofía Torres", tags: ["uso producto"],
    lastMessage: "Te recomiendo el Kit Control Frizz Total para cabello rizado.",
    lastMessageAt: "2026-02-12T09:28:00Z", unread: 0,
    createdAt: "2026-02-12T09:26:00Z", firstResponseAt: "2026-02-12T09:26:03Z", isAI: true,
  },
  {
    id: "conv-4", channel: "whatsapp", status: "espera_cliente", assignedTo: "ag-2",
    customerId: "c-4", customerName: "Camila Ruiz", tags: ["queja", "envío"],
    lastMessage: "Te envié el comprobante, ¿lo pudiste verificar?",
    lastMessageAt: "2026-02-12T08:45:00Z", unread: 0,
    createdAt: "2026-02-12T08:00:00Z", firstResponseAt: "2026-02-12T08:03:00Z", isAI: false,
  },
  {
    id: "conv-5", channel: "facebook", status: "convertido", assignedTo: "ag-3",
    customerId: "c-5", customerName: "María López", tags: ["mayorista", "pedido"],
    lastMessage: "Perfecto, ya hice el pedido. Gracias!",
    lastMessageAt: "2026-02-12T07:50:00Z", unread: 0, linkedOrderId: "ORD-20260212-001",
    createdAt: "2026-02-12T07:00:00Z", firstResponseAt: "2026-02-12T07:02:00Z",
    closedAt: "2026-02-12T07:50:00Z", isAI: false,
  },
  {
    id: "conv-6", channel: "whatsapp", status: "en_atencion", assignedTo: "ag-1",
    customerId: "c-2", customerName: "Paola Mejía", tags: ["uso producto"],
    lastMessage: "¿La mascarilla se puede usar todos los días?",
    lastMessageAt: "2026-02-12T09:40:00Z", unread: 1,
    createdAt: "2026-02-12T09:35:00Z", firstResponseAt: "2026-02-12T09:36:00Z", isAI: false,
  },
  {
    id: "conv-7", channel: "instagram", status: "espera_equipo", assignedTo: "ag-2",
    customerId: "c-1", customerName: "Laura García", tags: ["queja"],
    lastMessage: "El producto llegó sin tapa, necesito un cambio",
    lastMessageAt: "2026-02-11T18:30:00Z", unread: 2,
    createdAt: "2026-02-11T18:00:00Z", firstResponseAt: "2026-02-11T18:20:00Z", isAI: false,
  },
  {
    id: "conv-8", channel: "web", status: "cerrado", assignedTo: "ag-4",
    customerId: "c-2", customerName: "Paola Mejía", tags: ["envío"],
    lastMessage: "Gracias por la info, ya entendí los tiempos de envío.",
    lastMessageAt: "2026-02-11T15:00:00Z", unread: 0,
    createdAt: "2026-02-11T14:50:00Z", firstResponseAt: "2026-02-11T14:50:04Z",
    closedAt: "2026-02-11T15:00:00Z", isAI: true,
  },
];

/* ── MENSAJES (demo para conv-1) ── */
export const messagesDemo: Message[] = [
  { id: "m-1", conversationId: "conv-1", text: "Hola, compré el Kit Control Frizz hace 2 días y quiero saber si ya lo despacharon.", sender: "customer", senderName: "Laura García", timestamp: "2026-02-12T09:10:00Z", type: "text", channel: "whatsapp" },
  { id: "m-2", conversationId: "conv-1", text: "¡Hola Laura! Déjame revisar tu pedido ORD-20260210-003.", sender: "agent", senderName: "Carolina M.", timestamp: "2026-02-12T09:11:30Z", type: "text", channel: "whatsapp" },
  { id: "m-3", conversationId: "conv-1", text: "Tu pedido ya fue empacado y está en proceso de despacho. Debería salir hoy.", sender: "agent", senderName: "Carolina M.", timestamp: "2026-02-12T09:12:00Z", type: "text", channel: "whatsapp" },
  { id: "m-4", conversationId: "conv-1", text: "Revisar con bodega si sale en el despacho de la tarde", sender: "agent", senderName: "Carolina M.", timestamp: "2026-02-12T09:12:30Z", type: "note", isInternal: true, channel: "whatsapp" },
  { id: "m-5", conversationId: "conv-1", text: "¿Ya despacharon mi pedido?", sender: "customer", senderName: "Laura García", timestamp: "2026-02-12T09:15:00Z", type: "text", channel: "whatsapp" },
  // conv-2
  { id: "m-6", conversationId: "conv-2", text: "Hola, quiero saber si el sérum sirve para cabello rizado", sender: "customer", senderName: "Sofía Torres", timestamp: "2026-02-12T09:25:00Z", type: "text", channel: "instagram" },
  { id: "m-7", conversationId: "conv-2", text: "¿Y cuánto cuesta el kit completo?", sender: "customer", senderName: "Sofía Torres", timestamp: "2026-02-12T09:27:00Z", type: "text", channel: "instagram" },
  { id: "m-8", conversationId: "conv-2", text: "¿Hacen envíos a Cali?", sender: "customer", senderName: "Sofía Torres", timestamp: "2026-02-12T09:30:00Z", type: "text", channel: "instagram" },
  // conv-9 (tiktok)
  { id: "m-9", conversationId: "conv-9", text: "¡Hola! Vi tu producto en TikTok, ¿cómo lo compro?", sender: "customer", senderName: "Valentina TikTok", timestamp: "2026-02-12T10:00:00Z", type: "text", channel: "tiktok" },
  { id: "m-10", conversationId: "conv-9", text: "¡Hola Valentina! Puedes comprar en nuestra web o por mensaje directo.", sender: "agent", senderName: "Carolina M.", timestamp: "2026-02-12T10:01:00Z", type: "text", channel: "tiktok" },
  // conv-10 (tiktok)
  { id: "m-11", conversationId: "conv-10", text: "¿Cuánto tarda el envío a Bogotá?", sender: "customer", senderName: "Andrea Viral", timestamp: "2026-02-12T10:05:00Z", type: "text", channel: "tiktok" },
  { id: "m-12", conversationId: "conv-10", text: "En Bogotá el envío tarda 1-2 días hábiles.", sender: "agent", senderName: "Daniela R.", timestamp: "2026-02-12T10:06:00Z", type: "text", channel: "tiktok" },
];

/* ── PEDIDOS ADMIN ── */
export const adminOrders: AdminOrder[] = [
  {
    id: "ORD-20260212-001", customerId: "c-5", customerName: "María López", status: "nuevo",
    items: [
      { productId: "kit-control-frizz", name: "Kit Control Frizz Total", qty: 5, price: 189000 },
      { productId: "mascarilla-restauracion", name: "Mascarilla Restauración", qty: 5, price: 68000 },
    ],
    subtotal: 1285000, discount: 128500, shipping: 0, total: 1156500,
    paymentMethod: "transfer", paymentRef: "PSE-892734", address: "Cra 27 #36-50", city: "Bucaramanga",
    conversationId: "conv-5", channel: "facebook", notes: ["Mayorista — verificar pago antes de despachar"],
    timestamps: { created: "2026-02-12T07:55:00Z" },
  },
  {
    id: "ORD-20260211-002", customerId: "c-3", customerName: "Sofía Torres", status: "pagado",
    items: [{ productId: "kit-control-frizz", name: "Kit Control Frizz Total", qty: 1, price: 189000 }],
    subtotal: 189000, discount: 28350, shipping: 0, total: 160650,
    paymentMethod: "card", paymentRef: "STR-xyz123", address: "Calle 5N #23-10", city: "Cali",
    notes: ["Cupón BIENVENIDA15 aplicado"],
    timestamps: { created: "2026-02-11T16:00:00Z", paid: "2026-02-11T16:05:00Z" },
  },
  {
    id: "ORD-20260210-003", customerId: "c-1", customerName: "Laura García", status: "empacado",
    items: [
      { productId: "serum-brillo", name: "Sérum Brillo Capilar", qty: 2, price: 79000 },
      { productId: "shampoo-hidratante", name: "Shampoo Hidratación Profunda", qty: 1, price: 52000 },
    ],
    subtotal: 210000, discount: 0, shipping: 0, total: 210000,
    paymentMethod: "nequi", paymentRef: "NQ-445566", address: "Cra 15 #80-20 Apto 501", city: "Bogotá",
    conversationId: "conv-1", channel: "whatsapp", notes: [],
    timestamps: { created: "2026-02-10T10:00:00Z", paid: "2026-02-10T10:02:00Z", packed: "2026-02-12T08:00:00Z" },
  },
  {
    id: "ORD-20260209-004", customerId: "c-2", customerName: "Paola Mejía", status: "enviado",
    items: [
      { productId: "mascarilla-restauracion", name: "Mascarilla Restauración", qty: 1, price: 68000 },
      { productId: "tratamiento-nocturno", name: "Tratamiento Nocturno Reparador", qty: 1, price: 95000 },
    ],
    subtotal: 163000, discount: 0, shipping: 12000, total: 175000,
    paymentMethod: "card", paymentRef: "STR-abc789", address: "Calle 50 #30-15", city: "Medellín",
    trackingCode: "COL-TRK-1122334", notes: [],
    timestamps: { created: "2026-02-09T11:00:00Z", paid: "2026-02-09T11:05:00Z", packed: "2026-02-10T09:00:00Z", shipped: "2026-02-11T08:00:00Z" },
  },
  {
    id: "ORD-20260208-005", customerId: "c-5", customerName: "María López", status: "entregado",
    items: [{ productId: "kit-brillo-suavidad", name: "Kit Brillo y Suavidad", qty: 10, price: 165000 }],
    subtotal: 1650000, discount: 165000, shipping: 0, total: 1485000,
    paymentMethod: "transfer", paymentRef: "PSE-112233", address: "Cra 27 #36-50", city: "Bucaramanga",
    channel: "facebook", notes: ["Mayorista", "Entregado sin novedad"],
    timestamps: { created: "2026-02-08T10:00:00Z", paid: "2026-02-08T10:30:00Z", packed: "2026-02-08T14:00:00Z", shipped: "2026-02-09T08:00:00Z", delivered: "2026-02-11T14:00:00Z" },
  },
  {
    id: "ORD-20260207-006", customerId: "c-4", customerName: "Camila Ruiz", status: "incidencia",
    items: [{ productId: "shampoo-hidratante", name: "Shampoo Hidratación Profunda", qty: 1, price: 52000 }],
    subtotal: 52000, discount: 0, shipping: 12000, total: 64000,
    paymentMethod: "daviplata", paymentRef: "DV-998877", address: "Cra 44 #72-15", city: "Barranquilla",
    conversationId: "conv-4", channel: "whatsapp", notes: ["Producto llegó sin tapa"],
    incident: { type: "dano", description: "Shampoo llegó sin tapa, producto derramado parcialmente.", createdAt: "2026-02-11T18:00:00Z" },
    timestamps: { created: "2026-02-07T09:00:00Z", paid: "2026-02-07T09:10:00Z", packed: "2026-02-07T15:00:00Z", shipped: "2026-02-08T08:00:00Z", delivered: "2026-02-11T16:00:00Z" },
  },
  {
    id: "ORD-20260206-007", customerId: "c-1", customerName: "Laura García", status: "devuelto",
    items: [{ productId: "kit-brillo-suavidad", name: "Kit Brillo y Suavidad", qty: 1, price: 165000 }],
    subtotal: 165000, discount: 0, shipping: 0, total: 165000,
    paymentMethod: "card", paymentRef: "STR-dev001", address: "Cra 15 #80-20 Apto 501", city: "Bogotá",
    returnReason: "Reacción alérgica a uno de los componentes",
    notes: ["Reembolso procesado el 12/02"],
    timestamps: { created: "2026-02-06T10:00:00Z", paid: "2026-02-06T10:05:00Z", packed: "2026-02-06T14:00:00Z", shipped: "2026-02-07T08:00:00Z", delivered: "2026-02-09T10:00:00Z", returned: "2026-02-11T12:00:00Z" },
  },
  {
    id: "ORD-20260212-008", customerId: "c-2", customerName: "Paola Mejía", status: "nuevo",
    items: [{ productId: "serum-brillo", name: "Sérum Brillo Capilar", qty: 1, price: 79000 }],
    subtotal: 79000, discount: 0, shipping: 12000, total: 91000,
    paymentMethod: "nequi", address: "Calle 50 #30-15", city: "Medellín",
    notes: [], timestamps: { created: "2026-02-12T09:00:00Z" },
  },
];

/* ── KPIs DE VENTAS ── */
export const salesKPIs: SalesKPIs = {
  revenueToday: 1247500,
  revenueMonth: 8940000,
  revenuePrevMonth: 7650000,
  ordersToday: 5,
  ordersMonth: 42,
  aov: 212857,
  conversionRate: 3.8,
  cartAbandonment: 68.5,
  paidVsPending: { paid: 37, pending: 5 },
  topProducts: [
    { name: "Kit Control Frizz Total", units: 18, revenue: 3402000 },
    { name: "Kit Brillo y Suavidad", units: 14, revenue: 2310000 },
    { name: "Mascarilla Restauración", units: 12, revenue: 816000 },
    { name: "Sérum Brillo Capilar", units: 11, revenue: 869000 },
    { name: "Shampoo Hidratación", units: 9, revenue: 468000 },
  ],
};

/* ── KPIs DE CHAT ── */
export const chatKPIs: ChatKPIs = {
  newChatsToday: 27,
  newChatsByChannel: { whatsapp: 10, instagram: 6, facebook: 3, web: 4, tiktok: 4 },
  avgFRT: 48,
  frtByChannel: { whatsapp: 35, instagram: 72, facebook: 55, web: 5, tiktok: 44 },
  avgResolution: 14,
  backlog: 8,
  handoffRate: 12.5,
  chatToSaleRate: 28.3,
};

/* ── KPIs OPERATIVOS ── */
export const opsKPIs: OpsKPIs = {
  ordersByStatus: { nuevo: 2, pagado: 1, empacado: 1, enviado: 1, entregado: 1, devuelto: 1, cancelado: 0, incidencia: 1 },
  avgDispatchTime: 18.5,
  onTimeDeliveryRate: 87,
  incidentsByType: { direccion: 2, pago: 1, demora: 3, dano: 2, producto_erroneo: 1, otro: 1 },
  returnReasons: [
    { reason: "Reacción alérgica", count: 1 },
    { reason: "No era lo que esperaba", count: 2 },
    { reason: "Producto dañado", count: 1 },
    { reason: "Error en envío", count: 1 },
  ],
};

/* ── ALERTAS ── */
export const alerts: Alert[] = [
  { id: "al-1", type: "danger", title: "SLA roto: WhatsApp", description: "+15 min sin respuesta en conv. de Sofía Torres (Instagram)", timestamp: "2026-02-12T09:45:00Z", dismissed: false },
  { id: "al-2", type: "warning", title: "Carritos abandonados alto", description: "68.5% de abandono hoy — 12% más que ayer", timestamp: "2026-02-12T09:00:00Z", dismissed: false },
  { id: "al-3", type: "warning", title: "Stock bajo", description: "Kit Brillo y Suavidad: 18 unidades (menos de 20)", timestamp: "2026-02-12T08:00:00Z", dismissed: false },
  { id: "al-4", type: "danger", title: "Incidencia abierta", description: "Pedido ORD-20260207-006 — producto dañado sin resolver", timestamp: "2026-02-12T07:00:00Z", dismissed: false },
  { id: "al-5", type: "info", title: "Daniela R. con backlog alto", description: "5 conversaciones sin responder", timestamp: "2026-02-12T09:30:00Z", dismissed: false },
];

/* ── FUNNEL ── */
export const funnelData: FunnelStep[] = [
  { name: "Visitas", count: 2450, rate: 100, dropoff: 0 },
  { name: "Add to Cart", count: 420, rate: 17.1, dropoff: 82.9 },
  { name: "Begin Checkout", count: 185, rate: 44.0, dropoff: 56.0 },
  { name: "Pago completado", count: 93, rate: 50.3, dropoff: 49.7 },
  { name: "Entregado", count: 81, rate: 87.1, dropoff: 12.9 },
];

/* ── REPORTE POR CANAL ── */
export const channelReports: ChannelReport[] = [
  { channel: "whatsapp", revenue: 3200000, orders: 16, conversations: 340, conversion: 4.7 },
  { channel: "instagram", revenue: 2800000, orders: 13, conversations: 280, conversion: 4.6, adSpend: 450000, roas: 6.2 },
  { channel: "web", revenue: 1940000, orders: 9, conversations: 120, conversion: 7.5 },
  { channel: "facebook", revenue: 1000000, orders: 4, conversations: 85, conversion: 4.7, adSpend: 200000, roas: 5.0 },
  { channel: "tiktok", revenue: 900000, orders: 5, conversations: 60, conversion: 8.3, adSpend: 100000, roas: 9.0 },
];

/* ── TOP INTENTS ── */
export const topIntents: TopIntent[] = [
  { intent: "¿Cuánto tarda el envío?", count: 89, pct: 18.2, trend: "stable" },
  { intent: "¿Qué me sirve para el frizz?", count: 72, pct: 14.7, trend: "up" },
  { intent: "¿Dónde va mi pedido?", count: 64, pct: 13.1, trend: "up" },
  { intent: "¿Precio del kit?", count: 58, pct: 11.9, trend: "stable" },
  { intent: "¿Sirve para cabello teñido?", count: 45, pct: 9.2, trend: "down" },
  { intent: "¿Cómo se usa el producto?", count: 38, pct: 7.8, trend: "stable" },
  { intent: "¿Tienen envío gratis?", count: 34, pct: 7.0, trend: "up" },
  { intent: "Quiero devolver un producto", count: 22, pct: 4.5, trend: "down" },
  { intent: "¿Hacen envíos a mi ciudad?", count: 19, pct: 3.9, trend: "stable" },
  { intent: "Hablar con una persona", count: 15, pct: 3.1, trend: "down" },
];

/* ── SLA RULES ── */
export const slaRules: SLARule[] = [
  { channel: "whatsapp", maxFirstResponse: 5, maxResolution: 30, priority: "high" },
  { channel: "instagram", maxFirstResponse: 15, maxResolution: 60, priority: "normal" },
  { channel: "facebook", maxFirstResponse: 15, maxResolution: 60, priority: "normal" },
  { channel: "web", maxFirstResponse: 1, maxResolution: 15, priority: "urgent" },
];

/* ── TEMPLATES ── */
export const templates: Template[] = [
  { id: "tpl-1", name: "Saludo inicial", channel: ["whatsapp", "instagram", "facebook"], category: "saludo", text: "¡Hola {{nombre}}! 👋 Soy {{agente}} de Shelie. ¿En qué puedo ayudarte?", variables: ["nombre", "agente"] },
  { id: "tpl-2", name: "Estado de pedido", channel: ["whatsapp"], category: "pedido", text: "Tu pedido {{orden}} está en estado: {{estado}}. {{tracking}}", variables: ["orden", "estado", "tracking"] },
  { id: "tpl-3", name: "Envío de link de pago", channel: ["whatsapp", "instagram"], category: "pago", text: "Aquí tienes tu link de pago: {{link}}\nTotal: {{total}}\nVálido por 24h.", variables: ["link", "total"] },
  { id: "tpl-4", name: "Recomendación anti-frizz", channel: ["whatsapp", "instagram", "web"], category: "venta", text: "Para tu tipo de cabello te recomiendo el Kit Control Frizz Total ($189.000). Incluye shampoo + acondicionador + sérum. ¿Te lo agrego?", variables: [] },
  { id: "tpl-5", name: "Seguimiento postventa", channel: ["whatsapp"], category: "postventa", text: "¡Hola {{nombre}}! ¿Cómo te fue con tu {{producto}}? Nos encantaría saber tu experiencia. 💇‍♀️", variables: ["nombre", "producto"] },
];

/* ── ASSIGNMENT RULES ── */
export const assignmentRules: AssignmentRule[] = [
  { id: "ar-1", name: "WhatsApp → Carolina", condition: "channel", value: "whatsapp", assignTo: "ag-1", active: true },
  { id: "ar-2", name: "VIP → Carolina", condition: "tag", value: "vip", assignTo: "ag-1", active: true },
  { id: "ar-3", name: "Instagram → Round Robin", condition: "channel", value: "instagram", assignTo: "round-robin", active: true },
  { id: "ar-4", name: "Facebook → Daniela", condition: "channel", value: "facebook", assignTo: "ag-2", active: true },
  { id: "ar-5", name: "Noche → Agente IA", condition: "schedule", value: "22:00-06:00", assignTo: "ag-4", active: true },
];

/* ── HELPERS ── */
export function formatCOPAdmin(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

export function timeAgo(date: string) {
  const now = new Date("2026-02-12T10:00:00Z").getTime();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export const channelIcons: Record<string, string> = {
  whatsapp: "📱", instagram: "📸", facebook: "💬", web: "🌐",
    tiktok: "🎵",
  };

export const channelColors: Record<string, string> = {
  whatsapp: "bg-green-500/20 text-green-400",
  instagram: "bg-pink-500/20 text-pink-400",
  facebook: "bg-blue-500/20 text-blue-400",
  web: "bg-purple-500/20 text-purple-400",
    tiktok: "bg-black/20 text-[#69C9D0]",
  };

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
