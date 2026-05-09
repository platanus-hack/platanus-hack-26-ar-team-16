/**
 * Helpers for shaping routine data for the UI.
 *
 * normalizeRoutine() is the single adaptation layer between Dante's
 * camelCase DB types and the local snake_case shape the components expect.
 * If the DB schema changes, only touch this file.
 *
 * order_index gaps are expected (CLAUDE.md quirk: remove_exercise does not
 * reindex). Always sort, never assume contiguous integers.
 */

import type { Exercise, Routine, RoutineDay } from './types';

/** Sort exercises by order_index, tolerating gaps. Ties break on id. */
export function sortExercises(exercises: Exercise[] | undefined): Exercise[] {
  if (!exercises?.length) return [];
  return [...exercises].sort((a, b) => {
    if (a.order_index !== b.order_index) return a.order_index - b.order_index;
    return a.id.localeCompare(b.id);
  });
}

/** Sort days by day_index. Ties break on id. */
export function sortDays(days: RoutineDay[] | undefined): RoutineDay[] {
  if (!days?.length) return [];
  return [...days].sort((a, b) => {
    if (a.day_index !== b.day_index) return a.day_index - b.day_index;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Converts Dante's camelCase Routine (from useRoutineStore) to the local
 * snake_case shape the components consume. Handles both casing variants so
 * this stays correct even if the DB type evolves.
 *
 * Field mapping from Dante's src/types/routine.ts:
 *   RoutineDay.label        → name
 *   RoutineDay.dayOfWeek    → day_index
 *   RoutineDay.muscleGroups → muscle_groups
 *   RoutineExercise.exerciseName  → name
 *   RoutineExercise.routineDayId  → day_id
 *   RoutineExercise.orderIndex    → order_index
 *   RoutineExercise.weightKg      → weight_kg
 *   RoutineExercise.restSeconds   → rest_seconds
 */
export function normalizeRoutine(input: any): Routine | null {
  if (!input) return null;

  const days = (input.days ?? input.routine_days ?? []).map((d: any) => ({
    id: d.id,
    routine_id: d.routine_id ?? d.routineId,
    name: d.name ?? d.label,
    day_index: d.day_index ?? d.dayIndex ?? d.dayOfWeek ?? 0,
    muscle_groups: d.muscle_groups ?? d.muscleGroups ?? null,
    exercises: (d.exercises ?? []).map((e: any) => ({
      id: e.id,
      day_id: e.day_id ?? e.dayId ?? e.routineDayId,
      name: e.name ?? e.exerciseName,
      sets: e.sets ?? 0,
      reps: String(e.reps ?? ''),
      rest_seconds: e.rest_seconds ?? e.restSeconds ?? null,
      weight_kg: e.weight_kg ?? e.weightKg ?? null,
      notes: e.notes ?? null,
      order_index: e.order_index ?? e.orderIndex ?? 0,
    })),
  }));

  return {
    id: input.id,
    user_id: input.user_id ?? input.userId,
    name: input.name,
    description: input.description ?? null,
    is_active: input.is_active ?? input.isActive ?? true,
    created_at: input.created_at ?? input.createdAt,
    updated_at: input.updated_at ?? input.updatedAt ?? null,
    days: sortDays(days),
  };
}

/** "Push · Pull · Legs" summary for the header chip. */
export function summarizeDays(days: RoutineDay[] | undefined): string {
  if (!days?.length) return 'Sin días';
  const sorted = sortDays(days);
  const first = sorted.slice(0, 3).map((d) => d.name);
  const extra = sorted.length - first.length;
  const base = first.join(' · ');
  return extra > 0 ? `${base} +${extra}` : base;
}

/** Format rest seconds as "01:30". Returns null when falsy. */
export function formatRest(seconds?: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
