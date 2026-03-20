/**
 * WhatsApp Webhook — Meta Cloud API
 *
 * GET  /api/whatsapp/webhook  → verificación del webhook (Meta llama esto al registrar)
 * POST /api/whatsapp/webhook  → mensajes entrantes de WhatsApp
 *
 * Configura en Meta Business Manager:
 *   URL: https://spa-eta-ten.vercel.app/api/whatsapp/webhook
 *   Token de verificación: valor de env WHATSAPP_VERIFY_TOKEN
 *   Campos suscritos: messages
 */
import { NextRequest, NextResponse } from "next/server";
import {
  ensureWaTables, upsertWaConversation, saveWaMessage,
} from "@/lib/whatsapp-db";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "shelies_wa_2026";

/* ── GET: verificación de webhook ── */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/* ── POST: mensajes entrantes ── */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Asegurar que las tablas existen (idempotente)
    await ensureWaTables();

    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const value = change?.value;
        if (!value?.messages) continue;

        const contacts: Array<{ wa_id: string; profile: { name: string } }> =
          value.contacts ?? [];

        for (const msg of value.messages) {
          // Solo procesamos mensajes de texto por ahora
          if (msg.type !== "text") continue;

          const phone     = msg.from as string;
          const text      = (msg.text?.body ?? "") as string;
          const msgId     = msg.id as string;
          const timestamp = parseInt(msg.timestamp as string, 10);

          const contact  = contacts.find((c) => c.wa_id === phone);
          const name     = contact?.profile?.name ?? phone;

          // Upsert conversación
          await upsertWaConversation(phone, name, phone, text, timestamp);

          // Guardar mensaje
          await saveWaMessage({
            id:              msgId,
            conversation_id: phone,
            direction:       "inbound",
            sender_name:     name,
            text,
            msg_type:        "text",
            status:          "received",
            wa_timestamp:    timestamp,
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[WA webhook]", err);
    // Siempre respondemos 200 a Meta para que no retire el webhook
    return NextResponse.json({ status: "error" });
  }
}
