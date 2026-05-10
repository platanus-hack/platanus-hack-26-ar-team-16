-- Gohan AI — wearables_links: Gohan ↔ provider identity mapping
-- Decided: docs/ARCHITECTURE.md §14 (target state).
-- Applies after 008_denormalize_user_tenant_to_children.sql.
--
-- Why
-- ────────────────────────────────────────────────────────────
-- Today src/services/openWearables.ts holds the Open Wearables admin
-- creds in the JS bundle and lets the *client* pick which OW user it
-- operates as (`ensureOWUser(email)`). Both are §11/§14 OPEN items.
-- The fix is to push admin auth and identity resolution behind the
-- ow-bridge edge function and persist the mapping here.
--
-- Rows are written by ow-bridge on connect; read on every subsequent
-- sync/activity/sleep/workouts call. PK is (user_id) — one provider
-- per user today; if a user later links a second provider (e.g. Whoop),
-- this becomes (user_id, provider) — adjust then.

CREATE TABLE IF NOT EXISTS public.wearables_links (
  user_id      UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id),
  provider     TEXT NOT NULL CHECK (provider IN ('open_wearables')),
  external_id  TEXT NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_wearables_links_tenant
  ON public.wearables_links(tenant_id);

ALTER TABLE public.wearables_links ENABLE ROW LEVEL SECURITY;

-- No client policies: only the service role (ow-bridge edge fn) reads
-- and writes this table. Rationale matches tenant_api_keys (migration
-- 004) — the table holds a server-side secret-mapping the client must
-- never address directly.
