/**
 * Helper para construir URLs del backend.
 * Si NEXT_PUBLIC_API_URL está vacío, usa rutas relativas (ej: /api/...)
 * para permitir proxy por rewrites en Next.js y evitar CORS en local.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return API_URL ? `${API_URL}${path}` : path;
}

/** Fetch con Bearer token. Usa tokenKey para leer el token desde sessionStorage. */
function tokenFetch(tokenKey: string, url: string, options?: RequestInit): Promise<Response> {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = sessionStorage.getItem(tokenKey);
  }
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

/**
 * Fetch autenticado para el panel de administración.
 * Lee el token de sessionStorage["admin_token"].
 */
export function authedFetch(url: string, options?: RequestInit): Promise<Response> {
  return tokenFetch("admin_token", url, options);
}

/**
 * Fetch autenticado para el módulo de estilistas.
 * Lee el token de sessionStorage["estilista_token"].
 */
export function stylistFetch(url: string, options?: RequestInit): Promise<Response> {
  return tokenFetch("estilista_token", url, options);
}

/**
 * Fetch autenticado para el módulo de domiciliarios.
 * Lee el token de sessionStorage["domiciliario_token"].
 */
export function domiciliarioFetch(url: string, options?: RequestInit): Promise<Response> {
  return tokenFetch("domiciliario_token", url, options);
}
