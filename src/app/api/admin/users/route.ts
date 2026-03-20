/**
 * GET    /api/admin/users          → listar todos los usuarios
 * POST   /api/admin/users          → crear usuario
 * PATCH  /api/admin/users?id=:id   → actualizar usuario
 * DELETE /api/admin/users?id=:id   → desactivar usuario
 */
import { NextRequest, NextResponse } from "next/server";
import {
  ensureAdminUsersTables,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/lib/admin-users-db";

export async function GET() {
  try {
    await ensureAdminUsersTables();
    const users = await getAdminUsers();
    return NextResponse.json(users);
  } catch (err) {
    console.error("[admin/users GET]", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string; email: string; password: string;
      role: string; avatar: string; phone?: string; bio?: string;
    };

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ error: "name, email y password son requeridos" }, { status: 400 });
    }

    await ensureAdminUsersTables();
    const user = await createAdminUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    console.error("[admin/users POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") ?? "0");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const body = await request.json() as {
      name?: string; role?: string; avatar?: string;
      phone?: string; bio?: string; password?: string; is_active?: boolean;
    };

    const updated = await updateAdminUser(id, body);
    if (!updated) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") ?? "0");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    await deleteAdminUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
