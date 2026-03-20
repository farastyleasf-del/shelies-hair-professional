import { Router, Request, Response } from "express";
import { createAppointment, getAppointments } from "../lib/db-services";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const appointments = await getAppointments();
    res.json({ success: true, data: appointments });
  } catch (e) {
    console.error("GET /appointments:", e);
    res.status(500).json({ success: false, error: "Error al obtener citas" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const appointment = await createAppointment(req.body);
    res.status(201).json({ success: true, data: appointment });
  } catch (e) {
    console.error("POST /appointments:", e);
    res.status(500).json({ success: false, error: "Error al crear cita" });
  }
});

export default router;
