import { query, queryOne } from "./db";

/* ── Crear tablas y seed inicial ── */
export async function initServicesTable() {
  // ── services ──────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.services (
      id           SERIAL PRIMARY KEY,
      title        VARCHAR(500) NOT NULL,
      type         VARCHAR(50)  DEFAULT 'proceso',
      duration     VARCHAR(100),
      price        NUMERIC(12,2),
      icon         VARCHAR(10),
      description  TEXT         DEFAULT '',
      highlights   JSONB        DEFAULT '[]',
      image        TEXT,
      before_image TEXT,
      is_active    BOOLEAN      DEFAULT true,
      created_at   TIMESTAMPTZ  DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  DEFAULT NOW()
    )
  `, []);

  // ── stylists ──────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.stylists (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(255) NOT NULL,
      role         VARCHAR(255),
      photo        TEXT,
      specialties  JSONB        DEFAULT '[]',
      is_active    BOOLEAN      DEFAULT true,
      created_at   TIMESTAMPTZ  DEFAULT NOW()
    )
  `, []);

  // ── appointments ──────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.appointments (
      id             SERIAL PRIMARY KEY,
      service_id     INTEGER,
      stylist_id     INTEGER,
      client_name    VARCHAR(255) NOT NULL,
      client_phone   VARCHAR(50)  DEFAULT '',
      client_email   VARCHAR(255) DEFAULT '',
      date           DATE         NOT NULL,
      time_slot      VARCHAR(10)  NOT NULL,
      status         VARCHAR(50)  DEFAULT 'pendiente',
      deposit_amount NUMERIC(12,2) DEFAULT 0,
      deposit_status VARCHAR(50)  DEFAULT 'pendiente',
      payment_ref    VARCHAR(255) DEFAULT '',
      notes          TEXT         DEFAULT '',
      created_at     TIMESTAMPTZ  DEFAULT NOW(),
      updated_at     TIMESTAMPTZ  DEFAULT NOW()
    )
  `, []);

  // ── Seed services ──────────────────────────────
  const svcCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM bbdd_shelies.services`, []);
  if (!svcCount || parseInt(svcCount.count) === 0) {
    const services = [
      { title: "Alisado Orgánico Efecto Shelie's",    type: "proceso",  price: 350000, duration: "5-6 meses",     icon: "✨", description: "Alisado y reparación sin formol, 100% orgánico con TANINO. Enriquecido con aceite de Murumuru, aminoácidos y aceite de Aguacate. Apto para embarazadas, lactantes y niñas desde 6 años.", highlights: ["0% Formol — sin vapores tóxicos","100% Orgánico (activo: TANINO)","Apto embarazadas, lactantes y niñas +6 años","No se plancha con el producto aplicado"], image: "/images/services/resultado-3.jpg", before_image: "/images/services/antes-2.jpg" },
      { title: "Botox Capilar Canela",                type: "proceso",  price: 280000, duration: "1-2 meses",     icon: "💆", description: "Multibeneficios para todo tipo de hebra, especialmente las más procesadas y maltratadas. Ingredientes: Canela, Moringa y Argán.", highlights: ["Restauración y brillo intenso","Hidratación profunda capilar","Efecto anti-edad capilar","Para cabellos sin vida y sin movimiento"], image: "/images/services/resultado-1.jpg", before_image: "/images/services/antes-1.jpg" },
      { title: "Terapia Total Scalp",                 type: "proceso",  price: 220000, duration: "Según valoración", icon: "🌿", description: "Tratamiento dirigido al cuero cabelludo. Alivia irritaciones, dermatitis seborreica, alopecia y caída excesiva. Estimula el crecimiento y desintoxica el folículo piloso.", highlights: ["Alivia dermatitis seborreica","Combate alopecia y caída excesiva","Desintoxica el cuero cabelludo","Estimula el crecimiento capilar"], image: "/images/services/aplicacion-1.jpg", before_image: null },
      { title: "Terapia de Reconstrucción",           type: "proceso",  price: 200000, duration: "1 sesión",      icon: "🔧", description: "Fórmula con la misma composición del cabello. Vitamina B7, biotina, keratina, péptidos y proteínas al córtex capilar. Para cabellos sin elasticidad (efecto chicle). NO ALISA.", highlights: ["Penetra directamente al córtex capilar","Recupera elasticidad 60-80%","Para cabello efecto chicle","Resultados inmediatos y visibles"], image: "/images/services/resultado-modelo-1.jpg", before_image: "/images/services/antes-3.jpg" },
      { title: "Repolarización — Cronograma Capilar", type: "proceso",  price: 180000, duration: "1-2 meses",     icon: "💎", description: "Procedimiento reparador y nutritivo para todo tipo de hebra. Recupera el brillo, la suavidad y la vida de las hebras más maltratadas, procesadas y secas.", highlights: ["Para cabellos procesados y secos","Brillo extremo y suavidad inmediata","Durabilidad hasta 2 meses","Complementar con productos en casa"], image: "/images/services/aplicacion-2.jpg", before_image: null },
      { title: "Nano Cristalización",                 type: "adicional", price: 50000, duration: null,            icon: "⚡", description: "Potencializa cualquier tratamiento. Brillo tridimensional y flexibilidad capilar.", highlights: ["Complemento de cualquier servicio","Brillo tridimensional"], image: null, before_image: null },
      { title: "Corte Bordado",                       type: "adicional", price: 40000, duration: null,            icon: "✂️", description: "Retira la horquilla sin afectar la longitud. Oxigena el cabello para crecimiento sano.", highlights: ["Sin perder el largo","Elimina puntas abiertas"], image: null, before_image: null },
      { title: "Luz Fotónica / Infrarroja",           type: "adicional", price: 40000, duration: null,            icon: "🔵", description: "Alisa la cutícula, elimina el frizz y promueve la circulación del cuero cabelludo.", highlights: ["Alisa la cutícula","Elimina el frizz"], image: null, before_image: null },
      { title: "Terapia de Ozono",                    type: "adicional", price: 50000, duration: null,            icon: "💨", description: "Limpieza profunda del folículo. Regenera la dermis, sana la cutícula, promueve el crecimiento.", highlights: ["Limpieza profunda","Regenera la dermis"], image: null, before_image: null },
    ];
    for (const s of services) {
      await query(
        `INSERT INTO bbdd_shelies.services (title,type,price,duration,icon,description,highlights,image,before_image,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [s.title, s.type, s.price, s.duration, s.icon, s.description, JSON.stringify(s.highlights), s.image, s.before_image]
      );
    }
    console.log("[services] seed inicial:", services.length, "servicios");
  } else {
    console.log("[services] tabla lista con datos existentes");
  }

  // ── Seed stylists ──────────────────────────────
  const stCount = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM bbdd_shelies.stylists`, []);
  if (!stCount || parseInt(stCount.count) === 0) {
    const stylists = [
      { name: "Shelie",    role: "Fundadora · Especialista en Alisados",          photo: "/images/services/resultado-1.jpg", specialties: ["Alisado Orgánico","Botox Capilar","Sheliss Therapy"] },
      { name: "Valentina", role: "Especialista en Tratamientos Capilares",        photo: "/images/services/resultado-2.jpg", specialties: ["Reconstrucción","Repolarización","Terapia Scalp"] },
    ];
    for (const st of stylists) {
      await query(
        `INSERT INTO bbdd_shelies.stylists (name,role,photo,specialties,is_active) VALUES ($1,$2,$3,$4,true)`,
        [st.name, st.role, st.photo, JSON.stringify(st.specialties)]
      );
    }
    console.log("[stylists] seed inicial:", stylists.length, "estilistas");
  } else {
    console.log("[stylists] tabla lista con datos existentes");
  }
}

export interface DBService {
  id: number;
  title: string;
  type: "proceso" | "adicional";
  duration: string | null;
  price: number | null;
  icon: string | null;
  description: string | null;
  highlights: string[];
  image: string | null;
  before_image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBStylist {
  id: number;
  name: string;
  role: string | null;
  photo: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

export interface DBAppointment {
  id: number;
  service_id: number | null;
  stylist_id: number | null;
  client_name: string;
  client_phone: string;
  date: string;
  time_slot: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Services ──────────────────────────────────────────────────
export async function getServices(onlyActive = true): Promise<DBService[]> {
  const where = onlyActive ? "WHERE is_active = true" : "";
  return query<DBService>(`SELECT * FROM bbdd_shelies.services ${where} ORDER BY type, id`);
}

export async function getServiceById(id: number): Promise<DBService | null> {
  return queryOne<DBService>(`SELECT * FROM bbdd_shelies.services WHERE id = $1`, [id]);
}

export async function createService(data: Omit<DBService, "id" | "created_at" | "updated_at">): Promise<DBService> {
  const rows = await query<DBService>(
    `INSERT INTO bbdd_shelies.services (title, type, duration, price, icon, description, highlights, image, before_image, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.title, data.type, data.duration, data.price, data.icon, data.description,
     JSON.stringify(data.highlights), data.image, data.before_image, data.is_active]
  );
  return rows[0];
}

export async function updateService(id: number, data: Partial<DBService>): Promise<DBService | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, val] of Object.entries(data)) {
    if (key === "id" || key === "created_at" || key === "updated_at") continue;
    fields.push(`${key} = $${i++}`);
    values.push(key === "highlights" ? JSON.stringify(val) : val);
  }
  if (fields.length === 0) return null;
  fields.push(`updated_at = now()`);
  values.push(id);
  const rows = await query<DBService>(
    `UPDATE bbdd_shelies.services SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values
  );
  return rows[0] ?? null;
}

export async function deleteService(id: number): Promise<boolean> {
  const rows = await query(`DELETE FROM bbdd_shelies.services WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

// ── Stylists ───────────────────────────────────────────────────
export async function getStylists(onlyActive = true): Promise<DBStylist[]> {
  const where = onlyActive ? "WHERE is_active = true" : "";
  return query<DBStylist>(`SELECT * FROM bbdd_shelies.stylists ${where} ORDER BY id`);
}

// ── Appointments ───────────────────────────────────────────────
export async function createAppointment(data: Omit<DBAppointment, "id" | "created_at" | "updated_at">): Promise<DBAppointment> {
  const rows = await query<DBAppointment>(
    `INSERT INTO bbdd_shelies.appointments (service_id, stylist_id, client_name, client_phone, date, time_slot, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.service_id, data.stylist_id, data.client_name, data.client_phone,
     data.date, data.time_slot, data.status ?? "pendiente", data.notes]
  );
  return rows[0];
}

export async function getAppointments(): Promise<DBAppointment[]> {
  return query<DBAppointment>(`
    SELECT a.*, s.title as service_name, st.name as stylist_name
    FROM bbdd_shelies.appointments a
    LEFT JOIN bbdd_shelies.services s ON a.service_id = s.id
    LEFT JOIN bbdd_shelies.stylists st ON a.stylist_id = st.id
    ORDER BY a.date DESC, a.time_slot
  `);
}
