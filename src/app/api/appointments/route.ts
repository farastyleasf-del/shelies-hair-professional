import { NextRequest, NextResponse } from "next/server";
import { createAppointment, getAppointments } from "@/lib/db-services";

export async function GET() {
  try {
    const appointments = await getAppointments();
    return NextResponse.json({ success: true, data: appointments });
  } catch (e) {
    console.error("GET /api/appointments:", e);
    return NextResponse.json({ success: false, error: "Error al obtener citas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointment = await createAppointment(body);
    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (e) {
    console.error("POST /api/appointments:", e);
    return NextResponse.json({ success: false, error: "Error al crear cita" }, { status: 500 });
  }
}
