import { NextResponse } from "next/server";
import { demoOrders } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();

  if (!q) return NextResponse.json({ orders: demoOrders });

  const found = demoOrders.find(
    (o) => o.id.toLowerCase() === q || o.customer.email.toLowerCase() === q || o.customer.phone === q
  );

  return NextResponse.json({ order: found || null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const orderId = `ORD-${Date.now()}`;

  // In production: save to database, process payment, send confirmation email
  const order = {
    id: orderId,
    ...body,
    status: "pagado",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, order }, { status: 201 });
}
