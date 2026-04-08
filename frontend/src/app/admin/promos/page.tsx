"use client";
import { useState, useEffect, useCallback } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { apiUrl, authedFetch } from "@/lib/api";
import type { Promotion, PromoType, PromoStatus, PromoParticipant } from "@/lib/types";
import { PROMO_TYPES } from "@/lib/types";

/* ── Helpers ── */
const statusColors: Record<PromoStatus, { bg: string; text: string; label: string }> = {
  borrador:   { bg: "#F3F4F6", text: "#6B7280", label: "Borrador" },
  activa:     { bg: "#DCFCE7", text: "#16A34A", label: "Activa" },
  pausada:    { bg: "#FEF9C3", text: "#CA8A04", label: "Pausada" },
  finalizada: { bg: "#FEE2E2", text: "#DC2626", label: "Finalizada" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

/* ═══════════════════════════════════════════════════════
   CONFIG FORM — renders different fields per promo type
═══════════════════════════════════════════════════════ */
function PromoConfigForm({ type, config, onChange, t }: {
  type: PromoType;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
  t: ReturnType<typeof useAdminTheme>;
}) {
  const inputStyle: React.CSSProperties = { backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text, width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid", fontSize: 13, outline: "none" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: t.colors.textMuted, display: "block", marginBottom: 4 };

  switch (type) {
    case "rifa":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Cantidad máxima de números</label>
            <input type="number" value={(config.max_numbers as number) ?? 100} onChange={e => onChange({ ...config, max_numbers: parseInt(e.target.value) || 100 })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Premio principal</label>
            <input value={(config.prize as string) ?? ""} onChange={e => onChange({ ...config, prize: e.target.value })} style={inputStyle} placeholder="Alisado gratis" />
          </div>
          <div>
            <label style={labelStyle}>Fecha del sorteo</label>
            <input type="date" value={(config.draw_date as string) ?? ""} onChange={e => onChange({ ...config, draw_date: e.target.value })} style={inputStyle} />
          </div>
        </div>
      );

    case "ruleta": {
      const segments = (config.segments as Array<{ label: string; prize: string; color: string; probability: number }>) ?? [
        { label: "10% desc", prize: "10% descuento", color: "#EC4899", probability: 3 },
        { label: "Producto gratis", prize: "Protector Térmico", color: "#8B5CF6", probability: 1 },
        { label: "Intenta de nuevo", prize: "", color: "#6B7280", probability: 5 },
        { label: "20% desc", prize: "20% descuento", color: "#F59E0B", probability: 2 },
      ];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>Segmentos de la ruleta ({segments.length})</label>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={seg.color} onChange={e => { const s = [...segments]; s[i] = { ...s[i], color: e.target.value }; onChange({ ...config, segments: s }); }}
                style={{ width: 32, height: 32, borderRadius: 6, border: "none", cursor: "pointer" }} />
              <input value={seg.label} placeholder="Etiqueta" onChange={e => { const s = [...segments]; s[i] = { ...s[i], label: e.target.value }; onChange({ ...config, segments: s }); }}
                style={{ ...inputStyle, flex: 1 }} />
              <input value={seg.prize} placeholder="Premio (vacío=sin premio)" onChange={e => { const s = [...segments]; s[i] = { ...s[i], prize: e.target.value }; onChange({ ...config, segments: s }); }}
                style={{ ...inputStyle, flex: 1 }} />
              <input type="number" value={seg.probability} title="Peso (mayor = más probable)" onChange={e => { const s = [...segments]; s[i] = { ...s[i], probability: parseInt(e.target.value) || 1 }; onChange({ ...config, segments: s }); }}
                style={{ ...inputStyle, width: 60 }} />
              <button onClick={() => { const s = segments.filter((_, j) => j !== i); onChange({ ...config, segments: s }); }} style={{ color: "#EF4444", fontSize: 16, background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...config, segments: [...segments, { label: "Nuevo", prize: "", color: "#6366F1", probability: 1 }] })}
            style={{ fontSize: 12, color: t.colors.primary, background: "none", border: `1px dashed ${t.colors.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            + Agregar segmento
          </button>
          <div>
            <label style={labelStyle}>Máx. giros por persona</label>
            <input type="number" value={(config.max_plays_per_user as number) ?? 1} onChange={e => onChange({ ...config, max_plays_per_user: parseInt(e.target.value) || 1 })} style={inputStyle} />
          </div>
        </div>
      );
    }

    case "concurso_metricas":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Métrica a medir</label>
            <select value={(config.metric as string) ?? "reservas"} onChange={e => onChange({ ...config, metric: e.target.value })} style={inputStyle}>
              <option value="reservas">Reservas (citas)</option>
              <option value="compras">Compras</option>
              <option value="total_gastado">Total gastado ($)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Premio principal</label>
            <input value={(config.prize as string) ?? ""} onChange={e => onChange({ ...config, prize: e.target.value })} style={inputStyle} placeholder="Alisado orgánico gratis" />
          </div>
        </div>
      );

    case "codigo":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Código</label>
            <input value={(config.code as string) ?? ""} onChange={e => onChange({ ...config, code: e.target.value.toUpperCase() })} style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 700 }} placeholder="MAYO20" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Descuento (%)</label>
              <input type="number" value={(config.discount_pct as number) ?? 0} onChange={e => onChange({ ...config, discount_pct: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Máx. usos</label>
              <input type="number" value={(config.max_uses as number) ?? 50} onChange={e => onChange({ ...config, max_uses: parseInt(e.target.value) || 50 })} style={inputStyle} />
            </div>
          </div>
        </div>
      );

    case "raspa_gana": {
      const cards = (config.cards as Array<{ prize: string; probability: number }>) ?? [
        { prize: "10% descuento", probability: 3 },
        { prize: "", probability: 5 },
        { prize: "Producto gratis", probability: 1 },
      ];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>Posibles premios (vacío = sin premio)</label>
          {cards.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input value={c.prize} placeholder="Premio (vacío=sin premio)" onChange={e => { const s = [...cards]; s[i] = { ...s[i], prize: e.target.value }; onChange({ ...config, cards: s }); }}
                style={{ ...inputStyle, flex: 1 }} />
              <input type="number" value={c.probability} title="Peso" onChange={e => { const s = [...cards]; s[i] = { ...s[i], probability: parseInt(e.target.value) || 1 }; onChange({ ...config, cards: s }); }}
                style={{ ...inputStyle, width: 60 }} />
              <button onClick={() => onChange({ ...config, cards: cards.filter((_, j) => j !== i) })} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...config, cards: [...cards, { prize: "", probability: 1 }] })}
            style={{ fontSize: 12, color: t.colors.primary, background: "none", border: `1px dashed ${t.colors.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            + Agregar opción
          </button>
          <div>
            <label style={labelStyle}>Máx. raspaditas por persona</label>
            <input type="number" value={(config.max_plays_per_user as number) ?? 1} onChange={e => onChange({ ...config, max_plays_per_user: parseInt(e.target.value) || 1 })} style={inputStyle} />
          </div>
        </div>
      );
    }

    case "trivia": {
      const questions = (config.questions as Array<{ q: string; options: string[]; correct: number }>) ?? [];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>Preguntas ({questions.length})</label>
          {questions.map((q, qi) => (
            <div key={qi} style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.colors.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={q.q} placeholder={`Pregunta ${qi + 1}`} onChange={e => { const qs = [...questions]; qs[qi] = { ...qs[qi], q: e.target.value }; onChange({ ...config, questions: qs }); }} style={inputStyle} />
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="radio" checked={q.correct === oi} onChange={() => { const qs = [...questions]; qs[qi] = { ...qs[qi], correct: oi }; onChange({ ...config, questions: qs }); }} />
                  <input value={opt} placeholder={`Opción ${oi + 1}`} onChange={e => { const qs = [...questions]; const opts = [...qs[qi].options]; opts[oi] = e.target.value; qs[qi] = { ...qs[qi], options: opts }; onChange({ ...config, questions: qs }); }} style={{ ...inputStyle, flex: 1 }} />
                </div>
              ))}
              <button onClick={() => { const qs = questions.filter((_, j) => j !== qi); onChange({ ...config, questions: qs }); }} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", alignSelf: "flex-end" }}>Eliminar pregunta</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...config, questions: [...questions, { q: "", options: ["", "", "", ""], correct: 0 }] })}
            style={{ fontSize: 12, color: t.colors.primary, background: "none", border: `1px dashed ${t.colors.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            + Agregar pregunta
          </button>
          <div>
            <label style={labelStyle}>Respuestas correctas necesarias para ganar</label>
            <input type="number" value={(config.prize_threshold as number) ?? 3} onChange={e => onChange({ ...config, prize_threshold: parseInt(e.target.value) || 1 })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Premio</label>
            <input value={(config.prize as string) ?? ""} onChange={e => onChange({ ...config, prize: e.target.value })} style={inputStyle} placeholder="15% descuento" />
          </div>
        </div>
      );
    }

    case "referidos":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Recompensa para quien refiere</label>
            <input value={(config.reward_referrer as string) ?? ""} onChange={e => onChange({ ...config, reward_referrer: e.target.value })} style={inputStyle} placeholder="10% en próxima compra" />
          </div>
          <div>
            <label style={labelStyle}>Recompensa para la referida</label>
            <input value={(config.reward_referred as string) ?? ""} onChange={e => onChange({ ...config, reward_referred: e.target.value })} style={inputStyle} placeholder="15% en primera compra" />
          </div>
        </div>
      );

    case "puntos":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Puntos por compra</label>
              <input type="number" value={(config.points_per_purchase as number) ?? 1} onChange={e => onChange({ ...config, points_per_purchase: parseInt(e.target.value) || 1 })} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Puntos por reserva</label>
              <input type="number" value={(config.points_per_booking as number) ?? 2} onChange={e => onChange({ ...config, points_per_booking: parseInt(e.target.value) || 1 })} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Recompensas (una por línea: nombre|costo_puntos)</label>
            <textarea rows={4} value={((config.rewards as Array<{ name: string; cost: number }>) ?? []).map(r => `${r.name}|${r.cost}`).join("\n")}
              onChange={e => onChange({ ...config, rewards: e.target.value.split("\n").filter(l => l.includes("|")).map(l => { const [name, cost] = l.split("|"); return { name: name.trim(), cost: parseInt(cost) || 10 }; }) })}
              style={{ ...inputStyle, resize: "vertical" }} placeholder="Protector Térmico|50&#10;10% descuento|30" />
          </div>
        </div>
      );

    case "sorteo_instantaneo":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Cada cuántas participaciones gana</label>
            <input type="number" value={(config.every_nth as number) ?? 10} onChange={e => onChange({ ...config, every_nth: parseInt(e.target.value) || 10 })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Premio</label>
            <input value={(config.prize as string) ?? ""} onChange={e => onChange({ ...config, prize: e.target.value })} style={inputStyle} placeholder="Mascarilla gratis" />
          </div>
        </div>
      );

    case "reto": {
      const tasks = (config.tasks as Array<{ type: string; count: number; label: string }>) ?? [];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>Tareas del reto</label>
          {tasks.map((task, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <select value={task.type} onChange={e => { const t = [...tasks]; t[i] = { ...t[i], type: e.target.value }; onChange({ ...config, tasks: t }); }} style={{ ...inputStyle, width: 120 }}>
                <option value="reserva">Reservar</option>
                <option value="compra">Comprar</option>
                <option value="referido">Referir</option>
              </select>
              <input type="number" value={task.count} onChange={e => { const t = [...tasks]; t[i] = { ...t[i], count: parseInt(e.target.value) || 1 }; onChange({ ...config, tasks: t }); }} style={{ ...inputStyle, width: 60 }} />
              <input value={task.label} placeholder="Descripción" onChange={e => { const tt = [...tasks]; tt[i] = { ...tt[i], label: e.target.value }; onChange({ ...config, tasks: tt }); }} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => onChange({ ...config, tasks: tasks.filter((_, j) => j !== i) })} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...config, tasks: [...tasks, { type: "reserva", count: 1, label: "" }] })}
            style={{ fontSize: 12, color: t.colors.primary, background: "none", border: `1px dashed ${t.colors.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            + Agregar tarea
          </button>
          <div>
            <label style={labelStyle}>Premio al completar todas</label>
            <input value={(config.prize as string) ?? ""} onChange={e => onChange({ ...config, prize: e.target.value })} style={inputStyle} placeholder="Alisado orgánico gratis" />
          </div>
        </div>
      );
    }

    default:
      return <p style={{ color: t.colors.textMuted, fontSize: 13 }}>Selecciona un tipo para configurar</p>;
  }
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function AdminPromosPage() {
  const t = useAdminTheme();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedType, setSelectedType] = useState<PromoType | null>(null);
  const [form, setForm] = useState({ title: "", description: "", starts_at: "", ends_at: "", banner_image: "" });
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  // Detail / participants
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [participants, setParticipants] = useState<PromoParticipant[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  const fetchPromos = useCallback(async () => {
    try {
      const res = await authedFetch(apiUrl("/api/promos/all"));
      if (res.ok) setPromos(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function openWizard() {
    setWizardOpen(true); setWizardStep(1); setSelectedType(null);
    setForm({ title: "", description: "", starts_at: "", ends_at: "", banner_image: "" });
    setConfig({});
  }

  async function handleSave(status: "borrador" | "activa") {
    if (!selectedType || !form.title) return;
    setSaving(true);
    try {
      const res = await authedFetch(apiUrl("/api/promos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: selectedType, config, status }),
      });
      if (res.ok) {
        showToast(status === "activa" ? "Promo publicada" : "Borrador guardado");
        setWizardOpen(false); fetchPromos();
      }
    } catch {} finally { setSaving(false); }
  }

  async function handleStatusChange(id: number, status: PromoStatus) {
    try {
      const res = await authedFetch(apiUrl(`/api/promos/${id}`), {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { fetchPromos(); showToast(`Estado cambiado a ${status}`); }
    } catch {}
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminar esta promo?")) return;
    try {
      await authedFetch(apiUrl(`/api/promos/${id}`), { method: "DELETE" });
      fetchPromos(); showToast("Promo eliminada");
      if (selectedPromo?.id === id) setSelectedPromo(null);
    } catch {}
  }

  async function openDetail(promo: Promotion) {
    setSelectedPromo(promo); setLoadingParts(true);
    try {
      const res = await authedFetch(apiUrl(`/api/promos/${promo.id}/participants`));
      if (res.ok) setParticipants(await res.json());
    } catch {} finally { setLoadingParts(false); }
  }

  async function handleDraw(promoId: number) {
    try {
      const res = await authedFetch(apiUrl(`/api/promos/${promoId}/draw`), { method: "POST" });
      if (res.ok) {
        const data = await res.json() as { winner: PromoParticipant };
        showToast(`Ganador: ${data.winner.client_name} (${data.winner.client_phone})`);
        openDetail(selectedPromo!);
      } else {
        const err = await res.json() as { error: string };
        showToast(err.error);
      }
    } catch {}
  }

  const typeInfo = (type: string) => PROMO_TYPES.find(t => t.type === type);
  const inputStyle: React.CSSProperties = { backgroundColor: t.colors.inputBg, borderColor: t.colors.inputBorder, color: t.colors.text, width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid", fontSize: 14, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, padding: "10px 24px", borderRadius: 12, background: t.colors.primary, color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: t.colors.text, margin: 0 }}>Promos y Concursos</h1>
          <p style={{ fontSize: 13, color: t.colors.textMuted, margin: "4px 0 0" }}>Crea rifas, ruletas, concursos y más</p>
        </div>
        <button onClick={openWizard}
          style={{ padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer", background: t.colors.primary, color: "#fff", fontSize: 13, fontWeight: 600 }}>
          + Nueva promo
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: t.colors.textMuted, textAlign: "center", padding: 40 }}>Cargando...</p>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, borderRadius: 16, border: `1px solid ${t.colors.border}`, backgroundColor: t.colors.bgCard }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎉</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: t.colors.text }}>Sin promociones todavía</p>
          <p style={{ fontSize: 13, color: t.colors.textMuted }}>Crea tu primera rifa, ruleta o concurso</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {promos.map(promo => {
            const ti = typeInfo(promo.type);
            const si = statusColors[promo.status as PromoStatus] ?? statusColors.borrador;
            return (
              <div key={promo.id} onClick={() => openDetail(promo)}
                style={{ borderRadius: 16, border: `1px solid ${t.colors.border}`, backgroundColor: t.colors.bgCard, padding: 20, cursor: "pointer", transition: "border-color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = t.colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = t.colors.border)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{ti?.icon ?? "🎁"}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: si.bg, color: si.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>{si.label}</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: t.colors.text, margin: "0 0 4px" }}>{promo.title}</p>
                <p style={{ fontSize: 12, color: t.colors.textMuted, margin: "0 0 8px", lineHeight: 1.4 }}>{promo.description || ti?.desc}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, backgroundColor: ti?.color + "20", color: ti?.color, fontWeight: 600 }}>{ti?.label}</span>
                  <span style={{ fontSize: 11, color: t.colors.textFaint }}>{promo.participant_count ?? 0} participantes</span>
                </div>
                {(promo.starts_at || promo.ends_at) && (
                  <p style={{ fontSize: 11, color: t.colors.textFaint, margin: "8px 0 0" }}>
                    {fmtDate(promo.starts_at)} → {fmtDate(promo.ends_at)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ WIZARD MODAL ═══ */}
      {wizardOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setWizardOpen(false)}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", borderRadius: 20, backgroundColor: t.colors.bgCard, border: `1px solid ${t.colors.border}`, boxShadow: "0 25px 60px rgba(0,0,0,.3)" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: t.colors.text, margin: 0 }}>Nueva promoción</p>
                <p style={{ fontSize: 12, color: t.colors.textMuted, margin: "2px 0 0" }}>
                  Paso {wizardStep} de 3 — {wizardStep === 1 ? "Elige modalidad" : wizardStep === 2 ? "Configura" : "Revisa y publica"}
                </p>
              </div>
              <button onClick={() => setWizardOpen(false)} style={{ fontSize: 18, color: t.colors.textFaint, background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Step 1: Pick type */}
              {wizardStep === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {PROMO_TYPES.map(pt => (
                    <button key={pt.type} onClick={() => { setSelectedType(pt.type); setWizardStep(2); }}
                      style={{
                        padding: 16, borderRadius: 14, border: `2px solid ${selectedType === pt.type ? pt.color : t.colors.border}`,
                        backgroundColor: selectedType === pt.type ? pt.color + "10" : t.colors.bgCard,
                        cursor: "pointer", textAlign: "left", transition: "all .15s",
                      }}>
                      <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>{pt.icon}</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: t.colors.text, margin: "0 0 4px" }}>{pt.label}</p>
                      <p style={{ fontSize: 11, color: t.colors.textMuted, margin: 0, lineHeight: 1.3 }}>{pt.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Configure */}
              {wizardStep === 2 && selectedType && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: t.colors.textMuted, display: "block", marginBottom: 6 }}>Título *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Rifa de mayo — Alisado gratis" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: t.colors.textMuted, display: "block", marginBottom: 6 }}>Descripción</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      style={{ ...inputStyle, resize: "vertical" }} placeholder="Descripción que verán las clientas" />
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: t.colors.textMuted, display: "block", marginBottom: 6 }}>Fecha inicio</label>
                      <input type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: t.colors.textMuted, display: "block", marginBottom: 6 }}>Fecha fin</label>
                      <input type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${t.colors.border}`, paddingTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: t.colors.text, marginBottom: 12 }}>
                      {typeInfo(selectedType)?.icon} Configuración de {typeInfo(selectedType)?.label}
                    </p>
                    <PromoConfigForm type={selectedType} config={config} onChange={setConfig} t={t} />
                  </div>
                </div>
              )}

              {/* Step 3: Preview */}
              {wizardStep === 3 && selectedType && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ padding: 20, borderRadius: 14, border: `1px solid ${t.colors.border}`, backgroundColor: t.colors.bg }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 36 }}>{typeInfo(selectedType)?.icon}</span>
                      <div>
                        <p style={{ fontSize: 18, fontWeight: 700, color: t.colors.text, margin: 0 }}>{form.title || "Sin título"}</p>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, backgroundColor: typeInfo(selectedType)?.color + "20", color: typeInfo(selectedType)?.color, fontWeight: 600 }}>{typeInfo(selectedType)?.label}</span>
                      </div>
                    </div>
                    {form.description && <p style={{ fontSize: 13, color: t.colors.textMuted, margin: "0 0 8px" }}>{form.description}</p>}
                    <p style={{ fontSize: 12, color: t.colors.textFaint }}>{fmtDate(form.starts_at)} → {fmtDate(form.ends_at)}</p>
                  </div>
                  <p style={{ fontSize: 12, color: t.colors.textMuted }}>Configuración: {JSON.stringify(config).slice(0, 200)}...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${t.colors.border}`, display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : setWizardOpen(false)}
                style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${t.colors.border}`, background: "transparent", color: t.colors.textMuted, fontSize: 13, cursor: "pointer" }}>
                {wizardStep === 1 ? "Cancelar" : "Atrás"}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {wizardStep === 3 && (
                  <button onClick={() => handleSave("borrador")} disabled={saving}
                    style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${t.colors.border}`, background: "transparent", color: t.colors.textMuted, fontSize: 13, cursor: "pointer" }}>
                    Guardar borrador
                  </button>
                )}
                {wizardStep < 3 ? (
                  <button onClick={() => { if (wizardStep === 1 && !selectedType) return; setWizardStep(wizardStep + 1); }}
                    disabled={wizardStep === 1 && !selectedType || wizardStep === 2 && !form.title}
                    style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: t.colors.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (wizardStep === 1 && !selectedType) || (wizardStep === 2 && !form.title) ? 0.5 : 1 }}>
                    Siguiente
                  </button>
                ) : (
                  <button onClick={() => handleSave("activa")} disabled={saving}
                    style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: "#16A34A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                    {saving ? "Publicando..." : "Publicar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      {selectedPromo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setSelectedPromo(null)}>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", borderRadius: 20, backgroundColor: t.colors.bgCard, border: `1px solid ${t.colors.border}`, boxShadow: "0 25px 60px rgba(0,0,0,.3)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{typeInfo(selectedPromo.type)?.icon}</span>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: t.colors.text, margin: 0 }}>{selectedPromo.title}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: (statusColors[selectedPromo.status as PromoStatus] ?? statusColors.borrador).bg, color: (statusColors[selectedPromo.status as PromoStatus] ?? statusColors.borrador).text }}>{(statusColors[selectedPromo.status as PromoStatus] ?? statusColors.borrador).label}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPromo(null)} style={{ fontSize: 18, color: t.colors.textFaint, background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {selectedPromo.status === "borrador" && (
                  <button onClick={() => { handleStatusChange(selectedPromo.id, "activa"); setSelectedPromo({ ...selectedPromo, status: "activa" }); }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#16A34A", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Publicar</button>
                )}
                {selectedPromo.status === "activa" && (
                  <button onClick={() => { handleStatusChange(selectedPromo.id, "pausada"); setSelectedPromo({ ...selectedPromo, status: "pausada" }); }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Pausar</button>
                )}
                {selectedPromo.status === "pausada" && (
                  <button onClick={() => { handleStatusChange(selectedPromo.id, "activa"); setSelectedPromo({ ...selectedPromo, status: "activa" }); }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#16A34A", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Reactivar</button>
                )}
                {selectedPromo.status !== "finalizada" && (
                  <button onClick={() => { handleStatusChange(selectedPromo.id, "finalizada"); setSelectedPromo({ ...selectedPromo, status: "finalizada" }); }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${t.colors.border}`, background: "transparent", color: t.colors.textMuted, fontSize: 12, cursor: "pointer" }}>Finalizar</button>
                )}
                {selectedPromo.type === "rifa" && (
                  <button onClick={() => handleDraw(selectedPromo.id)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>🎲 Sortear ganador</button>
                )}
                <button onClick={() => handleDelete(selectedPromo.id)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>Eliminar</button>
              </div>

              {/* Info */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: t.colors.textMuted }}>{selectedPromo.description}</p>
                <p style={{ fontSize: 12, color: t.colors.textFaint, marginTop: 4 }}>{fmtDate(selectedPromo.starts_at)} → {fmtDate(selectedPromo.ends_at)}</p>
              </div>

              {/* Participants */}
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: t.colors.text, marginBottom: 12 }}>
                  Participantes ({participants.length})
                </p>
                {loadingParts ? (
                  <p style={{ fontSize: 13, color: t.colors.textMuted }}>Cargando...</p>
                ) : participants.length === 0 ? (
                  <p style={{ fontSize: 13, color: t.colors.textFaint }}>Sin participantes todavía</p>
                ) : (
                  <div style={{ maxHeight: 300, overflow: "auto" }}>
                    {participants.map(p => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${t.colors.border}` }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: t.colors.text, margin: 0 }}>{p.client_name}</p>
                          <p style={{ fontSize: 11, color: t.colors.textFaint, margin: 0 }}>{p.client_phone}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                            background: p.result === "ganador" ? "#DCFCE7" : p.result === "no_ganador" ? "#FEE2E2" : "#F3F4F6",
                            color: p.result === "ganador" ? "#16A34A" : p.result === "no_ganador" ? "#DC2626" : "#6B7280",
                          }}>
                            {p.result === "ganador" ? "GANADOR" : p.result === "no_ganador" ? "No ganó" : "Pendiente"}
                          </span>
                          {p.entry_data && (
                            <p style={{ fontSize: 10, color: t.colors.textFaint, margin: "2px 0 0" }}>
                              {p.entry_data.number_assigned ? `#${p.entry_data.number_assigned}` : ""}
                              {p.entry_data.prize_won ? `Premio: ${p.entry_data.prize_won}` : ""}
                              {p.entry_data.score !== undefined ? `Score: ${p.entry_data.score}/${p.entry_data.total}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
