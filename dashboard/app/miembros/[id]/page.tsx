import Link from "next/link";
import { notFound } from "next/navigation";
import { MEMBERS } from "@/lib/mock-data";
import { getPersonaById } from "@/lib/personas";
import {
  ArrowLeft,
  Activity,
  Heart,
  Moon,
  Watch,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Shield,
  Pill,
  Calendar,
} from "lucide-react";

export function generateStaticParams() {
  return MEMBERS.map((m) => ({ id: m.id }));
}

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const member = MEMBERS.find((m) => m.id === params.id);
  if (!member) return notFound();
  const persona = getPersonaById(member.personaId)!;

  const RISK_BADGE: Record<string, string> = {
    bajo: "bg-emerald-100 text-emerald-700",
    medio: "bg-amber-100 text-amber-700",
    alto: "bg-orange-100 text-orange-700",
    crítico: "bg-rose-100 text-rose-700",
  };

  const goalLabel: Record<string, string> = {
    hipertrofia: "Hipertrofia",
    "perder-grasa": "Perder grasa",
    "salud-general": "Salud general",
    fuerza: "Fuerza",
    resistencia: "Resistencia",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/miembros"
        className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a miembros
      </Link>

      {/* Header */}
      <div className="card p-6 bg-gradient-to-br from-white to-ink-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm"
              style={{ background: member.avatarColor }}
            >
              {member.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">{member.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-ink-600">
                <span>{member.age} años</span>
                <span>·</span>
                <span>{member.sex}</span>
                <span>·</span>
                <span>{member.heightCm}cm · {member.weightKg}kg</span>
                <span>·</span>
                <span>ID: {member.id}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-ink-900 text-white">{persona.name}</span>
                <span className={`badge capitalize ${RISK_BADGE[member.risk.churnRisk]}`}>
                  Churn risk: {member.risk.churnRisk} ({member.risk.churnScore})
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-500">Plan {member.commercial.plan}</div>
            <div className="text-2xl font-bold text-ink-900">
              ${member.commercial.monthlyFeeUsd}<span className="text-sm font-normal text-ink-500">/mes</span>
            </div>
            <div className="text-xs text-ink-500 mt-1">
              LTV acumulado: ${member.commercial.totalRevenueUsd}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capa 1: Críticos */}
        <Section title="Capa 1 · Datos críticos" subtitle="Lo mínimo para generar la primera rutina" icon={Activity}>
          <KV label="Objetivo">{goalLabel[member.goal]}</KV>
          <KV label="Experiencia"><span className="capitalize">{member.experience}</span></KV>
          <KV label="Disponibilidad">{member.daysPerWeek} días · {member.sessionMinutes} min/sesión</KV>
          <KV label="Split preferido">{member.preferredSplit.toUpperCase()}</KV>
          <KV label="Lesiones">
            {member.injuries.length > 0 ? member.injuries.join(", ") : <span className="text-ink-400">Ninguna declarada</span>}
          </KV>
        </Section>

        {/* Capa 2: Salud */}
        <Section title="Capa 2 · Salud y antecedentes" subtitle="Personalización profunda" icon={Heart}>
          <KV label="Condiciones" icon={Shield}>
            {member.health.conditions.length > 0
              ? member.health.conditions.join(", ")
              : <span className="text-ink-400">Sin condiciones declaradas</span>}
          </KV>
          <KV label="Medicación" icon={Pill}>
            {member.health.medications.length > 0
              ? member.health.medications.join(", ")
              : <span className="text-ink-400">Ninguna</span>}
          </KV>
          <KV label="Alergias">{member.health.allergies.length > 0 ? member.health.allergies.join(", ") : <span className="text-ink-400">—</span>}</KV>
          <KV label="Antecedentes familiares">
            {member.health.familyHistory.length > 0
              ? member.health.familyHistory.join(", ")
              : <span className="text-ink-400">—</span>}
          </KV>
          {member.reproductive?.tracksCycle && (
            <KV label="Ciclo menstrual" icon={Calendar}>
              Fase <span className="font-medium">{member.reproductive.cyclePhase}</span> · ciclo de {member.reproductive.cycleLengthDays}d
            </KV>
          )}
        </Section>

        {/* Capa 3: Deep / Wearable */}
        <Section title="Capa 3 · Wearable + Lifestyle" subtitle="Datos que se profundizan con el uso" icon={Watch}>
          {member.wearable.connected ? (
            <>
              <KV label="Dispositivo">
                <span className="capitalize">{member.wearable.device}</span> ·{" "}
                <span className="text-emerald-600 text-xs">conectado</span>
              </KV>
              <KV label="FC reposo">{member.wearable.avgRestingHR} bpm</KV>
              <KV label="HRV promedio">{member.wearable.avgHRV} ms</KV>
              <KV label="Sueño">
                <span className="font-mono">{member.lifestyle.sleepHours}h</span> · score {member.wearable.avgSleepScore}/100
              </KV>
              <KV label="Pasos diarios">{member.wearable.avgStepsDaily?.toLocaleString("es-AR")}</KV>
              {member.wearable.vo2Max && <KV label="VO2max">{member.wearable.vo2Max} ml/kg/min</KV>}
            </>
          ) : (
            <div className="text-sm text-ink-500 italic">
              Wearable no conectado. <span className="text-brand-600 font-medium">Oportunidad: 15% reducción de churn al sincronizar.</span>
            </div>
          )}
          <hr className="border-ink-100 my-2" />
          <KV label="Estrés autoreportado">{member.lifestyle.stressLevel}/5</KV>
          <KV label="Calidad del sueño">{member.lifestyle.sleepQuality}/5</KV>
          <KV label="Alcohol"><span className="capitalize">{member.lifestyle.alcoholFreq}</span></KV>
          <KV label="Fumador">{member.lifestyle.smoker ? "Sí" : "No"}</KV>
        </Section>
      </div>

      {/* Engagement + Churn risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Engagement con Gohan AI" icon={MessageSquare} className="lg:col-span-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Adherencia" value={`${member.engagement.adherencePct}%`} accent={member.engagement.adherencePct >= 70 ? "emerald" : member.engagement.adherencePct >= 50 ? "amber" : "rose"} />
            <Stat label="Sesiones (30d)" value={member.engagement.sessionsLast30d.toString()} />
            <Stat label="Mensajes a Gohan" value={member.engagement.chatMessagesLast30d.toString()} />
            <Stat label="Edits de rutina" value={member.engagement.routineEditsLast30d.toString()} />
            <Stat label="NPS último" value={(member.engagement.npsLast ?? "—").toString()} accent={(member.engagement.npsLast ?? 0) >= 9 ? "emerald" : (member.engagement.npsLast ?? 0) >= 7 ? "amber" : "rose"} />
            <Stat label="Antigüedad" value={`${member.commercial.ltVMonths} meses`} />
            <Stat label="Referidos" value={member.commercial.referrals.toString()} />
            <Stat label="Revenue total" value={`$${member.commercial.totalRevenueUsd}`} />
          </div>
        </Section>

        <Section title="Riesgo de churn" icon={AlertCircle}>
          <div className="text-center py-2">
            <div className={`inline-block px-4 py-2 rounded-lg text-2xl font-bold ${RISK_BADGE[member.risk.churnRisk]}`}>
              {member.risk.churnScore}/100
            </div>
            <div className="text-xs text-ink-500 mt-2 capitalize">{member.risk.churnRisk}</div>
          </div>
          {member.risk.churnReasons.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {member.risk.churnReasons.map((r, i) => (
                <div key={i} className="text-xs text-ink-600 flex items-start gap-1.5">
                  <span className="text-rose-500 mt-0.5">●</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Opportunities */}
      <Section title="Oportunidades de monetización" icon={DollarSign} subtitle="Calculadas por confianza × revenue mensual estimado">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {member.opportunities.map((o, i) => (
            <div key={i} className="border border-ink-200 rounded-lg p-4 bg-gradient-to-br from-emerald-50/40 to-transparent">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-ink-900">{o.product}</div>
                  <div className="text-xs text-ink-600 mt-1">{o.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-emerald-600 font-bold">+${o.estMonthlyUsd}/m</div>
                  <div className="text-xs text-ink-500">conf. {o.confidence}%</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${o.confidence}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Persona context */}
      <Section title={`Contexto: ${persona.name}`} icon={TrendingUp} subtitle={persona.tagline}>
        <p className="text-sm text-ink-700">{persona.description}</p>
        <div className="mt-3 p-3 rounded-lg bg-ink-50 text-sm">
          <div className="font-semibold text-ink-900 mb-1">Play de retención sugerido</div>
          <p className="text-ink-700">{persona.retentionPlay}</p>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card p-5 ${className ?? ""}`}>
      <div className="flex items-start gap-3 mb-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-ink-100 text-ink-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function KV({ label, children, icon: Icon }: { label: string; children: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-1 text-sm">
      <span className="text-xs text-ink-500 w-32 shrink-0 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
      <span className="text-ink-800 flex-1">{children}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "ink",
}: {
  label: string;
  value: string;
  accent?: "ink" | "emerald" | "amber" | "rose";
}) {
  const accentText = {
    ink: "text-ink-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  }[accent];
  return (
    <div className="rounded-lg bg-ink-50 p-3">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${accentText}`}>{value}</div>
    </div>
  );
}
