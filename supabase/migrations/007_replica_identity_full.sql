-- Migration 007: REPLICA IDENTITY FULL on routine tables
-- Owner: @DanteDia (DEV 3 — infrastructure)
--
-- Applied 2026-05-10 in coordination with @thblu after he diagnosed that
-- Realtime UPDATE events on routines / routine_days / routine_exercises
-- were being delivered without the OLD row payload — which made the
-- client's debounced refetch in useRealtimeRoutine unreliable on edits
-- (only INSERTs were reaching the subscriber consistently).
--
-- Postgres logical replication, by default, only emits the primary key
-- on UPDATE/DELETE. Supabase Realtime needs the full pre-image to ship
-- a usable change event, especially when the client filters or diffs
-- on non-PK columns (e.g. is_active flips, weight_kg changes).
--
-- REPLICA IDENTITY FULL writes the full pre-image of every updated row
-- to the WAL. This costs more disk I/O on writes but for our scale
-- (single-digit edits per minute per user) the trade is invisible.
--
-- This migration is the durable record of the change so any new device
-- bootstrapping the schema gets the same replica behavior. Idempotent:
-- ALTER ... REPLICA IDENTITY is a metadata change with no row scan.

ALTER TABLE public.routines          REPLICA IDENTITY FULL;
ALTER TABLE public.routine_days      REPLICA IDENTITY FULL;
ALTER TABLE public.routine_exercises REPLICA IDENTITY FULL;
