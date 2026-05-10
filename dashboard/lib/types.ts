// ============================================================
// Gohan AI — Tipos del modelo de datos
// Refleja las 3 capas de información que captura el agente:
// Capa 1 (crítica), Capa 2 (personalización), Capa 3 (deep)
// ============================================================

export type PersonaId =
  | "newcomer"
  | "hipertrofia"
  | "professional"
  | "holistic-female"
  | "active-senior"
  | "performance-athlete";

export type Goal =
  | "hipertrofia"
  | "perder-grasa"
  | "salud-general"
  | "fuerza"
  | "resistencia";

export type ExperienceLevel = "principiante" | "intermedio" | "avanzado";

export type ChurnRisk = "bajo" | "medio" | "alto" | "crítico";

export type SplitType =
  | "full-body"
  | "torso-pierna"
  | "ppl"
  | "bro-split"
  | "upper-lower";

// --- Capa 1: Datos críticos ---
export interface BasicProfile {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F" | "Otro";
  weightKg: number;
  heightCm: number;
  goal: Goal;
  experience: ExperienceLevel;
  daysPerWeek: number;
  sessionMinutes: number;
  injuries: string[];
}

// --- Capa 2: Personalización ---
export interface HealthProfile {
  conditions: string[]; // hipertensión, diabetes, etc.
  medications: string[];
  allergies: string[];
  surgeries: string[];
  familyHistory: string[];
}

export interface Lifestyle {
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  alcoholFreq: "nunca" | "ocasional" | "semanal" | "diario";
  smoker: boolean;
  stressLevel: 1 | 2 | 3 | 4 | 5;
}

// --- Capa 3: Deep knowledge (wearable + comportamiento) ---
export interface WearableData {
  connected: boolean;
  device?: "apple" | "garmin" | "polar" | "whoop" | "fitbit";
  avgRestingHR?: number;
  avgHRV?: number; // ms
  avgSleepScore?: number; // 0-100
  avgStepsDaily?: number;
  vo2Max?: number;
}

export interface ReproductiveHealth {
  tracksCycle: boolean;
  cyclePhase?: "folicular" | "ovulatoria" | "lútea" | "menstrual";
  cycleLengthDays?: number;
}

// --- Behavioral / engagement ---
export interface Engagement {
  joinedAt: string; // ISO date
  lastActiveAt: string;
  sessionsLast30d: number;
  adherencePct: number; // 0-100, % de rutinas completadas
  chatMessagesLast30d: number;
  routineEditsLast30d: number;
  npsLast?: number; // 0-10
  npsLastAt?: string;
}

// --- Comercial ---
export interface CommercialData {
  plan: "básico" | "plus" | "premium" | "elite";
  monthlyFeeUsd: number;
  ltVMonths: number; // lifetime value en meses
  totalRevenueUsd: number;
  paymentMethod: "tarjeta" | "débito automático" | "efectivo";
  referrals: number;
}

// --- Risk + opportunities (computed) ---
export interface MemberRisk {
  churnRisk: ChurnRisk;
  churnScore: number; // 0-100
  churnReasons: string[];
}

export interface UpsellOpportunity {
  product: string;
  estMonthlyUsd: number;
  confidence: number; // 0-100
  reason: string;
}

// --- Member completo ---
export interface Member extends BasicProfile {
  personaId: PersonaId;
  health: HealthProfile;
  lifestyle: Lifestyle;
  wearable: WearableData;
  reproductive?: ReproductiveHealth;
  engagement: Engagement;
  commercial: CommercialData;
  risk: MemberRisk;
  opportunities: UpsellOpportunity[];
  preferredSplit: SplitType;
  avatarColor: string;
}

// --- Persona definition ---
export interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  ageRange: string;
  pctOfBase: number; // % de la base de socios
  primaryGoals: Goal[];
  keyData: string[]; // qué datos únicos define a esta persona
  monetization: {
    headline: string;
    products: { name: string; priceUsd: number; conversion: number }[];
    estArpuLiftUsd: number; // bump mensual sobre la fee base
  };
  retentionPlay: string;
  color: string; // tailwind hue
}

// --- Aggregate metrics (operación) ---
export interface OperationMetrics {
  activeMembers: number;
  membersTrend30d: number; // % vs mes anterior
  mrrUsd: number;
  mrrTrend: number;
  churnRate30d: number; // %
  churnTrend: number;
  nps: number;
  npsTrend: number;
  avgAdherence: number;
  avgAdherenceTrend: number;
  wearableConnectedPct: number;
  chatEngagementPct: number;
}
