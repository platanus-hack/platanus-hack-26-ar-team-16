-- Gohan AI — Denormalize (user_id, tenant_id) onto routine_days + routine_exercises
-- Decided: docs/ARCHITECTURE.md §16.1 (review of 2026-05-10).
-- Applies after 007_replica_identity_full.sql.
--
-- Why
-- ────────────────────────────────────────────────────────────
-- ADR #7 already denormalized `tenant_id` onto `routines` so we can scope
-- hot queries (and Realtime filters) without joining through `profiles`.
-- The same trade was never extended to the child rows. As a consequence,
-- `useRealtimeRoutine` could not wire-filter `routine_exercises` events
-- (no user_id, no routine_id on the row), so every exercise mutation
-- woke every connected client. RLS gated the *payload* but not the
-- *fan-out*. Documented as §16.5 / §11 'PARTIAL'.
--
-- This migration applies ADR #7 consistently to the child tables:
--   * routine_days       gains (user_id NOT NULL, tenant_id NOT NULL)
--   * routine_exercises  gains (user_id NOT NULL, tenant_id NOT NULL)
-- and adds the indexes that make `user_id=eq.${id}` realtime filters O(1).
--
-- Trade — denormalized identity must be kept in sync. Three insert paths
-- in supabase/functions/_shared/chat-handler.ts populate the new
-- columns explicitly (executeCreateRoutine, executeAddExercise; see also
-- the routine_days insert in executeCreateRoutine). Cheaper than the
-- alternative (server-side view + per-call join) and matches the precedent
-- set by ADR #7.
--
-- Idempotent. Backfills from the existing parent rows so safe to apply
-- to a populated database.

-- ─────────────────────────────────────────────────────────────
-- 1. routine_days: add columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.routine_days
  ADD COLUMN IF NOT EXISTS user_id   UUID,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

UPDATE public.routine_days rd
SET user_id   = r.user_id,
    tenant_id = r.tenant_id
FROM public.routines r
WHERE r.id = rd.routine_id
  AND (rd.user_id IS NULL OR rd.tenant_id IS NULL);

ALTER TABLE public.routine_days
  ALTER COLUMN user_id   SET NOT NULL,
  ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routine_days_user
  ON public.routine_days(user_id);

CREATE INDEX IF NOT EXISTS idx_routine_days_tenant
  ON public.routine_days(tenant_id);

-- ─────────────────────────────────────────────────────────────
-- 2. routine_exercises: add columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.routine_exercises
  ADD COLUMN IF NOT EXISTS user_id   UUID,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

UPDATE public.routine_exercises re
SET user_id   = r.user_id,
    tenant_id = r.tenant_id
FROM public.routine_days  rd
JOIN public.routines      r  ON r.id  = rd.routine_id
WHERE rd.id = re.routine_day_id
  AND (re.user_id IS NULL OR re.tenant_id IS NULL);

ALTER TABLE public.routine_exercises
  ALTER COLUMN user_id   SET NOT NULL,
  ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routine_exercises_user
  ON public.routine_exercises(user_id);

CREATE INDEX IF NOT EXISTS idx_routine_exercises_tenant
  ON public.routine_exercises(tenant_id);
