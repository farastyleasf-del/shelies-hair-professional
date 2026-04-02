import { Router, Request, Response } from "express";
import { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct } from "../lib/db-products";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getProducts(false) });
  } catch { res.status(500).json({ success: false, error: "Error" }); }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const p = await getProductBySlug(req.params.slug);
    if (!p) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true, data: p });
  } catch { res.status(500).json({ success: false, error: "Error" }); }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const p = await createProduct(req.body);
    res.status(201).json({ success: true, data: p });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(400).json({ success: false, error: msg });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const p = await updateProduct(parseInt(req.params.id), req.body);
    if (!p) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true, data: p });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    res.status(400).json({ success: false, error: msg });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const ok = await deleteProduct(parseInt(req.params.id));
    if (!ok) { res.status(404).json({ success: false, error: "No encontrado" }); return; }
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, error: "Error" }); }
});

export default router;
