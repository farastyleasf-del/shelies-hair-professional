import { NextRequest, NextResponse } from "next/server";
import { updateService, deleteService } from "@/lib/db-services";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const service = await updateService(Number(params.id), body);
    if (!service) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: service });
  } catch (e) {
    console.error("PATCH /api/services/[id]:", e);
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await deleteService(Number(params.id));
    if (!deleted) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/services/[id]:", e);
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
