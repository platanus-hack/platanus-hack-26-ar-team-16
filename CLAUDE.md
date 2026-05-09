# Gohan AI - AI Personal Trainer Modules

## Project

AI-powered personal trainer modules for existing gym apps. Chat with AI coach → personalized routines generated and updated in real-time. B2B multi-tenant, integrable via MCP server.

## Stack

- React Native + Expo (prebuild, NOT Expo Go)
- Expo Router (file-based navigation)
- NativeWind (Tailwind CSS for RN)
- Zustand (state management)
- Supabase (auth, PostgreSQL, realtime subscriptions, edge functions)
- Claude API via @anthropic-ai/sdk (streaming + tool_use)
- Custom MCP Server (TypeScript, separate package in mcp-server/)

## Conventions

- TypeScript strict mode
- Conventional commits: feat:, fix:, chore:, docs:
- Interfaces in src/types/ are CONTRACTS — don't change without team agreement
- Each module area is owned by one dev — don't edit other devs' areas
- Mock data for cross-module dependencies until integration phase
- No force push to main
- Claude API key ONLY in edge functions, NEVER in client code

## Architecture — Module Ownership

- app/(tabs)/routine.tsx, src/components/routine/, src/modules/routine/ → @thblu
- app/, src/components/ui/, src/components/chat/, src/modules/chat/, src/store/, src/theme/ → @alexndr-n
- src/services/, src/hooks/useRealtimeRoutine.ts, supabase/, src/types/ → @DanteDia
- src/modules/ai/, mcp-server/ → @Juampiman

## Key Patterns

- AI responses use Claude streaming (token by token)
- Claude tool_use modifies routines directly in Supabase
- Supabase Realtime pushes routine changes to the Routine screen
- Multi-tenant: tenant config (colors, logo) loaded from tenants table
- Chat guardrail: AI only responds about fitness/training/sports nutrition

---

## Live Infrastructure (set up by @DanteDia, validated end-to-end)

> Heads up to teammates and their Claudes: this is real, not mock. Do not recreate.

- **Supabase project**: `gohan-ai`, ref `cjflwpcxfprxxjbhjxlo`, region `sa-east-1`, free tier
- **Project URL**: `https://cjflwpcxfprxxjbhjxlo.supabase.co`
- **Edge function**: `ai-chat` deployed at `/functions/v1/ai-chat`, no-verify-jwt (gateway still requires anon key)
- **`ANTHROPIC_API_KEY`**: set as edge function secret (rotate the leaked one when convenient)
- **`.env.local`** with real creds is gitignored — ask Dante or pull from `.env.example` shape

### Tenants seeded
- `default` — "Gohan AI", `#6366F1` (purple). Default for any signup without `tenant_slug`.
- `smartfit` — "SmartFit Demo", `#FF6B00` (orange). Used for the demo user.

### Demo user (use this for the live demo, no onboarding needed)
- **Email**: `demo@gohan.ai`
- **Password**: `GohanDemo2026!`
- **Tenant**: `smartfit` (orange branding)
- **State**: `onboarding_completed = true`, profile filled in, active routine "Push / Pull / Legs" (3 days, 18 exercises) already in DB
- **Reset to canonical state**: re-run `scripts/seed-demo.sql` in the Supabase SQL editor

### Tools verified end-to-end (chat → tool_use → DB write)
- ✅ `create_routine` (writes 1 routine + N days + M exercises in a single message)
- ✅ `update_exercise`
- ✅ `replace_exercise`
- ✅ `add_exercise`
- ✅ `remove_exercise`

### SSE event contract (what `ChatManager.ts` parses)
The streaming endpoint emits these `data: {...}\n\n` events, terminated by `data: [DONE]\n\n`:
- `{type: "text", content: "<delta>"}` — token chunk for the visible reply
- `{type: "tool_start", content: "<toolName>", toolName: "<toolName>"}` — Claude is about to invoke a tool
- `{type: "tool_end", content: "<toolName>", toolName: "<toolName>", toolSuccess: boolean}` — DB write finished
- `{type: "error", content: "<msg>"}` — only on failure

Pass header `x-no-stream: true` to get the full JSON `{content, toolCalls, routineModified}` instead.

### Known quirks (not bugs, plan around them)
- **`order_index` gaps after delete**: `remove_exercise` does not reindex siblings, so order may go `0,1,2,3,5,6`. Sort by `order_index` is correct; do not assume contiguous integers.
- **`onboardingCompleted` not auto-set**: the edge function does not flip the profile flag after `create_routine`. The first signed-up user keeps re-entering onboarding mode in the system prompt until something updates the profile (UI client should call `markOnboardingCompleted` after a successful `create_routine` event from the SSE stream, or we add that to the edge function tool handler).
- **Tenants policy is `authenticated`-only**: pre-login branding (gym colors before sign-in) is not yet supported. If the demo needs it, open the policy to `anon` in a follow-up migration.
- **Sessions on native need AsyncStorage**: already wired in `src/services/supabase.ts`. Don't call `createClient` elsewhere.

### How to smoke-test the stack quickly

```bash
# 1. Sign in demo user
JWT=$(curl -sS -X POST "$EXPO_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"demo@gohan.ai","password":"GohanDemo2026!"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

# 2. Hit the edge function (non-streaming for easy inspection)
curl -sS -X POST "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/ai-chat" \
  -H "Content-Type: application/json" -H "x-no-stream: true" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $JWT" \
  -d '{"userMessage":"hola","userProfile":{"id":"d14aca31-5ece-465a-b02e-ebdd79384962","onboardingCompleted":true}}'
```
