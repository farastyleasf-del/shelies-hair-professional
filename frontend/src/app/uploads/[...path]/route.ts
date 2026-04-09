import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL || "http://shelie_spa_back:3001";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.pathname; // /uploads/filename.jpg
  try {
    const res = await fetch(`${BACKEND}${path}`, { headers: { host: "shelies.asf.company" } });
    if (!res.ok) return new NextResponse("Not found", { status: 404 });
    const body = res.body;
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    headers.set("cache-control", "public, max-age=2592000");
    return new NextResponse(body, { status: 200, headers });
  } catch {
    return new NextResponse("Backend unavailable", { status: 502 });
  }
}
