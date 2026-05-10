# Supabase — Gohan AI

Owner: @DanteDia

> **Project is already provisioned.** Ref: `cjflwpcxfprxxjbhjxlo` (region `sa-east-1`).
> Migrations 001-005 are applied. The `ai-chat` edge function is deployed.
> Credentials live in `.env.local` (gitignored). Get them from Dante or the
> Supabase dashboard if you need to set up a fresh device.

## What lives here

- `migrations/001_initial_schema.sql` — base tables, indexes, realtime publication, default tenant.
- `migrations/002_rls_and_storage.sql` — RLS policies, `handle_new_user` trigger, `chat-audio` storage bucket.
- `migrations/003_realtime_routines.sql` — adds `routines` to the realtime publication (so `is_active` flips reach subscribers).
- `migrations/004_external_identity_and_api_keys.sql` — Phase 1 of the B2B refactor (see ARCHITECTURE.md §4/§10/§11): adds external identity columns + `tenant_api_keys` + `tenant_signing_secrets` + `usage_events`.
- `migrations/005_relax_profiles_auth_fk.sql` — drops the FK `profiles.id → auth.users.id` so gym-origin users (no Supabase Auth row) can have profiles. Standalone signup keeps working via the trigger.
- `functions/ai-chat/` — edge function that proxies Claude for the standalone consumer flow (owner: @Juampiman).
- `functions/api-chat/`, `functions/api-keys/`, `functions/api-session/` — B2B endpoints from the §10 architecture. Need migration 005 applied to be fully functional for gym-origin users.

## Migration log (applied, in order)

| Version | Name | Applied | Notes |
|---------|------|---------|-------|
| `20260509080943` | initial_schema | day 0 | base tables |
| `20260509081026` | rls_and_storage | day 0 | per-user RLS + chat-audio bucket |
| `20260509084822` | realtime_routines | day 0 | adds `routines` to realtime publication |
| `20260510051339` | external_identity_and_api_keys | 2026-05-10 | Phase 1 B2B foundation. See "What 004 changed" below |
| `20260510053023` | relax_profiles_auth_fk | 2026-05-10 | Drops FK profile→auth.users. Unblocks gym-origin user inserts. See "What 005 changed" below |

### What 004 changed (operational summary)

Aplicada 2026-05-10 contra prod (`cjflwpcxfprxxjbhjxlo`). Cambios verificados post-apply:

- **`profiles`**: agregadas 3 columnas — `external_id TEXT`, `external_idp TEXT`, `last_active_at TIMESTAMPTZ`. Backfill: 5 filas existentes quedaron con `external_idp='gohan'`, `external_id=id::text`. Constraint `UNIQUE(tenant_id, external_id)` agregada (verificada sin colisiones antes del apply).
- **`routines`**: agregada `tenant_id UUID NOT NULL REFERENCES tenants(id)`. Backfill desde `profiles.tenant_id` cubrió las 2 filas existentes. ADR #7 lo justifica (evita join hot por path).
- **3 tablas nuevas** (todas con RLS *enabled* sin policies → solo service-role-key accede):
  - `tenant_api_keys` — keys hasheadas SHA-256, kid rotation, `revoked_at` para soft-delete.
  - `tenant_signing_secrets` — secretos HS256 por tenant para firmar JWTs custom del gym.
  - `usage_events` — telemetry por call (tokens, tool_calls, latency, model). Para billing B2B.
- **Trigger refresh**: `handle_new_user()` ahora setea `external_idp='gohan'`, `external_id=auth.users.id`, `last_active_at=NOW()` automáticamente al signup. Comportamiento de tenant resolution (`raw_user_meta_data.tenant_slug` → `default`) sin cambios.

**Reversibilidad**: todo es reversible (DROP COLUMN, DROP TABLE, restaurar trigger viejo). No hay data loss.

**Razón del cambio** — necesario para que el modelo de auth multi-source (§10 ARCHITECTURE) funcione: tres caminos (gym JWT / Supabase JWT / API key) que convergen en `profiles` keyed por `(tenant_id, external_id)`. Sin estas columnas, no se puede distinguir un user de Megatlon del mismo email que un user standalone, ni rastrear de qué IdP vino.

### What 005 changed (operational summary)

Aplicada 2026-05-10 contra prod. Cambio chico pero conceptualmente importante.

- **`profiles.id` ya no es FK a `auth.users.id`**. El constraint se llamaba `profiles_id_fkey` (auto-generado). El DROP se hizo dinámicamente buscando por `confrelid='auth.users'::regclass` para ser robusto a renames.
- **`profiles.id` mantiene PK** + ahora tiene `DEFAULT gen_random_uuid()` explícito. Las inserts gym-origin (vía `api-session` con JWT del gym) van a generar un UUID nuevo automáticamente sin tener que existir en `auth.users`.
- **Standalone signup sigue intacto**: el trigger `handle_new_user()` (refreshed en 004) explícitamente setea `profiles.id = NEW.id` (= `auth.users.id`), así que las RLS policies con `auth.uid() = id` siguen matcheando para users standalone.
- **RLS implications para gym-origin users**: como su `profiles.id` es UUID random (no `auth.uid()`), las self-access policies que usan `auth.uid() = id` simplemente no matchean. Eso es correcto — gym-origin users no autentican vía Supabase Auth y nunca tienen `auth.uid()` set en sus calls. Acceso mediado por edge functions con service role.

**Verificación post-apply**: 5/5 profiles existentes siguen teniendo su `profiles.id` igual a un `auth.users.id` válido (verificado con join). Cero data loss, cero comportamiento alterado para users standalone.

**Reversibilidad**: re-add del FK en una sola sentencia. Ningún row va a romper porque todos los current profiles siguen teniendo su `id` apuntando a un `auth.users.id`.

## How to run from a fresh checkout

1. **Get `.env.local`** — ask Dante for the file (or copy from the Supabase
   dashboard: Settings → API → Project URL + anon key).
2. `npm install`
3. `npm start`

That's it. No CLI setup needed unless you're modifying the schema or the edge
function.

## Re-running schema changes

If you add a migration file:

```bash
npm i -g supabase
supabase login
supabase link --project-ref cjflwpcxfprxxjbhjxlo
supabase db push
```

Or paste the SQL into the dashboard SQL editor. Always create a new migration
file rather than editing 001/002 — the existing ones have already been applied.

## Re-deploying edge functions

```bash
supabase functions deploy ai-chat     --project-ref cjflwpcxfprxxjbhjxlo --no-verify-jwt
supabase functions deploy api-chat    --project-ref cjflwpcxfprxxjbhjxlo --no-verify-jwt
supabase functions deploy api-session --project-ref cjflwpcxfprxxjbhjxlo --no-verify-jwt
supabase functions deploy api-keys    --project-ref cjflwpcxfprxxjbhjxlo --no-verify-jwt
supabase functions deploy ow-bridge   --project-ref cjflwpcxfprxxjbhjxlo --no-verify-jwt
```

`--no-verify-jwt` disables the **gateway**'s pre-flight JWT check; it does NOT
disable our auth. Each function self-verifies the bearer token before doing
anything: `ai-chat` and `ow-bridge` validate a Supabase JWT, `api-chat` accepts
either an `gk_live_*` API key or a Gohan session JWT, `api-session` verifies
the gym-issued JWT against `tenant_signing_secrets`. The body's `userProfile.id`
is stripped — identity comes from the verified token only (see
`docs/ARCHITECTURE.md` §11). The flag is set this way so we can accept multiple
token shapes (Supabase JWT, Gohan session JWT, API key) without the gateway
rejecting anything that isn't a Supabase JWT.

## Setting / rotating ANTHROPIC_API_KEY

The edge function reads `ANTHROPIC_API_KEY` from secrets. To set it:

- **Dashboard** (recommended): Project Settings → Edge Functions → Secrets → "New secret"
- **CLI**: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref cjflwpcxfprxxjbhjxlo`

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected — don't set them.

## (Optional) Enable Google OAuth

- Supabase dashboard → Authentication → Providers → Google
- Add the Expo deep link redirect: `gohan-ai://auth/callback` (matches the `scheme` in `app.json`)
- Add web redirect if testing with Expo web: `http://localhost:8081/auth/callback`

## Regenerate DB types

```bash
supabase gen types typescript --project-id cjflwpcxfprxxjbhjxlo > src/types/database.ts
```

## Realtime

`routine_days` and `routine_exercises` are added to `supabase_realtime` in 001.
RLS already gates rows per user, so realtime payloads also respect ownership.

## Adding a tenant for the demo

```sql
INSERT INTO tenants (name, slug, primary_color, secondary_color, logo_url)
VALUES ('SmartFit Demo', 'smartfit', '#FF6B00', '#1A1A1A', null);
```

Sign-up users into that tenant by passing `tenant_slug` in `signUp` metadata
(see `src/services/auth.ts → signUpWithEmail`).

## Storage

Bucket `chat-audio` (private). Path convention: `{user_id}/{conversation_id}/{filename}`.
RLS in 002 enforces that `(storage.foldername(name))[1] = auth.uid()`.
