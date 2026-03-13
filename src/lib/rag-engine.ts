import { products, globalFAQ, demoOrders, formatCOP } from "./data";
import { Product, ChatAction } from "./types";

/* ── Tipos para el Motor RAG ── */
export interface RAGResponse {
    content: string;
    actions?: ChatAction[];
    products?: Product[];
    intent: "recommendation" | "tracking" | "support" | "purchase" | "greeting" | "service" | "unknown";
    transferRequested: boolean;
}

/* ── WhatsApp oficial ── */
const WA_URL = "https://wa.me/573246828585";

/* ── Base de Conocimiento — Servicios ── */
const SERVICES_KB = [
    {
        id: "alisado-organico",
        name: "Alisado Orgánico Efecto Shelie's",
        keywords: ["alisado", "alisar", "alis", "liso", "liso perfecto", "organico",
            "tanino", "murumuru", "sin formol", "formol", "embarazo", "embarazada",
            "lactante", "nina", "ninas", "keratina organica"],
        description: "Alisado y reparación sin formol, 100% orgánico con TANINO. Dura 5–6 meses. Apto para embarazadas, lactantes y niñas desde 6 años. Contiene aceite de Murumuru, aminoácidos y aceite de aguacate.",
        duration: "5–6 meses",
        price: "Consultar según largo y cantidad de cabello",
    },
    {
        id: "botox-capilar",
        name: "Botox Capilar Canela",
        keywords: ["botox", "botox capilar", "canela capilar", "moringa", "restaurar cabello",
            "sin vida", "brillo intenso", "anti edad capilar", "1 mes liso"],
        description: "Restauración, hidratación y brillo intenso. Liso 60% durante 1–2 meses. Ingredientes: Canela, Moringa y Argán. Ideal para cabellos procesados y maltratados.",
        duration: "1–2 meses",
        price: "Consultar según largo y cantidad de cabello",
    },
    {
        id: "terapia-scalp",
        name: "Terapia Total Scalp",
        keywords: ["scalp", "cuero cabelludo", "dermatitis", "seborreica", "alopecia",
            "caspa", "descamacion", "irritacion", "caida cuero", "desintoxicar cuero"],
        description: "Tratamiento para el cuero cabelludo. Alivia dermatitis seborreica, alopecia, caída excesiva e irritaciones. Desintoxica el cuero cabelludo y estimula el crecimiento.",
        duration: "Según valoración",
        price: "Consultar en sede",
    },
    {
        id: "reconstruccion",
        name: "Terapia de Reconstrucción",
        keywords: ["reconstruccion", "reconstruir", "reconstruye", "elasticidad perdida",
            "cortex", "efecto chicle", "biotina", "peptidos", "proteinas capilar",
            "daño profundo", "sin elasticidad", "keratina tratamiento"],
        description: "Reparador intensivo con biotina, keratina, péptidos y proteínas. Penetra hasta el córtex. Recupera elasticidad 60–80% en la primera sesión. Para cabellos sin elasticidad ni resistencia.",
        duration: "1 sesión (60–80% recuperación)",
        price: "Consultar en sede",
    },
    {
        id: "repolarizacion",
        name: "Repolarización (Cronograma Capilar)",
        keywords: ["repolarizacion", "repolarizar", "cronograma capilar servicio",
            "brillo extremo servicio", "suavidad extrema servicio", "hebras maltratadas"],
        description: "Procedimiento reparador y nutritivo. Recupera brillo, suavidad y vida del cabello. Efecto de 1–2 meses.",
        duration: "1–2 meses",
        price: "Consultar en sede",
    },
    {
        id: "nano-cristalizacion",
        name: "Nano Cristalización",
        keywords: ["nano", "nanocristalizacion", "nano cristalizacion",
            "brillo tridimensional", "potencializar tratamiento"],
        description: "Terapia exclusiva que potencializa cualquier tratamiento. Aporta brillo tridimensional y flexibilidad. Costo: $50.000.",
        duration: "Adicional a cualquier servicio",
        price: "$50.000",
    },
    {
        id: "corte-bordado",
        name: "Corte Bordado",
        keywords: ["corte bordado", "horquilla", "puntas abiertas", "puntas secas",
            "oxigenar cabello", "bordado"],
        description: "Retira horquillas sin afectar el largo. Elimina puntas abiertas y secas. Oxigena el cabello. Costo: $40.000.",
        duration: "Adicional a cualquier servicio",
        price: "$40.000",
    },
    {
        id: "luz-fotonica",
        name: "Luz Fotónica / Infrarroja",
        keywords: ["luz fotonica", "infrarroja", "infrarojo", "fotonica azul",
            "luz roja capilar", "flujo sanguineo capilar"],
        description: "Luz infrarroja: promueve crecimiento activando circulación. Luz fotónica azul: mejora adherencia del producto, alisa cutícula y elimina frizz. Costo: $40.000.",
        duration: "Adicional a cualquier servicio",
        price: "$40.000",
    },
    {
        id: "terapia-ozono",
        name: "Terapia de Ozono",
        keywords: ["ozono", "terapia ozono", "limpieza profunda cuero",
            "sebo capilar", "regenerar dermis"],
        description: "Limpieza profunda del cuero cabelludo. Favorece nutrición del folículo, regenera la dermis y mejora la circulación. Costo: $50.000.",
        duration: "Adicional a cualquier servicio",
        price: "$50.000",
    },
];

/* ── Base de Conocimiento — Keywords específicas por producto ── */
const PRODUCT_KB: Record<string, { keywords: string[]; note?: string }> = {
    "shampoo-hidratante-blindaje": {
        keywords: ["shampoo blindaje", "blindaje shampoo", "active liss",
            "libre de sales", "sin sales", "rigidez cabello"],
    },
    "tratamiento-natural-blindaje": {
        keywords: ["tratamiento natural", "tratamiento blindaje", "ricino",
            "aloe vera cabello", "efecto seda", "acondicionador blindaje"],
    },
    "protector-termico-blindaje": {
        keywords: ["protector termico", "termoprotector", "termo protector",
            "spray calor", "perfume capilar", "prolonga alisado", "plancha cabello"],
    },
    "mascarilla-kanechom": {
        keywords: ["kanechom", "mascarilla kanechom", "mascarilla 1kg", "1kg mascarilla"],
    },
    "ampolletas-cronograma": {
        keywords: ["ampolleta", "ampolletas", "ampola", "ampolas",
            "ampolleta nutricion", "ampolleta reconstruccion",
            "pos quimica", "kit ampolletas", "24ml ampolleta"],
    },
    "mascarilla-cronograma": {
        keywords: ["mascarilla cronograma", "cronograma mascarilla", "mascarilla premium 300",
            "telarana mascarilla", "7 minutos mascarilla", "regeneracao"],
    },
    "kit-romeo-julieta": {
        keywords: ["romeo", "julieta", "romeo julieta", "kit detox",
            "jengibre ortiga", "detox capilar"],
    },
    "oro-liquido-shelies": {
        keywords: ["oro liquido", "aceite oro liquido", "argan aguacate macadamia",
            "mezcla aceites esenciales", "30ml aceite shelies"],
    },
    "aceite-de-coco": {
        keywords: ["aceite de coco", "coco virgen", "aceite coco capilar"],
    },
    "elixir-capilar": {
        keywords: ["elixir capilar", "tonico capilar", "celulas madre",
            "hialuronico capilar", "sin minoxidil", "estimular crecimiento"],
        note: "No contiene minoxidil. No genera dependencia.",
    },
};

/* ── Listas de detección booleana (any-match) ── */
const KEYWORDS = {
    tracking: [
        "tracking", "rastreo", "donde va", "estatus", "mi orden", "guia",
        "no ha llegado", "donde esta", "seguimiento", "cuando llega", "envio",
        "entrega", "paquete", "ord-",
    ],
    purchase: [
        "comprar", "precio", "cuanto vale", "cuanto cuesta", "como compro",
        "donde compro", "metodo de pago", "pago", "nequi", "daviplata",
        "transferencia", "hacer pedido", "realizar pedido", "checkout", "carrito",
    ],
    support: [
        "asesor", "asesora", "humano", "persona real", "hablar con alguien",
        "necesito ayuda", "soporte", "servicio al cliente",
    ],
    service: [
        "alisado", "alisar", "botox", "terapia", "scalp", "reconstruccion",
        "repolarizacion", "nano cristal", "horquilla", "puntas abiertas",
        "ozono", "infrarroja", "fotonica", "servicio", "sede", "salon",
        "proceso capilar", "tratamiento en sede", "tratamiento profesional",
        "agendar", "cita", "cuero cabelludo", "dermatitis", "alopecia",
    ],
    recommendation: [
        "cabello", "pelo", "cabellos", "frizz", "encrespado", "encrespa",
        "brillo", "opaco", "hidrat", "seco", "reseco", "sequedad", "graso",
        "dano", "danado", "reparar", "restaurar", "quebradizo", "debil",
        "caida", "crecer", "crecimiento", "caida", "perder pelo",
        "shampoo", "mascarilla", "aceite", "ampolleta", "elixir", "tonico",
        "tratamiento", "rutina", "kit", "serum", "acondicionador",
        "recomienda", "recomendar", "que me sirve", "que me conviene",
        "que usar", "que producto", "que tienen", "tienen algo",
        "blindaje", "kanechom", "oro liquido", "romeo", "julieta",
        "tinte", "decoloracion", "quimica", "plancha", "calor",
        "puntas", "volumen", "esponjado", "lacio", "liso en casa",
    ],
};

/* ════════════════════════════════════════════
   MOTOR RAG
   ════════════════════════════════════════════ */
export const ragEngine = {

    async processQuery(query: string): Promise<RAGResponse> {
        const q = query.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Detección booleana — cualquier coincidencia activa el intent
        const has = (list: string[]) => list.some((kw) => q.includes(kw));

        const isTracking    = has(KEYWORDS.tracking);
        const isPurchase    = has(KEYWORDS.purchase);
        const isSupport     = has(KEYWORDS.support);
        const isService     = has(KEYWORDS.service);
        const isRecommend   = has(KEYWORDS.recommendation);
        const isGreeting    = this.isGreeting(q);
        const needsHandoff  = isPurchase || isSupport;

        // 1. Saludo — primero para respuesta cálida inmediata
        if (isGreeting && !isTracking && !isRecommend && !isService) {
            return {
                content: "¡Hola! 👋 Soy tu asesora virtual de Shelie's Hair Professional.\n\nPuedo ayudarte con:\n\n• Recomendar el producto ideal para tu cabello\n• Informarte sobre nuestros servicios en sede\n• Rastrear tu pedido\n• Conectarte con una asesora\n\n¿En qué te ayudo?",
                intent: "greeting",
                transferRequested: false,
            };
        }

        // 2. Rastreo de pedidos
        if (isTracking || q.includes("ord-") || (q.includes("pedido") && this.hasContactInfo(q))) {
            return this.handleOrderQuery(q);
        }

        // 3. Producto específico (nombre o keyword única de producto)
        const specificProduct = this.findSpecificProduct(q);
        if (specificProduct) {
            return this.buildProductResponse(specificProduct, needsHandoff);
        }

        // 4. Servicio específico (Alisado, Botox, Scalp, etc.)
        const specificService = this.findSpecificService(q);
        if (specificService) {
            return this.buildServiceResponse(specificService);
        }

        // 5. Servicios en general (cuando hay intent de servicio sin servicio específico)
        if (isService && !isRecommend) {
            return this.handleGeneralServiceQuery();
        }

        // 6. Recomendación de producto por objetivo de cabello
        if (isRecommend) {
            return this.handleProductQuery(q, needsHandoff);
        }

        // 7. FAQ (envíos, devoluciones, etc.)
        const faqMatch = this.searchKnowledge(q);
        if (faqMatch) {
            return {
                content: faqMatch + (needsHandoff ? "\n\n¿Te conecto con una asesora?" : ""),
                intent: needsHandoff ? "purchase" : "support",
                transferRequested: needsHandoff,
                actions: needsHandoff
                    ? [{ type: "handoff", label: "Hablar con asesora 📱", payload: WA_URL }]
                    : [],
            };
        }

        // 8. Handoff directo (quiere comprar o hablar con alguien)
        if (needsHandoff) {
            return {
                content: "¡Claro! Te conecto con una asesora de Shelie's de inmediato. 📱",
                intent: isPurchase ? "purchase" : "support",
                transferRequested: true,
                actions: [{ type: "handoff", label: "Ir a WhatsApp 💬", payload: WA_URL }],
            };
        }

        // 9. Fallback amigable — ofrece las 3 rutas principales
        return {
            content: "¡Hola! 😊 Puedo ayudarte con:\n\n💆‍♀️ **Productos** — shampoos, mascarillas, aceites, ampolletas\n💈 **Servicios en sede** — alisado, botox, terapias capilares\n📦 **Tu pedido** — rastreo y estado de envío\n\n¿Qué estás buscando?",
            intent: "unknown",
            transferRequested: false,
            actions: [
                { type: "handoff", label: "Hablar con asesora 📱", payload: WA_URL },
            ],
        };
    },

    findSpecificProduct(q: string): Product | null {
        for (const [productId, kb] of Object.entries(PRODUCT_KB)) {
            if (kb.keywords.some((kw) => q.includes(kw))) {
                return products.find((p) => p.id === productId) ?? null;
            }
        }
        for (const p of products) {
            const name = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const words = name.split(" ").filter((w) => w.length > 4);
            if (words.length >= 2 && words.every((w) => q.includes(w))) return p;
        }
        return null;
    },

    findSpecificService(q: string): (typeof SERVICES_KB)[0] | null {
        for (const service of SERVICES_KB) {
            if (service.keywords.some((kw) => q.includes(kw))) return service;
        }
        return null;
    },

    buildProductResponse(product: Product, needsHandoff: boolean): RAGResponse {
        const note = PRODUCT_KB[product.id]?.note ?? "";
        const priceText = formatCOP(product.price);
        const compareText = product.comparePrice ? `  ~~Antes: ${formatCOP(product.comparePrice)}~~` : "";

        const content = [
            `**${product.name}**`,
            `_${product.tagline}_`,
            "",
            `Precio: **${priceText}**${compareText}`,
            "",
            `Beneficios:\n${product.benefits.map((b) => `• ${b}`).join("\n")}`,
            "",
            `Ideal para: ${product.forWhom}`,
            note ? `\n${note}` : "",
        ].filter(Boolean).join("\n");

        const actions: ChatAction[] = [
            { type: "add_to_cart", label: `Agregar al carrito — ${priceText}`, payload: product.id },
            { type: "view_product", label: "Ver ficha completa", payload: product.slug },
        ];
        if (needsHandoff) {
            actions.push({ type: "handoff", label: "Hablar con asesora 📱", payload: WA_URL });
        }

        return { content, products: [product], actions, intent: "recommendation", transferRequested: false };
    },

    buildServiceResponse(service: (typeof SERVICES_KB)[0]): RAGResponse {
        const content = [
            `**${service.name}**`,
            "",
            service.description,
            "",
            `Duracion: **${service.duration}**`,
            `Costo: **${service.price}**`,
            "",
            "Quieres agendar o tienes mas preguntas?",
        ].join("\n");

        return {
            content,
            intent: "service",
            transferRequested: true,
            actions: [
                {
                    type: "handoff",
                    label: `Agendar por WhatsApp 📱`,
                    payload: `${WA_URL}?text=${encodeURIComponent(`Hola Shelie's, quiero info sobre: ${service.name}`)}`,
                },
                { type: "view_product", label: "Ver todos los servicios", payload: "/servicios" },
            ],
        };
    },

    handleGeneralServiceQuery(): RAGResponse {
        const main = SERVICES_KB.slice(0, 5);
        const extra = SERVICES_KB.slice(5);

        const content = [
            "En Shelie's Hair Professional ofrecemos estos **procesos capilares:**",
            "",
            main.map((s) => `• **${s.name}** — ${s.duration}`).join("\n"),
            "",
            "**Adicionales** para complementar tu servicio:",
            extra.map((s) => `• ${s.name} — ${s.price}`).join("\n"),
            "",
            "Todos nuestros servicios se realizan en nuestras sedes en Bogota. Sobre cual quieres mas informacion?",
        ].join("\n");

        return {
            content,
            intent: "service",
            transferRequested: true,
            actions: [
                { type: "handoff", label: "Agendar por WhatsApp 📱", payload: WA_URL },
                { type: "view_product", label: "Ver todos los servicios", payload: "/servicios" },
            ],
        };
    },

    handleProductQuery(q: string, needsHandoff: boolean): RAGResponse {
        let filtered = [...products];
        let focus = "";

        if (/caida|anticaida|elixir|tonico|crecer|crecimiento/.test(q)) {
            filtered = products.filter((p) => p.objective.includes("crecimiento-anticaida"));
            focus = "combatir la caida y estimular el crecimiento";
        } else if (/frizz|encrespado|encrespa|humedad|esponjado/.test(q)) {
            filtered = products.filter((p) => p.objective.includes("control-frizz"));
            focus = "el control del frizz";
        } else if (/brillo|suav|opaco|liso en casa/.test(q)) {
            filtered = products.filter((p) => p.objective.includes("brillo-suavidad"));
            focus = "el brillo y la suavidad";
        } else if (/dano|reparar|restaurar|decolorac|tinte|quimico|puntas|seco|quebradizo/.test(q)) {
            filtered = products.filter((p) => p.objective.includes("reparacion"));
            focus = "la reparacion capilar";
        } else if (/cuero|dermis|dermatitis|alopecia/.test(q)) {
            filtered = products.filter(
                (p) => p.objective.includes("crecimiento-anticaida") || p.id === "kit-romeo-julieta"
            );
            focus = "el cuidado del cuero cabelludo";
        }

        if (filtered.length === 0) filtered = products;

        const best = filtered[0];
        const extras = filtered.slice(1, 3);

        const content = [
            focus
                ? `Para **${focus}**, estas son nuestras mejores opciones:`
                : "Estos son nuestros productos mas recomendados:",
            "",
            `⭐ **${best.name}** — ${formatCOP(best.price)}`,
            `   ${best.tagline}`,
            extras.length > 0
                ? "\nTambien te puede interesar:\n" + extras.map((p) => `• **${p.name}** — ${formatCOP(p.price)}`).join("\n")
                : "",
            "",
            "Quieres saber mas sobre alguno?",
        ].filter(Boolean).join("\n");

        const actions: ChatAction[] = [
            { type: "add_to_cart", label: `Agregar ${best.name}`, payload: best.id },
            { type: "view_product", label: "Ver detalles", payload: best.slug },
        ];
        if (needsHandoff) {
            actions.push({ type: "handoff", label: "Asesoria por WhatsApp 📱", payload: WA_URL });
        }

        return { content, products: filtered.slice(0, 3), actions, intent: "recommendation", transferRequested: false };
    },

    handleOrderQuery(q: string): RAGResponse {
        const match =
            q.match(/ord-[\w-]+/i) ||
            q.match(/\b[\w@.]+@[\w.]+\b/) ||
            q.match(/\b3\d{9}\b/);

        if (match) {
            const val = match[0].toLowerCase();
            const order = demoOrders.find(
                (o) =>
                    o.id.toLowerCase() === val ||
                    o.customer.email.toLowerCase() === val ||
                    o.customer.phone === val
            );
            if (order) {
                return {
                    content: `Pedido: **${order.id}**\n\nEstatus: **${order.status.toUpperCase()}**\nFecha: ${new Date(order.createdAt).toLocaleDateString()}\nTotal: ${formatCOP(order.total)}\n\nTienes alguna otra duda?`,
                    intent: "tracking",
                    transferRequested: false,
                };
            }
        }

        return {
            content: "Para rastrear tu pedido necesito el **Numero de Orden** (ej: ORD-...), el correo o el telefono con que compraste.",
            intent: "tracking",
            transferRequested: false,
        };
    },

    searchKnowledge(q: string): string | null {
        for (const faq of globalFAQ) {
            const question = faq.question.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const qWords = q.split(" ").filter((w) => w.length > 3);
            const matches = qWords.filter((w) => question.includes(w)).length;
            if (matches >= 2 || question.includes(q)) return faq.answer;
        }
        return null;
    },

    hasContactInfo(q: string): boolean {
        return /ord-/.test(q) || /\b[\w@.]+@[\w.]+\b/.test(q) || /\b3\d{9}\b/.test(q);
    },

    isGreeting(q: string): boolean {
        return /^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches|saludos|hi )/.test(q);
    },
};
