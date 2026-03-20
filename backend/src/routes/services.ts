import { Router, Request, Response } from "express";
import { getServices, getServiceById } from "../lib/db-services";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const services = await getServices();
    res.json({ success: true, data: services });
  } catch (e) {
    res.status(500).json({ success: false, error: "Error al obtener servicios" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const service = await getServiceById(parseInt(req.params.id));
    if (!service) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true, data: service });
  } catch (e) {
    res.status(500).json({ success: false, error: "Error" });
  }
});

export default router;
