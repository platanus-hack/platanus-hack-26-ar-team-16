import type { Routine } from '../types';

// TODO: @DanteDia — implement with Supabase queries

export async function getActiveRoutine(_userId: string): Promise<Routine | null> {
  throw new Error('Not implemented');
}

export async function updateExercise(
  _exerciseId: string,
  _data: { sets?: number; reps?: number; weightKg?: number; notes?: string }
): Promise<void> {
  throw new Error('Not implemented');
}

export async function markExerciseCompleted(
  _exerciseId: string,
  _completed: boolean
): Promise<void> {
  throw new Error('Not implemented');
}
