/**
 * JWT Auth Middleware
 * Protege rutas que requieren sesión de administrador.
 * Uso: app.use("/api/admin", requireAuth, adminRouter);
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET ?? "shelie-jwt-secret-change-in-production";
export const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "8h";

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar: string;
}

/** Firma un token JWT con los datos del usuario */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
}

/** Middleware: verifica Bearer token en Authorization header */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as Request & { user: JwtPayload }).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/** Middleware: solo admins pueden pasar */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: JwtPayload }).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Acceso restringido a administradores" });
    return;
  }
  next();
}
