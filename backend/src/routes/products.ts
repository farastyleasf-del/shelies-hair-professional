import { Router, Request, Response } from "express";
import { getProducts } from "../lib/db-products";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const products = await getProducts();
    res.json({ success: true, data: products });
  } catch (e) {
    res.status(500).json({ success: false, error: "Error al obtener productos" });
  }
});

export default router;
