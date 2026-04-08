import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import appointmentsRouter, { initAppointmentsPaymentCols } from "./routes/appointments";
import whatsappRouter    from "./routes/whatsapp";
import adminRouter       from "./routes/adminUsers";
import servicesRouter    from "./routes/services";
import productsRouter    from "./routes/products";
import paymentsRouter    from "./routes/payments";
import ordersRouter, { initOrdersTable }   from "./routes/orders";
import quotesRouter      from "./routes/quotes";
import contactRouter, { initContactTable } from "./routes/contact";
import uploadsRouter     from "./routes/uploads";
import employeesRouter   from "./routes/employees";
import stylistRouter     from "./routes/stylist";
import promosRouter      from "./routes/promos";
import { ensureSchema } from "./lib/db";
import { requireAuth } from "./middleware/auth";
import { initProductsTable } from "./lib/db-products";
import { initServicesTable } from "./lib/db-services";
import { initEmployeesTables } from "./lib/employees-db";
import { initStylistTables } from "./lib/stylist-db";
import { initPromosTable } from "./lib/promos-db";

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

/* ── Middleware ── */
// Acepta múltiples orígenes separados por coma o wildcard
const allowedOrigins = (process.env.FRONTEND_URL ?? "*")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Sin origin (curl, Postman, SSR) o wildcard → permitir
    if (!origin || allowedOrigins.includes("*")) return cb(null, true);
    if (allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS bloqueado: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── Static uploads ── */
app.use("/uploads", express.static(process.env.UPLOAD_DIR || "/app/uploads"));

/* ── Health check ── */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "shelies-backend", ts: new Date().toISOString() });
});

/* ── Rutas API ── */

// Públicas: acceso sin token
app.use("/api/services",            servicesRouter);
app.use("/api/products",            productsRouter);
app.use("/api/payments",            paymentsRouter);
app.use("/api/orders",              ordersRouter);
app.use("/api/quotes",              quotesRouter);
app.use("/api/contact",             contactRouter);
app.use("/api/uploads",             uploadsRouter);
app.use("/api/appointments",        appointmentsRouter);
app.use("/api/promos",              promosRouter);

// Admin: /auth es pública, el resto requiere JWT
app.use("/api/admin", (req, res, next) => {
  if (req.path === "/auth" && req.method === "POST") return next();
  requireAuth(req, res, next);
}, adminRouter);

// Employees: /auth es pública, el resto requiere JWT
app.use("/api/employees", (req, res, next) => {
  if (req.path === "/auth" && req.method === "POST") return next();
  requireAuth(req, res, next);
}, employeesRouter);

// Protegidas completas
app.use("/api/whatsapp",            requireAuth, whatsappRouter);
app.use("/api/stylist",             requireAuth, stylistRouter);

/* ── 404 catch-all ── */
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

/* ── Inicializar tablas y arrancar ── */
async function start() {
  try {
    await ensureSchema();          // CREATE SCHEMA IF NOT EXISTS bbdd_shelies
    await initProductsTable();
    await initServicesTable();
    await initOrdersTable();
    await initContactTable();
    await initAppointmentsPaymentCols();
    await initEmployeesTables();
    await initStylistTables();
    await initPromosTable();
  } catch (err) {
    console.warn("[init tables]", err);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Shelies Backend corriendo en http://0.0.0.0:${PORT}`);
  });
}
start();

export default app;
