/**
 * Admin Users DB — tabla bbdd_shelies.admin_users
 * Gestión de agentes/usuarios del panel de administración.
 */
import bcrypt from "bcrypt";
import { query, queryOne } from "./db";

const SALT_ROUNDS = 12;

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "agente" | "estilista" | "especialista" | "colaborador";
  avatar: string;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AdminUserPublic = Omit<AdminUser, "password_hash">;

/* ── Crear tablas si no existen ─────────────────────────────────────────────── */
export async function ensureAdminUsersTables(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.admin_users (
      id             SERIAL PRIMARY KEY,
      name           VARCHAR(255) NOT NULL,
      email          VARCHAR(255) NOT NULL UNIQUE,
      password_hash  VARCHAR(255) NOT NULL,
      role           VARCHAR(50)  NOT NULL DEFAULT 'agente',
      avatar         VARCHAR(10)  NOT NULL DEFAULT '👤',
      phone          VARCHAR(50),
      bio            TEXT,
      is_active      BOOLEAN NOT NULL DEFAULT true,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Insertar usuario admin por defecto si la tabla está vacía
  const existing = await queryOne<{ id: number }>(
    `SELECT id FROM bbdd_shelies.admin_users WHERE email = $1`, ["shelie"]
  );
  if (!existing) {
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD ?? "shelies2026";
    const hashed = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
    await query(`
      INSERT INTO bbdd_shelies.admin_users (name, email, password_hash, role, avatar, is_active)
      VALUES ('Shelie', 'shelie', $1, 'admin', '💎', true)
    `, [hashed]);
  }
}

/* ── CRUD ───────────────────────────────────────────────────────────────────── */
export async function getAdminUsers(): Promise<AdminUserPublic[]> {
  return query<AdminUserPublic>(
    `SELECT id, name, email, role, avatar, phone, bio, is_active, created_at, updated_at
     FROM bbdd_shelies.admin_users ORDER BY id ASC`
  );
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  return queryOne<AdminUser>(
    `SELECT * FROM bbdd_shelies.admin_users WHERE email = $1 AND is_active = true`, [email]
  );
}

export async function createAdminUser(data: {
  name: string; email: string; password: string;
  role: string; avatar: string; phone?: string; bio?: string;
}): Promise<AdminUserPublic> {
  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
  const rows = await query<AdminUserPublic>(`
    INSERT INTO bbdd_shelies.admin_users (name, email, password_hash, role, avatar, phone, bio)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email, role, avatar, phone, bio, is_active, created_at, updated_at
  `, [data.name, data.email, hashed, data.role, data.avatar, data.phone ?? null, data.bio ?? null]);
  return rows[0];
}

export async function updateAdminUser(id: number, data: {
  name?: string; role?: string; avatar?: string;
  phone?: string; bio?: string; password?: string; is_active?: boolean;
}): Promise<AdminUserPublic | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.name      !== undefined) { sets.push(`name = $${i++}`);          values.push(data.name); }
  if (data.role      !== undefined) { sets.push(`role = $${i++}`);          values.push(data.role); }
  if (data.avatar    !== undefined) { sets.push(`avatar = $${i++}`);        values.push(data.avatar); }
  if (data.phone     !== undefined) { sets.push(`phone = $${i++}`);         values.push(data.phone); }
  if (data.bio       !== undefined) { sets.push(`bio = $${i++}`);           values.push(data.bio); }
  if (data.password  !== undefined) {
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    sets.push(`password_hash = $${i++}`);
    values.push(hashed);
  }
  if (data.is_active !== undefined) { sets.push(`is_active = $${i++}`);     values.push(data.is_active); }

  if (sets.length === 0) return null;
  sets.push(`updated_at = NOW()`);
  values.push(id);

  const rows = await query<AdminUserPublic>(`
    UPDATE bbdd_shelies.admin_users SET ${sets.join(", ")}
    WHERE id = $${i}
    RETURNING id, name, email, role, avatar, phone, bio, is_active, created_at, updated_at
  `, values);
  return rows[0] ?? null;
}

export async function deleteAdminUser(id: number): Promise<void> {
  await query(
    `UPDATE bbdd_shelies.admin_users SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]
  );
}

/* ── Auth ───────────────────────────────────────────────────────────────────── */
export async function verifyAdminCredentials(
  email: string, password: string
): Promise<AdminUserPublic | null> {
  await ensureAdminUsersTables();
  const user = await getAdminUserByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;
  const { password_hash, ...pub } = user;
  void password_hash;
  return pub;
}
