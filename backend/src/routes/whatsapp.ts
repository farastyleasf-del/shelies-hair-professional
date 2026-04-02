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
  } else if (!mode && !token && !challenge) {
    // Visita directa sin parámetros — responder 200 para no bloquear Meta
    res.status(200).send("OK");
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

/* ── Send message (text o imagen) ── */
router.post("/send", async (req: Request, res: Response) => {
  const { phone, text, imageUrl, agentName } = req.body as {
    phone: string; text?: string; imageUrl?: string; agentName?: string;
  };

  if (!phone || (!text && !imageUrl)) {
    res.status(400).json({ error: "phone y text (o imageUrl) son requeridos" });
    return;
  }

  const token         = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    res.status(503).json({ error: "WhatsApp no configurado. Agrega WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID." });
    return;
  }

  try {
    const isImage = !!imageUrl;
    const payload = isImage
      ? { messaging_product: "whatsapp", to: phone, type: "image", image: { link: imageUrl, caption: text ?? "" } }
      : { messaging_product: "whatsapp", to: phone, type: "text", text: { body: text! } };

    const metaRes = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const metaData = await metaRes.json() as {
      messages?: Array<{ id: string }>; error?: { message: string };
    };
    if (!metaRes.ok) {
      res.status(502).json({ error: metaData.error?.message ?? "Error al enviar" });
      return;
    }
    const msgId   = metaData.messages?.[0]?.id ?? `out-${Date.now()}`;
    const msgText = isImage ? `📷 ${text ?? "Imagen"}` : text!;
    await ensureWaTables();
    await addOutboundConversation(phone, msgText);
    await saveWaMessage({
      id: msgId, conversation_id: phone, direction: "outbound",
      sender_name: agentName ?? "Shelie Admin", text: msgText,
      msg_type: isImage ? "image" : "text",
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

export default router;
