/**
 * POST /api/whatsapp/send
 *
 * Body: { phone: string, text: string, agentName?: string }
 *
 * Envía un mensaje de texto por la API oficial de Meta y lo guarda en DB.
 * Requiere:
 *   WHATSAPP_ACCESS_TOKEN   — Token de acceso permanente de Meta
 *   WHATSAPP_PHONE_NUMBER_ID — ID del número de teléfono en Meta Business
 */
import { NextRequest, NextResponse } from "next/server";
import {
  ensureWaTables, addOutboundConversation, saveWaMessage,
} from "@/lib/whatsapp-db";

const META_API_VERSION = "v19.0";

export async function POST(request: NextRequest) {
  const { phone, text, agentName } = await request.json() as {
    phone: string;
    text: string;
    agentName?: string;
  };

  if (!phone || !text) {
    return NextResponse.json({ error: "phone y text son requeridos" }, { status: 400 });
  }

  const token         = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      { error: "WhatsApp no configurado. Agrega WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID en las variables de entorno." },
      { status: 503 }
    );
  }

  try {
    // Enviar por Meta Cloud API
    const metaRes = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const metaData = await metaRes.json() as {
      messages?: Array<{ id: string }>;
      error?: { message: string };
    };

    if (!metaRes.ok) {
      console.error("[WA send] Meta error:", metaData);
      return NextResponse.json(
        { error: metaData.error?.message ?? "Error al enviar" },
        { status: 502 }
      );
    }

    const msgId = metaData.messages?.[0]?.id ?? `out-${Date.now()}`;

    // Persistir en DB
    await ensureWaTables();
    await addOutboundConversation(phone, text);
    await saveWaMessage({
      id:              msgId,
      conversation_id: phone,
      direction:       "outbound",
      sender_name:     agentName ?? "Shelie Admin",
      text,
      msg_type:        "text",
      status:          "sent",
      wa_timestamp:    Math.floor(Date.now() / 1000),
    });

    return NextResponse.json({ status: "sent", messageId: msgId });
  } catch (err) {
    console.error("[WA send]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
