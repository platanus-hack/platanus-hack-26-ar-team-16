"use client";

import { KpiCard } from "@/components/KpiCard";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  Sparkles,
  Target,
  Lock,
} from "lucide-react";
import { MEMBERS, OPERATION_METRICS, TOTAL_OPPORTUNITY_MRR } from "@/lib/mock-data";
import { PERSONAS } from "@/lib/personas";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import clsx from "clsx";

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// Las 3 oportunidades más bajadas a tierra: ejecutables hoy mismo
// sin nuevo desarrollo de producto, en cualquier gym standard.
const GROUNDED_PRODUCTS = [
  "Antropometría inicial",
  "Plan macros pro",
  "Suscripción proteína whey",
];

const GROUNDED_REASONS = [
  "ya existe en gyms · solo sistematizarlo",
  "nutricionista de planta lo arma",
  "venta directa de suplemento",
];

function GROUNDED_PRODUCTS_MAX(list: { product: string; estMonthly: number }[]) {
  const matches = list.filter((p) => GROUNDED_PRODUCTS.includes(p.product));
  return matches.length > 0 ? Math.max(...matches.map((p) => p.estMonthly)) : 1;
}

export default function MonetizacionPage() {
  // Aggregate opportunities scaled to active members
  const scaleFactor = OPERATION_METRICS.activeMembers / MEMBERS.length;

  const oppsByProduct: Record<string, { product: string; estMonthly: number; count: number; avgConfidence: number; targetPersonas: Set<string> }> = {};
  for (const m of MEMBERS) {
    for (const o of m.opportunities) {
      const key = o.product;
      if (!oppsByProduct[key]) {
        oppsByProduct[key] = {
          product: key,
          estMonthly: 0,
          count: 0,
          avgConfidence: 0,
          targetPersonas: new Set(),
        };
      }
      const expected = (o.estMonthlyUsd * o.confidence) / 100;
      oppsByProduct[key].estMonthly += expected;
      oppsByProduct[key].count += 1;
      oppsByProduct[key].avgConfidence += o.confidence;
      oppsByProduct[key].targetPersonas.add(m.personaId);
    }
  }
  const productList = Object.values(oppsByProduct)
    .map((p) => ({
      ...p,
      avgConfidence: Math.round(p.avgConfidence / p.count),
      estMonthly: Math.round(p.estMonthly * scaleFactor),
      count: Math.round(p.count * scaleFactor),
    }))
    .sort((a, b) => b.estMonthly - a.estMonthly);

  const totalCurrentMrr = OPERATION_METRICS.mrrUsd;
  const totalOpportunity = TOTAL_OPPORTUNITY_MRR;
  const upliftPct = Math.round((totalOpportunity / totalCurrentMrr) * 100);
  const annualOpp = totalOpportunity * 12;

  // Revenue by persona
  const revByPersona = PERSONAS.map((p) => {
    const personaMembers = MEMBERS.filter((m) => m.personaId === p.id);
    const currentMrr = personaMembers.reduce((s, m) => s + m.commercial.monthlyFeeUsd, 0) * scaleFactor;
    const oppMrr = personaMembers.reduce(
      (s, m) => s + m.opportunities.reduce((a, o) => a + (o.estMonthlyUsd * o.confidence) / 100, 0),
      0
    ) * scaleFactor;
    return {
      name: p.name.replace("El ", "").replace("La ", ""),
      personaId: p.id,
      current: Math.round(currentMrr),
      opportunity: Math.round(oppMrr),
      total: Math.round(currentMrr + oppMrr),
      color: p.color,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-600 max-w-3xl">
          Cómo convertir lo que Gohan AI sabe sobre cada miembro en{" "}
          <span className="font-semibold">revenue incremental</span>. Cada oportunidad combina
          probabilidad de conversión × ticket promedio × volumen de la persona.
        </p>
      </div>

      {/* Top KPIs — money */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="MRR actual"
          value={fmtUsd(totalCurrentMrr)}
          subtitle="Solo cuotas mensuales"
          icon={DollarSign}
        />
        <KpiCard
          label="MRR oportunidad (potencial)"
          value={fmtUsd(totalOpportunity)}
          subtitle="Suma esperada upsells (prob × ticket)"
          icon={TrendingUp}
          accent="emerald"
        />
        <KpiCard
          label="Uplift sobre MRR"
          value={`+${upliftPct}%`}
          subtitle="Si capturas todas las oportunidades"
          icon={Target}
          accent="brand"
        />
        <KpiCard
          label="Oportunidad anual"
          value={fmtUsd(annualOpp)}
          subtitle="Revenue incremental año 1"
          icon={Sparkles}
          accent="indigo"
        />
      </div>

      {/* Revenue by persona */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink-900">Revenue actual vs oportunidad por persona</h3>
        <p className="text-xs text-ink-500 mb-4">
          La barra azul es lo que ya facturas. La barra verde es el revenue adicional esperado
          si activas las ofertas que Gohan AI sugiere.
        </p>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={revByPersona} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#334155" }} width={110} />
              <Tooltip formatter={(v: number) => fmtUsd(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="current" stackId="a" fill="#6366f1" name="MRR actual" radius={[0, 0, 0, 0]} />
              <Bar dataKey="opportunity" stackId="a" fill="#10b981" name="Oportunidad" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products / opportunities — 3 más bajadas a tierra */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink-900">Top 3 oportunidades de producto</h3>
        <p className="text-xs text-ink-500 mb-4">
          Las más ejecutables hoy mismo, sin nuevo desarrollo. Ordenadas por revenue mensual esperado.
        </p>
        <div className="space-y-2">
          {GROUNDED_PRODUCTS.map((slug, i) => {
            const p = productList.find((x) => x.product === slug);
            if (!p) return null;
            const widthPct = (p.estMonthly / GROUNDED_PRODUCTS_MAX(productList)) * 100;
            return (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-ink-50">
                <div className="w-7 h-7 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink-900 truncate">{p.product}</span>
                    <span className="text-emerald-600 font-bold whitespace-nowrap">
                      +{fmtUsd(p.estMonthly)}/mes
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${widthPct}%` }} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-ink-500">
                    <span>{p.count} miembros target</span>
                    <span>·</span>
                    <span>conf. promedio {p.avgConfidence}%</span>
                    <span>·</span>
                    <span className="text-ink-700 font-medium">{GROUNDED_REASONS[i]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monetization plays per persona */}
      <div>
        <h2 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Plays de monetización por persona
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PERSONAS.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={clsx("inline-block px-2 py-0.5 rounded text-xs font-medium mb-1", `bg-${p.color}-100 text-${p.color}-700`)}>
                    {p.pctOfBase}% de la base
                  </div>
                  <h3 className="font-bold text-ink-900">{p.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    +${p.monetization.estArpuLiftUsd}
                  </div>
                  <div className="text-xs text-ink-500">ARPU lift / mes</div>
                </div>
              </div>
              <p className="text-sm text-ink-700 mt-2">{p.monetization.headline}</p>

              <div className="mt-4 space-y-2">
                {p.monetization.products.map((pr, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-ink-50">
                    <ShoppingBag className="w-4 h-4 text-ink-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900 truncate">{pr.name}</div>
                      <div className="text-xs text-ink-500">
                        ${pr.priceUsd} · conv. esperada {pr.conversion}%
                      </div>
                    </div>
                    <div className="text-xs font-mono text-emerald-600">
                      +${Math.round((pr.priceUsd * pr.conversion) / 100)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-ink-100">
                <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">
                  Retención
                </div>
                <p className="text-sm text-ink-700">{p.retentionPlay}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data moat */}
      <div className="card p-5 bg-gradient-to-br from-ink-900 to-ink-800 text-white border-ink-900">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Por qué los datos de Gohan son un moat</h3>
            <div className="text-sm text-ink-300 mt-2 space-y-2">
              <p>
                Las apps tradicionales del gym tienen lo básico: nombre, plan, fechas de pago.
                Gohan agrega <span className="font-semibold text-white">todo lo que sí mueve la aguja</span>:
                objetivo real, condiciones médicas, fase del ciclo, cargas de wearable, intención
                emocional inferida del chat, modificaciones de rutina, lesiones nuevas, NPS continuo.
              </p>
              <p>
                Esa data <span className="font-semibold text-white">no se la lleva el miembro</span> si
                cambia de gym. Y permite vender no solo cuota — vender nutrición, suplementación,
                fisio, comunidad, eventos, partnerships.
              </p>
              <p className="text-brand-300 font-medium">
                Estimación conservadora: +${Math.round(totalOpportunity / 1000)}k/mes en una sucursal de 850 socios. Multiplicar por la cantidad de sucursales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
