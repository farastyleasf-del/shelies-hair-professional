/**
 * POST /api/admin/auth  → verificar credenciales y devolver perfil del usuario
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/admin-users-db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
    }

    const user = await verifyAdminCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("[admin/auth]", err);
    // Fallback si DB no responde
    return NextResponse.json({ error: "Error de conexión" }, { status: 503 });
  }
}
