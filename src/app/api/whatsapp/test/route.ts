/**
 * POST /api/whatsapp/test
 * Simula la llegada de un mensaje de WhatsApp para pruebas.
 * Solo disponible cuando WHATSAPP_ACCESS_TOKEN no está configurado
 * o cuando se pasa ?force=true.
 *
 * Body: { phone?: string, name?: string, text?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { ensureWaTables, upsertWaConversation, saveWaMessage } from "@/lib/whatsapp-db";

const TEST_NUMBERS = [
  { phone: "573001234567", name: "María García", text: "Hola, ¿tienen disponibilidad para alisado el viernes?" },
  { phone: "573157654321", name: "Laura Martínez", text: "Buenas tardes, quiero agendar un botox capilar" },
  { phone: "573209876543", name: "Valentina López", text: "Hola! ¿Cuánto vale la terapia de reconstrucción?" },
  { phone: "573124567890", name: "Sofía Ramírez", text: "Necesito información sobre el alisado permanente" },
  { phone: "573312345678", name: "Camila Torres", text: "Buenos días, ¿trabajan los domingos?" },
];

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  // Bloquear en producción con token real (a menos que se fuerce)
  const hasToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
  if (hasToken && !force) {
    return NextResponse.json({ error: "Modo test desactivado en producción. Usa ?force=true" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({})) as {
      phone?: string; name?: string; text?: string; all?: boolean;
    };

    await ensureWaTables();

    if (body.all) {
      // Insertar todos los mensajes de prueba
      for (const t of TEST_NUMBERS) {
        const ts = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600);
        await upsertWaConversation(t.phone, t.name, t.phone, t.text, ts);
        await saveWaMessage({
          id: `test-${t.phone}-${Date.now()}`,
          conversation_id: t.phone,
          direction: "inbound",
          sender_name: t.name,
          text: t.text,
          msg_type: "text",
          status: "received",
          wa_timestamp: ts,
        });
      }
      return NextResponse.json({ ok: true, seeded: TEST_NUMBERS.length });
    }

    // Mensaje personalizado o uno aleatorio
    const demo = TEST_NUMBERS[Math.floor(Math.random() * TEST_NUMBERS.length)];
    const phone = body.phone ?? demo.phone;
    const name  = body.name  ?? demo.name;
    const text  = body.text  ?? demo.text;
    const ts    = Math.floor(Date.now() / 1000);

    await upsertWaConversation(phone, name, phone, text, ts);
    await saveWaMessage({
      id: `test-${phone}-${ts}`,
      conversation_id: phone,
      direction: "inbound",
      sender_name: name,
      text,
      msg_type: "text",
      status: "received",
      wa_timestamp: ts,
    });

    return NextResponse.json({ ok: true, phone, name, text });
  } catch (err) {
    console.error("[WA test]", err);
    return NextResponse.json({ error: "Error al insertar mensaje de prueba" }, { status: 500 });
  }
}
