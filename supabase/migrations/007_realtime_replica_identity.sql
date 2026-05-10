-- Gohan AI — REPLICA IDENTITY FULL for Realtime UPDATE/DELETE events
--
-- Without REPLICA IDENTITY FULL, Supabase Realtime cannot filter UPDATE
-- and DELETE postgres_changes events by non-PK columns (e.g. user_id on
-- routines). This caused the routine page to miss updates when Gohan
-- modified exercises because the routine_exercises UPDATE event didn't
-- reliably reach the client's subscription.
--
-- Apply AFTER 006_sources.sql.

ALTER TABLE public.routines          REPLICA IDENTITY FULL;
ALTER TABLE public.routine_days      REPLICA IDENTITY FULL;
ALTER TABLE public.routine_exercises REPLICA IDENTITY FULL;
