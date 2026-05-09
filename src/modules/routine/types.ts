/**
 * Local types for the Routine UI module.
 * These are normalized (snake_case) shapes used by the components.
 * The normalizeRoutine() function in groupByDay.ts converts Dante's
 * camelCase DB types into this shape — one place to adapt, everything
 * downstream stays stable.
 *
 * order_index may have gaps after remove_exercise (CLAUDE.md quirk).
 * Always sort by it, never assume contiguous integers.
 */

export interface Exercise {
  id: string;
  day_id: string;
  name: string;
  sets: number;
  /** Reps as string so we can render ranges like "8-12" or "AMRAP". */
  reps: string;
  rest_seconds?: number | null;
  weight_kg?: number | null;
  notes?: string | null;
  order_index: number;
}

export interface RoutineDay {
  id: string;
  routine_id: string;
  /** Human label e.g. "Push", "Pull", "Legs". */
  name: string;
  day_index: number;
  muscle_groups?: string[] | null;
  exercises?: Exercise[];
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  days?: RoutineDay[];
}

export interface DaySelectorItem {
  dayOfWeek: number;
  label: string;
  muscleGroups: string[];
  isActive: boolean;
  isToday: boolean;
}
