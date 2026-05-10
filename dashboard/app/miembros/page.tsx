"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MEMBERS } from "@/lib/mock-data";
import { PERSONAS } from "@/lib/personas";
import type { ChurnRisk, PersonaId } from "@/lib/types";
import {
  Watch,
  MessageSquare,
  TrendingUp,
  Filter,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";

const RISK_STYLES: Record<ChurnRisk, string> = {
  bajo: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  medio: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  alto: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  crítico: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

const PLAN_STYLES: Record<string, string> = {
  básico: "bg-ink-100 text-ink-700",
  plus: "bg-indigo-100 text-indigo-700",
  premium: "bg-brand-100 text-brand-700",
  elite: "bg-amber-100 text-amber-700",
};

export default function MiembrosPage() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId | "all">("all");
  const [riskFilter, setRiskFilter] = useState<ChurnRisk | "all">("all");

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => {
      if (selectedPersona !== "all" && m.personaId !== selectedPersona) return false;
      if (riskFilter !== "all" && m.risk.churnRisk !== riskFilter) return false;
      return true;
    }).sort((a, b) => b.risk.churnScore - a.risk.churnScore);
  }, [selectedPersona, riskFilter]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-600 max-w-3xl">
          Cada socio convertido en una vista 360. Gohan AI captura datos en 3 capas (críticos →
          personalización → deep knowledge) y los traduce a una persona accionable + score de
          riesgo + oportunidades concretas de revenue.
        </p>
      </div>

      {/* Personas grid */}
      <div>
        <h2 className="font-semibold text-ink-900 mb-3">6 Customer Personas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PERSONAS.map((p) => {
            const count = MEMBERS.filter((m) => m.personaId === p.id).length;
            const pct = Math.round((count / MEMBERS.length) * 100);
            const isSelected = selectedPersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() =>
                  setSelectedPersona(isSelected ? "all" : (p.id as PersonaId))
                }
                className={clsx(
                  "card p-4 text-left transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-brand-500 ring-offset-2"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className={clsx("inline-block px-2 py-0.5 rounded text-xs font-medium mb-2", `bg-${p.color}-100 text-${p.color}-700`)}>
                      {pct}% de la base
                    </div>
                    <h3 className="font-bold text-ink-900">{p.name}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">{p.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-ink-700 mt-3 line-clamp-3">{p.description}</p>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
                  <span className="text-ink-500">
                    +{p.monetization.estArpuLiftUsd}/mes ARPU
                  </span>
                  <span className="text-brand-600 font-medium inline-flex items-center gap-1">
                    Ver miembros <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-ink-600">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filtros:</span>
        </div>
        <select
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value as PersonaId | "all")}
          className="px-3 py-1.5 rounded-lg border border-ink-200 bg-white"
        >
          <option value="all">Todas las personas</option>
          {PERSONAS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as ChurnRisk | "all")}
          className="px-3 py-1.5 rounded-lg border border-ink-200 bg-white"
        >
          <option value="all">Todos los riesgos</option>
          <option value="crítico">Riesgo crítico</option>
          <option value="alto">Riesgo alto</option>
          <option value="medio">Riesgo medio</option>
          <option value="bajo">Riesgo bajo</option>
        </select>
        <span className="text-ink-500">
          Mostrando {filtered.length} miembros
        </span>
      </div>

      {/* Members table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-200/70">
              <tr className="text-left text-xs uppercase tracking-wider text-ink-600">
                <th className="px-4 py-3 font-medium">Miembro</th>
                <th className="px-4 py-3 font-medium">Persona</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Adherencia</th>
                <th className="px-4 py-3 font-medium">Engagement</th>
                <th className="px-4 py-3 font-medium">NPS</th>
                <th className="px-4 py-3 font-medium">Riesgo</th>
                <th className="px-4 py-3 font-medium">Oportunidad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map((m) => {
                const persona = PERSONAS.find((p) => p.id === m.personaId)!;
                const topOpp = [...m.opportunities].sort((a, b) => b.confidence * b.estMonthlyUsd - a.confidence * a.estMonthlyUsd)[0];
                return (
                  <tr key={m.id} className="border-b border-ink-100 hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ background: m.avatarColor }}
                        >
                          {m.name.split(" ").map((p) => p[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium text-ink-900">{m.name}</div>
                          <div className="text-xs text-ink-500">
                            {m.age} años · {m.sex} · {m.commercial.ltVMonths}m de antig.
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-ink-700">{persona.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx("badge", PLAN_STYLES[m.commercial.plan])}>
                        {m.commercial.plan}
                      </span>
                      <div className="text-xs text-ink-500 mt-1">
                        ${m.commercial.monthlyFeeUsd}/mes
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                          <div
                            className={clsx(
                              "h-full",
                              m.engagement.adherencePct >= 70
                                ? "bg-emerald-500"
                                : m.engagement.adherencePct >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                            style={{ width: `${m.engagement.adherencePct}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink-700 font-mono">
                          {m.engagement.adherencePct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-ink-600">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {m.engagement.chatMessagesLast30d}
                        </span>
                        {m.wearable.connected && (
                          <span className="inline-flex items-center gap-1 text-emerald-600" title={`Wearable: ${m.wearable.device}`}>
                            <Watch className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "font-mono font-semibold",
                          (m.engagement.npsLast ?? 0) >= 9
                            ? "text-emerald-600"
                            : (m.engagement.npsLast ?? 0) >= 7
                            ? "text-amber-600"
                            : "text-rose-600"
                        )}
                      >
                        {m.engagement.npsLast ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx("badge capitalize", RISK_STYLES[m.risk.churnRisk])}>
                        {m.risk.churnRisk}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {topOpp ? (
                        <div>
                          <div className="text-xs text-ink-700 font-medium line-clamp-1">
                            {topOpp.product}
                          </div>
                          <div className="text-xs text-emerald-600 font-mono">
                            +${topOpp.estMonthlyUsd}/m · {topOpp.confidence}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/miembros/${m.id}`}
                        className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 text-xs font-medium"
                      >
                        Ver 360 <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 60 && (
          <div className="text-xs text-ink-500 px-4 py-3 bg-ink-50 border-t border-ink-200/70">
            Mostrando los primeros 60 de {filtered.length}. En producción esto pagina con virtual scroll.
          </div>
        )}
      </div>

      {/* Insight */}
      <div className="card p-5 bg-gradient-to-br from-indigo-50 to-white border-indigo-200/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-ink-900">Datos únicos que captura Gohan AI</h3>
            <p className="text-sm text-ink-700 mt-1">
              A diferencia de un CRM tradicional, Gohan accede al <span className="font-semibold">contexto vivo</span> del miembro:
              estado emocional inferido del chat, fase del ciclo, calidad del sueño, lesiones nuevas,
              cambio de objetivo. Esa data cruza con wearables y comportamiento en la app para construir
              un <span className="font-semibold">perfil que se profundiza día a día</span> — no en un formulario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
