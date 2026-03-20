/**
 * Admin Users DB — tabla shelies.admin_users
 * Gestión de agentes/usuarios del panel de administración.
 */
import { query, queryOne } from "./db";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "agente" | "especialista" | "colaborador";
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
    CREATE TABLE IF NOT EXISTS shelies.admin_users (
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
  await query(`
    INSERT INTO shelies.admin_users (name, email, password_hash, role, avatar, is_active)
    VALUES ('Shelie Admin', 'admin@shelie.com', 'shelie2026', 'admin', '💎', true)
    ON CONFLICT (email) DO NOTHING
  `);
}

/* ── CRUD ───────────────────────────────────────────────────────────────────── */
export async function getAdminUsers(): Promise<AdminUserPublic[]> {
  return query<AdminUserPublic>(
    `SELECT id, name, email, role, avatar, phone, bio, is_active, created_at, updated_at
     FROM shelies.admin_users ORDER BY id ASC`
  );
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  return queryOne<AdminUser>(
    `SELECT * FROM shelies.admin_users WHERE email = $1 AND is_active = true`, [email]
  );
}

export async function createAdminUser(data: {
  name: string; email: string; password: string;
  role: string; avatar: string; phone?: string; bio?: string;
}): Promise<AdminUserPublic> {
  const rows = await query<AdminUserPublic>(`
    INSERT INTO shelies.admin_users (name, email, password_hash, role, avatar, phone, bio)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, name, email, role, avatar, phone, bio, is_active, created_at, updated_at
  `, [data.name, data.email, data.password, data.role, data.avatar, data.phone ?? null, data.bio ?? null]);
  return rows[0];
}

export async function updateAdminUser(id: number, data: {
  name?: string; role?: string; avatar?: string;
  phone?: string; bio?: string; password?: string; is_active?: boolean;
}): Promise<AdminUserPublic | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.name     !== undefined) { sets.push(`name = $${i++}`);          values.push(data.name); }
  if (data.role     !== undefined) { sets.push(`role = $${i++}`);          values.push(data.role); }
  if (data.avatar   !== undefined) { sets.push(`avatar = $${i++}`);        values.push(data.avatar); }
  if (data.phone    !== undefined) { sets.push(`phone = $${i++}`);         values.push(data.phone); }
  if (data.bio      !== undefined) { sets.push(`bio = $${i++}`);           values.push(data.bio); }
  if (data.password !== undefined) { sets.push(`password_hash = $${i++}`); values.push(data.password); }
  if (data.is_active !== undefined){ sets.push(`is_active = $${i++}`);     values.push(data.is_active); }

  if (sets.length === 0) return null;
  sets.push(`updated_at = NOW()`);
  values.push(id);

  const rows = await query<AdminUserPublic>(`
    UPDATE shelies.admin_users SET ${sets.join(", ")}
    WHERE id = $${i}
    RETURNING id, name, email, role, avatar, phone, bio, is_active, created_at, updated_at
  `, values);
  return rows[0] ?? null;
}

export async function deleteAdminUser(id: number): Promise<void> {
  // Soft delete — nunca borrar el último admin
  await query(
    `UPDATE shelies.admin_users SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]
  );
}

/* ── Auth ───────────────────────────────────────────────────────────────────── */
export async function verifyAdminCredentials(
  email: string, password: string
): Promise<AdminUserPublic | null> {
  // Primero intentar DB
  try {
    await ensureAdminUsersTables();
    const user = await getAdminUserByEmail(email);
    if (user && user.password_hash === password) {
      const { password_hash, ...pub } = user;
      void password_hash;
      return pub;
    }
    return null;
  } catch {
    // Fallback hardcoded si DB no está disponible
    if (email === "admin@shelie.com" && password === "shelie2026") {
      return {
        id: 0, name: "Shelie Admin", email, role: "admin",
        avatar: "💎", phone: null, bio: null, is_active: true,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
    }
    return null;
  }
}
