"use client";

import { Fragment } from "react";
import { KpiCard } from "@/components/KpiCard";
import {
  Users,
  DollarSign,
  TrendingDown,
  Smile,
  Activity,
  Watch,
  MessageSquare,
} from "lucide-react";
import {
  OPERATION_METRICS,
  MRR_TREND,
  OCCUPANCY_HEATMAP,
} from "@/lib/mock-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function OperacionPage() {
  const m = OPERATION_METRICS;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-600 max-w-3xl">
          Vista ejecutiva del negocio. Todas las métricas se actualizan en tiempo real desde
          Gohan AI: lo que el agente captura en chat + datos de wearables + comportamiento real
          en la app del gym.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Miembros activos"
          value={m.activeMembers.toLocaleString("es-AR")}
          trend={m.membersTrend30d}
          trendLabel="vs mes anterior"
          icon={Users}
          accent="indigo"
        />
        <KpiCard
          label="MRR"
          value={fmtUsd(m.mrrUsd)}
          trend={m.mrrTrend}
          trendLabel="vs mes anterior"
          icon={DollarSign}
          accent="emerald"
        />
        <KpiCard
          label="Churn (30d)"
          value={`${m.churnRate30d}%`}
          trend={m.churnTrend}
          trendLabel="vs mes anterior"
          icon={TrendingDown}
          invertTrend
          accent="amber"
        />
        <KpiCard
          label="NPS"
          value={m.nps.toString()}
          trend={m.npsTrend}
          trendLabel="puntos vs trimestre"
          icon={Smile}
          accent="brand"
        />
      </div>

      {/* Engagement KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          label="Wearable conectado"
          value={`${m.wearableConnectedPct}%`}
          subtitle={`${Math.round((m.wearableConnectedPct / 100) * m.activeMembers)} miembros`}
          icon={Watch}
        />
        <KpiCard
          label="Engagement con Gohan"
          value={`${m.chatEngagementPct}%`}
          subtitle="usan el chat >2 veces/mes"
          icon={MessageSquare}
        />
      </div>

      {/* MRR Trend */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-semibold text-ink-900">Evolución de MRR</h3>
            <p className="text-xs text-ink-500">Últimos 12 meses · vs target</p>
          </div>
          <div className="badge bg-emerald-100 text-emerald-700">+{m.mrrTrend}% MoM</div>
        </div>
        <div className="h-72 mt-4">
          <ResponsiveContainer>
            <AreaChart data={MRR_TREND}>
              <defs>
                <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmtUsd(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Area type="monotone" dataKey="mrr" stroke="#f43f5e" strokeWidth={2} fill="url(#mrrG)" name="MRR real" />
              <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Target" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap full-width */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink-900">Ocupación por hora y día</h3>
        <p className="text-xs text-ink-500 mb-4">
          Datos derivados de check-ins + intención declarada en chat con Gohan. Útil para
          staffing y promociones de horas valle.
        </p>
        <Heatmap />
      </div>

      {/* Insight callout */}
      <div className="card p-5 bg-gradient-to-br from-brand-50 to-white border-brand-200/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-ink-900">Insight de Gohan AI</h3>
            <p className="text-sm text-ink-700 mt-1">
              Los miembros con wearable conectado tienen <span className="font-semibold">38% menos
              churn</span> y <span className="font-semibold">24% mayor adherencia</span> que los que
              no lo conectaron. <span className="font-semibold">Recomendación:</span> campaña de
              onboarding del wearable a los <span className="font-semibold">{Math.round((1 - m.wearableConnectedPct / 100) * m.activeMembers)} miembros</span> sin sincronizar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Heatmap() {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  function cellColor(occupancy: number) {
    // 0 -> ink-100, 100 -> brand-600
    const pct = occupancy / 100;
    if (pct < 0.25) return "bg-ink-100";
    if (pct < 0.5) return "bg-brand-100";
    if (pct < 0.7) return "bg-brand-300";
    if (pct < 0.85) return "bg-brand-500";
    return "bg-brand-700 text-white";
  }
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid" style={{ gridTemplateColumns: `auto repeat(${hours.length}, minmax(28px, 1fr))`, gap: 3 }}>
          <div />
          {hours.map((h) => (
            <div key={h} className="text-[10px] text-ink-500 text-center font-mono">
              {h}
            </div>
          ))}
          {days.map((d) => (
            <Fragment key={d}>
              <div className="text-xs text-ink-600 font-medium pr-2 flex items-center">
                {d}
              </div>
              {hours.map((h) => {
                const cell = OCCUPANCY_HEATMAP.find((c) => c.day === d && c.hour === h);
                return (
                  <div
                    key={`${d}-${h}`}
                    title={`${d} ${h}:00 — ${cell?.occupancy}% ocupación`}
                    className={`h-7 rounded ${cellColor(cell?.occupancy ?? 0)} transition-all hover:ring-2 hover:ring-brand-300 cursor-pointer`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-ink-500">
        <span>Menos</span>
        <div className="w-4 h-4 rounded bg-ink-100" />
        <div className="w-4 h-4 rounded bg-brand-100" />
        <div className="w-4 h-4 rounded bg-brand-300" />
        <div className="w-4 h-4 rounded bg-brand-500" />
        <div className="w-4 h-4 rounded bg-brand-700" />
        <span>Más</span>
      </div>
    </div>
  );
}
