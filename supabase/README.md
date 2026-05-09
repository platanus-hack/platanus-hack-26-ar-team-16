# Supabase — Gohan AI

Owner: @DanteDia

> **Project is already provisioned.** Ref: `cjflwpcxfprxxjbhjxlo` (region `sa-east-1`).
> Migrations 001 + 002 are applied. The `ai-chat` edge function is deployed.
> Credentials live in `.env.local` (gitignored). Get them from Dante or the
> Supabase dashboard if you need to set up a fresh device.

## What lives here

- `migrations/001_initial_schema.sql` — base tables, indexes, realtime publication, default tenant.
- `migrations/002_rls_and_storage.sql` — RLS policies, `handle_new_user` trigger, `chat-audio` storage bucket.
- `functions/ai-chat/` — edge function that proxies Claude (owner: @Juampiman).

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

## Re-deploying the edge function

```bash
supabase functions deploy ai-chat --project-ref cjflwpcxfprxxjbhjxlo --no-verify-jwt
```

`--no-verify-jwt` is intentional: we pass `userProfile` in the request body and
let RLS gate any client-side reads. If you want JWT verification, drop the flag
and forward the access token from the client.

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
