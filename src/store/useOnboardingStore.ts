import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gohan.onboardingVisited.v1';

interface OnboardingState {
  hasVisited: boolean;
  isHydrated: boolean;
  markVisited: () => void;
  hydrate: () => Promise<void>;
}

/**
 * Tracks whether the user has been to the onboarding wizard at least once.
 * The redirect logic in `useProtectedRoute` only forces the user to the
 * wizard while this flag is false — after the first visit they can navigate
 * freely, even if they didn't finish onboarding. Persisted in AsyncStorage
 * so it survives app restarts.
 */
export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasVisited: false,
  isHydrated: false,
  markVisited: () => {
    if (get().hasVisited) return;
    set({ hasVisited: true });
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  },
  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEY);
      set({ hasVisited: v === '1', isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
