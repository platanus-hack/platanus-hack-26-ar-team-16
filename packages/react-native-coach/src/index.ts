// Public entry point for `@gohan-ai/react-native`.
//
// Per ARCHITECTURE.md §14, this package re-exports the embeddable surface of
// the Gohan AI codebase WITHOUT duplicating source. The repo is laid out as
// app + package side-by-side; this entry imports straight from `../../src/`
// (the standalone Expo app's source tree). tsup bundles the transitive
// closure into `dist/`, externalising react / react-native / nativewind /
// expo-* / supabase-js so the consumer's app provides them.
//
// What is intentionally NOT exported:
//   - Zustand stores (kept internal — host should not poke at chat / routine
//     state directly; the public API is the `<GohanCoach />` root and its
//     `onError` / `getAuthToken` props).
//   - The Supabase client at `src/services/supabase.ts` (standalone-only).
//   - Anything under `app/` or `app/(auth)/` (host owns navigation + auth).

export { GohanCoach } from '../../../src/components/GohanCoach';
export type { GohanCoachProps } from '../../../src/components/GohanCoach';

export {
  CoachProvider,
  useCoachContext,
  useCoachContextOrNull,
} from '../../../src/modules/coach';
export type { CoachProviderProps } from '../../../src/modules/coach';

export type {
  CoachConfig,
  ApiClient,
  ApiRequestInit,
} from '../../../src/types/coach';
