import { useEffect } from 'react';
import { getActiveRoutine } from '../services/routines';
import { supabase } from '../services/supabase';
import { useRoutineStore } from '../store';

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
export function useRealtimeRoutine(userId: string | undefined) {
  const setRoutine = useRoutineStore((s) => s.setRoutine);
  const setLoading = useRoutineStore((s) => s.setLoading);

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

    const channel = supabase
      .channel(`routine-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routines', filter: `user_id=eq.${userId}` },
        scheduleRefetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routine_days' },
        scheduleRefetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routine_exercises' },
        scheduleRefetch
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (refetchTimer) clearTimeout(refetchTimer);
      supabase.removeChannel(channel);
    };
  }, [userId, setRoutine, setLoading]);
}
