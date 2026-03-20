"use client";
import { useState } from "react";
import { agents, channelIcons, channelColors, formatCOPAdmin } from "@/lib/admin-data";
import type { Agent } from "@/lib/admin-types";
import { useAdminTheme } from "@/lib/admin-theme";

const roleLabels: Record<string, string> = {
  admin: "👑 Admin", supervisor: "⭐ Supervisor", agente: "💬 Agente", soporte: "🤖 Soporte",
};

const roleColors: Record<string, string> = {
  admin: "bg-dorado/20 text-dorado", supervisor: "bg-vino/20 text-blush",
  agente: "bg-blue-500/20 text-blue-400", soporte: "bg-purple-500/20 text-purple-400",
};

const shiftLabels: Record<string, string> = {
  manana: "☀️ Mañana (6-14h)", tarde: "🌅 Tarde (14-22h)",
  noche: "🌙 Noche (22-6h)", completo: "🕐 Completo",
};

function AgentCard({ agent, onSelect }: { agent: Agent; onSelect: () => void }) {
  const t = useAdminTheme();
  const slaOk = agent.stats.slaCompliance >= agent.goals.slaTarget;
  const chatsOk = agent.stats.chatsToday >= agent.goals.chatsPerDay * 0.7;

  return (
    <button onClick={onSelect}
      className={`w-full text-left ${t.bgCard} border ${t.border} rounded-2xl p-5 hover:${t.borderHover} transition-all group`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full ${t.accentBg} flex items-center justify-center text-lg font-bold ${t.accentText} flex-shrink-0`}>
          {agent.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${t.text} group-hover:opacity-80 transition-colors`}>{agent.name}</p>
            <div className={`w-2 h-2 rounded-full ${agent.active ? "bg-green-400" : t.textFaint}`} />
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded ${roleColors[agent.role]}`}>
            {roleLabels[agent.role]}
          </span>
        </div>
      </div>

      {/* Channels */}
      <div className="flex gap-1 mb-3">
        {agent.channels.map((ch) => (
          <span key={ch} className={`text-[10px] px-2 py-0.5 rounded ${channelColors[ch]}`}>
            {channelIcons[ch]}
          </span>
        ))}
        <span className={`text-[10px] ${t.textFaint} ml-auto`}>{shiftLabels[agent.shift]}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className={`${t.bgDeep} rounded-lg p-2 text-center`}>
          <p className={`text-lg font-bold ${chatsOk ? "text-green-400" : "text-amber-400"}`}>{agent.stats.chatsToday}</p>
          <p className={`text-[9px] ${t.textFaint}`}>Chats hoy</p>
        </div>
        <div className={`${t.bgDeep} rounded-lg p-2 text-center`}>
          <p className={`text-lg font-bold ${slaOk ? "text-green-400" : "text-red-400"}`}>{agent.stats.slaCompliance}%</p>
          <p className={`text-[9px] ${t.textFaint}`}>SLA</p>
        </div>
        <div className={`${t.bgDeep} rounded-lg p-2 text-center`}>
          <p className="text-lg font-bold text-dorado">{agent.stats.conversionsToday}</p>
          <p className={`text-[9px] ${t.textFaint}`}>Ventas</p>
        </div>
      </div>

      {/* Mini bars */}
      <div className="space-y-1.5">
        <ProgressBar label="FRT" value={agent.stats.avgFRT} max={120} unit="s"
          color={agent.stats.avgFRT < 30 ? "bg-green-500" : agent.stats.avgFRT < 60 ? "bg-amber-500" : "bg-red-500"} />
        <ProgressBar label="Satisf." value={agent.stats.satisfaction} max={5} unit="/5"
          color="bg-dorado" />
        <ProgressBar label="Backlog" value={agent.stats.backlog} max={10} unit=""
          color={agent.stats.backlog > 5 ? "bg-red-500" : "bg-green-500"} />
      </div>
    </button>
  );
}

function ProgressBar({ label, value, max, unit, color }: {
  label: string; value: number; max: number; unit: string; color: string;
}) {
  const t = useAdminTheme();
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] ${t.textFaint} w-12`}>{label}</span>
      <div className={`flex-1 h-1.5 ${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
      <span className={`text-[10px] ${t.textMuted} w-10 text-right`}>{value}{unit}</span>
    </div>
  );
}

function AgentDetail({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const t = useAdminTheme();
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${t.bgDeep} border ${t.borderHover} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full ${t.accentBg} flex items-center justify-center text-2xl font-bold ${t.accentText}`}>
                {agent.name.charAt(0)}
              </div>
              <div>
                <h2 className={`text-xl font-poppins font-bold ${t.text}`}>{agent.name}</h2>
                <p className={`text-xs ${t.textMuted}`}>{agent.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded ${roleColors[agent.role]}`}>{roleLabels[agent.role]}</span>
                  <span className={`text-[10px] ${t.textFaint}`}>{shiftLabels[agent.shift]}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className={`${t.textFaint} hover:${t.text} text-xl`}>✕</button>
          </div>

          {/* Full Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Chats hoy" value={agent.stats.chatsToday} goal={agent.goals.chatsPerDay} unit="" />
            <StatCard label="Chats mes" value={agent.stats.chatsMonth} unit="" />
            <StatCard label="FRT promedio" value={agent.stats.avgFRT} unit="s" good={agent.stats.avgFRT < 60} />
            <StatCard label="Resolución" value={agent.stats.avgResolution} unit="min" />
            <StatCard label="SLA" value={agent.stats.slaCompliance} goal={agent.goals.slaTarget} unit="%" good={agent.stats.slaCompliance >= agent.goals.slaTarget} />
            <StatCard label="Conversiones hoy" value={agent.stats.conversionsToday} unit="" />
            <StatCard label="Conversiones mes" value={agent.stats.conversionsMonth} unit="" />
            <StatCard label="Satisfacción" value={agent.stats.satisfaction} unit="/5" good={agent.stats.satisfaction >= 4.5} />
            <StatCard label="Backlog" value={agent.stats.backlog} unit="" good={agent.stats.backlog < 5} />
          </div>

          {/* Goals */}
          <div className={`${t.bgCard} rounded-xl p-4 mb-6`}>
            <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider mb-3`}>🎯 Metas</p>
            <div className="space-y-3">
              <GoalBar label="Chats/día" current={agent.stats.chatsToday} goal={agent.goals.chatsPerDay} />
              <GoalBar label="SLA" current={agent.stats.slaCompliance} goal={agent.goals.slaTarget} unit="%" />
              <GoalBar label="Conversión" current={Math.round((agent.stats.conversionsToday / Math.max(1, agent.stats.chatsToday)) * 100)} goal={agent.goals.conversionTarget} unit="%" />
            </div>
          </div>

          {/* Channels */}
          <div className={`${t.bgCard} rounded-xl p-4`}>
            <p className={`text-[11px] ${t.textFaint} uppercase tracking-wider mb-3`}>📱 Canales asignados</p>
            <div className="flex gap-2">
              {agent.channels.map((ch) => (
                <span key={ch} className={`px-3 py-1.5 rounded-lg text-xs ${channelColors[ch]}`}>
                  {channelIcons[ch]} {ch}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, goal, good }: {
  label: string; value: number; unit: string; goal?: number; good?: boolean;
}) {
  const t = useAdminTheme();
  return (
    <div className={`${t.bgCard} rounded-xl p-3 text-center`}>
      <p className={`text-xl font-bold ${good === true ? "text-green-400" : good === false ? "text-red-400" : t.text}`}>
        {value}{unit}
      </p>
      <p className={`text-[10px] ${t.textFaint}`}>{label}</p>
      {goal !== undefined && (
        <p className={`text-[9px] ${t.textFaint} mt-0.5`}>Meta: {goal}{unit}</p>
      )}
    </div>
  );
}

function GoalBar({ label, current, goal, unit = "" }: {
  label: string; current: number; goal: number; unit?: string;
}) {
  const t = useAdminTheme();
  const pct = Math.min(100, (current / goal) * 100);
  const achieved = current >= goal;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={t.textMuted}>{label}</span>
        <span className={achieved ? "text-green-400" : t.textMuted}>
          {current}{unit} / {goal}{unit} {achieved && "✅"}
        </span>
      </div>
      <div className={`h-2 ${t.mode === "dark" ? "bg-white/5" : "bg-gray-100"} rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full transition-all ${achieved ? "bg-green-500" : "bg-vino"}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EquipoPage() {
  const t = useAdminTheme();
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-poppins font-bold ${t.text}`}>👥 Equipo</h1>
          <p className={`${t.textMuted} text-sm mt-1`}>{agents.length} miembros • {agents.filter((a) => a.active).length} activos</p>
        </div>
        <button className={`${t.accentBg} ${t.accentText} px-4 py-2 rounded-xl text-sm font-medium hover:opacity-80 transition-colors`}>
          + Agregar agente
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className={`${t.bgCard} border ${t.border} rounded-2xl p-4 text-center`}>
          <p className={`text-2xl font-bold ${t.text}`}>{agents.reduce((a, ag) => a + ag.stats.chatsToday, 0)}</p>
          <p className={`text-[10px] ${t.textFaint}`}>Chats totales hoy</p>
        </div>
        <div className={`${t.bgCard} border ${t.border} rounded-2xl p-4 text-center`}>
          <p className="text-2xl font-bold text-green-400">
            {Math.round(agents.reduce((a, ag) => a + ag.stats.slaCompliance, 0) / agents.length)}%
          </p>
          <p className={`text-[10px] ${t.textFaint}`}>SLA promedio</p>
        </div>
        <div className={`${t.bgCard} border ${t.border} rounded-2xl p-4 text-center`}>
          <p className="text-2xl font-bold text-dorado">{agents.reduce((a, ag) => a + ag.stats.conversionsToday, 0)}</p>
          <p className={`text-[10px] ${t.textFaint}`}>Ventas hoy</p>
        </div>
        <div className={`${t.bgCard} border ${t.border} rounded-2xl p-4 text-center`}>
          <p className="text-2xl font-bold text-amber-400">{agents.reduce((a, ag) => a + ag.stats.backlog, 0)}</p>
          <p className={`text-[10px] ${t.textFaint}`}>Backlog total</p>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onSelect={() => setSelected(agent)} />
        ))}
      </div>

      {selected && <AgentDetail agent={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
