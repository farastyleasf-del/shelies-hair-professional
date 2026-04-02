import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpe?g|png|webp|gif|mp4|mov|webm)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const router = Router();

router.post("/", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: "Sin archivo" }); return; }
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

export default router;
