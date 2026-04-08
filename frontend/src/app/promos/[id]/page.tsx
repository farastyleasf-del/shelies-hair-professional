"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import type { Promotion } from "@/lib/types";
import { PROMO_TYPES } from "@/lib/types";

/* ── Helpers ── */
function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/* ═══════════════════════════════════════════════════════
   RULETA WHEEL — CSS animated spinning wheel
═══════════════════════════════════════════════════════ */
function RuletaWheel({ segments, onResult }: {
  segments: Array<{ label: string; color: string; prize: string }>;
  onResult: (segmentIndex: number) => void;
}) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const n = segments.length;
  const segAngle = 360 / n;

  function spin(targetIndex: number) {
    setSpinning(true);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    // Land in the middle of the target segment
    const targetAngle = 360 - (targetIndex * segAngle + segAngle / 2);
    const total = fullSpins * 360 + targetAngle;
    setRotation(prev => prev + total);
    setTimeout(() => { setSpinning(false); onResult(targetIndex); }, 4000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Pointer */}
      <div style={{ fontSize: 24, marginBottom: -12, zIndex: 2 }}>▼</div>
      {/* Wheel */}
      <div style={{ position: "relative", width: 280, height: 280 }}>
        <div ref={wheelRef} style={{
          width: 280, height: 280, borderRadius: "50%", overflow: "hidden", position: "relative",
          transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          boxShadow: "0 4px 20px rgba(0,0,0,.15)",
        }}>
          {segments.map((seg, i) => {
            const startAngle = i * segAngle;
            const endAngle = startAngle + segAngle;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const largeArc = segAngle > 180 ? 1 : 0;
            const x1 = 140 + 140 * Math.cos(startRad);
            const y1 = 140 + 140 * Math.sin(startRad);
            const x2 = 140 + 140 * Math.cos(endRad);
            const y2 = 140 + 140 * Math.sin(endRad);
            const midAngle = (startAngle + segAngle / 2 - 90) * Math.PI / 180;
            const tx = 140 + 80 * Math.cos(midAngle);
            const ty = 140 + 80 * Math.sin(midAngle);
            const textRotation = startAngle + segAngle / 2;

            return (
              <svg key={i} style={{ position: "absolute", top: 0, left: 0, width: 280, height: 280 }}>
                <path d={`M140,140 L${x1},${y1} A140,140 0 ${largeArc},1 ${x2},${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth="2" />
                <text x={tx} y={ty} fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${tx}, ${ty})`}>{seg.label.slice(0, 12)}</text>
              </svg>
            );
          })}
        </div>
        {/* Center circle */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          🎡
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#6B7280" }}>
        {spinning ? "Girando..." : "Presiona GIRAR para participar"}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RASPA Y GANA — Canvas scratch card
═══════════════════════════════════════════════════════ */
function RaspaGana({ prize, onRevealed }: { prize: string; onRevealed: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const isDrawing = useRef(false);
  const scratched = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#C0C0C0";
    ctx.fillRect(0, 0, 280, 140);
    ctx.fillStyle = "#888";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Raspa aquí", 140, 75);
  }, []);

  function scratch(e: React.MouseEvent | React.TouchEvent) {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    scratched.current += 1;
    if (scratched.current > 30 && !revealed) {
      setRevealed(true);
      ctx.clearRect(0, 0, 280, 140);
      onRevealed();
    }
  }

  return (
    <div style={{ position: "relative", width: 280, height: 140, margin: "0 auto", borderRadius: 16, overflow: "hidden", border: "2px solid #E5E7EB" }}>
      {/* Prize underneath */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: prize ? "linear-gradient(135deg, #FEF3C7, #FDE68A)" : "#F3F4F6" }}>
        <span style={{ fontSize: 32 }}>{prize ? "🎉" : "😔"}</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: prize ? "#92400E" : "#6B7280", margin: "4px 0 0" }}>
          {prize || "Sigue intentando"}
        </p>
      </div>
      {/* Scratch overlay */}
      <canvas ref={canvasRef} width={280} height={140}
        style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
        onMouseDown={() => { isDrawing.current = true; }}
        onMouseUp={() => { isDrawing.current = false; }}
        onMouseMove={e => { if (isDrawing.current) scratch(e); }}
        onTouchStart={() => { isDrawing.current = true; }}
        onTouchEnd={() => { isDrawing.current = false; }}
        onTouchMove={e => { if (isDrawing.current) scratch(e); }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TRIVIA QUIZ
═══════════════════════════════════════════════════════ */
function TriviaQuiz({ questions, onSubmit }: {
  questions: Array<{ q: string; options: string[] }>;
  onSubmit: (answers: number[]) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  function selectAnswer(optIdx: number) {
    const next = [...answers];
    next[current] = optIdx;
    setAnswers(next);
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(current + 1), 300);
    }
  }

  const q = questions[current];
  const allAnswered = answers.length === questions.length && answers.every(a => a !== undefined);

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {questions.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= current ? "#8B5CF6" : "#E5E7EB" }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>Pregunta {current + 1} de {questions.length}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>{q.q}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((opt, oi) => (
          <button key={oi} onClick={() => selectAnswer(oi)}
            style={{
              padding: "12px 16px", borderRadius: 12, fontSize: 14, textAlign: "left", cursor: "pointer",
              border: answers[current] === oi ? "2px solid #8B5CF6" : "2px solid #E5E7EB",
              background: answers[current] === oi ? "#8B5CF620" : "#fff",
              color: "#1a1a1a", fontWeight: answers[current] === oi ? 600 : 400,
            }}>
            {opt}
          </button>
        ))}
      </div>
      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
          style={{ fontSize: 13, color: current === 0 ? "#D1D5DB" : "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
          ← Anterior
        </button>
        {allAnswered ? (
          <button onClick={() => onSubmit(answers)}
            style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Enviar respuestas
          </button>
        ) : current < questions.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)} disabled={answers[current] === undefined}
            style={{ fontSize: 13, color: answers[current] !== undefined ? "#8B5CF6" : "#D1D5DB", background: "none", border: "none", cursor: "pointer" }}>
            Siguiente →
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PARTICIPATION FORM (name + phone + email)
═══════════════════════════════════════════════════════ */
function ParticipationForm({ onSubmit, loading, label }: {
  onSubmit: (data: { client_name: string; client_phone: string; client_email: string }) => void;
  loading: boolean; label?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360, margin: "0 auto" }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre *"
        className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Tu teléfono *"
        className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Tu email (opcional)"
        className="w-full border border-blush/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vino/30" />
      <button onClick={() => { if (name && phone) onSubmit({ client_name: name, client_phone: phone, client_email: email }); }}
        disabled={loading || !name || !phone}
        className="btn-vino w-full disabled:opacity-50">
        {loading ? "Procesando..." : label ?? "Participar"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function PromoDetailPage() {
  const params = useParams();
  const promoId = parseInt(params.id as string);
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState<Array<{ client_name: string; count: number }>>([]);

  // For interactive games — store user info before game starts
  const [userInfo, setUserInfo] = useState<{ client_name: string; client_phone: string; client_email: string } | null>(null);

  const fetchPromo = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/promos/${promoId}`));
      if (res.ok) setPromo(await res.json());
    } catch {} finally { setLoading(false); }
  }, [promoId]);

  useEffect(() => { fetchPromo(); }, [fetchPromo]);

  useEffect(() => {
    if (promo?.type === "concurso_metricas") {
      fetch(apiUrl(`/api/promos/${promoId}/leaderboard`))
        .then(r => r.ok ? r.json() : [])
        .then(setLeaderboard)
        .catch(() => {});
    }
  }, [promo?.type, promoId]);

  async function participate(clientData: { client_name: string; client_phone: string; client_email: string }, extraData?: Record<string, unknown>) {
    setParticipating(true); setError(""); setResult(null);
    try {
      const res = await fetch(apiUrl(`/api/promos/${promoId}/enter`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clientData, data: extraData }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al participar"); return data; }
      setResult(data);
      return data;
    } catch {
      setError("Error de conexión");
      return null;
    } finally { setParticipating(false); }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="inline-block w-8 h-8 border-2 border-vino/20 border-t-vino rounded-full animate-spin" />
    </div>
  );

  if (!promo) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">😕</p>
      <p className="font-poppins font-semibold text-lg">Promo no encontrada</p>
      <Link href="/promos" className="btn-outline mt-4 inline-block">Ver todas las promos</Link>
    </div>
  );

  const ti = PROMO_TYPES.find(t => t.type === promo.type);
  const config = promo.config as Record<string, unknown>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Back */}
      <Link href="/promos" className="text-sm text-humo hover:text-vino mb-6 inline-flex items-center gap-1">
        ← Volver a promociones
      </Link>

      {/* Header */}
      <div className="card-premium overflow-hidden mb-8">
        {promo.banner_image ? (
          <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${promo.banner_image})` }} />
        ) : (
          <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ti?.color}30, ${ti?.color}60)` }}>
            <span className="text-7xl">{ti?.icon}</span>
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: ti?.color + "20", color: ti?.color }}>{ti?.label}</span>
            {promo.ends_at && <span className="text-xs text-humo">Hasta {fmtDate(promo.ends_at)}</span>}
          </div>
          <h1 className="font-poppins font-bold text-2xl mb-2" style={{ color: "#1a1a1a" }}>{promo.title}</h1>
          <p className="text-humo">{promo.description}</p>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className="card-premium p-6 mb-8 text-center" style={{ borderColor: result.result === "ganador" ? "#16A34A" : "#F59E0B", borderWidth: 2 }}>
          <p className="text-4xl mb-2">{result.result === "ganador" ? "🎉" : "😊"}</p>
          <p className="font-poppins font-bold text-lg" style={{ color: result.result === "ganador" ? "#16A34A" : "#92400E" }}>
            {result.result === "ganador" ? "¡Felicidades, ganaste!" : "¡Gracias por participar!"}
          </p>
          {(() => { const ed = result.entry_data as Record<string, unknown> | undefined; return ed?.prize_won ? <p className="text-base mt-1" style={{ color: "#5E0B2B" }}>Premio: <strong>{String(ed.prize_won)}</strong></p> : null; })()}
          {(() => { const ed = result.entry_data as Record<string, unknown> | undefined; return ed?.number_assigned ? <p className="text-lg font-mono font-bold mt-2" style={{ color: "#5E0B2B" }}>Tu número: #{String(ed.number_assigned)}</p> : null; })()}
          {(() => { const ed = result.entry_data as Record<string, unknown> | undefined; return ed?.score !== undefined ? <p className="text-base mt-1">Score: {String(ed.score)} / {String(ed.total)}</p> : null; })()}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card-premium p-4 mb-6 text-center" style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* ═══ INTERACTIVE SECTION (per type) ═══ */}
      {!result && (
        <div className="card-premium p-6 mb-8">
          {/* ── RIFA ── */}
          {promo.type === "rifa" && (
            <div className="text-center">
              <p className="font-poppins font-semibold text-lg mb-2">🎟️ Regístrate para la rifa</p>
              <p className="text-sm text-humo mb-6">Recibirás un número al participar. {config.max_numbers ? `Hay ${Number(config.max_numbers)} números disponibles.` : ""}</p>
              <ParticipationForm onSubmit={d => participate(d)} loading={participating} label="Obtener mi número" />
            </div>
          )}

          {/* ── RULETA ── */}
          {promo.type === "ruleta" && (() => {
            const segments = (config.segments as Array<{ label: string; color: string; prize: string; probability: number }>) ?? [];
            if (!userInfo) return (
              <div className="text-center">
                <p className="font-poppins font-semibold text-lg mb-2">🎡 Gira la ruleta</p>
                <p className="text-sm text-humo mb-6">Ingresa tus datos para girar</p>
                <ParticipationForm onSubmit={d => setUserInfo(d)} loading={false} label="Continuar" />
              </div>
            );
            return (
              <div className="text-center">
                <RuletaWheel segments={segments} onResult={() => {}} />
                <button
                  onClick={async () => {
                    setParticipating(true);
                    const data = await participate(userInfo);
                    if (data?.entry_data?.segment_index !== undefined) {
                      // Trigger wheel spin to land on the right segment
                      const wheelEl = document.querySelector("[data-wheel]") as HTMLDivElement;
                      if (wheelEl) { /* animation handled by state */ }
                    }
                  }}
                  disabled={participating}
                  className="btn-vino mt-4 disabled:opacity-50">
                  {participating ? "Girando..." : "🎡 GIRAR"}
                </button>
              </div>
            );
          })()}

          {/* ── RASPA Y GANA ── */}
          {promo.type === "raspa_gana" && (() => {
            if (!userInfo) return (
              <div className="text-center">
                <p className="font-poppins font-semibold text-lg mb-2">✨ Raspa y descubre tu premio</p>
                <p className="text-sm text-humo mb-6">Ingresa tus datos para jugar</p>
                <ParticipationForm onSubmit={async d => {
                  setUserInfo(d);
                  await participate(d);
                }} loading={participating} label="Obtener mi tarjeta" />
              </div>
            );
            const prize = "";
            return (
              <div className="text-center">
                <p className="font-poppins font-semibold text-lg mb-4">Raspa la tarjeta</p>
                <RaspaGana prize={prize} onRevealed={() => {}} />
              </div>
            );
          })()}

          {/* ── TRIVIA ── */}
          {promo.type === "trivia" && (() => {
            const questions = (config.questions as Array<{ q: string; options: string[]; correct: number }>) ?? [];
            if (!userInfo) return (
              <div className="text-center">
                <p className="font-poppins font-semibold text-lg mb-2">❓ Trivia Shelie&apos;s</p>
                <p className="text-sm text-humo mb-6">{questions.length} preguntas sobre cuidado capilar</p>
                <ParticipationForm onSubmit={d => setUserInfo(d)} loading={false} label="Comenzar quiz" />
              </div>
            );
            return (
              <TriviaQuiz
                questions={questions.map(q => ({ q: q.q, options: q.options }))}
                onSubmit={answers => participate(userInfo, { answers })}
              />
            );
          })()}

          {/* ── CÓDIGO ── */}
          {promo.type === "codigo" && (
            <div className="text-center">
              <p className="font-poppins font-semibold text-lg mb-2">🏷️ Código de descuento</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gray-100 mb-4">
                <span className="font-mono font-bold text-2xl" style={{ color: "#5E0B2B" }}>{config.code as string}</span>
                <button onClick={() => navigator.clipboard.writeText(config.code as string)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-vino text-white font-semibold">Copiar</button>
              </div>
              <p className="text-sm text-humo">
                {config.discount_pct ? `${config.discount_pct}% de descuento` : ""}
                {config.discount_fixed ? ` $${config.discount_fixed} de descuento` : ""}
              </p>
            </div>
          )}

          {/* ── CONCURSO MÉTRICAS ── */}
          {promo.type === "concurso_metricas" && (
            <div>
              <p className="font-poppins font-semibold text-lg mb-4 text-center">🏆 Ranking</p>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-humo text-center">Sin participantes todavía</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between card-premium p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg" style={{ color: i < 3 ? "#F59E0B" : "#6B7280" }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                        <span className="font-medium">{entry.client_name}</span>
                      </div>
                      <span className="font-bold" style={{ color: "#5E0B2B" }}>{entry.count}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-humo text-center mt-4">
                Métrica: {config.metric === "reservas" ? "Reservas" : config.metric === "compras" ? "Compras" : "Total gastado"}
              </p>
            </div>
          )}

          {/* ── REFERIDOS ── */}
          {promo.type === "referidos" && (
            <div className="text-center">
              <p className="font-poppins font-semibold text-lg mb-2">👯 Programa de referidos</p>
              <p className="text-sm text-humo mb-2">Quien refiere: <strong>{config.reward_referrer as string}</strong></p>
              <p className="text-sm text-humo mb-6">Quien es referida: <strong>{config.reward_referred as string}</strong></p>
              <ParticipationForm onSubmit={d => participate(d, { referrer_phone: d.client_phone })} loading={participating} label="Registrar mi referido" />
            </div>
          )}

          {/* ── PUNTOS ── */}
          {promo.type === "puntos" && (
            <div className="text-center">
              <p className="font-poppins font-semibold text-lg mb-2">⭐ Programa de puntos</p>
              <p className="text-sm text-humo mb-4">
                Gana {config.points_per_purchase as number ?? 1} punto por compra · {config.points_per_booking as number ?? 2} puntos por reserva
              </p>
              <div className="space-y-2 mb-4">
                {((config.rewards as Array<{ name: string; cost: number }>) ?? []).map((r, i) => (
                  <div key={i} className="card-premium p-3 flex items-center justify-between">
                    <span className="font-medium">{r.name}</span>
                    <span className="font-bold text-sm" style={{ color: "#F59E0B" }}>{r.cost} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SORTEO INSTANTÁNEO ── */}
          {promo.type === "sorteo_instantaneo" && (
            <div className="text-center">
              <p className="font-poppins font-semibold text-lg mb-2">⚡ Sorteo instantáneo</p>
              <p className="text-sm text-humo mb-6">
                Cada {config.every_nth as number ?? 10} participación gana: <strong>{config.prize as string}</strong>
              </p>
              <ParticipationForm onSubmit={d => participate(d)} loading={participating} label="Probar mi suerte" />
            </div>
          )}

          {/* ── RETO ── */}
          {promo.type === "reto" && (
            <div className="text-center">
              <p className="font-poppins font-semibold text-lg mb-4">🎯 Reto Shelie&apos;s</p>
              <div className="space-y-3 mb-4 text-left max-w-xs mx-auto">
                {((config.tasks as Array<{ type: string; count: number; label: string }>) ?? []).map((task, i) => (
                  <div key={i} className="flex items-center gap-3 card-premium p-3">
                    <span className="text-lg">☐</span>
                    <div>
                      <p className="font-medium text-sm">{task.label || `${task.type} x${task.count}`}</p>
                      <p className="text-xs text-humo">Cantidad: {task.count}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#5E0B2B" }}>
                Premio al completar: {config.prize as string}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <Link href="/promos" className="text-sm text-humo hover:text-vino">← Ver todas las promociones</Link>
      </div>
    </div>
  );
}
