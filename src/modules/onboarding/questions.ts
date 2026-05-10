/**
 * Onboarding wizard questions — derived from `docs/onboarding-skill.md`.
 *
 * The skill defines 7 critical questions; we keep them in the same order so
 * the AI's downstream parsing matches the user's mental flow. The wizard
 * collects answers locally and sends a single composite message to the same
 * `ai-chat` edge function the chat tab uses, which calls the `create_routine`
 * tool to generate the first routine.
 */

export interface OnboardingOption {
  /** Stable identifier — also the value sent to the AI for parsing. */
  id: string;
  label: string;
  /** Visually highlighted as the recommended default. */
  recommended?: boolean;
}

export interface OnboardingQuestion {
  id: OnboardingQuestionId;
  /** Big-text headline. */
  title: string;
  /** Optional supporting blurb shown under the title. */
  subtitle?: string;
  options: OnboardingOption[];
  /** Whether the question allows multiple selected options. */
  multi?: boolean;
  /** Whether the question is skippable (skill marks #7 lesions as non-skip). */
  skippable: boolean;
}

export type OnboardingQuestionId =
  | 'goal'
  | 'gender'
  | 'level'
  | 'days'
  | 'duration'
  | 'preferences'
  | 'injuries';

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'goal',
    title: '¿Qué querés lograr?',
    subtitle: 'Esto define todo el plan: tipo de entrenamiento, descansos, volumen.',
    skippable: false,
    options: [
      { id: 'muscle', label: 'Ganar masa muscular' },
      { id: 'fat-loss', label: 'Perder grasa' },
      { id: 'shape', label: 'Ponerme en forma' },
      { id: 'strength', label: 'Aumentar fuerza' },
      { id: 'health', label: 'Salud' },
    ],
  },
  {
    id: 'gender',
    title: '¿Sos hombre o mujer?',
    subtitle: 'Me ayuda a calibrar la distribución de los ejercicios.',
    skippable: true,
    options: [
      { id: 'male', label: 'Masculino' },
      { id: 'female', label: 'Femenino' },
      { id: 'na', label: 'Prefiero no decir' },
    ],
  },
  {
    id: 'level',
    title: '¿Cuál es tu nivel?',
    subtitle: 'Si dudás, intermedio suele ser el más común.',
    skippable: false,
    options: [
      { id: 'beginner', label: 'Principiante' },
      { id: 'intermediate', label: 'Intermedio', recommended: true },
      { id: 'advanced', label: 'Avanzado' },
    ],
  },
  {
    id: 'days',
    title: '¿Cuántos días por semana podés entrenar?',
    skippable: false,
    options: [
      { id: '2', label: '2 días' },
      { id: '3', label: '3 días' },
      { id: '4', label: '4 días', recommended: true },
      { id: '5', label: '5 días' },
      { id: '6', label: '6 días' },
    ],
  },
  {
    id: 'duration',
    title: '¿Cuánto tiempo tenés por sesión?',
    skippable: false,
    options: [
      { id: '30', label: '30 min' },
      { id: '45', label: '45 min' },
      { id: '60', label: '60 min', recommended: true },
      { id: '90', label: '90 min' },
    ],
  },
  {
    id: 'preferences',
    title: '¿Qué tipo de entrenamiento disfrutás más?',
    subtitle: 'Podés elegir varios.',
    multi: true,
    skippable: true,
    options: [
      { id: 'weights', label: 'Pesas / máquinas' },
      { id: 'functional', label: 'Funcional / peso corporal' },
      { id: 'hiit', label: 'HIIT' },
      { id: 'cardio', label: 'Cardio tradicional' },
      { id: 'mobility', label: 'Mobility / estiramiento' },
    ],
  },
  {
    id: 'injuries',
    title: '¿Tenés alguna lesión o limitación?',
    subtitle: 'Si es complicado de explicar, escribilo en "Otra".',
    skippable: false,
    multi: true,
    options: [
      { id: 'none', label: 'No tengo', recommended: true },
      { id: 'knee', label: 'Rodilla' },
      { id: 'shoulder', label: 'Hombro' },
      { id: 'back', label: 'Espalda' },
    ],
  },
];

/**
 * AI's recommended training style for each goal. Surfaced in the preferences
 * step so the highlighted option shifts based on what the user picked in #1.
 */
export const GOAL_TO_PREFERENCE: Record<string, string> = {
  muscle: 'weights',
  'fat-loss': 'hiit',
  shape: 'functional',
  strength: 'weights',
  health: 'mobility',
  endurance: 'cardio',
};

/**
 * Build the composite message sent to the AI after the wizard finishes.
 * Mirrors the conversational summary called out at the end of the skill so
 * the agent has all 7 slots in a single turn and can call `create_routine`.
 */
export function buildSummaryMessage(
  answers: Record<OnboardingQuestionId, string>,
): string {
  const lines: string[] = [
    'Completé el onboarding desde el wizard. Estas son mis respuestas — armame la rutina ya:',
  ];
  for (const q of ONBOARDING_QUESTIONS) {
    const a = answers[q.id]?.trim();
    if (!a) continue;
    lines.push(`- ${q.title} ${a}`);
  }
  lines.push('Generá la rutina con create_routine.');
  return lines.join('\n');
}
