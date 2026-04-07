import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://shelies.asf.company";

async function proxy(req: NextRequest) {
  const url = new URL(req.nextUrl.pathname + req.nextUrl.search, BACKEND);

  const headers = new Headers(req.headers);
  // Remove browser origin so the remote CORS policy doesn't block us
  headers.delete("origin");
  headers.delete("referer");
  headers.set("host", new URL(BACKEND).host);

  const res = await fetch(url.toString(), {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.blob() : undefined,
  });

  const responseHeaders = new Headers(res.headers);
  // Allow the local browser to read the response
  responseHeaders.set("access-control-allow-origin", "*");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
  });
}
