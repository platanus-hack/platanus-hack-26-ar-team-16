-- Gohan AI — Relax profiles.id → auth.users.id FK
-- Owner: @DanteDia (DEV 3 — infrastructure)
--
-- Apply AFTER 004_external_identity_and_api_keys.sql.
--
-- Why
-- ────────────────────────────────────────────────────────────
-- In the standalone-consumer flow, profiles.id is the same UUID as
-- auth.users.id (the trigger handle_new_user explicitly assigns NEW.id).
-- That worked while every Gohan user owned a Supabase Auth row. In the
-- B2B hosted integration model (ARCHITECTURE.md §4 / §10), gym-origin
-- profiles are upserted by the api-session edge function from a
-- gym-issued JWT — these users never sign up against Supabase Auth, so
-- there is no auth.users row to point a FK at. The FK currently blocks
-- those inserts.
--
-- Per ARCHITECTURE.md §10, the *unique identity* for a Gohan profile is
-- the (tenant_id, external_id) pair — already enforced by the unique
-- constraint added in migration 004. profiles.id is just an internal
-- surrogate UUID. Dropping the FK to auth.users does not weaken identity
-- guarantees; it just decouples the profile row from the Supabase Auth
-- subsystem for users who don't use it.
--
-- Standalone-consumer flow remains intact
-- ────────────────────────────────────────────────────────────
-- handle_new_user() (refreshed in migration 004) still sets
-- profiles.id = NEW.id (auth.users.id) on signup, so the existing RLS
-- policies on profiles in 002_rls_and_storage.sql that reference
-- `auth.uid() = id` for self-access continue to work for standalone
-- users. Gym-origin profiles get freshly-generated UUIDs (different
-- from any auth.uid()), so those self-access policies simply don't
-- match for them — that is correct behavior, since gym-origin users
-- never authenticate via Supabase Auth and never set auth.uid() in the
-- first place. Their access is mediated by the api-chat edge function
-- using the service role.

-- Drop the FK constraint if it exists. Postgres auto-names the FK
-- constraint based on the table/column; we look it up dynamically so
-- this is robust to whatever name was generated.
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'f'
    AND confrelid = 'auth.users'::regclass
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', v_conname);
  END IF;
END $$;

-- Make sure profiles.id keeps its uuid PK + default. (No-op if already set.)
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
