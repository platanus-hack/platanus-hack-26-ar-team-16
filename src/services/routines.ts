import type {
  DayOfWeek,
  Routine,
  RoutineDay,
  RoutineExercise,
} from '../types';
import { supabase } from './supabase';

interface RoutineExerciseRow {
  id: string;
  routine_day_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_seconds: number;
  order_index: number;
  notes: string | null;
  ai_reasoning: string | null;
  completed: boolean;
  created_at: string;
}

interface RoutineDayRow {
  id: string;
  routine_id: string;
  day_of_week: DayOfWeek;
  muscle_groups: string[];
  label: string;
  created_at: string;
  routine_exercises?: RoutineExerciseRow[];
}

interface RoutineRow {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  routine_days?: RoutineDayRow[];
}

function rowToExercise(row: RoutineExerciseRow): RoutineExercise {
  return {
    id: row.id,
    routineDayId: row.routine_day_id,
    exerciseName: row.exercise_name,
    sets: row.sets,
    reps: row.reps,
    weightKg: row.weight_kg,
    restSeconds: row.rest_seconds,
    orderIndex: row.order_index,
    notes: row.notes,
    aiReasoning: row.ai_reasoning,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

function rowToDay(row: RoutineDayRow): RoutineDay {
  const exercises = (row.routine_exercises ?? [])
    .map(rowToExercise)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  return {
    id: row.id,
    routineId: row.routine_id,
    dayOfWeek: row.day_of_week,
    muscleGroups: row.muscle_groups ?? [],
    label: row.label,
    exercises,
    createdAt: row.created_at,
  };
}

function rowToRoutine(row: RoutineRow): Routine {
  const days = (row.routine_days ?? [])
    .map(rowToDay)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isActive: row.is_active,
    days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ROUTINE_SELECT = `
  id, user_id, name, is_active, created_at, updated_at,
  routine_days (
    id, routine_id, day_of_week, muscle_groups, label, created_at,
    routine_exercises (
      id, routine_day_id, exercise_name, sets, reps, weight_kg,
      rest_seconds, order_index, notes, ai_reasoning, completed, created_at
    )
  )
`;

export async function getActiveRoutine(userId: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from('routines')
    .select(ROUTINE_SELECT)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRoutine(data as RoutineRow) : null;
}

export async function getRoutineById(routineId: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from('routines')
    .select(ROUTINE_SELECT)
    .eq('id', routineId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRoutine(data as RoutineRow) : null;
}

export async function updateExercise(
  exerciseId: string,
  data: { sets?: number; reps?: number; weightKg?: number | null; notes?: string | null }
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (data.sets !== undefined) updates.sets = data.sets;
  if (data.reps !== undefined) updates.reps = data.reps;
  if (data.weightKg !== undefined) updates.weight_kg = data.weightKg;
  if (data.notes !== undefined) updates.notes = data.notes;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from('routine_exercises')
    .update(updates)
    .eq('id', exerciseId);
  if (error) throw error;
}

export async function markExerciseCompleted(
  exerciseId: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from('routine_exercises')
    .update({ completed })
    .eq('id', exerciseId);
  if (error) throw error;
}
