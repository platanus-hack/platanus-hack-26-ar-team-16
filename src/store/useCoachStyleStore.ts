import { create } from 'zustand';
import type { CoachStyle } from '../types';

interface CoachStyleState {
  style: CoachStyle;
  setStyle: (style: CoachStyle) => void;
}

export const useCoachStyleStore = create<CoachStyleState>((set) => ({
  style: 'intenso',
  setStyle: (style) => set({ style }),
}));
