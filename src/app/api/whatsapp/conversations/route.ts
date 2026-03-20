/**
 * GET  /api/whatsapp/conversations          → lista todas las conversaciones
 * GET  /api/whatsapp/conversations?id=phone → conversación + mensajes
 * PATCH /api/whatsapp/conversations         → actualizar estado / marcar leído / asignar
 */
import { NextRequest, NextResponse } from "next/server";
import {
  ensureWaTables,
  getWaConversations,
  getWaConversation,
  getWaMessages,
  markConversationRead,
  updateConversationStatus,
} from "@/lib/whatsapp-db";

export async function GET(request: NextRequest) {
  try {
    await ensureWaTables();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const conv = await getWaConversation(id);
      if (!conv) return NextResponse.json(null);
      const messages = await getWaMessages(id);
      return NextResponse.json({ conversation: conv, messages });
    }

    const conversations = await getWaConversations();
    return NextResponse.json(conversations);
  } catch (err) {
    console.error("[WA conversations GET]", err);
    return NextResponse.json([], { status: 200 }); // falla silenciosa para el cliente
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as {
      id: string;
      action: "read" | "status" | "assign";
      status?: string;
      assignedTo?: string | null;
    };

    await ensureWaTables();

    if (body.action === "read") {
      await markConversationRead(body.id);
    } else if (body.action === "status" && body.status) {
      await updateConversationStatus(body.id, body.status, body.assignedTo);
    } else if (body.action === "assign") {
      await updateConversationStatus(body.id, "en_atencion", body.assignedTo ?? null);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WA conversations PATCH]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
