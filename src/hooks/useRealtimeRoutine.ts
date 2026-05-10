import { useEffect } from 'react';
import {
  getActiveRoutine,
  listUserRoutines,
} from '../services/routines';
import { supabase } from '../services/supabase';
import { useRoutineStore } from '../store';
import { useCoachContextOrNull } from '../modules/coach/CoachProvider';

// Subscribes to Supabase realtime on routines, routine_days, routine_exercises.
// Whenever the AI mutates the routine (via tool_use → edge function),
// we refetch the active routine and push it into the Zustand store
// so the Routine screen rerenders without manual refresh.
//
// Why refetch instead of patching from the payload:
//   - tool_use can fire create_routine which inserts ~20 rows across 2 tables
//     in quick succession. Streaming individual deltas into a nested store
//     state is fragile. A debounced refetch keeps the store consistent
//     with the DB and is fast enough for the demo (single user, small payload).
//
// Wire-side scoping (ARCHITECTURE.md §16.1, migration 008): user_id is
// denormalized onto routine_days and routine_exercises, mirroring ADR #7's
// treatment of routines.tenant_id. Every subscription now filters by
// `user_id=eq.${userId}` at the wire — events stay scoped per-user
// regardless of how many tenants share the cluster.
export function useRealtimeRoutine(userId: string | undefined) {
  const setRoutine = useRoutineStore((s) => s.setRoutine);
  const setRoutines = useRoutineStore((s) => s.setRoutines);
  const setLoading = useRoutineStore((s) => s.setLoading);
  // If a CoachProvider is mounted, its config carries an auth-token getter
  // that needs to be passed to Realtime so the channel is authenticated as
  // the right user (relevant for the embedded path; the standalone path
  // already has a Supabase session). When the getter returns a token that
  // Realtime rejects (e.g. a Gohan session JWT before Phase 1's
  // realtime_jwt mint lands), we degrade gracefully — see the catch below.
  const coachCtx = useCoachContextOrNull();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let refetchTimer: ReturnType<typeof setTimeout> | null = null;

    async function refetch() {
      try {
        const [routine, routines] = await Promise.all([
          getActiveRoutine(userId!),
          listUserRoutines(userId!),
        ]);
        if (!cancelled) {
          setRoutine(routine);
          setRoutines(routines);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[useRealtimeRoutine] refetch failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function scheduleRefetch() {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(refetch, 150);
    }

    setLoading(true);
    refetch();

    let unsubscribe: (() => void) | null = null;

    (async () => {
      // Apply auth on the realtime client when a non-Supabase token getter
      // is available (embedded path). Wrapped in try/catch so a token the
      // gateway rejects doesn't crash the screen.
      if (coachCtx) {
        try {
          const token = await coachCtx.config.getAuthToken();
          if (token) {
            // setAuth is sync but typed as void — wrap defensively.
            (supabase.realtime as { setAuth: (t: string) => void }).setAuth(token);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(
            '[useRealtimeRoutine] realtime auth rejected — events may not arrive on the embedded path until api-session mints a realtime_jwt (Phase 1 TODO).',
            err,
          );
        }
      }
      if (cancelled) return;

      const channel = supabase
        .channel(`routine-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'routines', filter: `user_id=eq.${userId}` },
          scheduleRefetch,
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'routine_days', filter: `user_id=eq.${userId}` },
          scheduleRefetch,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'routine_exercises',
            filter: `user_id=eq.${userId}`,
          },
          scheduleRefetch,
        )
        .subscribe();

      unsubscribe = () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      cancelled = true;
      if (refetchTimer) clearTimeout(refetchTimer);
      if (unsubscribe) unsubscribe();
    };
  }, [userId, setRoutine, setRoutines, setLoading, coachCtx]);
}
