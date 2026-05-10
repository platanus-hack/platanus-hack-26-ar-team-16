import type {
  Member,
  OperationMetrics,
  PersonaId,
  Goal,
  ExperienceLevel,
} from "./types";

// ============================================================
// Mock data realista. Representa una sucursal de ~850 miembros
// activos del gym con Gohan AI integrado. Cifras alineadas con
// benchmarks de retail fitness LATAM (Smart Fit, Gold's, etc.)
// ============================================================

const FIRST_NAMES_M = ["Lucas", "Mateo", "Joaquín", "Tomás", "Nicolás", "Bruno", "Federico", "Diego", "Martín", "Gonzalo", "Santiago", "Agustín", "Maxi", "Pablo", "Ramiro", "Iván"];
const FIRST_NAMES_F = ["Sofía", "Camila", "Valentina", "Martina", "Lucía", "Renata", "Florencia", "Julieta", "Antonia", "Catalina", "Pilar", "Mía", "Ana", "Clara", "Delfina", "Isabel"];
const LAST_NAMES = ["Alvarez", "Benítez", "Castro", "Domínguez", "Espinoza", "Fernández", "García", "Herrera", "Iglesias", "Jiménez", "Krieger", "López", "Martínez", "Núñez", "Ortega", "Pérez", "Quiroga", "Ramírez", "Suárez", "Torres", "Valverde"];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function rand(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 9999) * 10000;
  const r = x - Math.floor(x);
  return Math.floor(r * (max - min + 1)) + min;
}

const PALETTE = ["#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#a855f7", "#ec4899", "#14b8a6"];

interface PersonaTemplate {
  id: PersonaId;
  goalPool: Goal[];
  expPool: ExperienceLevel[];
  ageRange: [number, number];
  sexBias: "M" | "F" | "any";
  daysRange: [number, number];
  sessionRange: [number, number];
  weightRange: [number, number];
  heightRange: [number, number];
  conditionsPool: string[];
  meds: string[];
  wearableProb: number;
  cycleTracking: boolean;
  plans: { plan: "básico" | "plus" | "premium" | "elite"; fee: number; weight: number }[];
  adherenceRange: [number, number];
}

const TEMPLATES: PersonaTemplate[] = [
  {
    id: "newcomer",
    goalPool: ["salud-general", "perder-grasa"],
    expPool: ["principiante"],
    ageRange: [22, 38],
    sexBias: "any",
    daysRange: [2, 3],
    sessionRange: [30, 45],
    weightRange: [60, 95],
    heightRange: [158, 185],
    conditionsPool: [],
    meds: [],
    wearableProb: 0.25,
    cycleTracking: false,
    plans: [
      { plan: "básico", fee: 25, weight: 70 },
      { plan: "plus", fee: 39, weight: 30 },
    ],
    adherenceRange: [25, 65],
  },
  {
    id: "hipertrofia",
    goalPool: ["hipertrofia", "fuerza"],
    expPool: ["intermedio", "avanzado"],
    ageRange: [20, 32],
    sexBias: "M",
    daysRange: [4, 6],
    sessionRange: [60, 90],
    weightRange: [70, 105],
    heightRange: [168, 190],
    conditionsPool: [],
    meds: [],
    wearableProb: 0.65,
    cycleTracking: false,
    plans: [
      { plan: "plus", fee: 39, weight: 50 },
      { plan: "premium", fee: 65, weight: 50 },
    ],
    adherenceRange: [70, 95],
  },
  {
    id: "professional",
    goalPool: ["salud-general", "perder-grasa"],
    expPool: ["principiante", "intermedio"],
    ageRange: [30, 45],
    sexBias: "any",
    daysRange: [3, 4],
    sessionRange: [30, 45],
    weightRange: [62, 95],
    heightRange: [160, 188],
    conditionsPool: ["estrés crónico", "insomnio leve"],
    meds: ["sertralina 50mg"],
    wearableProb: 0.78,
    cycleTracking: false,
    plans: [
      { plan: "premium", fee: 65, weight: 40 },
      { plan: "elite", fee: 109, weight: 60 },
    ],
    adherenceRange: [55, 80],
  },
  {
    id: "holistic-female",
    goalPool: ["hipertrofia", "salud-general", "perder-grasa"],
    expPool: ["intermedio", "principiante"],
    ageRange: [25, 45],
    sexBias: "F",
    daysRange: [3, 5],
    sessionRange: [45, 60],
    weightRange: [52, 75],
    heightRange: [155, 175],
    conditionsPool: ["dolor menstrual", "anemia leve"],
    meds: ["anticonceptivo oral"],
    wearableProb: 0.72,
    cycleTracking: true,
    plans: [
      { plan: "plus", fee: 39, weight: 35 },
      { plan: "premium", fee: 65, weight: 65 },
    ],
    adherenceRange: [65, 90],
  },
  {
    id: "active-senior",
    goalPool: ["salud-general", "fuerza"],
    expPool: ["principiante", "intermedio"],
    ageRange: [50, 72],
    sexBias: "any",
    daysRange: [3, 4],
    sessionRange: [45, 60],
    weightRange: [60, 90],
    heightRange: [155, 180],
    conditionsPool: ["hipertensión", "artrosis", "diabetes tipo 2", "osteopenia"],
    meds: ["losartán 50mg", "metformina 850mg", "atorvastatina 20mg"],
    wearableProb: 0.45,
    cycleTracking: false,
    plans: [
      { plan: "plus", fee: 39, weight: 60 },
      { plan: "premium", fee: 65, weight: 40 },
    ],
    adherenceRange: [70, 92],
  },
  {
    id: "performance-athlete",
    goalPool: ["resistencia", "fuerza", "hipertrofia"],
    expPool: ["intermedio", "avanzado"],
    ageRange: [25, 50],
    sexBias: "any",
    daysRange: [5, 6],
    sessionRange: [60, 90],
    weightRange: [58, 90],
    heightRange: [162, 190],
    conditionsPool: ["tendinitis recurrente"],
    meds: [],
    wearableProb: 0.97,
    cycleTracking: false,
    plans: [
      { plan: "premium", fee: 65, weight: 30 },
      { plan: "elite", fee: 149, weight: 70 },
    ],
    adherenceRange: [82, 98],
  },
];

const PERSONA_DISTRIBUTION: { id: PersonaId; pct: number }[] = [
  { id: "newcomer", pct: 24 },
  { id: "hipertrofia", pct: 22 },
  { id: "professional", pct: 18 },
  { id: "holistic-female", pct: 16 },
  { id: "active-senior", pct: 11 },
  { id: "performance-athlete", pct: 9 },
];

function buildMember(seed: number, personaId: PersonaId): Member {
  const tpl = TEMPLATES.find((t) => t.id === personaId)!;

  const sex: "M" | "F" =
    tpl.sexBias === "M"
      ? "M"
      : tpl.sexBias === "F"
      ? "F"
      : seed % 2 === 0
      ? "M"
      : "F";

  const firstName =
    sex === "F" ? pick(FIRST_NAMES_F, seed * 3) : pick(FIRST_NAMES_M, seed * 3);
  const lastName = pick(LAST_NAMES, seed * 7);
  const name = `${firstName} ${lastName}`;

  const age = rand(seed + 1, tpl.ageRange[0], tpl.ageRange[1]);
  const weightKg = rand(seed + 2, tpl.weightRange[0], tpl.weightRange[1]);
  const heightCm = rand(seed + 3, tpl.heightRange[0], tpl.heightRange[1]);
  const goal = pick(tpl.goalPool, seed + 4);
  const experience = pick(tpl.expPool, seed + 5);
  const daysPerWeek = rand(seed + 6, tpl.daysRange[0], tpl.daysRange[1]);
  const sessionMinutes = pick([30, 45, 60, 90].filter((v) => v >= tpl.sessionRange[0] && v <= tpl.sessionRange[1]), seed + 7);

  const planRoll = rand(seed + 8, 0, 100);
  let cumulative = 0;
  let chosenPlan = tpl.plans[0];
  for (const p of tpl.plans) {
    cumulative += p.weight;
    if (planRoll <= cumulative) {
      chosenPlan = p;
      break;
    }
  }

  const monthsActive = rand(seed + 9, personaId === "newcomer" ? 1 : 4, personaId === "active-senior" ? 84 : personaId === "performance-athlete" ? 48 : 36);
  const adherencePct = rand(seed + 10, tpl.adherenceRange[0], tpl.adherenceRange[1]);
  const sessionsLast30d = Math.round((adherencePct / 100) * daysPerWeek * 4.3);

  const wearableConnected = rand(seed + 11, 1, 100) <= tpl.wearableProb * 100;
  const stressLevel = (rand(seed + 12, 1, 5)) as 1 | 2 | 3 | 4 | 5;
  const sleepHours = rand(seed + 13, personaId === "professional" ? 5 : 6, 8) + (rand(seed + 14, 0, 9) / 10);

  // Churn risk model:
  //   bajo adherencia + bajo NPS + pocos meses + pocos chats con Gohan = alto riesgo
  let churnScore = 0;
  if (adherencePct < 40) churnScore += 35;
  else if (adherencePct < 60) churnScore += 18;
  if (monthsActive < 3) churnScore += 25;
  else if (monthsActive < 6) churnScore += 10;
  const npsLast = rand(seed + 15, personaId === "newcomer" ? 4 : 6, 10);
  if (npsLast <= 6) churnScore += 25;
  else if (npsLast <= 8) churnScore += 8;
  if (stressLevel >= 4) churnScore += 8;
  churnScore = Math.min(100, churnScore);

  const churnRisk: Member["risk"]["churnRisk"] =
    churnScore >= 60 ? "crítico" : churnScore >= 40 ? "alto" : churnScore >= 20 ? "medio" : "bajo";

  const churnReasons: string[] = [];
  if (adherencePct < 60) churnReasons.push(`Adherencia ${adherencePct}% (debajo del umbral 60%)`);
  if (npsLast <= 6) churnReasons.push(`NPS ${npsLast}/10 — detractor`);
  if (monthsActive < 3) churnReasons.push("Antigüedad <3 meses (zona de riesgo de fuga)");
  if (stressLevel >= 4) churnReasons.push("Estrés autoreportado 4-5/5");

  // Opportunities por persona
  const oppsByPersona: Record<PersonaId, Member["opportunities"]> = {
    newcomer: [
      { product: "Onboarding 90d con coach", estMonthlyUsd: 30, confidence: churnScore > 30 ? 72 : 28, reason: "Alto riesgo de fuga + adherencia baja" },
      { product: "Antropometría inicial", estMonthlyUsd: 12, confidence: 55, reason: "Aún no tiene baseline medido" },
    ],
    hipertrofia: [
      { product: "Suscripción proteína whey", estMonthlyUsd: 45, confidence: 78, reason: "Volumen alto + suplementación declarada" },
      { product: "Plan macros pro", estMonthlyUsd: 39, confidence: 64, reason: "Edita rutina frecuentemente, alto involvement" },
    ],
    professional: [
      { product: "Upgrade a plan anual Elite", estMonthlyUsd: 30, confidence: 68, reason: "Plan premium + alto LTV proyectado" },
      { product: "Programa sueño + mindfulness", estMonthlyUsd: 29, confidence: sleepHours < 6.5 ? 81 : 35, reason: `Sueño ${sleepHours.toFixed(1)}h, estrés ${stressLevel}/5` },
    ],
    "holistic-female": [
      { product: "Nutrición ciclo-sincronizada", estMonthlyUsd: 49, confidence: 74, reason: "Tracking de ciclo activo" },
      { product: "Bundle femme afiliado", estMonthlyUsd: 18, confidence: 51, reason: "Engagement alto en módulo nutricional" },
    ],
    "active-senior": [
      { product: "Bundle fisio + entrenamiento", estMonthlyUsd: 35, confidence: 69, reason: "Condiciones crónicas + lesiones declaradas" },
      { product: "Convenio obra social (reembolso)", estMonthlyUsd: 0, confidence: 88, reason: "Cumple criterios de cobertura" },
    ],
    "performance-athlete": [
      { product: "Upgrade a tier Elite", estMonthlyUsd: 84, confidence: 71, reason: "Wearable activo 95%+, cargas altas" },
      { product: "Programa evento específico", estMonthlyUsd: 30, confidence: 58, reason: "Eventos declarados en chat" },
    ],
  };

  const lastActiveOffsetDays = rand(seed + 30, 0, monthsActive < 2 ? 14 : 60);

  return {
    id: `m-${seed.toString().padStart(4, "0")}`,
    name,
    age,
    sex,
    weightKg,
    heightCm,
    goal,
    experience,
    daysPerWeek,
    sessionMinutes,
    injuries:
      personaId === "active-senior"
        ? ["rodilla derecha (artrosis)", "hombro izquierdo"]
        : personaId === "performance-athlete" && rand(seed, 0, 1) === 0
        ? ["tendinitis aquilea recurrente"]
        : [],
    personaId,
    health: {
      conditions:
        tpl.conditionsPool.length > 0
          ? [tpl.conditionsPool[seed % tpl.conditionsPool.length]]
          : [],
      medications:
        tpl.meds.length > 0 && rand(seed + 16, 0, 100) > 30
          ? [tpl.meds[seed % tpl.meds.length]]
          : [],
      allergies: rand(seed + 17, 0, 10) > 7 ? ["polen"] : [],
      surgeries: personaId === "active-senior" && rand(seed, 0, 10) > 6 ? ["meniscectomía 2018"] : [],
      familyHistory:
        personaId === "active-senior"
          ? ["cardiopatía paterna", "diabetes tipo 2"]
          : personaId === "professional"
          ? ["hipertensión"]
          : [],
    },
    lifestyle: {
      sleepHours: parseFloat(sleepHours.toFixed(1)),
      sleepQuality: (rand(seed + 18, personaId === "professional" ? 1 : 3, 5)) as 1 | 2 | 3 | 4 | 5,
      alcoholFreq: pick(["nunca", "ocasional", "semanal"], seed + 19) as "nunca" | "ocasional" | "semanal",
      smoker: rand(seed + 20, 0, 100) < 8,
      stressLevel,
    },
    wearable: {
      connected: wearableConnected,
      device: wearableConnected ? pick(["apple", "garmin", "polar", "whoop", "fitbit"], seed + 21) as "apple" | "garmin" | "polar" | "whoop" | "fitbit" : undefined,
      avgRestingHR: wearableConnected ? rand(seed + 22, personaId === "performance-athlete" ? 45 : 58, 75) : undefined,
      avgHRV: wearableConnected ? rand(seed + 23, 35, 90) : undefined,
      avgSleepScore: wearableConnected ? rand(seed + 24, personaId === "professional" ? 55 : 70, 92) : undefined,
      avgStepsDaily: wearableConnected ? rand(seed + 25, 5500, 14000) : undefined,
      vo2Max: wearableConnected && (personaId === "performance-athlete" || personaId === "hipertrofia") ? rand(seed + 26, 38, 58) : undefined,
    },
    reproductive: tpl.cycleTracking
      ? {
          tracksCycle: true,
          cyclePhase: pick(["folicular", "ovulatoria", "lútea", "menstrual"], seed + 27) as "folicular" | "ovulatoria" | "lútea" | "menstrual",
          cycleLengthDays: rand(seed + 28, 26, 32),
        }
      : undefined,
    engagement: {
      joinedAt: new Date(Date.now() - monthsActive * 30 * 24 * 3600 * 1000).toISOString(),
      lastActiveAt: new Date(Date.now() - lastActiveOffsetDays * 24 * 3600 * 1000).toISOString(),
      sessionsLast30d,
      adherencePct,
      chatMessagesLast30d: rand(seed + 29, personaId === "newcomer" ? 2 : 8, personaId === "performance-athlete" ? 65 : 40),
      routineEditsLast30d: rand(seed + 31, 0, personaId === "hipertrofia" ? 12 : 6),
      npsLast,
      npsLastAt: new Date(Date.now() - rand(seed + 32, 5, 60) * 24 * 3600 * 1000).toISOString(),
    },
    commercial: {
      plan: chosenPlan.plan,
      monthlyFeeUsd: chosenPlan.fee,
      ltVMonths: monthsActive,
      totalRevenueUsd: monthsActive * chosenPlan.fee,
      paymentMethod: pick(["tarjeta", "débito automático"], seed + 33) as "tarjeta" | "débito automático",
      referrals: rand(seed + 34, 0, personaId === "hipertrofia" ? 4 : 2),
    },
    risk: {
      churnRisk,
      churnScore,
      churnReasons,
    },
    opportunities: oppsByPersona[personaId],
    preferredSplit:
      personaId === "newcomer"
        ? "full-body"
        : personaId === "hipertrofia"
        ? "ppl"
        : personaId === "performance-athlete"
        ? "upper-lower"
        : pick(["full-body", "torso-pierna", "ppl", "upper-lower"], seed + 35) as "full-body" | "torso-pierna" | "ppl" | "upper-lower",
    avatarColor: PALETTE[seed % PALETTE.length],
  };
}

// Generate ~120 members for a representative sample
export const MEMBERS: Member[] = (() => {
  const out: Member[] = [];
  let seed = 1;
  const totalSample = 120;
  for (const dist of PERSONA_DISTRIBUTION) {
    const count = Math.round((dist.pct / 100) * totalSample);
    for (let i = 0; i < count; i++) {
      out.push(buildMember(seed++, dist.id));
    }
  }
  return out;
})();

// ============================================================
// Aggregate metrics — computed from the mock dataset
// ============================================================

const totalRevenue = MEMBERS.reduce((s, m) => s + m.commercial.monthlyFeeUsd, 0);
const totalOpportunityRevenue = MEMBERS.reduce(
  (s, m) => s + m.opportunities.reduce((a, o) => a + (o.estMonthlyUsd * o.confidence) / 100, 0),
  0
);

export const OPERATION_METRICS: OperationMetrics = {
  // Real values are scaled to a "branch" of 850 members (factor)
  activeMembers: 847,
  membersTrend30d: 4.2,
  mrrUsd: Math.round((totalRevenue / MEMBERS.length) * 847),
  mrrTrend: 6.1,
  churnRate30d: 3.8,
  churnTrend: -0.4,
  nps: 52,
  npsTrend: 7,
  avgAdherence: Math.round(
    MEMBERS.reduce((s, m) => s + m.engagement.adherencePct, 0) / MEMBERS.length
  ),
  avgAdherenceTrend: 3.5,
  wearableConnectedPct: Math.round(
    (MEMBERS.filter((m) => m.wearable.connected).length / MEMBERS.length) * 100
  ),
  chatEngagementPct: Math.round(
    (MEMBERS.filter((m) => m.engagement.chatMessagesLast30d > 2).length / MEMBERS.length) * 100
  ),
};

export const TOTAL_OPPORTUNITY_MRR = Math.round((totalOpportunityRevenue / MEMBERS.length) * 847);

// 12-month MRR trend (synthetic, growing)
export const MRR_TREND = (() => {
  const base = OPERATION_METRICS.mrrUsd * 0.78;
  const months = ["Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May"];
  return months.map((m, i) => ({
    month: m,
    mrr: Math.round(base + (OPERATION_METRICS.mrrUsd - base) * (i / 11) + (i % 3) * 220),
    target: Math.round(base + (OPERATION_METRICS.mrrUsd * 1.1 - base) * (i / 11)),
  }));
})();

// Churn trend
export const CHURN_TREND = [
  { month: "Jun", churn: 5.1, nps: 41 },
  { month: "Jul", churn: 4.8, nps: 42 },
  { month: "Ago", churn: 4.6, nps: 44 },
  { month: "Sep", churn: 4.5, nps: 45 },
  { month: "Oct", churn: 4.4, nps: 46 },
  { month: "Nov", churn: 4.3, nps: 47 },
  { month: "Dic", churn: 4.2, nps: 48 },
  { month: "Ene", churn: 4.0, nps: 50 },
  { month: "Feb", churn: 4.1, nps: 49 },
  { month: "Mar", churn: 3.9, nps: 51 },
  { month: "Abr", churn: 3.8, nps: 52 },
  { month: "May", churn: 3.8, nps: 52 },
];

// Heatmap de ocupación por hora/día (datos derivados de patrones de Gohan)
export const OCCUPANCY_HEATMAP = (() => {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const data: { day: string; hour: number; occupancy: number }[] = [];
  for (const d of days) {
    for (const h of hours) {
      let base = 30;
      if (h >= 7 && h <= 9) base += 35;
      if (h >= 18 && h <= 20) base += 50;
      if (d === "Sáb" || d === "Dom") base = base * 0.7;
      base += Math.random() * 15;
      data.push({ day: d, hour: h, occupancy: Math.min(100, Math.round(base)) });
    }
  }
  return data;
})();
