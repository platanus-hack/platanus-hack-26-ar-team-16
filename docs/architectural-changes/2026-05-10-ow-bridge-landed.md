# 2026-05-10 — Open Wearables bridge (`ow-bridge`) landed; client-side admin path removed

**Status:** Adopted.
**Migration:** `supabase/migrations/009_wearables_links.sql`.
**Edge function:** `supabase/functions/ow-bridge/index.ts`.
**Affects:** ARCHITECTURE.md §14 (rewritten from "target" to "current"), §11 (risk table). Closes TD-1 in `docs/tech-debt.md`.

## Context

The Open Wearables integration shipped pre-auth-refactor (commit `82d2750`). It violated three §10/§11 invariants:

1. Admin email + password literals in `src/services/openWearables.ts` shipped in the Hermes bundle and lived in git history.
2. `ensureOWUser(email)` let the client choose which OW user it operated as — no `(gohan_user_id ↔ ow_user_id)` mapping; impersonation was possible by passing a different email.
3. Resolved `ow_user_id` lived in a module-level `let` that reset on cold start, requiring a re-auth round-trip every time.

§14 of ARCHITECTURE.md described the target state. This change implements it.

## Decision

- **New edge function `ow-bridge`** (`supabase/functions/ow-bridge/`). Verifies the Supabase JWT, resolves `(userId, tenantId, email)`, and dispatches on `body.action`: `connect`, `sync`, `activity`, `sleep`, `workouts`. The OW admin token is fetched server-side from edge-function env vars (`OW_HOST`, `OW_ADMIN_USERNAME`, `OW_ADMIN_PASSWORD`, `OW_API_KEY`) and cached for 5 minutes.
- **New table `wearables_links`** (`migrations/009`). One row per `(profiles.id, provider, external_id)`. Service-role-only — no client policies. Mirror of `tenant_api_keys` in ownership style.
- **Client refactored** (`src/services/openWearables.ts`). Now a thin Supabase-JWT-authenticated wrapper that POSTs to `ow-bridge` with an action. No admin token, no `OW_HOST` calls, no module-level identity state.
- **`gitleaks` rule** in `.gitleaks.toml` flags any reintroduction of the historical literal.

## Consequences

**Wins.**
- Admin credentials no longer ship in any client bundle, including the embeddable `@gohan-ai/react-native` module.
- OW user identity is server-derived from the verified Supabase JWT — impersonation is closed.
- Mapping is durable in Postgres (PK on `user_id`); no cold-start re-auth.
- Adding a second wearable provider (Whoop, Oura) is a check-constraint change + an action handler, not a fresh client-bundled credential.

**Costs.**
- One extra round trip per call (client → ow-bridge → OW). The 5-min admin-token cache makes this acceptable; the `connect` path is rare and `activity`/`sleep`/`workouts` were already async.
- Operational: OW admin password must be rotated separately (TD-2). The historical literal remains discoverable in git history regardless of this change.

## Deploy steps

Per `ARCHITECTURE.md` §15.1:

1. Apply migration 009.
2. `supabase secrets set OW_HOST=... OW_ADMIN_USERNAME=... OW_ADMIN_PASSWORD=... OW_API_KEY=...`
3. `supabase functions deploy ow-bridge --project-ref <ref> --no-verify-jwt`
4. Deploy the client (eas build).
5. **Rotate the OW admin password** (TD-2).
