import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import appointmentsRouter from "./routes/appointments";
import whatsappRouter    from "./routes/whatsapp";
import adminRouter       from "./routes/adminUsers";
import servicesRouter    from "./routes/services";
import productsRouter    from "./routes/products";

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

/* ── Middleware ── */
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── Health check ── */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "shelies-backend", ts: new Date().toISOString() });
});

/* ── Rutas API ── */
app.use("/api/appointments",        appointmentsRouter);
app.use("/api/whatsapp",            whatsappRouter);
app.use("/api/admin",               adminRouter);
app.use("/api/services",            servicesRouter);
app.use("/api/products",            productsRouter);

/* ── 404 catch-all ── */
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Shelies Backend corriendo en http://0.0.0.0:${PORT}`);
});

export default app;
