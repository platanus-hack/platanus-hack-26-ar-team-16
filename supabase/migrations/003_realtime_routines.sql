-- Add `routines` to the realtime publication.
-- 001 added routine_days + routine_exercises but missed the parent table,
-- so toggling is_active (e.g. when create_routine deactivates the old
-- routine and inserts a new active one) wouldn't reach subscribers.
-- The hook in src/hooks/useRealtimeRoutine.ts subscribes to all three.

ALTER PUBLICATION supabase_realtime ADD TABLE routines;
