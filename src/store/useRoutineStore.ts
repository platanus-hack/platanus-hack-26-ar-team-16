import { create } from 'zustand';
import type { Routine, DayOfWeek } from '../types';

interface RoutineState {
  routine: Routine | null;
  selectedDay: DayOfWeek;
  isLoading: boolean;
  setRoutine: (routine: Routine | null) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setLoading: (loading: boolean) => void;
}

export const useRoutineStore = create<RoutineState>((set) => ({
  routine: null,
  selectedDay: new Date().getDay() as DayOfWeek,
  isLoading: true,
  setRoutine: (routine) => set({ routine }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  setLoading: (isLoading) => set({ isLoading }),
}));
