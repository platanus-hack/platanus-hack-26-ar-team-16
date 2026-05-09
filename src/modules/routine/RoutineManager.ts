import type { Routine, RoutineDay, DayOfWeek } from '../../types';

// TODO: @thblu — helper functions for routine display logic

export function getDayExercises(routine: Routine, day: DayOfWeek): RoutineDay | undefined {
  return routine.days.find((d) => d.dayOfWeek === day);
}

export function getCompletedCount(day: RoutineDay): number {
  return day.exercises.filter((e) => e.completed).length;
}

export function getTotalExercises(day: RoutineDay): number {
  return day.exercises.length;
}
