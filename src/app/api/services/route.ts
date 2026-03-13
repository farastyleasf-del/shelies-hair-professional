import { NextRequest, NextResponse } from "next/server";
import { getServices, createService } from "@/lib/db-services";

export async function GET() {
  try {
    const services = await getServices(false);
    return NextResponse.json({ success: true, data: services });
  } catch (e) {
    console.error("GET /api/services:", e);
    return NextResponse.json({ success: false, error: "Error al obtener servicios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const service = await createService(body);
    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (e) {
    console.error("POST /api/services:", e);
    return NextResponse.json({ success: false, error: "Error al crear servicio" }, { status: 500 });
  }
}
