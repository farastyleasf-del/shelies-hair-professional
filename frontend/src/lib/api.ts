/**
 * Helper para construir URLs del backend.
 * En desarrollo: http://localhost:3001
 * En producción: NEXT_PUBLIC_API_URL (URL del contenedor backend)
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
