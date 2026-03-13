import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/db-products";

export async function GET() {
  try {
    const products = await getProducts(false);
    return NextResponse.json({ success: true, data: products });
  } catch (e) {
    console.error("GET /api/products:", e);
    return NextResponse.json({ success: false, error: "Error al obtener productos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await createProduct(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (e) {
    console.error("POST /api/products:", e);
    return NextResponse.json({ success: false, error: "Error al crear producto" }, { status: 500 });
  }
}
