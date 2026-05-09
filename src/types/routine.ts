export interface Routine {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  days: RoutineDay[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineDay {
  id: string;
  routineId: string;
  dayOfWeek: DayOfWeek;
  muscleGroups: string[];
  label: string;
  exercises: RoutineExercise[];
  createdAt: string;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

export interface RoutineExercise {
  id: string;
  routineDayId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  restSeconds: number;
  orderIndex: number;
  notes: string | null;
  aiReasoning: string | null;
  completed: boolean;
  createdAt: string;
}
