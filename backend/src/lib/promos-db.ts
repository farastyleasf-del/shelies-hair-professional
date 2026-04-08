/**
 * Promociones, Rifas y Concursos — DB Layer
 * Tablas: bbdd_shelies.promotions, bbdd_shelies.promo_participants
 */
import { query, queryOne } from "./db";

/* ── Types ── */
export interface Promotion {
  id: number;
  title: string;
  description: string;
  type: string;
  config: Record<string, unknown>;
  status: string;
  starts_at: string;
  ends_at: string;
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

/* ── Init tables ── */
export async function initPromosTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.promotions (
      id            SERIAL PRIMARY KEY,
      title         VARCHAR(255) NOT NULL,
      description   TEXT DEFAULT '',
      type          VARCHAR(50) NOT NULL,
      config        JSONB NOT NULL DEFAULT '{}',
      status        VARCHAR(20) DEFAULT 'borrador',
      starts_at     TIMESTAMPTZ,
      ends_at       TIMESTAMPTZ,
      banner_image  VARCHAR(500) DEFAULT '',
      created_by    VARCHAR(255) DEFAULT '',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `, []);

  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.promo_participants (
      id            SERIAL PRIMARY KEY,
      promo_id      INT NOT NULL,
      client_name   VARCHAR(255) DEFAULT '',
      client_phone  VARCHAR(50) DEFAULT '',
      client_email  VARCHAR(255) DEFAULT '',
      entry_type    VARCHAR(50) DEFAULT 'manual',
      entry_data    JSONB NOT NULL DEFAULT '{}',
      result        VARCHAR(50) DEFAULT 'pendiente',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `, []);

  console.log("[promos] tablas promotions y promo_participants listas");
}

/* ── Queries: Promotions ── */

export async function getActivePromos(): Promise<Promotion[]> {
  return query<Promotion>(`
    SELECT p.*, COALESCE(pp.cnt, 0)::int AS participant_count
    FROM bbdd_shelies.promotions p
    LEFT JOIN (SELECT promo_id, COUNT(*)::int AS cnt FROM bbdd_shelies.promo_participants GROUP BY promo_id) pp
      ON pp.promo_id = p.id
    WHERE p.status = 'activa'
      AND (p.starts_at IS NULL OR p.starts_at <= NOW())
      AND (p.ends_at IS NULL OR p.ends_at >= NOW())
    ORDER BY p.created_at DESC
  `, []);
}

export async function getAllPromos(): Promise<Promotion[]> {
  return query<Promotion>(`
    SELECT p.*, COALESCE(pp.cnt, 0)::int AS participant_count
    FROM bbdd_shelies.promotions p
    LEFT JOIN (SELECT promo_id, COUNT(*)::int AS cnt FROM bbdd_shelies.promo_participants GROUP BY promo_id) pp
      ON pp.promo_id = p.id
    ORDER BY p.created_at DESC
  `, []);
}

export async function getPromo(id: number): Promise<Promotion | null> {
  const row = await queryOne<Promotion>(`
    SELECT p.*, COALESCE(pp.cnt, 0)::int AS participant_count
    FROM bbdd_shelies.promotions p
    LEFT JOIN (SELECT promo_id, COUNT(*)::int AS cnt FROM bbdd_shelies.promo_participants GROUP BY promo_id) pp
      ON pp.promo_id = p.id
    WHERE p.id = $1
  `, [id]);
  return row ?? null;
}

export async function createPromo(data: {
  title: string; description: string; type: string; config: Record<string, unknown>;
  status?: string; starts_at?: string; ends_at?: string; banner_image?: string; created_by?: string;
}): Promise<Promotion> {
  const rows = await query<Promotion>(`
    INSERT INTO bbdd_shelies.promotions (title, description, type, config, status, starts_at, ends_at, banner_image, created_by)
    VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    data.title, data.description, data.type, JSON.stringify(data.config),
    data.status ?? "borrador", data.starts_at ?? null, data.ends_at ?? null,
    data.banner_image ?? "", data.created_by ?? "",
  ]);
  return rows[0];
}

export async function updatePromo(id: number, data: Partial<{
  title: string; description: string; config: Record<string, unknown>;
  status: string; starts_at: string; ends_at: string; banner_image: string;
}>): Promise<Promotion | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (data.title !== undefined)       { sets.push(`title = $${i++}`);       params.push(data.title); }
  if (data.description !== undefined) { sets.push(`description = $${i++}`); params.push(data.description); }
  if (data.config !== undefined)      { sets.push(`config = $${i++}::jsonb`); params.push(JSON.stringify(data.config)); }
  if (data.status !== undefined)      { sets.push(`status = $${i++}`);      params.push(data.status); }
  if (data.starts_at !== undefined)   { sets.push(`starts_at = $${i++}`);   params.push(data.starts_at); }
  if (data.ends_at !== undefined)     { sets.push(`ends_at = $${i++}`);     params.push(data.ends_at); }
  if (data.banner_image !== undefined){ sets.push(`banner_image = $${i++}`); params.push(data.banner_image); }

  if (sets.length === 0) return getPromo(id);
  sets.push(`updated_at = NOW()`);
  params.push(id);

  const rows = await query<Promotion>(`
    UPDATE bbdd_shelies.promotions SET ${sets.join(", ")} WHERE id = $${i} RETURNING *
  `, params);
  return rows[0] ?? null;
}

export async function deletePromo(id: number): Promise<boolean> {
  await query(`DELETE FROM bbdd_shelies.promo_participants WHERE promo_id = $1`, [id]);
  const rows = await query(`DELETE FROM bbdd_shelies.promotions WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

/* ── Queries: Participants ── */

export async function getParticipants(promoId: number): Promise<PromoParticipant[]> {
  return query<PromoParticipant>(`
    SELECT * FROM bbdd_shelies.promo_participants WHERE promo_id = $1 ORDER BY created_at DESC
  `, [promoId]);
}

export async function addParticipant(data: {
  promo_id: number; client_name: string; client_phone: string; client_email: string;
  entry_type: string; entry_data: Record<string, unknown>; result?: string;
}): Promise<PromoParticipant> {
  const rows = await query<PromoParticipant>(`
    INSERT INTO bbdd_shelies.promo_participants (promo_id, client_name, client_phone, client_email, entry_type, entry_data, result)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
    RETURNING *
  `, [
    data.promo_id, data.client_name, data.client_phone, data.client_email,
    data.entry_type, JSON.stringify(data.entry_data), data.result ?? "pendiente",
  ]);
  return rows[0];
}

export async function countParticipantsByPhone(promoId: number, phone: string): Promise<number> {
  const row = await queryOne<{ count: string }>(`
    SELECT COUNT(*)::text AS count FROM bbdd_shelies.promo_participants WHERE promo_id = $1 AND client_phone = $2
  `, [promoId, phone]);
  return parseInt(row?.count ?? "0");
}

export async function getNextRifaNumber(promoId: number): Promise<number> {
  const row = await queryOne<{ max_num: string }>(`
    SELECT COALESCE(MAX((entry_data->>'number_assigned')::int), 0)::text AS max_num
    FROM bbdd_shelies.promo_participants WHERE promo_id = $1
  `, [promoId]);
  return parseInt(row?.max_num ?? "0") + 1;
}

export async function drawRifaWinner(promoId: number): Promise<PromoParticipant | null> {
  // Pick random participant who hasn't won yet
  const rows = await query<PromoParticipant>(`
    UPDATE bbdd_shelies.promo_participants
    SET result = 'ganador', entry_data = entry_data || '{"winner": true}'::jsonb
    WHERE id = (
      SELECT id FROM bbdd_shelies.promo_participants
      WHERE promo_id = $1 AND result = 'pendiente'
      ORDER BY RANDOM() LIMIT 1
    )
    RETURNING *
  `, [promoId]);
  return rows[0] ?? null;
}

export async function getLeaderboard(promoId: number): Promise<Array<{ client_name: string; client_phone: string; count: number }>> {
  return query(`
    SELECT client_name, client_phone, COUNT(*)::int AS count
    FROM bbdd_shelies.promo_participants
    WHERE promo_id = $1
    GROUP BY client_name, client_phone
    ORDER BY count DESC
    LIMIT 50
  `, [promoId]);
}
