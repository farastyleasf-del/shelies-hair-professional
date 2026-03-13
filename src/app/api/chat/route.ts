import { NextResponse } from "next/server";

// El chatbot corre 100% en el cliente usando el motor RAG local (src/lib/rag-engine.ts).
// Este endpoint queda como punto de extensión para integrar IA real en el futuro
// sin modificar el ChatWidget (ej: Groq free tier, Google Gemini free tier, etc.)
export async function POST(request: Request) {
  const { message } = await request.json();
  void message;
  return NextResponse.json({ status: "not_implemented" }, { status: 501 });
}
