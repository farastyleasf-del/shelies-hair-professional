import { query, queryOne } from "./db";

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
  return query<DBService>(`SELECT * FROM shelies.services ${where} ORDER BY type, id`);
}

export async function getServiceById(id: number): Promise<DBService | null> {
  return queryOne<DBService>(`SELECT * FROM shelies.services WHERE id = $1`, [id]);
}

export async function createService(data: Omit<DBService, "id" | "created_at" | "updated_at">): Promise<DBService> {
  const rows = await query<DBService>(
    `INSERT INTO shelies.services (title, type, duration, price, icon, description, highlights, image, before_image, is_active)
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
    `UPDATE shelies.services SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values
  );
  return rows[0] ?? null;
}

export async function deleteService(id: number): Promise<boolean> {
  const rows = await query(`DELETE FROM shelies.services WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

// ── Stylists ───────────────────────────────────────────────────
export async function getStylists(onlyActive = true): Promise<DBStylist[]> {
  const where = onlyActive ? "WHERE is_active = true" : "";
  return query<DBStylist>(`SELECT * FROM shelies.stylists ${where} ORDER BY id`);
}

// ── Appointments ───────────────────────────────────────────────
export async function createAppointment(data: Omit<DBAppointment, "id" | "created_at" | "updated_at">): Promise<DBAppointment> {
  const rows = await query<DBAppointment>(
    `INSERT INTO shelies.appointments (service_id, stylist_id, client_name, client_phone, date, time_slot, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.service_id, data.stylist_id, data.client_name, data.client_phone,
     data.date, data.time_slot, data.status ?? "pendiente", data.notes]
  );
  return rows[0];
}

export async function getAppointments(): Promise<DBAppointment[]> {
  return query<DBAppointment>(`
    SELECT a.*, s.title as service_name, st.name as stylist_name
    FROM shelies.appointments a
    LEFT JOIN shelies.services s ON a.service_id = s.id
    LEFT JOIN shelies.stylists st ON a.stylist_id = st.id
    ORDER BY a.date DESC, a.time_slot
  `);
}
