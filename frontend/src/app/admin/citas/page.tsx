"use client";
import { apiUrl, authedFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { useAdminTheme } from "@/lib/admin-theme";

type Cita = {
  id: string;
  servicio: string;
  estilista: string;
  fecha: string;
  hora: string;
  nombre: string;
  telefono: string;
  estado: string;
  creadoEn: string;
};

const HORAS = ["08:00","12:00","16:00"];
const HORA_LABELS: Record<string,string> = {
  "08:00":"8AM","12:00":"12PM","16:00":"4PM"
};
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getWeekDates(base: Date): Date[] {
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay()); // Sunday
  return Array.from({length: 7}, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function AdminCitas() {
  const t = useAdminTheme();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [weekBase, setWeekBase] = useState(new Date());
  const [selected, setSelected] = useState<Cita | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("shelies_citas") || "[]");
      setCitas(stored);
    } catch {}
    // Also fetch from API
    authedFetch(apiUrl("/api/appointments"))
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.length) {
          const apiCitas: Cita[] = data.data.map((a: any) => ({
            id: String(a.id),
            servicio: a.notes?.split(" | ")[0]?.replace("Servicio: ","") || a.service_name || "",
            estilista: a.notes?.split(" | ")[1]?.replace("Especialista: ","") || a.stylist_name || "",
            fecha: a.date?.split("T")[0] || a.date || "",
            hora: a.time_slot || "",
            nombre: a.client_name || "",
            telefono: a.client_phone || "",
            estado: a.status || "confirmada",
            creadoEn: a.created_at || "",
          }));
          setCitas(prev => {
            // Merge: API citas take precedence, keep localStorage-only ones
            const apiIds = new Set(apiCitas.map(c => c.id));
            const localOnly = prev.filter(c => !c.id.startsWith("cita-") || !apiIds.has(c.id));
            return [...apiCitas, ...localOnly];
          });
        }
      })
      .catch(() => {});
  }, []);

  const weekDates = getWeekDates(weekBase);
  const today = isoDate(new Date());

  function citasForSlot(fecha: string, hora: string): Cita[] {
    return citas.filter(c => c.fecha === fecha && c.hora === hora);
  }

  function prevWeek() {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  }
  function nextWeek() {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  }

  const totalSemana = citas.filter(c => weekDates.some(d => isoDate(d) === c.fecha)).length;
  const proximasCitas = [...citas]
    .filter(c => c.fecha >= today)
    .sort((a,b) => (a.fecha+a.hora).localeCompare(b.fecha+b.hora))
    .slice(0,10);

  return (
    <div className={`${t.bg} min-h-screen p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`font-poppins font-bold text-2xl ${t.text}`}>Calendario de Citas</h1>
          <p className={`text-sm mt-1 ${t.textMuted}`}>{citas.length} cita{citas.length !== 1 ? "s" : ""} registradas · {totalSemana} esta semana</p>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={prevWeek} className={`px-3 py-2 rounded-xl border ${t.border} ${t.textMuted} ${t.bgHover} text-sm`}>← Anterior</button>
        <span className={`font-semibold text-sm ${t.text}`}>
          {weekDates[0].getDate()} {MESES[weekDates[0].getMonth()]} – {weekDates[6].getDate()} {MESES[weekDates[6].getMonth()]} {weekDates[0].getFullYear()}
        </span>
        <button onClick={nextWeek} className={`px-3 py-2 rounded-xl border ${t.border} ${t.textMuted} ${t.bgHover} text-sm`}>Siguiente →</button>
        <button onClick={() => setWeekBase(new Date())} className={`px-3 py-2 rounded-xl ${t.bgCard} ${t.border} border ${t.text} text-sm font-medium ${t.bgHover}`}>Hoy</button>
      </div>

      {/* Calendar grid */}
      <div className={`overflow-x-auto pb-2 rounded-2xl ${t.bgCard} border ${t.border} p-3`}>
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className={`${t.textFaint} text-xs p-2`} />
            {weekDates.map((d, i) => {
              const iso = isoDate(d);
              const isToday = iso === today;
              const hasCitas = citas.some(c => c.fecha === iso);
              return (
                <div key={i} className={`text-center p-2 rounded-xl text-xs font-semibold ${isToday ? "bg-fucsia/20 text-fucsia" : t.textMuted}`}>
                  <div>{DIAS_SEMANA[d.getDay()]}</div>
                  <div className={`text-base font-bold mt-0.5 ${isToday ? "text-fucsia" : t.text}`}>{d.getDate()}</div>
                  {hasCitas && <div className="w-1.5 h-1.5 rounded-full bg-fucsia mx-auto mt-1" />}
                </div>
              );
            })}
          </div>

          {/* Time slot rows */}
          {HORAS.map(hora => (
            <div key={hora} className="grid grid-cols-8 gap-1 mb-1">
              <div className={`${t.textFaint} text-xs p-2 pt-3 text-right`}>{HORA_LABELS[hora]}</div>
              {weekDates.map((d, i) => {
                const iso = isoDate(d);
                const slot = citasForSlot(iso, hora);
                return (
                  <div key={i} className={`min-h-[52px] rounded-lg border ${iso === today ? "border-fucsia/20 bg-fucsia/5" : t.border} p-1`}>
                    {slot.map(cita => (
                      <button key={cita.id} onClick={() => setSelected(cita)}
                        className="w-full text-left text-[10px] leading-tight rounded-md p-1.5 text-white font-medium hover:opacity-90 transition-opacity"
                        style={{ background: "linear-gradient(135deg,#D93879,#5E0B2B)" }}>
                        <div className="font-bold truncate">{cita.nombre.split(" ")[0]}</div>
                        <div className="opacity-80 truncate">{cita.servicio.split(" ").slice(0,2).join(" ")}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Próximas citas list */}
      <div className="mt-8">
        <h2 className={`font-bold text-base ${t.text} mb-3`}>Próximas citas</h2>
        {proximasCitas.length === 0 ? (
          <p className={`${t.textMuted} text-sm`}>No hay citas agendadas aún.</p>
        ) : (
          <div className="space-y-2">
            {proximasCitas.map(cita => {
              const [y,mo,day] = cita.fecha.split("-").map(Number);
              const dateLabel = `${DIAS_SEMANA[new Date(y,mo-1,day).getDay()]} ${day} ${MESES[mo-1]}`;
              return (
                <div key={cita.id} onClick={() => setSelected(cita)}
                  className={`flex items-center gap-4 ${t.bgCard} ${t.bgHover} border ${t.border} rounded-xl p-4 cursor-pointer transition-colors`}>
                  <div className="flex-shrink-0 text-center min-w-[52px]">
                    <div className={`text-xs ${t.textFaint}`}>{dateLabel.split(" ")[0]}</div>
                    <div className={`text-lg font-bold ${t.text}`}>{day}</div>
                    <div className={`text-xs ${t.textFaint}`}>{HORA_LABELS[cita.hora] || cita.hora}</div>
                  </div>
                  <div className={`w-px h-10 ${t.border} border-l flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${t.text} text-sm truncate`}>{cita.nombre}</p>
                    <p className={`${t.textMuted} text-xs truncate`}>{cita.servicio}</p>
                    <p className={`${t.textFaint} text-xs`}>{cita.estilista} · {cita.telefono}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
                    {cita.estado}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-white text-lg">Detalle de Cita</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center">×</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Cliente", selected.nombre],
                ["WhatsApp", selected.telefono],
                ["Servicio", selected.servicio],
                ["Especialista", selected.estilista],
                ["Fecha", (() => { const [y,mo,d] = selected.fecha.split("-").map(Number); return `${DIAS_SEMANA[new Date(y,mo-1,d).getDay()]} ${d} de ${MESES[mo-1]} ${y}`; })()],
                ["Hora", HORA_LABELS[selected.hora] || selected.hora],
                ["Estado", selected.estado],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-white/40 flex-shrink-0">{k}</span>
                  <span className="text-white text-right">{v}</span>
                </div>
              ))}
            </div>
            <a href={`https://wa.me/57${selected.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${selected.nombre.split(" ")[0]}, te confirmamos tu cita en Shelie's Hair Professional el ${selected.fecha} a las ${selected.hora}. ¡Te esperamos! 💫`)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-5 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              📲 Contactar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
