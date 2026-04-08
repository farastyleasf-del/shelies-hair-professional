"use client";
import { useEffect, useState, useCallback } from "react";
import { useAdminTheme } from "@/lib/admin-theme";
import { apiUrl, authedFetch } from "@/lib/api";

interface Employee {
  id: number; cedula: string; name: string; cargo: string;
  site: string; email: string; phone: string | null;
  status: "activo" | "inactivo"; fecha_ingreso: string | null;
}

interface Appointment {
  id: number; client_name: string; service_name: string;
  appointment_date: string; appointment_time: string; status: string;
  stylist_name: string;
}

const CARGO_LABEL: Record<string, string> = {
  estilista: "Estilista", call_center: "Call Center", admin: "Admin",
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  activo:   { bg: "#ECFDF5", text: "#059669" },
  inactivo: { bg: "#FEF2F2", text: "#DC2626" },
};

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const COLORS = ["#8B3A4A","#059669","#2563EB","#7C3AED","#D97706","#0891B2"];
  let h = 0; for (const c of name) h += c.charCodeAt(0);
  const bg = COLORS[h % COLORS.length];
  const initials = name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: bg, width: size * 4, height: size * 4, fontSize: size < 10 ? 11 : 14 }}>
      {initials}
    </div>
  );
}

export default function EstilistasPage() {
  const t = useAdminTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected]   = useState<Employee | null>(null);
  const [citas, setCitas]         = useState<Appointment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [search, setSearch]       = useState("");
  const [filterCargo, setFilterCargo] = useState<"todos" | "estilista" | "call_center">("todos");
  const [editStatus, setEditStatus]   = useState<"activo" | "inactivo" | null>(null);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    authedFetch(apiUrl("/api/employees"))
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setEmployees(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openEmployee(emp: Employee) {
    setSelected(emp);
    setEditStatus(emp.status);
    setLoadingCitas(true);
    // Buscar citas por nombre aproximado del estilista
    authedFetch(apiUrl("/api/appointments"))
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          const mine = d.filter((a: Appointment) =>
            a.stylist_name?.toLowerCase().includes(emp.name.split(" ")[0].toLowerCase())
          ).slice(0, 20);
          setCitas(mine);
        }
      })
      .catch(() => setCitas([]))
      .finally(() => setLoadingCitas(false));
  }

  async function saveStatus() {
    if (!selected || editStatus === null) return;
    setSaving(true);
    try {
      const res = await authedFetch(apiUrl(`/api/employees/${selected.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      if (res.ok) {
        const updated = await res.json() as Employee;
        setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
        setSelected(updated);
      }
    } catch {} finally { setSaving(false); }
  }

  const filtered = employees
    .filter(e => filterCargo === "todos" || e.cargo === filterCargo)
    .filter(e => !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.cedula.includes(search));

  const estilistas  = employees.filter(e => e.cargo === "estilista");
  const callCenter  = employees.filter(e => e.cargo === "call_center");
  const activos     = employees.filter(e => e.status === "activo");

  // ── CUPOS ──────────────────────────────────────────────
  const WEEKDAYS_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const TIME_SLOTS = ["08:00","12:00","16:00"];

  function getMondayOf(d: Date): string {
    const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(d); mon.setDate(d.getDate() + diff);
    return mon.toISOString().slice(0, 10);
  }

  interface SlotTemplate { id: number; weekday: number; time_slot: string; label: string; max_capacity: number; booked_count: number; bookings: Array<{ employee_name: string }> }
  const [slots, setSlots]           = useState<SlotTemplate[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showSlots, setShowSlots]   = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [newWd, setNewWd]           = useState(1);
  const [newTs, setNewTs]           = useState("09:00");
  const [newCap, setNewCap]         = useState(3);
  const [newLabel, setNewLabel]     = useState("");
  const [addingSlot, setAddingSlot] = useState(false);

  const weekStart = getMondayOf(new Date(Date.now() + weekOffset * 7 * 86400000));
  const weekLabel = (() => {
    const d = new Date(weekStart + "T12:00:00");
    const end = new Date(d); end.setDate(d.getDate() + 6);
    return `${d.getDate()} – ${end.getDate()} ${end.toLocaleString("es-CO",{month:"long"})}`;
  })();

  const loadSlots = useCallback(() => {
    if (!showSlots) return;
    setSlotsLoading(true);
    authedFetch(apiUrl(`/api/stylist/slots?week=${weekStart}`))
      .then(r => r.json()).then(d => setSlots(Array.isArray(d) ? d : []))
      .catch(() => setSlots([])).finally(() => setSlotsLoading(false));
  }, [showSlots, weekStart]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  async function addSlot() {
    setAddingSlot(true);
    try {
      await authedFetch(apiUrl("/api/stylist/slots"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekday: newWd, timeSlot: newTs, maxCapacity: newCap, label: newLabel }),
      });
      loadSlots(); setNewLabel("");
    } catch {} finally { setAddingSlot(false); }
  }

  async function removeSlot(id: number) {
    await authedFetch(apiUrl(`/api/stylist/slots/${id}`), { method: "DELETE" }).catch(() => {});
    loadSlots();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: t.colors.text }}>👥 Equipo HC</h1>
        <p className="text-sm mt-0.5" style={{ color: t.colors.textMuted }}>
          Base de empleados — {employees.length} personas registradas del Excel
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: employees.length, icon: "👥", color: t.colors.text },
          { label: "Activos", value: activos.length, icon: "🟢", color: t.colors.successText },
          { label: "Estilistas", value: estilistas.length, icon: "💇", color: t.colors.primary },
          { label: "Call Center", value: callCenter.length, icon: "💬", color: t.colors.info },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-4"
            style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: t.colors.textMuted }}>{k.label}</p>
              <span>{k.icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2 flex-1 min-w-[200px]"
          style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.border }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: t.colors.textFaint }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula o email..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: t.colors.text }} />
        </div>
        <div className="flex gap-1 rounded-xl border overflow-hidden"
          style={{ borderColor: t.colors.border }}>
          {(["todos", "estilista", "call_center"] as const).map(f => (
            <button key={f} onClick={() => setFilterCargo(f)}
              className="px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: filterCargo === f ? t.colors.primary : "transparent",
                color: filterCargo === f ? "#fff" : t.colors.textMuted,
              }}>
              {f === "todos" ? "Todos" : CARGO_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de empleados */}
      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: t.colors.textFaint }}>
          Cargando equipo...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(emp => {
            const sc = STATUS_COLORS[emp.status] ?? STATUS_COLORS.inactivo;
            return (
              <button key={emp.id} onClick={() => openEmployee(emp)}
                className="text-left rounded-2xl border p-4 flex items-start gap-4 transition-all hover:shadow-md"
                style={{ backgroundColor: t.colors.bgCard, borderColor: t.colors.border }}>
                <Avatar name={emp.name} size={11} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold leading-tight" style={{ color: t.colors.text }}>
                      {emp.name}
                    </p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.text }}>
                      {emp.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium mb-1"
                    style={{ color: emp.cargo === "estilista" ? t.colors.primary : t.colors.info }}>
                    {CARGO_LABEL[emp.cargo] ?? emp.cargo}  ·  {emp.site}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: t.colors.textFaint }}>{emp.email}</p>
                  {emp.phone && (
                    <p className="text-[10px]" style={{ color: t.colors.textFaint }}>{emp.phone}</p>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-sm" style={{ color: t.colors.textFaint }}>
              Sin resultados
            </div>
          )}
        </div>
      )}

      {/* ── Panel de cupos de horario ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
        <button className="w-full flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: t.colors.bgCard }}
          onClick={() => setShowSlots(!showSlots)}>
          <div>
            <p className="text-sm font-semibold text-left" style={{ color: t.colors.text }}>
              🕐 Cupos de horario disponibles
            </p>
            <p className="text-[11px] text-left mt-0.5" style={{ color: t.colors.textFaint }}>
              El admin define los turnos disponibles y su capacidad máxima por semana
            </p>
          </div>
          <span className="text-lg" style={{ color: t.colors.textFaint }}>{showSlots ? "▲" : "▼"}</span>
        </button>

        {showSlots && (
          <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: t.colors.border, backgroundColor: t.colors.bgCard }}>
            {/* Navegación semana */}
            <div className="flex items-center justify-between pt-4">
              <button onClick={() => setWeekOffset(w => w - 1)}
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: t.colors.border, color: t.colors.text }}>‹</button>
              <p className="text-sm font-semibold" style={{ color: t.colors.text }}>Semana {weekLabel}</p>
              <button onClick={() => setWeekOffset(w => w + 1)}
                className="w-8 h-8 rounded-full border flex items-center justify-center"
                style={{ borderColor: t.colors.border, color: t.colors.text }}>›</button>
            </div>

            {/* Formulario agregar cupo */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: t.colors.border }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.colors.textMuted }}>
                Agregar cupo
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select value={newWd} onChange={e => setNewWd(parseInt(e.target.value))}
                  className="px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.border, color: t.colors.text }}>
                  {WEEKDAYS_FULL.map((d,i) => <option key={i} value={i}>{d}</option>)}
                </select>
                <select value={newTs} onChange={e => setNewTs(e.target.value)}
                  className="px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.border, color: t.colors.text }}>
                  {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                </select>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                  style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.border }}>
                  <span className="text-[11px]" style={{ color: t.colors.textFaint }}>Max:</span>
                  <input type="number" min={1} max={10} value={newCap}
                    onChange={e => setNewCap(parseInt(e.target.value))}
                    className="w-10 bg-transparent text-sm outline-none font-semibold"
                    style={{ color: t.colors.text }} />
                </div>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Etiqueta (opcional)"
                  className="px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: t.colors.inputBg, borderColor: t.colors.border, color: t.colors.text }} />
              </div>
              <button onClick={addSlot} disabled={addingSlot}
                className="px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: t.colors.primary }}>
                {addingSlot ? "Agregando..." : "+ Agregar cupo"}
              </button>
            </div>

            {/* Lista de cupos */}
            {slotsLoading ? (
              <div className="py-8 text-center text-sm" style={{ color: t.colors.textFaint }}>Cargando cupos...</div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center text-sm rounded-xl border"
                style={{ color: t.colors.textFaint, borderColor: t.colors.border }}>
                Sin cupos configurados para esta semana
              </div>
            ) : (
              <div className="space-y-2">
                {WEEKDAYS_FULL.map((dayName, wd) => {
                  const daySlots = slots.filter(s => s.weekday === wd);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={wd} className="rounded-xl border overflow-hidden" style={{ borderColor: t.colors.border }}>
                      <div className="px-4 py-2 border-b" style={{ borderColor: t.colors.border, backgroundColor: t.colors.bgDeep }}>
                        <p className="text-xs font-semibold" style={{ color: t.colors.text }}>{dayName}</p>
                      </div>
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0"
                          style={{ borderColor: t.colors.border }}>
                          <div>
                            <span className="text-sm font-medium" style={{ color: t.colors.text }}>{slot.time_slot}</span>
                            {slot.label && <span className="text-[10px] ml-2" style={{ color: t.colors.textFaint }}>{slot.label}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-semibold"
                              style={{ color: slot.booked_count >= slot.max_capacity ? "#DC2626" : "#059669" }}>
                              {slot.booked_count}/{slot.max_capacity} estilistas
                            </span>
                            {slot.bookings.length > 0 && (
                              <span className="text-[10px]" style={{ color: t.colors.textFaint }}>
                                {slot.bookings.map(b => b.employee_name.split(" ")[0]).join(", ")}
                              </span>
                            )}
                            <button onClick={() => removeSlot(slot.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel de detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: t.colors.bgCard }}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-4"
              style={{ borderBottom: `1px solid ${t.colors.border}` }}>
              <Avatar name={selected.name} size={14} />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold" style={{ color: t.colors.text }}>{selected.name}</p>
                <p className="text-sm font-medium"
                  style={{ color: selected.cargo === "estilista" ? t.colors.primary : t.colors.info }}>
                  {CARGO_LABEL[selected.cargo]} · {selected.site}
                </p>
                <p className="text-xs" style={{ color: t.colors.textFaint }}>CC: {selected.cedula}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm opacity-50 hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ backgroundColor: t.colors.border, color: t.colors.text }}>
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Email",    value: selected.email },
                  { label: "Teléfono", value: selected.phone ?? "—" },
                  { label: "Sede",     value: selected.site },
                  { label: "Ingreso",  value: selected.fecha_ingreso ?? "—" },
                ].map(f => (
                  <div key={f.label} className="rounded-xl p-3"
                    style={{ backgroundColor: t.colors.bgDeep }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                      style={{ color: t.colors.textFaint }}>{f.label}</p>
                    <p className="text-sm font-medium truncate" style={{ color: t.colors.text }}>{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Cambiar estado */}
              <div className="rounded-xl border p-3" style={{ borderColor: t.colors.border }}>
                <p className="text-xs font-semibold mb-2" style={{ color: t.colors.textMuted }}>
                  Estado del empleado
                </p>
                <div className="flex gap-2">
                  {(["activo", "inactivo"] as const).map(s => (
                    <button key={s} onClick={() => setEditStatus(s)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{
                        backgroundColor: editStatus === s
                          ? (s === "activo" ? t.colors.successLight : t.colors.dangerLight)
                          : "transparent",
                        color: editStatus === s
                          ? (s === "activo" ? t.colors.successText : t.colors.dangerText)
                          : t.colors.textFaint,
                        borderColor: editStatus === s
                          ? (s === "activo" ? t.colors.success : t.colors.danger)
                          : t.colors.border,
                      }}>
                      {s === "activo" ? "🟢 Activo" : "🔴 Inactivo"}
                    </button>
                  ))}
                </div>
                {editStatus !== selected.status && (
                  <button onClick={saveStatus} disabled={saving}
                    className="mt-2 w-full py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50"
                    style={{ backgroundColor: t.colors.primary }}>
                    {saving ? "Guardando..." : "Guardar cambio"}
                  </button>
                )}
              </div>

              {/* Citas próximas */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: t.colors.textMuted }}>
                  📅 Citas asignadas recientes
                </p>
                {loadingCitas ? (
                  <p className="text-xs text-center py-4" style={{ color: t.colors.textFaint }}>Cargando citas...</p>
                ) : citas.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: t.colors.textFaint }}>Sin citas registradas</p>
                ) : (
                  <div className="space-y-2">
                    {citas.map(c => (
                      <div key={c.id} className="rounded-xl p-3 flex items-center justify-between"
                        style={{ backgroundColor: t.colors.bgDeep }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: t.colors.text }}>{c.client_name}</p>
                          <p className="text-[10px]" style={{ color: t.colors.textFaint }}>
                            {c.service_name} · {c.appointment_date} {c.appointment_time}
                          </p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: t.colors.primaryLight, color: t.colors.primary }}>
                          {c.status}
                        </span>
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
