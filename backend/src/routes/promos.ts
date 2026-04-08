/**
 * Promociones, Rifas y Concursos — API Routes
 * Público: GET /, GET /:id, POST /:id/enter, GET /:id/leaderboard
 * Admin:   GET /all, POST /, PATCH /:id, DELETE /:id, GET /:id/participants, POST /:id/draw
 */
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getActivePromos, getAllPromos, getPromo, createPromo, updatePromo, deletePromo,
  getParticipants, addParticipant, countParticipantsByPhone, getNextRifaNumber,
  drawRifaWinner, getLeaderboard,
} from "../lib/promos-db";

const router = Router();

/* ═══════ ADMIN ENDPOINTS that must come before /:id ═══════ */

/* GET /all — todas las promos (admin) */
router.get("/all", requireAuth, async (_req: Request, res: Response) => {
  try {
    res.json(await getAllPromos());
  } catch (err) {
    console.error("[promos GET /all]", err);
    res.status(500).json({ error: "Error al obtener promos" });
  }
});

/* ═══════ PUBLIC ENDPOINTS ═══════ */

/* GET / — promos activas */
router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await getActivePromos());
  } catch (err) {
    console.error("[promos GET /]", err);
    res.status(500).json({ error: "Error al obtener promos" });
  }
});

/* GET /:id — detalle */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const promo = await getPromo(id);
    if (!promo) { res.status(404).json({ error: "Promo no encontrada" }); return; }
    res.json(promo);
  } catch (err) {
    console.error("[promos GET /:id]", err);
    res.status(500).json({ error: "Error al obtener promo" });
  }
});

/* GET /:id/leaderboard — ranking para concurso_metricas */
router.get("/:id/leaderboard", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    res.json(await getLeaderboard(id));
  } catch (err) {
    console.error("[promos leaderboard]", err);
    res.status(500).json({ error: "Error al obtener leaderboard" });
  }
});

/* POST /:id/enter — participar */
router.post("/:id/enter", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

    const promo = await getPromo(id);
    if (!promo) { res.status(404).json({ error: "Promo no encontrada" }); return; }
    if (promo.status !== "activa") { res.status(400).json({ error: "Esta promo no está activa" }); return; }

    const { client_name, client_phone, client_email, data: entryInput } = req.body as {
      client_name: string; client_phone: string; client_email?: string; data?: Record<string, unknown>;
    };
    if (!client_name || !client_phone) {
      res.status(400).json({ error: "Nombre y teléfono son requeridos" }); return;
    }

    const config = promo.config as Record<string, unknown>;
    let entryData: Record<string, unknown> = {};
    let result = "pendiente";
    let entryType = "manual";

    switch (promo.type) {
      case "rifa": {
        const maxNumbers = (config.max_numbers as number) ?? 999;
        const existing = await countParticipantsByPhone(id, client_phone);
        if (existing > 0) { res.status(400).json({ error: "Ya participas en esta rifa" }); return; }
        const number = await getNextRifaNumber(id);
        if (number > maxNumbers) { res.status(400).json({ error: "Se agotaron los números" }); return; }
        entryData = { number_assigned: number };
        entryType = "rifa";
        break;
      }

      case "ruleta": {
        const segments = (config.segments as Array<{ label: string; prize: string; probability: number }>) ?? [];
        if (segments.length === 0) { res.status(400).json({ error: "Ruleta sin segmentos" }); return; }
        const maxPlays = (config.max_plays_per_user as number) ?? 1;
        const plays = await countParticipantsByPhone(id, client_phone);
        if (plays >= maxPlays) { res.status(400).json({ error: "Ya usaste tus giros" }); return; }
        // Weighted random selection
        const totalWeight = segments.reduce((s, seg) => s + (seg.probability ?? 1), 0);
        let rand = Math.random() * totalWeight;
        let winnerIdx = 0;
        for (let i = 0; i < segments.length; i++) {
          rand -= (segments[i].probability ?? 1);
          if (rand <= 0) { winnerIdx = i; break; }
        }
        entryData = { segment_index: winnerIdx, prize_won: segments[winnerIdx].prize, label: segments[winnerIdx].label };
        result = segments[winnerIdx].prize ? "ganador" : "no_ganador";
        entryType = "spin";
        break;
      }

      case "raspa_gana": {
        const cards = (config.cards as Array<{ prize: string; probability: number }>) ?? [];
        if (cards.length === 0) { res.status(400).json({ error: "Sin tarjetas configuradas" }); return; }
        const maxPlays = (config.max_plays_per_user as number) ?? 1;
        const plays = await countParticipantsByPhone(id, client_phone);
        if (plays >= maxPlays) { res.status(400).json({ error: "Ya raspaste tu tarjeta" }); return; }
        const totalWeight = cards.reduce((s, c) => s + (c.probability ?? 1), 0);
        let rand = Math.random() * totalWeight;
        let winnerIdx = 0;
        for (let i = 0; i < cards.length; i++) {
          rand -= (cards[i].probability ?? 1);
          if (rand <= 0) { winnerIdx = i; break; }
        }
        entryData = { card_index: winnerIdx, prize_won: cards[winnerIdx].prize };
        result = cards[winnerIdx].prize ? "ganador" : "no_ganador";
        entryType = "scratch";
        break;
      }

      case "trivia": {
        const questions = (config.questions as Array<{ q: string; options: string[]; correct: number }>) ?? [];
        const answers = (entryInput?.answers as number[]) ?? [];
        let score = 0;
        questions.forEach((q, i) => { if (answers[i] === q.correct) score++; });
        const threshold = (config.prize_threshold as number) ?? questions.length;
        entryData = { answers, score, total: questions.length };
        result = score >= threshold ? "ganador" : "no_ganador";
        entryType = "trivia";
        break;
      }

      case "codigo": {
        const code = (config.code as string) ?? "";
        const inputCode = (entryInput?.code as string) ?? "";
        if (inputCode.toUpperCase() !== code.toUpperCase()) { res.status(400).json({ error: "Código inválido" }); return; }
        const maxUses = (config.max_uses as number) ?? 999;
        const { participant_count } = (await getPromo(id)) ?? { participant_count: 0 };
        if ((participant_count ?? 0) >= maxUses) { res.status(400).json({ error: "Código agotado" }); return; }
        entryData = { code: inputCode, discount_pct: config.discount_pct, discount_fixed: config.discount_fixed };
        result = "ganador";
        entryType = "codigo";
        break;
      }

      case "referidos": {
        const referrerPhone = (entryInput?.referrer_phone as string) ?? "";
        entryData = { referrer_phone: referrerPhone };
        result = "pendiente";
        entryType = "referido";
        break;
      }

      case "puntos": {
        const pointsPerAction = (config.points_per_action as number) ?? 1;
        const actionType = (entryInput?.action_type as string) ?? "manual";
        entryData = { points: pointsPerAction, action_type: actionType };
        result = "pendiente";
        entryType = "puntos";
        break;
      }

      case "sorteo_instantaneo": {
        const everyNth = (config.every_nth as number) ?? 10;
        const { participant_count } = (await getPromo(id)) ?? { participant_count: 0 };
        const nextCount = (participant_count ?? 0) + 1;
        const isWinner = nextCount % everyNth === 0;
        entryData = { entry_number: nextCount, is_winner: isWinner };
        result = isWinner ? "ganador" : "no_ganador";
        entryType = "sorteo";
        break;
      }

      case "reto": {
        const taskType = (entryInput?.task_type as string) ?? "";
        entryData = { task_type: taskType, completed: true };
        result = "pendiente";
        entryType = "reto";
        break;
      }

      case "concurso_metricas":
      default: {
        entryData = entryInput ?? {};
        entryType = "metrica";
        break;
      }
    }

    const participant = await addParticipant({
      promo_id: id, client_name, client_phone, client_email: client_email ?? "",
      entry_type: entryType, entry_data: entryData, result,
    });

    res.json({ ok: true, participant, entry_data: entryData, result });
  } catch (err) {
    console.error("[promos enter]", err);
    res.status(500).json({ error: "Error al participar" });
  }
});

/* ═══════ ADMIN ENDPOINTS (auth required) ═══════ */

/* POST / — crear promo */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, type, config, status, starts_at, ends_at, banner_image, created_by } = req.body;
    if (!title || !type) { res.status(400).json({ error: "title y type son requeridos" }); return; }
    const promo = await createPromo({ title, description: description ?? "", type, config: config ?? {}, status, starts_at, ends_at, banner_image, created_by });
    res.status(201).json(promo);
  } catch (err) {
    console.error("[promos POST]", err);
    res.status(500).json({ error: "Error al crear promo" });
  }
});

/* PATCH /:id — actualizar promo */
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const updated = await updatePromo(id, req.body);
    if (!updated) { res.status(404).json({ error: "Promo no encontrada" }); return; }
    res.json(updated);
  } catch (err) {
    console.error("[promos PATCH]", err);
    res.status(500).json({ error: "Error al actualizar promo" });
  }
});

/* DELETE /:id */
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const ok = await deletePromo(id);
    if (!ok) { res.status(404).json({ error: "Promo no encontrada" }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("[promos DELETE]", err);
    res.status(500).json({ error: "Error al eliminar promo" });
  }
});

/* GET /:id/participants — lista de participantes */
router.get("/:id/participants", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    res.json(await getParticipants(id));
  } catch (err) {
    console.error("[promos participants]", err);
    res.status(500).json({ error: "Error al obtener participantes" });
  }
});

/* POST /:id/draw — sortear ganador de rifa */
router.post("/:id/draw", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const winner = await drawRifaWinner(id);
    if (!winner) { res.status(400).json({ error: "No hay participantes pendientes" }); return; }
    res.json({ ok: true, winner });
  } catch (err) {
    console.error("[promos draw]", err);
    res.status(500).json({ error: "Error al sortear" });
  }
});

export default router;
