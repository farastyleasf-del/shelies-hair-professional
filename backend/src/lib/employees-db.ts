/**
 * Employees DB — Tabla HC (headcount) + sesiones de agentes
 * bbdd_shelies.employees + bbdd_shelies.agent_sessions
 */
import bcrypt from "bcrypt";
import { query, queryOne } from "./db";

const SALT_ROUNDS = 12;

/* ──────────────────────────────────────────────────────────
   TIPOS
────────────────────────────────────────────────────────── */
export interface Employee {
  id: number;
  cedula: string;
  name: string;
  cargo: "estilista" | "call_center" | "admin";
  site: string;
  email: string;
  phone: string | null;
  status: "activo" | "inactivo";
  fecha_ingreso: string | null;
  admin_user_id: number | null;
  username: string | null;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentSession {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  session_date: string;
}

/* ──────────────────────────────────────────────────────────
   CREAR TABLAS
────────────────────────────────────────────────────────── */
export async function initEmployeesTables(): Promise<void> {
  // Tabla employees
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.employees (
      id             SERIAL PRIMARY KEY,
      cedula         VARCHAR(30) UNIQUE NOT NULL,
      name           VARCHAR(255) NOT NULL,
      cargo          VARCHAR(50) NOT NULL DEFAULT 'estilista',
      site           VARCHAR(50) NOT NULL DEFAULT 'SUR',
      email          VARCHAR(255),
      phone          VARCHAR(50),
      status         VARCHAR(20) NOT NULL DEFAULT 'activo',
      fecha_ingreso  DATE,
      admin_user_id  INT REFERENCES bbdd_shelies.admin_users(id) ON DELETE SET NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Tabla sesiones de agentes (adherencia)
  await query(`
    CREATE TABLE IF NOT EXISTS bbdd_shelies.agent_sessions (
      id               SERIAL PRIMARY KEY,
      user_id          INT NOT NULL,
      user_name        VARCHAR(255) NOT NULL,
      user_email       VARCHAR(255) NOT NULL,
      started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at         TIMESTAMPTZ,
      duration_minutes INT,
      session_date     DATE NOT NULL DEFAULT CURRENT_DATE
    )
  `);

  // ── Migraciones de columnas ──────────────────────────────
  await query(`ALTER TABLE bbdd_shelies.employees ADD COLUMN IF NOT EXISTS username      VARCHAR(255)`, []);
  await query(`ALTER TABLE bbdd_shelies.employees ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`, []);

  // Seed HC del Excel si la tabla está vacía
  await seedEmployees();

  // Sincronizar username desde admin_users (para empleados ya existentes)
  await query(`
    UPDATE bbdd_shelies.employees e
    SET username = u.email, updated_at = NOW()
    FROM bbdd_shelies.admin_users u
    WHERE e.admin_user_id = u.id AND e.username IS NULL
  `, []);

  // Superusuario johan.castro — acceso a todos los módulos
  await ensureSuperUser();
}

/* ──────────────────────────────────────────────────────────
   SEED DESDE EXCEL HC (1)(1).xlsx
────────────────────────────────────────────────────────── */
async function seedEmployees(): Promise<void> {
  const existing = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM bbdd_shelies.employees`, []
  );
  if (existing && parseInt(existing.count) > 0) return;

  const HC: Array<{
    cedula: string; name: string; cargo: string;
    site: string; email: string; phone: string; status: string; fecha_ingreso: string | null;
  }> = [
    // ESTILISTAS (9)
    { cedula: "1007718814", name: "Angie Melisa Orozco Ramirez",     cargo: "estilista",   site: "SUR", email: "mellysa048@gmail.com",         phone: "3057958042", status: "activo", fecha_ingreso: null },
    { cedula: "1000223108", name: "Yenifer Cogollo Chaparro",        cargo: "estilista",   site: "SUR", email: "jenlo.9524@gmail.com",          phone: "3217961893", status: "activo", fecha_ingreso: null },
    { cedula: "1001276388", name: "Nicol Dayana Beltran Neuta",      cargo: "estilista",   site: "SUR", email: "dayanabeltran344@gmail.com",    phone: "3223751137", status: "activo", fecha_ingreso: null },
    { cedula: "1233900697", name: "Francy Camila Benavides Suarez",  cargo: "estilista",   site: "SUR", email: "camilabenavides65@gmail.com",   phone: "3132067953", status: "activo", fecha_ingreso: null },
    { cedula: "1013597403", name: "Gilliane Samantha Quiroga Cañon", cargo: "estilista",   site: "SUR", email: "samanthaquiroga.04@gmail.com",  phone: "3222837449", status: "activo", fecha_ingreso: null },
    { cedula: "1013633771", name: "Deisy Carolina Ducon Niño",       cargo: "estilista",   site: "SUR", email: "shijiro-17@hotmail.com",        phone: "3203513452", status: "activo", fecha_ingreso: null },
    { cedula: "1049606614", name: "Derly Adriana Perez Rodriguez",   cargo: "estilista",   site: "SUR", email: "derly7843@gmail.com",           phone: "3136741136", status: "activo", fecha_ingreso: null },
    { cedula: "1000463061", name: "Angie Tatiana Infante Torres",    cargo: "estilista",   site: "SUR", email: "infante.angie2024@gmail.com",   phone: "3144117515", status: "activo", fecha_ingreso: null },
    { cedula: "1031125880", name: "Cindy Milena Cardenas Obando",    cargo: "estilista",   site: "SUR", email: "cindykmyle@hotmail.com",        phone: "3124401516", status: "activo", fecha_ingreso: null },
    // CALL CENTER (2)
    { cedula: "79436498",   name: "Rigo Armando Jimenez",            cargo: "call_center", site: "SUR", email: "rigarjim67@hotmail.com",        phone: "3507139817", status: "activo", fecha_ingreso: null },
    { cedula: "1015438272", name: "Katherine Mesa Patiño",           cargo: "call_center", site: "SUR", email: "katamesapat29@gmail.com",       phone: "3193482051", status: "activo", fecha_ingreso: null },
  ];

  for (const emp of HC) {
    await query(`
      INSERT INTO bbdd_shelies.employees (cedula, name, cargo, site, email, phone, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (cedula) DO NOTHING
    `, [emp.cedula, emp.name, emp.cargo, emp.site, emp.email, emp.phone, emp.status]);
  }

  // Crear todos los usuarios del sistema con contraseña hasheada
  const sharedPw = process.env.SHARED_EMPLOYEE_PASSWORD ?? "shelies2026";
  const hashed = await bcrypt.hash(sharedPw, SALT_ROUNDS);

  const seedUsers: Array<[string, string, string, string]> = [
    ["Shelie",           "shelie",             "admin",     "💎"],
    ["Rigo Jimenez",     "rigo.jimenez",       "agente",    "💬"],
    ["Katherine Mesa",   "katherine.mesa",     "agente",    "💬"],
    ["Angie Orozco",     "angie.orozco",       "estilista", "✂️"],
    ["Yenifer Cogollo",  "yenifer.cogollo",    "estilista", "✂️"],
    ["Nicol Beltran",    "nicol.beltran",      "estilista", "✂️"],
    ["Francy Benavides", "francy.benavides",   "estilista", "✂️"],
    ["Gilliane Quiroga", "gilliane.quiroga",   "estilista", "✂️"],
    ["Deisy Ducon",      "deisy.ducon",        "estilista", "✂️"],
    ["Derly Perez",      "derly.perez",        "estilista", "✂️"],
    ["Angie Infante",    "angie.infante",      "estilista", "✂️"],
    ["Cindy Cardenas",   "cindy.cardenas",     "estilista", "✂️"],
  ];
  for (const [name, email, role, avatar] of seedUsers) {
    await query(`
      INSERT INTO bbdd_shelies.admin_users (name, email, password_hash, role, avatar, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (email) DO NOTHING
    `, [name, email, hashed, role, avatar]);
  }

  // Vincular admin_user_id en employees por cédula
  const linkMap: Array<{ cedula: string; username: string }> = [
    { cedula: "79436498",   username: "rigo.jimenez"    },
    { cedula: "1015438272", username: "katherine.mesa"  },
    { cedula: "1007718814", username: "angie.orozco"    },
    { cedula: "1000223108", username: "yenifer.cogollo" },
    { cedula: "1001276388", username: "nicol.beltran"   },
    { cedula: "1233900697", username: "francy.benavides"},
    { cedula: "1013597403", username: "gilliane.quiroga"},
    { cedula: "1013633771", username: "deisy.ducon"     },
    { cedula: "1049606614", username: "derly.perez"     },
    { cedula: "1000463061", username: "angie.infante"   },
    { cedula: "1031125880", username: "cindy.cardenas"  },
  ];
  for (const { cedula, username } of linkMap) {
    await query(`
      UPDATE bbdd_shelies.employees e
      SET admin_user_id = u.id, updated_at = NOW()
      FROM bbdd_shelies.admin_users u
      WHERE e.cedula = $1 AND u.email = $2
    `, [cedula, username]);
  }
}

/* ──────────────────────────────────────────────────────────
   SUPERUSUARIO
────────────────────────────────────────────────────────── */
async function ensureSuperUser(): Promise<void> {
  const SUPER_USER   = process.env.SUPER_USER_USERNAME ?? "johan.castro";
  const SUPER_PASS   = process.env.SUPER_USER_PASSWORD ?? "johan159";
  const SUPER_NAME   = process.env.SUPER_USER_NAME     ?? "Johan Castro";
  const SUPER_CEDULA = "SUPER001";

  const hashed = await bcrypt.hash(SUPER_PASS, SALT_ROUNDS);

  // Entrada en admin_users (para el panel /admin)
  await query(`
    INSERT INTO bbdd_shelies.admin_users (name, email, password_hash, role, avatar, is_active)
    VALUES ($1, $2, $3, 'admin', '👑', true)
    ON CONFLICT (email) DO UPDATE SET
      name          = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role          = 'admin',
      is_active     = true,
      updated_at    = NOW()
  `, [SUPER_NAME, SUPER_USER, hashed]);

  // Entrada en employees (para /estilista y /domiciliario)
  await query(`
    INSERT INTO bbdd_shelies.employees
      (cedula, name, cargo, site, email, username, password_hash, status)
    VALUES ($1, $2, 'admin', 'SUR', $3, $3, $4, 'activo')
    ON CONFLICT (cedula) DO UPDATE SET
      name          = EXCLUDED.name,
      username      = EXCLUDED.username,
      password_hash = EXCLUDED.password_hash,
      status        = 'activo',
      updated_at    = NOW()
  `, [SUPER_CEDULA, SUPER_NAME, SUPER_USER, hashed]);

  console.log(`[employees] superusuario ${SUPER_USER} listo`);
}

/* ──────────────────────────────────────────────────────────
   CRUD EMPLOYEES
────────────────────────────────────────────────────────── */
export async function getEmployees(cargo?: string): Promise<Employee[]> {
  if (cargo) {
    return query<Employee>(
      `SELECT * FROM bbdd_shelies.employees WHERE cargo = $1 ORDER BY name ASC`, [cargo]
    );
  }
  return query<Employee>(`SELECT * FROM bbdd_shelies.employees ORDER BY cargo, name ASC`);
}

export async function getEmployee(id: number): Promise<Employee | null> {
  return queryOne<Employee>(`SELECT * FROM bbdd_shelies.employees WHERE id = $1`, [id]);
}

export async function getEmployeeByUsername(username: string): Promise<Employee | null> {
  return queryOne<Employee>(`SELECT * FROM bbdd_shelies.employees WHERE username = $1 AND status = 'activo'`, [username]);
}

export async function updateEmployee(id: number, data: Partial<Employee>): Promise<Employee | null> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (data.name   !== undefined) { sets.push(`name=$${i++}`);   vals.push(data.name); }
  if (data.status !== undefined) { sets.push(`status=$${i++}`); vals.push(data.status); }
  if (data.phone  !== undefined) { sets.push(`phone=$${i++}`);  vals.push(data.phone); }
  if (data.site   !== undefined) { sets.push(`site=$${i++}`);   vals.push(data.site); }
  if (sets.length === 0) return null;
  sets.push(`updated_at=NOW()`);
  vals.push(id);
  const rows = await query<Employee>(
    `UPDATE bbdd_shelies.employees SET ${sets.join(",")} WHERE id=$${i} RETURNING *`, vals
  );
  return rows[0] ?? null;
}

/* ──────────────────────────────────────────────────────────
   SESIONES DE AGENTES
────────────────────────────────────────────────────────── */
export async function startSession(userId: number, userName: string, userEmail: string): Promise<AgentSession> {
  // Cerrar sesión previa abierta si existe
  await query(`
    UPDATE bbdd_shelies.agent_sessions
    SET ended_at = NOW(),
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at))::int / 60
    WHERE user_id = $1 AND ended_at IS NULL
  `, [userId]);

  const rows = await query<AgentSession>(`
    INSERT INTO bbdd_shelies.agent_sessions (user_id, user_name, user_email)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [userId, userName, userEmail]);
  return rows[0];
}

export async function endSession(userId: number): Promise<AgentSession | null> {
  const rows = await query<AgentSession>(`
    UPDATE bbdd_shelies.agent_sessions
    SET ended_at = NOW(),
        duration_minutes = GREATEST(1, EXTRACT(EPOCH FROM (NOW() - started_at))::int / 60)
    WHERE user_id = $1 AND ended_at IS NULL
    RETURNING *
  `, [userId]);
  return rows[0] ?? null;
}

export async function getSessionsToday(): Promise<AgentSession[]> {
  return query<AgentSession>(`
    SELECT * FROM bbdd_shelies.agent_sessions
    WHERE session_date = CURRENT_DATE
    ORDER BY started_at DESC
  `);
}

export async function getSessionStats(days = 7): Promise<Array<{
  user_name: string; user_email: string; session_date: string;
  sessions: string; total_minutes: string;
}>> {
  return query(`
    SELECT user_name, user_email, session_date::text,
           COUNT(*)::text AS sessions,
           COALESCE(SUM(duration_minutes), 0)::text AS total_minutes
    FROM bbdd_shelies.agent_sessions
    WHERE session_date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY user_name, user_email, session_date
    ORDER BY session_date DESC, user_name ASC
  `);
}

export async function getChatStats(days = 7): Promise<Array<{
  sender_name: string; session_date: string;
  conversations: string; messages_sent: string;
}>> {
  return query(`
    SELECT
      m.sender_name,
      DATE(m.created_at)::text AS session_date,
      COUNT(DISTINCT m.conversation_id)::text AS conversations,
      COUNT(*)::text AS messages_sent
    FROM bbdd_shelies.wa_messages m
    WHERE m.direction = 'outbound'
      AND m.created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY m.sender_name, DATE(m.created_at)
    ORDER BY session_date DESC, m.sender_name ASC
  `);
}

