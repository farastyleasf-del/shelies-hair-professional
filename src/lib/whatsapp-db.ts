/**
 * WhatsApp DB — tablas shelies.wa_conversations + shelies.wa_messages
 * Persiste conversaciones reales de la API oficial de Meta.
 */
import { query, queryOne } from "./db";

/* ── Tipos ────────────────────────────────────────────────────────────────── */
export interface WaConversation {
  id: string;           // phone number (wa_id)
  contact_name: string;
  contact_phone: string;
  status: "nuevo" | "en_atencion" | "espera_cliente" | "cerrado";
  unread: number;
  last_message: string;
  last_message_at: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaMessage {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_name: string;
  text: string;
  msg_type: string;
  status: string;
  wa_timestamp: number | null;
  created_at: string;
}

/* ── Migrations (create tables if not exists) ─────────────────────────────── */
export async function ensureWaTables(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS shelies.wa_conversations (
      id VARCHAR(50) PRIMARY KEY,
      contact_name VARCHAR(255) NOT NULL DEFAULT '',
      contact_phone VARCHAR(50) NOT NULL DEFAULT '',
      status VARCHAR(50) NOT NULL DEFAULT 'nuevo',
      unread INT NOT NULL DEFAULT 0,
      last_message TEXT NOT NULL DEFAULT '',
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      assigned_to VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS shelies.wa_messages (
      id VARCHAR(255) PRIMARY KEY,
      conversation_id VARCHAR(50) NOT NULL REFERENCES shelies.wa_conversations(id) ON DELETE CASCADE,
      direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
      sender_name VARCHAR(255) NOT NULL DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      msg_type VARCHAR(50) NOT NULL DEFAULT 'text',
      status VARCHAR(50) NOT NULL DEFAULT 'sent',
      wa_timestamp BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/* ── Conversaciones ───────────────────────────────────────────────────────── */
export async function getWaConversations(): Promise<WaConversation[]> {
  return query<WaConversation>(
    `SELECT * FROM shelies.wa_conversations ORDER BY last_message_at DESC`
  );
}

export async function getWaConversation(id: string): Promise<WaConversation | null> {
  return queryOne<WaConversation>(
    `SELECT * FROM shelies.wa_conversations WHERE id = $1`, [id]
  );
}

export async function upsertWaConversation(
  id: string, name: string, phone: string, lastMessage: string, waTimestamp: number
): Promise<void> {
  await query(`
    INSERT INTO shelies.wa_conversations (id, contact_name, contact_phone, last_message, last_message_at, unread, updated_at)
    VALUES ($1, $2, $3, $4, to_timestamp($5), 1, NOW())
    ON CONFLICT (id) DO UPDATE SET
      contact_name = EXCLUDED.contact_name,
      last_message = EXCLUDED.last_message,
      last_message_at = EXCLUDED.last_message_at,
      unread = shelies.wa_conversations.unread + 1,
      updated_at = NOW()
  `, [id, name, phone, lastMessage, waTimestamp]);
}

export async function addOutboundConversation(
  phone: string, text: string
): Promise<void> {
  // Crea la conv si no existe (outbound sin inbound previo)
  await query(`
    INSERT INTO shelies.wa_conversations (id, contact_name, contact_phone, last_message, last_message_at, status)
    VALUES ($1, $1, $1, $2, NOW(), 'en_atencion')
    ON CONFLICT (id) DO UPDATE SET
      last_message = EXCLUDED.last_message,
      last_message_at = NOW(),
      updated_at = NOW()
  `, [phone, text]);
}

export async function markConversationRead(id: string): Promise<void> {
  await query(
    `UPDATE shelies.wa_conversations SET unread = 0, updated_at = NOW() WHERE id = $1`, [id]
  );
}

export async function updateConversationStatus(
  id: string, status: string, assignedTo?: string | null
): Promise<void> {
  if (assignedTo !== undefined) {
    await query(
      `UPDATE shelies.wa_conversations SET status = $1, assigned_to = $2, updated_at = NOW() WHERE id = $3`,
      [status, assignedTo, id]
    );
  } else {
    await query(
      `UPDATE shelies.wa_conversations SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
  }
}

/* ── Mensajes ─────────────────────────────────────────────────────────────── */
export async function getWaMessages(conversationId: string): Promise<WaMessage[]> {
  return query<WaMessage>(
    `SELECT * FROM shelies.wa_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
}

export async function saveWaMessage(msg: Omit<WaMessage, "created_at">): Promise<void> {
  await query(`
    INSERT INTO shelies.wa_messages (id, conversation_id, direction, sender_name, text, msg_type, status, wa_timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [msg.id, msg.conversation_id, msg.direction, msg.sender_name, msg.text, msg.msg_type, msg.status, msg.wa_timestamp]);
}
