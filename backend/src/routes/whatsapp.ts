import { Router, Request, Response } from "express";
import {
  ensureWaTables, upsertWaConversation, saveWaMessage,
  getWaConversations, getWaConversation, getWaMessages,
  markConversationRead, updateConversationStatus,
  addOutboundConversation,
} from "../lib/whatsapp-db";

const router = Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "shelies_wa_2026";
const META_API_VERSION = "v19.0";

/* ── Webhook GET: verificación Meta ── */
router.get("/webhook", (req: Request, res: Response) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
});

/* ── Webhook POST: mensajes entrantes ── */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    await ensureWaTables();
    const entries = req.body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value;
        if (!value?.messages) continue;
        const contacts: Array<{ wa_id: string; profile: { name: string } }> = value.contacts ?? [];
        for (const msg of value.messages) {
          if (msg.type !== "text") continue;
          const phone     = msg.from as string;
          const text      = (msg.text?.body ?? "") as string;
          const msgId     = msg.id as string;
          const timestamp = parseInt(msg.timestamp as string, 10);
          const contact   = contacts.find((c) => c.wa_id === phone);
          const name      = contact?.profile?.name ?? phone;
          await upsertWaConversation(phone, name, phone, text, timestamp);
          await saveWaMessage({
            id: msgId, conversation_id: phone, direction: "inbound",
            sender_name: name, text, msg_type: "text",
            status: "received", wa_timestamp: timestamp,
          });
        }
      }
    }
    res.json({ status: "ok" });
  } catch (err) {
    console.error("[WA webhook]", err);
    res.json({ status: "error" }); // 200 siempre para Meta
  }
});

/* ── Send message ── */
router.post("/send", async (req: Request, res: Response) => {
  const { phone, text, agentName } = req.body as {
    phone: string; text: string; agentName?: string;
  };

  if (!phone || !text) {
    res.status(400).json({ error: "phone y text son requeridos" });
    return;
  }

  const token         = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    res.status(503).json({ error: "WhatsApp no configurado. Agrega WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID." });
    return;
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } }),
      }
    );
    const metaData = await metaRes.json() as {
      messages?: Array<{ id: string }>; error?: { message: string };
    };
    if (!metaRes.ok) {
      res.status(502).json({ error: metaData.error?.message ?? "Error al enviar" });
      return;
    }
    const msgId = metaData.messages?.[0]?.id ?? `out-${Date.now()}`;
    await ensureWaTables();
    await addOutboundConversation(phone, text);
    await saveWaMessage({
      id: msgId, conversation_id: phone, direction: "outbound",
      sender_name: agentName ?? "Shelie Admin", text, msg_type: "text",
      status: "sent", wa_timestamp: Math.floor(Date.now() / 1000),
    });
    res.json({ status: "sent", messageId: msgId });
  } catch (err) {
    console.error("[WA send]", err);
    res.status(500).json({ error: "Error interno" });
  }
});

/* ── Conversations list / detail ── */
router.get("/conversations", async (req: Request, res: Response) => {
  try {
    await ensureWaTables();
    const id = req.query.id as string | undefined;
    if (id) {
      const conv = await getWaConversation(id);
      if (!conv) { res.json(null); return; }
      const messages = await getWaMessages(id);
      res.json({ conversation: conv, messages });
    } else {
      res.json(await getWaConversations());
    }
  } catch (err) {
    console.error("[WA conversations GET]", err);
    res.json([]);
  }
});

/* ── Conversations update ── */
router.patch("/conversations", async (req: Request, res: Response) => {
  try {
    const { id, action, status, assignedTo } = req.body as {
      id: string; action: string; status?: string; assignedTo?: string | null;
    };
    await ensureWaTables();
    if (action === "read") await markConversationRead(id);
    else if (action === "status" && status) await updateConversationStatus(id, status, assignedTo);
    else if (action === "assign") await updateConversationStatus(id, "en_atencion", assignedTo ?? null);
    res.json({ ok: true });
  } catch (err) {
    console.error("[WA conversations PATCH]", err);
    res.status(500).json({ error: "Error" });
  }
});

/* ── Test/seed WA messages ── */
const TEST_NUMBERS = [
  { phone: "573001234567", name: "María García", text: "Hola, ¿tienen disponibilidad para alisado el viernes?" },
  { phone: "573157654321", name: "Laura Martínez", text: "Buenas tardes, quiero agendar un botox capilar" },
  { phone: "573209876543", name: "Valentina López", text: "Hola! ¿Cuánto vale la terapia de reconstrucción?" },
  { phone: "573124567890", name: "Sofía Ramírez", text: "Necesito información sobre el alisado permanente" },
  { phone: "573312345678", name: "Camila Torres", text: "Buenos días, ¿trabajan los domingos?" },
];

router.post("/test", async (req: Request, res: Response) => {
  const force = req.query.force === "true";
  const hasToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
  if (hasToken && !force) {
    res.status(403).json({ error: "Modo test desactivado en producción. Usa ?force=true" });
    return;
  }
  try {
    await ensureWaTables();
    const { all, phone, name, text } = req.body as {
      all?: boolean; phone?: string; name?: string; text?: string;
    };
    if (all) {
      for (const t of TEST_NUMBERS) {
        const ts = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600);
        await upsertWaConversation(t.phone, t.name, t.phone, t.text, ts);
        await saveWaMessage({
          id: `test-${t.phone}-${Date.now()}`, conversation_id: t.phone,
          direction: "inbound", sender_name: t.name, text: t.text,
          msg_type: "text", status: "received", wa_timestamp: ts,
        });
      }
      res.json({ ok: true, seeded: TEST_NUMBERS.length });
    } else {
      const demo = TEST_NUMBERS[Math.floor(Math.random() * TEST_NUMBERS.length)];
      const p = phone ?? demo.phone;
      const n = name  ?? demo.name;
      const tx = text ?? demo.text;
      const ts = Math.floor(Date.now() / 1000);
      await upsertWaConversation(p, n, p, tx, ts);
      await saveWaMessage({
        id: `test-${p}-${ts}`, conversation_id: p,
        direction: "inbound", sender_name: n, text: tx,
        msg_type: "text", status: "received", wa_timestamp: ts,
      });
      res.json({ ok: true, phone: p, name: n, text: tx });
    }
  } catch (err) {
    console.error("[WA test]", err);
    res.status(500).json({ error: "Error al insertar mensaje de prueba" });
  }
});

export default router;
