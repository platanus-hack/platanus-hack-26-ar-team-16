import { useEffect } from 'react';
import { getActiveRoutine, getRoutineIdsForUser } from '../services/routines';
import { supabase } from '../services/supabase';
import { useRoutineStore } from '../store';
import { useCoachContextOrNull } from '../modules/coach/CoachProvider';

// Subscribes to Supabase realtime on routine_days and routine_exercises.
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
// Cross-tenant leak fix (ARCHITECTURE.md §11): the previous version
// subscribed to ALL `routine_days` and `routine_exercises` rows because
// neither table carries a `user_id` column we could filter on. We now
// resolve the user's `routine.id` set first and filter the child-table
// subscriptions with `routine_id=in.(...)`. RLS still gates the actual
// payload, but this also stops *event* fan-out across tenants.
export function useRealtimeRoutine(userId: string | undefined) {
  const setRoutine = useRoutineStore((s) => s.setRoutine);
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
        const routine = await getActiveRoutine(userId!);
        if (!cancelled) setRoutine(routine);
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
      // Resolve the user's routine IDs once so we can scope the child-table
      // subscriptions. If the user has no routines yet (first-time user),
      // we still subscribe to `routines` so we react to the first insert.
      let routineIds: string[] = [];
      try {
        routineIds = await getRoutineIdsForUser(userId!);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[useRealtimeRoutine] failed to resolve routine ids', err);
      }
      if (cancelled) return;

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

      const filterIds = routineIds.length > 0 ? routineIds.join(',') : '__none__';

      const channel = supabase
        .channel(`routine-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'routines', filter: `user_id=eq.${userId}` },
          () => {
            // A routine row changed — IDs might have shifted (insert/delete).
            // Refresh our id cache opportunistically. The next event from
            // routine_days/_exercises will use the latest filter on next
            // mount; for now we just refetch the routine.
            scheduleRefetch();
          },
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'routine_days',
            filter: `routine_id=in.(${filterIds})`,
          },
          scheduleRefetch,
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            // routine_exercises has no routine_id column — it joins through
            // routine_day_id. We cannot pre-filter at the wire without a
            // routine_day_id list, which would explode on every day add/remove.
            // Server-side RLS still scopes payloads to the current user, so
            // this stays correct for the standalone path. Tracked: Phase 3
            // moves child-table fan-out behind a server view that exposes
            // `user_id` so the filter can be tightened wire-side.
            table: 'routine_exercises',
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
  }, [userId, setRoutine, setLoading, coachCtx]);
}
