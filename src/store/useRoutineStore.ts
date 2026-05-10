import { create } from 'zustand';
import type { Routine, DayOfWeek } from '../types';
import type { RoutineSummary } from '../services/routines';

interface RoutineState {
  routine: Routine | null;
  routines: RoutineSummary[];
  selectedDay: DayOfWeek;
  isLoading: boolean;
  setRoutine: (routine: Routine | null) => void;
  setRoutines: (routines: RoutineSummary[]) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setLoading: (loading: boolean) => void;
}

export const useRoutineStore = create<RoutineState>((set) => ({
  routine: null,
  routines: [],
  selectedDay: new Date().getDay() as DayOfWeek,
  isLoading: true,
  setRoutine: (routine) => set({ routine }),
  setRoutines: (routines) => set({ routines }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  setLoading: (isLoading) => set({ isLoading }),
}));
