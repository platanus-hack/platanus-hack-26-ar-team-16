-- Gohan AI — External Identity, Tenant Scoping, API Keys, Usage Events
-- Owner: @DanteDia (DEV 3 — infrastructure)
--
-- Apply AFTER 003_realtime_routines.sql.
-- Prepares the schema for the B2B hosted integration model described in
-- docs/ARCHITECTURE.md §4 / §10. Adds:
--   1. profiles.external_id / external_idp / last_active_at + unique scope
--   2. routines.tenant_id (denormalized, ADR #7) + index
--   3. tenant_api_keys (gk_live_* SHA-256 hashes)
--   4. tenant_signing_secrets (HS256 secrets per tenant, with kid rotation)
--   5. usage_events (per-call telemetry: tokens, tool_calls, latency)
--   6. RLS on the three new tables (service-role only — no client policies)
--   7. Refreshed handle_new_user() so the standalone-consumer signup path
--      writes external_idp = 'gohan', external_id = auth.users.id
--
-- Idempotent where possible. The unique constraint on
-- (tenant_id, external_id) is created AFTER the backfill so this can be
-- applied to the live database without violating existing rows.

-- ─────────────────────────────────────────────────────────────
-- 1. profiles: external identity columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS external_id   TEXT,
  ADD COLUMN IF NOT EXISTS external_idp  TEXT,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Backfill: every existing profile today is a Supabase-Auth user under the
-- standalone-consumer path, so external_idp = 'gohan' and external_id is
-- the auth.users.id (same UUID as profiles.id).
UPDATE public.profiles
SET external_idp = 'gohan',
    external_id  = id::text
WHERE external_idp IS NULL OR external_id IS NULL;

-- Unique scope: a tenant cannot have two profiles with the same external_id.
-- Created AFTER backfill so the migration is safe on the live DB.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_tenant_external_id_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tenant_external_id_key
      UNIQUE (tenant_id, external_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_external_id
  ON public.profiles(tenant_id, external_id);

-- ─────────────────────────────────────────────────────────────
-- 2. routines: denormalized tenant_id (ADR #7)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Backfill from profiles.tenant_id via user_id.
UPDATE public.routines r
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE p.id = r.user_id
  AND r.tenant_id IS NULL;

-- Now make it NOT NULL (no orphan routines today, but verify before running).
ALTER TABLE public.routines
  ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routines_tenant_active
  ON public.routines(tenant_id, is_active);

-- ─────────────────────────────────────────────────────────────
-- 3. tenant_api_keys (gk_live_* SHA-256 hashes)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  key_hash     TEXT NOT NULL,
  kid          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_hash
  ON public.tenant_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant
  ON public.tenant_api_keys(tenant_id);

-- ─────────────────────────────────────────────────────────────
-- 4. tenant_signing_secrets (HS256 secrets, per-tenant, kid-rotated)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_signing_secrets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kid        TEXT NOT NULL,
  secret     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (tenant_id, kid)
);

CREATE INDEX IF NOT EXISTS idx_tenant_signing_secrets_tenant
  ON public.tenant_signing_secrets(tenant_id);

-- ─────────────────────────────────────────────────────────────
-- 5. usage_events (per-call telemetry)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.usage_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID,
  user_id    UUID,
  event_type TEXT,
  tokens_in  INT,
  tokens_out INT,
  tool_calls INT,
  latency_ms INT,
  model      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_created
  ON public.usage_events(tenant_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 6. RLS — service-role-only (no client policies)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.tenant_api_keys        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_signing_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events           ENABLE ROW LEVEL SECURITY;

-- (No CREATE POLICY statements: with RLS enabled and no policies, only the
-- service role bypasses RLS. Edge functions use SUPABASE_SERVICE_ROLE_KEY.)

-- ─────────────────────────────────────────────────────────────
-- 7. Refresh handle_new_user() — set external_idp / external_id
--    for the standalone-consumer signup path. Tenant resolution
--    behavior is unchanged (raw_user_meta_data.tenant_slug → 'default').
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id    UUID;
  v_tenant_slug  TEXT;
  v_display_name TEXT;
BEGIN
  v_tenant_slug := COALESCE(NEW.raw_user_meta_data->>'tenant_slug', 'default');
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    ''
  );

  SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_tenant_slug;
  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'default';
  END IF;

  INSERT INTO public.profiles (
    id, tenant_id, display_name, external_idp, external_id, last_active_at
  )
  VALUES (
    NEW.id, v_tenant_id, v_display_name, 'gohan', NEW.id::text, NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
