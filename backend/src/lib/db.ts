/**
 * Conexión a PostgreSQL — schema shelies
 * Host: pgadmin.asf.company:6432 (PgBouncer)
 */
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;

/**
 * Garantiza que el schema bbdd_shelies exista dentro de la base de datos activa.
 * Debe llamarse una sola vez al arrancar, antes de cualquier CREATE TABLE.
 */
export async function ensureSchema(): Promise<void> {
  await pool.query("CREATE SCHEMA IF NOT EXISTS bbdd_shelies");
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
