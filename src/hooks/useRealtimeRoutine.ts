import { useEffect } from 'react';
import { useRoutineStore } from '../store';

// TODO: @DanteDia — subscribe to Supabase realtime changes on routine_exercises table
// When AI modifies a routine via tool_use, this hook should automatically
// update the routine store so the Routine screen reflects changes in real-time.

export function useRealtimeRoutine(userId: string | undefined) {
  const setRoutine = useRoutineStore((s) => s.setRoutine);

  useEffect(() => {
    if (!userId) return;

    // TODO: implement Supabase realtime subscription
    // const channel = supabase
    //   .channel('routine-changes')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'routine_exercises' }, (payload) => {
    //     // refetch and update store
    //   })
    //   .subscribe();
    //
    // return () => { supabase.removeChannel(channel); };
  }, [userId, setRoutine]);
}
