"use client";
import { apiUrl } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// ── DB types ──────────────────────────────────────────────────────────────────
interface DBService {
  id: number; title: string; type: string; duration: string | null;
  price: number | null; icon: string | null; description: string;
  highlights: string[]; image: string | null; before_image: string | null;
  is_active: boolean;
}

function LazyVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { video.load(); video.play().catch(() => {}); }
        else { video.pause(); video.currentTime = 0; }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-carbon group">
      <video ref={ref} src={src} className="w-full h-full object-cover" loop muted playsInline preload="none" />
      <div className="absolute inset-0 bg-gradient-to-t from-vino/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="text-white text-xs font-semibold tracking-wide">{label}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
    </div>
  );
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

const WHATSAPP = "573042741979";

const ESTILISTAS = [
  {
    id: "shelie",
    name: "Shelie",
    role: "Fundadora · Especialista en Alisados",
    specialty: ["Alisado Orgánico", "Botox Capilar", "Sheliss Therapy"],
    initials: "S",
    color: "#D93879",
    image: "/images/services/resultado-1.jpg",
  },
  {
    id: "valentina",
    name: "Valentina",
    role: "Especialista en Tratamientos Capilares",
    specialty: ["Reconstrucción", "Repolarización", "Terapia Scalp"],
    initials: "V",
    color: "#5E0B2B",
    image: "/images/services/resultado-2.jpg",
  },
];

const SERVICIOS_MENU = [
  { name: "Alisado Orgánico Efecto Shelie's",      price: 350000 },
  { name: "Botox Capilar Canela",                  price: 280000 },
  { name: "Terapia Total Scalp",                   price: 220000 },
  { name: "Terapia de Reconstrucción",             price: 200000 },
  { name: "Repolarización — Cronograma Capilar",   price: 180000 },
  { name: "Nano Cristalización (+$50.000)",        price: 50000  },
  { name: "Corte Bordado (+$40.000)",              price: 40000  },
  { name: "Luz Fotónica / Infrarroja (+$40.000)", price: 40000  },
  { name: "Terapia de Ozono (+$50.000)",           price: 50000  },
];

const TIME_SLOTS = [
  { label: "8:00 AM",  value: "08:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "4:00 PM",  value: "16:00" },
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// Imágenes mapeadas correctamente — sin repeticiones entre procesos
const procesosCapilares = [
  {
    id: "alisado-organico",
    title: "Alisado Orgánico Efecto Shelie's",
    tagline: "Transformación total en una sesión",
    description:
      "Procedimiento de alisado y reparación — liso perfecto y transformación capilar. Enriquecido con aceite de MURUMURU, aminoácidos que reparan y nutren, y aceite de AGUACATE. Activo alisador: TANINO. 0% Formol. 100% Orgánico.",
    duration: "5–6 meses",
    image: "/images/services/resultado-3.jpg",   // cabello lacio espectacular desde atrás
    before: "/images/services/antes-2.jpg",       // cabello frizzy, ángulo completo del salón
    highlights: [
      "0% Formol — sin vapores tóxicos",
      "100% Orgánico (activo: TANINO)",
      "Apto embarazadas, lactantes y niñas +6 años",
      "No se plancha con el producto aplicado",
    ],
  },
  {
    id: "botox-capilar",
    title: "Botox Capilar Canela",
    tagline: "Restauración profunda · Brillo extremo · Efecto anti-edad",
    description:
      "Multibeneficios para todo tipo de hebra, especialmente las más procesadas y maltratadas. Ingredientes: Canela, Moringa y Argán. Precio según largo y densidad del cabello.",
    duration: "1–2 meses",
    image: "/images/services/resultado-1.jpg",
    before: "/images/services/antes-1.jpg",
    highlights: [
      "Restauración y brillo intenso",
      "Hidratación profunda capilar",
      "Efecto anti-edad capilar",
      "Para cabellos sin vida y sin movimiento",
    ],
  },
  {
    id: "terapia-scalp",
    title: "Terapia Total Scalp",
    tagline: "Cuero cabelludo sano = cabello fuerte",
    description:
      "Tratamiento dirigido al cuero cabelludo. Alivia irritaciones, dermatitis seborreica, alopecia y caída excesiva. Estimula el crecimiento y desintoxica el folículo piloso.",
    duration: "Según valoración",
    image: "/images/services/aplicacion-1.jpg",
    before: undefined,
    highlights: [
      "Alivia dermatitis seborreica",
      "Combate alopecia y caída excesiva",
      "Desintoxica el cuero cabelludo",
      "Estimula el crecimiento capilar",
    ],
  },
  {
    id: "reconstruccion",
    title: "Terapia de Reconstrucción",
    tagline: "Hasta 80% de recuperación en la primera sesión",
    description:
      "Fórmula con la misma composición del cabello. Vitamina B7, biotina, keratina, péptidos y proteínas al córtex capilar. Para cabellos sin elasticidad (efecto chicle). NO ALISA.",
    duration: "1 sesión",
    image: "/images/services/resultado-modelo-1.jpg",
    before: "/images/services/antes-3.jpg",           // cabello frizzy, ángulo lateral diferente
    highlights: [
      "Penetra directamente al córtex capilar",
      "Recupera elasticidad 60–80%",
      "Para cabello efecto chicle",
      "Resultados inmediatos y visibles",
    ],
  },
  {
    id: "repolarizacion",
    title: "Repolarización — Cronograma Capilar",
    tagline: "Brillo extremo y suavidad restaurada",
    description:
      "Procedimiento reparador y nutritivo para todo tipo de hebra. Recupera el brillo, la suavidad y la vida de las hebras más maltratadas, procesadas y secas. Durabilidad 1–2 meses.",
    duration: "1–2 meses",
    image: "/images/services/aplicacion-2.jpg",
    before: undefined,
    highlights: [
      "Para cabellos procesados y secos",
      "Brillo extremo y suavidad inmediata",
      "Durabilidad hasta 2 meses",
      "Complementar con productos en casa",
    ],
  },
];

// Adicionales — fondos gradient, sin repetir fotos
const adicionales = [
  { id: "nano",    title: "Nano Cristalización",     price: "$50.000", icon: "⚡", from: "#D93879", to: "#5E0B2B", description: "Potencializa cualquier tratamiento. Brillo tridimensional y flexibilidad capilar." },
  { id: "corte",   title: "Corte Bordado",            price: "$40.000", icon: "✂️", from: "#FF70BA", to: "#D93879", description: "Retira la horquilla sin afectar la longitud. Oxigena el cabello para crecimiento sano." },
  { id: "luz",     title: "Luz Fotónica / Infrarroja",price: "$40.000", icon: "🔵", from: "#5E0B2B", to: "#3B1280", description: "Alisa la cutícula, elimina el frizz y promueve la circulación del cuero cabelludo." },
  { id: "ozono",   title: "Terapia de Ozono",         price: "$50.000", icon: "💨", from: "#0D7377", to: "#5E0B2B", description: "Limpieza profunda del folículo. Regenera la dermis, sana la cutícula, promueve el crecimiento." },
];

// ── BEFORE / AFTER SLIDER ─────────────────────────────────────────────────────

function BeforeAfterSlider() {
  const [pos, setPos] = useState(50);

  return (
    <div
      className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl cursor-ew-resize select-none"
      style={{ aspectRatio: "4/3" }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos(Math.min(94, Math.max(6, ((e.clientX - r.left) / r.width) * 100)));
      }}
      onTouchMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos(Math.min(94, Math.max(6, ((e.touches[0].clientX - r.left) / r.width) * 100)));
      }}
    >
      {/* AFTER — cabello lacio */}
      <Image src="/images/services/resultado-3.jpg" alt="Después" fill className="object-cover object-top" sizes="100vw" priority />

      {/* BEFORE — cabello frizzy, recortado a la izquierda */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src="/images/services/antes-2.jpg" alt="Antes" fill className="object-cover object-top" sizes="100vw" priority />
      </div>

      {/* Divider */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
        style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white shadow-xl border-2 border-white/80 flex items-center justify-center">
          <span className="text-vino font-black text-sm leading-none">◀▶</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-5 left-5 bg-carbon/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider pointer-events-none">
        Antes
      </div>
      <div className="absolute bottom-5 right-5 bg-fucsia/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider pointer-events-none">
        Después
      </div>
    </div>
  );
}

// ── MINI CALENDAR ─────────────────────────────────────────────────────────────

function MiniCalendar({ selected, onSelect }: { selected: string | null; onSelect: (d: string) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const y = view.getFullYear(), m = view.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function iso(day: number) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function disabled(day: number) {
    const d = new Date(y, m, day);
    const dow = d.getDay();
    return d < today; // abierto lunes a domingo
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setView(new Date(y, m - 1, 1))}
          className="w-8 h-8 rounded-lg hover:bg-blush flex items-center justify-center text-vino font-bold text-lg transition-colors">‹</button>
        <span className="font-poppins font-semibold text-sm text-carbon">{MESES[m]} {y}</span>
        <button onClick={() => setView(new Date(y, m + 1, 1))}
          className="w-8 h-8 rounded-lg hover:bg-blush flex items-center justify-center text-vino font-bold text-lg transition-colors">›</button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DIAS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-humo/60 uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const key = iso(day);
          const off = disabled(day);
          const sel = selected === key;
          return (
            <button key={key} disabled={off} onClick={() => onSelect(key)}
              className={`aspect-square rounded-xl text-sm font-medium transition-all duration-150 ${
                off ? "text-humo/25 cursor-not-allowed" :
                sel ? "bg-vino text-white shadow-md scale-110 font-bold" :
                "hover:bg-blush text-carbon"
              }`}>
              {day}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-humo mt-3 text-center">Atención: Lunes a Domingo</p>
    </div>
  );
}

// ── BOOKING MODAL ─────────────────────────────────────────────────────────────

type BData = { servicio: string; precio: number; estilista: string; fecha: string | null; hora: string | null; nombre: string; telefono: string; email: string };

function BookingModal({ initial, onClose, serviciosMenu, estilistasMenu }: { initial?: string; onClose: () => void; serviciosMenu?: { name: string; price: number }[]; estilistasMenu?: typeof ESTILISTAS }) {
  const MENU = serviciosMenu ?? SERVICIOS_MENU;
  const ESTILISTAS_LIST = estilistasMenu ?? ESTILISTAS;
  const [step, setStep] = useState(1);
  const [d, setD] = useState<BData>({ servicio: initial || "", precio: 0, estilista: "", fecha: null, hora: null, nombre: "", telefono: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const STEPS = 5;

  function fmtFecha(iso: string) {
    const [y, mo, day] = iso.split("-").map(Number);
    const dt = new Date(y, mo - 1, day);
    return `${DIAS[dt.getDay()]} ${day} de ${MESES[mo - 1]}`;
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/appointments/create-preference"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicio:     d.servicio,
          estilista:    d.estilista,
          fecha:        d.fecha,
          hora:         d.hora,
          client_name:  d.nombre,
          client_phone: d.telefono,
          client_email: d.email,
          precio:       d.precio,
        }),
      });
      const data = await res.json() as { init_point?: string; sandbox_init_point?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al procesar");
      // Redirigir a MercadoPago
      const url = data.init_point ?? data.sandbox_init_point;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  function googleLink() {
    if (!d.fecha || !d.hora) return "#";
    const [y, mo, day] = d.fecha.split("-").map(Number);
    const [h, min] = d.hora.split(":").map(Number);
    const s = new Date(y, mo - 1, day, h, min);
    const e = new Date(y, mo - 1, day, h + 2, min);
    const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").split(".")[0];
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Cita Shelie's — ${d.servicio}`)}&dates=${fmt(s)}/${fmt(e)}&details=${encodeURIComponent(`Servicio: ${d.servicio}\nEspecialista: ${d.estilista}`)}&location=${encodeURIComponent("Shelie's Hair Professional")}`;
  }

  function downloadICS() {
    if (!d.fecha || !d.hora) return;
    const [y, mo, day] = d.fecha.split("-").map(Number);
    const [h, min] = d.hora.split(":").map(Number);
    const s = new Date(y, mo - 1, day, h, min);
    const e = new Date(y, mo - 1, day, h + 2, min);
    const fmt = (dt: Date) => dt.toISOString().replace(/[-:.]/g, "").slice(0, 15);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shelies//ES",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(s)}`, `DTEND:${fmt(e)}`,
      `SUMMARY:Cita en Shelie's Hair Professional`,
      `DESCRIPTION:Servicio: ${d.servicio}\\nEspecialista: ${d.estilista}`,
      `LOCATION:Shelie's Hair Professional`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cita-shelies.ics"; a.click();
    URL.revokeObjectURL(url);
  }

  function canNext() {
    if (step === 1) return !!d.servicio;
    if (step === 2) return !!d.estilista;
    if (step === 3) return !!d.fecha;
    if (step === 4) return d.nombre.trim().length > 1 && d.telefono.replace(/\D/g, "").length >= 7 && d.email.includes("@");
    return true;
  }

  const inp = "w-full border-2 border-blush/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-fucsia transition-colors bg-white text-carbon";
  const lbl = "text-xs font-semibold text-humo uppercase tracking-wider block mb-2";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-blush/40 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-poppins font-bold text-xl text-carbon">Agendar Cita</h2>
              <p className="text-xs text-humo mt-0.5">Paso {step} de {STEPS}</p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-blush/40 flex items-center justify-center text-humo hover:bg-blush transition-colors text-lg leading-none">×</button>
          </div>
          <div className="h-1.5 bg-blush/40 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS) * 100}%`, background: "linear-gradient(135deg, #D93879, #5E0B2B)" }} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* STEP 1 — Servicio */}
          {step === 1 && (
            <div>
              <h3 className="font-poppins font-semibold text-base text-carbon mb-4">¿Qué servicio necesitas?</h3>
              <div className="space-y-2">
                {MENU.map((s) => (
                  <button key={s.name} onClick={() => setD((p) => ({ ...p, servicio: s.name, precio: s.price }))}
                    className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                      d.servicio === s.name ? "border-fucsia bg-fucsia/5 text-fucsia" : "border-blush/60 text-carbon hover:border-rosa"
                    }`}>
                    <div className="flex items-center justify-between">
                      <span>{d.servicio === s.name && <span className="mr-2 text-fucsia font-bold">✓</span>}{s.name}</span>
                      <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${d.servicio === s.name ? "text-fucsia" : "text-humo"}`}>
                        ${s.price.toLocaleString("es-CO")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Estilista */}
          {step === 2 && (
            <div>
              <h3 className="font-poppins font-semibold text-base text-carbon mb-4">¿Con quién quieres tu cita?</h3>
              <div className="space-y-3">
                {ESTILISTAS_LIST.map((e) => (
                  <button key={e.id} onClick={() => setD((p) => ({ ...p, estilista: e.name }))}
                    className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                      d.estilista === e.name ? "border-fucsia bg-fucsia/5" : "border-blush/60 hover:border-rosa"
                    }`}>
                    {/* Avatar with real photo */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                      <Image src={e.image} alt={e.name} fill className="object-cover object-top" sizes="64px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-poppins font-bold text-carbon">{e.name}</p>
                      <p className="text-xs text-humo mt-0.5">{e.role}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.specialty.map((sp) => (
                          <span key={sp} className="text-[10px] bg-blush text-vino px-2 py-0.5 rounded-full font-medium">{sp}</span>
                        ))}
                      </div>
                    </div>
                    {d.estilista === e.name && (
                      <div className="w-7 h-7 rounded-full bg-fucsia flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Fecha y Hora */}
          {step === 3 && (
            <div>
              <h3 className="font-poppins font-semibold text-base text-carbon mb-4">Selecciona fecha y hora</h3>
              <div className="bg-blush-light rounded-2xl p-4 mb-5">
                <MiniCalendar selected={d.fecha} onSelect={(dt) => setD((p) => ({ ...p, fecha: dt, hora: null }))} />
              </div>
              {d.fecha && (
                <div>
                  <p className="text-xs font-semibold text-humo uppercase tracking-wider mb-3">
                    {fmtFecha(d.fecha)} — {d.hora ? "Hora seleccionada ✓" : "Elige un horario"}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button key={slot.value} onClick={() => setD((p) => ({ ...p, hora: slot.value }))}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          d.hora === slot.value
                            ? "bg-vino border-vino text-white shadow-md scale-105"
                            : "border-blush/60 text-carbon hover:border-fucsia hover:text-fucsia"
                        }`}>
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Datos */}
          {step === 4 && (
            <div>
              <h3 className="font-poppins font-semibold text-base text-carbon mb-5">Tus datos para la cita</h3>
              <div className="space-y-4">
                <div>
                  <label className={lbl}>Nombre completo</label>
                  <input value={d.nombre} onChange={(e) => setD((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="¿Cómo te llamamos?" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Número WhatsApp</label>
                  <input value={d.telefono} onChange={(e) => setD((p) => ({ ...p, telefono: e.target.value }))}
                    placeholder="3XX XXX XXXX" type="tel" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Email *</label>
                  <input value={d.email} onChange={(e) => setD((p) => ({ ...p, email: e.target.value }))}
                    placeholder="tu@email.com" type="email" className={inp} />
                  <p className="text-[11px] text-humo mt-1.5">Necesario para el recibo de pago. Tu información es solo para la cita.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — Pago seña */}
          {step === 5 && (
            <div>
              {submitting ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-blush border-t-fucsia animate-spin" />
                  <p className="text-sm text-humo">Preparando tu pago...</p>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: "linear-gradient(135deg,#D93879,#5E0B2B)" }}>
                      <span className="text-3xl">💳</span>
                    </div>
                    <h3 className="font-poppins font-bold text-xl text-carbon">¡Listo, {d.nombre.split(" ")[0]}!</h3>
                    <p className="text-sm text-humo mt-1 max-w-xs mx-auto">
                      Revisa el resumen y paga la seña para confirmar tu cita.
                    </p>
                  </div>

                  {/* Resumen */}
                  <div className="bg-blush-light rounded-2xl p-5 mb-4 space-y-3">
                    {[
                      { label: "Servicio",     value: d.servicio },
                      { label: "Especialista", value: d.estilista },
                      { label: "Fecha",        value: d.fecha ? fmtFecha(d.fecha) : "" },
                      { label: "Hora",         value: TIME_SLOTS.find((t) => t.value === d.hora)?.label || "" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-start justify-between gap-3">
                        <span className="text-xs font-semibold text-humo uppercase tracking-wider flex-shrink-0">{r.label}</span>
                        <span className="text-sm font-medium text-carbon text-right">{r.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Desglose de pago */}
                  <div className="bg-vino/5 border border-vino/20 rounded-2xl p-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-humo">Valor del servicio</span>
                      <span className="font-medium text-carbon">${d.precio.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t border-vino/20 pt-2 mt-2">
                      <span className="text-vino">Seña a pagar ahora</span>
                      <span className="text-vino">$30.000</span>
                    </div>
                    <p className="text-[11px] text-humo mt-1">El resto se paga el día de tu cita.</p>
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 text-white font-poppins font-bold py-4 rounded-2xl text-sm shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#D93879,#5E0B2B)" }}
                  >
                    {submitting ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Procesando...</>
                    ) : (
                      <><span className="text-xl">💳</span>Pagar seña con MercadoPago</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 5 && (
          <div className="px-6 py-4 border-t border-blush/40 flex gap-3 flex-shrink-0 bg-white">
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="px-5 py-3 rounded-2xl border-2 border-blush text-carbon font-semibold text-sm hover:border-fucsia transition-colors">
                ← Atrás
              </button>
            )}
            <button onClick={() => {
                if (step === 3 && !d.hora) {
                  alert("Selecciona un horario para continuar");
                  return;
                }
                setStep((s) => s + 1);
              }} disabled={!canNext()}
              className={`flex-1 py-3 rounded-2xl font-poppins font-bold text-sm transition-all ${
                canNext() ? "text-white shadow-md hover:opacity-90" : "bg-blush/50 text-humo cursor-not-allowed"
              }`}
              style={canNext() ? { background: "linear-gradient(135deg,#D93879,#5E0B2B)" } : {}}>
              {step === 4 ? "Ver resumen →" : "Siguiente →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function ServiciosPage() {
  const [booking, setBooking] = useState<{ open: boolean; initial?: string }>({ open: false });
  const open = (initial?: string) => setBooking({ open: true, initial });

  const [dbProcesos, setDbProcesos] = useState<DBService[] | null>(null);
  const [dbAdicionales, setDbAdicionales] = useState<DBService[] | null>(null);
  const [menuServicios, setMenuServicios] = useState(SERVICIOS_MENU);
  const [estilistasDB, setEstilistasDB] = useState(ESTILISTAS);

  useEffect(() => {
    fetch(apiUrl("/api/services"))
      .then((r) => r.json())
      .then((d: { success: boolean; data: DBService[] }) => {
        if (d.success) {
          setDbProcesos(d.data.filter((s) => s.type === "proceso" && s.is_active));
          setDbAdicionales(d.data.filter((s) => s.type === "adicional" && s.is_active));
          const allServices = d.data.filter((s) => s.is_active && s.price);
          if (allServices.length > 0) {
            setMenuServicios(allServices.map((s) => ({ name: s.title, price: s.price! })));
          }
        }
      })
      .catch(() => {});
    // Cargar estilistas desde API
    fetch(apiUrl("/api/services/stylists/list"))
      .then(r => r.json())
      .then((d: { success?: boolean; data?: Array<{ id: number; name: string; role: string; photo: string | null; specialties: string[]; is_active: boolean }> }) => {
        const arr = d.data ?? (Array.isArray(d) ? d as Array<{ id: number; name: string; role: string; photo: string | null; specialties: string[]; is_active: boolean }> : []);
        const active = arr.filter(s => s.is_active !== false);
        if (active.length > 0) {
          setEstilistasDB(active.map((s, i) => ({
            id: String(s.id),
            name: s.name,
            role: s.role || "Estilista",
            specialty: s.specialties ?? [],
            initials: s.name.charAt(0),
            color: i % 2 === 0 ? "#D93879" : "#5E0B2B",
            image: s.photo || "/images/services/resultado-1.jpg",
          })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-blush-light min-h-screen pb-20 sm:pb-0">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#5E0B2B 0%,#D93879 60%,#FF70BA 100%)" }}>
        {/* Dot texture */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #FFF0F5 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
          <span className="inline-block text-blush/70 text-[11px] font-semibold uppercase tracking-[0.35em] mb-5">
            ✦ Shelie's Hair Professional ✦
          </span>
          <h1 className="font-poppins font-bold text-5xl sm:text-6xl text-white leading-[1.1] mb-5">
            Tu mejor versión.<br />
            <em className="not-italic text-blush">Cada visita.</em>
          </h1>
          <p className="text-white/70 text-base max-w-md mx-auto leading-relaxed mb-9">
            Especialistas en alisados orgánicos y reparación capilar con técnicas exclusivas
            y productos importados de Brasil.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <button onClick={() => open()}
              className="bg-white text-vino font-poppins font-bold px-9 py-4 rounded-full shadow-xl hover:scale-105 transition-transform text-sm">
              📅 Agendar Cita — Es gratis
            </button>
            <a href="#servicios"
              className="bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-9 py-4 rounded-full text-sm hover:bg-white/25 transition-colors">
              Ver servicios ↓
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {["100% Orgánico", "0% Formol", "Tecnología brasileña", "Resultados garantizados"].map((b) => (
              <span key={b} className="text-[11px] bg-white/10 border border-white/20 text-white/85 px-4 py-1.5 rounded-full">
                ✓ {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ANTES / DESPUÉS ── */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-carbon mb-2">
            La Transformación Shelie&apos;s
          </h2>
          <p className="text-humo text-sm">Arrastra el divisor para comparar · La misma persona, una sesión de diferencia</p>
        </div>
        <BeforeAfterSlider />
        <p className="text-center text-xs text-humo mt-4">
          ¿Listo para tu transformación?{" "}
          <button onClick={() => open()} className="text-fucsia font-semibold hover:underline">Agenda tu cita aquí →</button>
        </p>
      </div>

      {/* ── PROCESOS CAPILARES ── */}
      <div id="servicios" className="max-w-5xl mx-auto px-4 pb-10">
        <div className="mb-10">
          <h2 className="font-poppins font-bold text-3xl text-carbon border-l-4 border-fucsia pl-4">
            Procesos Capilares
          </h2>
          <p className="text-humo text-sm mt-2 pl-5">Tratamientos profesionales con resultados duraderos</p>
        </div>

        <div className="space-y-12">
          {(dbProcesos
            ? dbProcesos.map((s) => ({
                id: s.id.toString(),
                title: s.title,
                tagline: "",
                description: s.description,
                image: s.image ?? "/images/services/resultado-3.jpg",
                before: s.before_image ?? undefined,
                highlights: s.highlights,
                duration: s.duration ?? "",
              }))
            : procesosCapilares
          ).map((s, i) => {
            const imgSrc = s.image ?? "/images/services/resultado-3.jpg";
            const beforeSrc = s.before ?? undefined;
            const isAbsoluteImg = imgSrc.startsWith("http") || imgSrc.startsWith("/uploads");
            const isAbsoluteBefore = beforeSrc && (beforeSrc.startsWith("http") || beforeSrc.startsWith("/uploads"));
            return (
            <div
              key={s.id}
              className={`card-premium overflow-hidden flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              {/* Imagen */}
              <div className="relative w-full md:w-[42%] flex-shrink-0 min-h-[300px] sm:min-h-[360px]">
                {isAbsoluteImg ? (
                  <img src={imgSrc} alt={s.title} className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                ) : (
                  <Image src={imgSrc} alt={s.title} fill className="object-cover" sizes="(max-width:768px) 100vw,42vw" loading={i === 0 ? "eager" : "lazy"} />
                )}
                {/* Duration */}
                {s.duration && (
                  <div className="absolute top-4 left-4 bg-carbon/75 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full tracking-wide">
                    ⏱ {s.duration}
                  </div>
                )}
                {/* Before thumbnail — solo cuando es diferente de la imagen principal */}
                {beforeSrc && (
                  <div className="absolute bottom-4 left-4 w-[72px] h-[88px] rounded-xl overflow-hidden border-2 border-white shadow-xl">
                    {isAbsoluteBefore ? (
                      <img src={beforeSrc} alt="Antes" className="absolute inset-0 w-full h-full object-cover object-top" loading="lazy" />
                    ) : (
                      <Image src={beforeSrc} alt="Antes" fill className="object-cover object-top" sizes="72px" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-carbon/50 flex items-end justify-center pb-1.5">
                      <span className="text-white text-[9px] font-bold uppercase tracking-wider">Antes</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 p-7 sm:p-9 flex flex-col justify-center">
                {s.tagline && <p className="text-fucsia text-[11px] font-bold uppercase tracking-[0.2em] mb-2">{s.tagline}</p>}
                <h3 className="font-poppins font-bold text-2xl text-carbon mb-3">{s.title}</h3>
                <p className="text-humo text-sm leading-relaxed mb-5">{s.description}</p>
                <ul className="space-y-2.5 mb-7">
                  {s.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-sm text-carbon">
                      <span className="w-5 h-5 rounded-full bg-fucsia/10 text-fucsia flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
                <button onClick={() => open(s.title)}
                  className="btn-vino self-start text-sm">
                  Agendar este servicio →
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* ── ADICIONALES ── */}
        <div className="mt-20">
          <div className="mb-8">
            <h2 className="font-poppins font-bold text-3xl text-carbon border-l-4 border-rosa pl-4">
              Adicionales
            </h2>
            <p className="text-humo text-sm mt-2 pl-5">Potencia cualquier proceso con estas terapias complementarias</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {(dbAdicionales
              ? dbAdicionales.map((s) => ({
                  id: s.id.toString(),
                  title: s.title,
                  icon: s.icon ?? "✨",
                  price: s.price ? "$" + s.price.toLocaleString("es-CO") : "",
                  description: s.description,
                  from: "#D93879",
                  to: "#5E0B2B",
                }))
              : adicionales
            ).map((a) => (
              <div key={a.id} className="rounded-2xl p-6 text-white relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}>
                {/* Decorative circle */}
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{a.icon}</span>
                    {a.price && <span className="text-sm font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{a.price}</span>}
                  </div>
                  <h3 className="font-poppins font-bold text-lg mb-2">{a.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed mb-5">{a.description}</p>
                  <button onClick={() => open(`${a.title}${a.price ? " (" + a.price + ")" : ""}`)}
                    className="text-xs bg-white/20 hover:bg-white/30 border border-white/30 px-5 py-2 rounded-full font-semibold transition-colors">
                    Añadir a mi cita →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── REELS ── */}
        <div className="mt-20">
          <div className="mb-8 text-center">
            <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-carbon mb-2">
              Míralo en acción
            </h2>
            <p className="text-humo text-sm">Resultados reales que hablan por sí solos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { src: "/videos/reel-2.mp4", label: "Transformación capilar" },
              { src: "/videos/reel-4.mp4", label: "Alisado orgánico Shelie's" },
              { src: "/videos/reel-5.mp4", label: "Resultados garantizados" },
            ].map((reel) => (
              <LazyVideo key={reel.src} src={reel.src} label={reel.label} />
            ))}
          </div>
        </div>

        {/* ── CTA FINAL ── */}
        <div className="mt-16 rounded-3xl p-10 sm:p-14 text-center text-white overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#5E0B2B,#D93879)" }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, #FFF0F5 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <p className="text-blush/70 text-[11px] font-semibold uppercase tracking-[0.3em] mb-3">¿Tienes dudas?</p>
            <h2 className="font-poppins font-bold text-2xl sm:text-3xl mb-3">
              La asesoría es gratis
            </h2>
            <p className="text-white/70 text-sm mb-8 max-w-sm mx-auto">
              Escríbenos y te ayudamos a encontrar el tratamiento perfecto para tu tipo de cabello.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => open()}
                className="bg-white text-vino font-poppins font-bold px-9 py-3.5 rounded-full text-sm hover:scale-105 transition-transform shadow-lg">
                📅 Agendar Cita
              </button>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                className="bg-white/15 border border-white/30 text-white font-semibold px-9 py-3.5 rounded-full text-sm hover:bg-white/25 transition-colors">
                💬 WhatsApp Directo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY CTA MOBILE ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-blush/60 shadow-2xl px-4 py-3">
        <button onClick={() => open()}
          className="w-full text-white font-poppins font-bold py-3.5 rounded-2xl text-sm shadow-md"
          style={{ background: "linear-gradient(135deg,#D93879,#5E0B2B)" }}>
          📅 Agendar Cita — Es gratis
        </button>
      </div>

      {/* Modal */}
      {booking.open && <BookingModal initial={booking.initial} onClose={() => setBooking({ open: false })} serviciosMenu={menuServicios} estilistasMenu={estilistasDB} />}
    </div>
  );
}
