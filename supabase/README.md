# Supabase — Gohan AI

Owner: @DanteDia

## What lives here

- `migrations/001_initial_schema.sql` — base tables, indexes, realtime publication, default tenant.
- `migrations/002_rls_and_storage.sql` — RLS policies, `handle_new_user` trigger, `chat-audio` storage bucket.
- `functions/ai-chat/` — edge function that proxies Claude (owner: @Juampiman).

## One-time setup

1. **Create the project**
   ```bash
   # supabase.com → New project → grab URL + anon key + service role key
   ```

2. **Link the local repo**
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <PROJECT_REF>
   ```

3. **Apply migrations**
   ```bash
   supabase db push
   ```
   Or paste the SQL files in order into the SQL editor.

4. **Set edge function secrets**
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

5. **Deploy edge function**
   ```bash
   supabase functions deploy ai-chat --no-verify-jwt
   ```
   `--no-verify-jwt` is OK because we pass `userProfile` in the body and let RLS gate any client-side reads. If you want JWT verification, drop the flag and forward the access token from the client.

6. **(Optional) Enable Google OAuth**
   - Supabase dashboard → Authentication → Providers → Google
   - Add the Expo deep link redirect: `gohan-ai://auth/callback` (matches the `scheme` in `app.json`)
   - Add web redirect if testing with Expo web: `http://localhost:8081/auth/callback`

7. **Fill `.env`** from `.env.example` at the repo root.

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
