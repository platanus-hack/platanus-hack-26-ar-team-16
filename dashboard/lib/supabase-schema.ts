// ============================================================
// Supabase schema — alineado con FOUNDATION.md del repo real
// (platanus-hack/platanus-hack-26-ar-team-16)
//
// Estos tipos espejan EXACTAMENTE las tablas que define DEV 3 en
// supabase/migrations/001_initial_schema.sql. El dashboard se
// alimenta de estas tablas + agregados derivados.
// ============================================================

export interface Tenant {
  id: string;
  name: string;          // "SmartFit", "Gold's Gym", etc.
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
}

export interface Profile {
  id: string;            // FK a auth.users
  tenant_id: string;     // FK a tenants — multi-tenant
  display_name: string;
  avatar_url: string | null;
  fitness_level: "principiante" | "intermedio" | "avanzado";
  equipment_available: string[]; // ["mancuernas", "barra", "máquinas"]
  injuries: string[];            // ["rodilla derecha", "hombro izquierdo"]
  training_days_per_week: number;
  goals: string[];               // ["hipertrofia", "perder grasa"]
  onboarding_completed: boolean;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;       // FK a profiles
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineDay {
  id: string;
  routine_id: string;    // FK a routines
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Domingo, 1=Lunes...
  muscle_groups: string[];  // ["pecho", "tríceps"]
  label: string;            // "Push A", "Pull", etc.
  created_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_day_id: string; // FK a routine_days
  exercise_name: string;
  sets: number;
  reps: number;          // o rango "8-12"
  weight_kg: number | null;
  rest_seconds: number;
  order_index: number;
  notes: string | null;
  ai_reasoning: string | null; // Por qué la IA eligió este ejercicio
  completed: boolean;          // ⭐ Esto alimenta la métrica de adherencia
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;       // ⭐ Mina de oro: aquí está el contexto vivo
  audio_url: string | null;
  created_at: string;
}

// ============================================================
// Tipos derivados/agregados que computa el dashboard sobre las
// tablas anteriores (vía SQL views o queries en /services/)
// ============================================================

export interface MemberAggregate {
  profile: Profile;
  tenant: Tenant;
  active_routine: Routine | null;
  // Adherencia computada de routine_exercises.completed sobre últimos 30d
  adherence_30d_pct: number;
  // Conteo de rutinas completadas (sesiones)
  sessions_30d: number;
  // Conteo de mensajes a Gohan
  chat_messages_30d: number;
  // Cantidad de veces que la IA modificó la rutina (proxy de involvement)
  routine_edits_30d: number;
  // NPS — esto requiere agregar una tabla `nps_responses` (sugerencia)
  nps_last: number | null;
  // Antigüedad
  member_since_months: number;
  // Inferidos del análisis de mensajes (Claude API en background job)
  inferred: {
    persona_id: string;       // → ver lib/personas.ts
    stress_level: 1 | 2 | 3 | 4 | 5 | null;
    sleep_quality: 1 | 2 | 3 | 4 | 5 | null;
    churn_risk_score: number; // 0-100
    churn_reasons: string[];
  };
}

// ============================================================
// Tablas SUGERIDAS para cubrir gaps (no existen aún en el repo,
// pero deberían agregarse para alimentar el dashboard B2B)
// ============================================================

/** Sugerencia: agregar tabla `nps_responses` */
export interface NpsResponse_SUGGESTED {
  id: string;
  user_id: string;
  score: number; // 0-10
  comment: string | null;
  asked_in_conversation_id: string | null; // Gohan pregunta en chat
  created_at: string;
}

/** Sugerencia: agregar tabla `wearable_connections` para integrar Terra/OpenWearables */
export interface WearableConnection_SUGGESTED {
  id: string;
  user_id: string;
  provider: "apple" | "garmin" | "polar" | "whoop" | "fitbit";
  is_active: boolean;
  last_synced_at: string | null;
  // Métricas crudas se guardan en wearable_metrics (otra tabla)
}

/** Sugerencia: agregar tabla `commercial` para precio por miembro/plan */
export interface MembershipPlan_SUGGESTED {
  id: string;
  user_id: string;
  tenant_id: string;
  plan: "básico" | "plus" | "premium" | "elite";
  monthly_fee_usd: number;
  payment_method: string;
  active_since: string;
  cancelled_at: string | null;
}

/** Sugerencia: agregar tabla `member_inferences` con cache de inferencias de Claude */
export interface MemberInference_SUGGESTED {
  user_id: string;
  inferred_at: string;
  persona_id: string;
  stress_level: number | null;
  goal_changes: string[]; // si cambió de objetivo
  upsell_opportunities: { product: string; confidence: number; reason: string }[];
  // Esta tabla es la "intelligence layer" que llena el dashboard
}
