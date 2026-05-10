# Gohan AI - AI Personal Trainer Modules

DONT MAKE COMMITS UNLESS EXPLICITLY ASKED

## Project

AI-powered personal trainer modules for existing gym apps. Chat with AI coach → personalized routines generated and updated in real-time. B2B multi-tenant, integrable via MCP server.

## Stack

React Native + Expo (prebuild, NOT Expo Go) · Expo Router · NativeWind · Zustand · Supabase (auth, Postgres, realtime, edge functions) · Claude API via `@anthropic-ai/sdk` · custom MCP server in `mcp-server/`. Exact versions in `package.json`.

## Conventions

- TypeScript strict mode
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- Interfaces in `src/types/` are CONTRACTS — don't change without team agreement
- Mock data for cross-module dependencies until integration phase
- Claude API key ONLY in edge functions, NEVER in client code

## Styling — CRITICAL RULE

NativeWind v4 works on web AND mobile. Use Tailwind `className` for all styling so both platforms stay in sync.

- **ALWAYS use `className`** for static layout/spacing/colors.
- Use inline `style` ONLY for truly dynamic values (e.g., `style={{ backgroundColor: theme.primary }}` for runtime theme colors).
- Mix freely: `className="flex-1 rounded-2xl p-4" style={{ backgroundColor: theme.primary }}`.
- Conditional styles via interpolation: `` className={`p-4 ${isActive ? 'bg-indigo-500' : 'bg-white'}`} ``.
- Convert any inline-only `style` you find to `className` when Tailwind can express it.
- NativeWind depends on `babel-preset-expo` with `jsxImportSource: 'nativewind'` — don't touch `babel.config.js` without verifying NativeWind still works.

## Key Patterns

- AI responses use Claude streaming (token by token)
- Claude `tool_use` modifies routines directly in Supabase
- Supabase Realtime pushes routine changes to the Routine screen
- Multi-tenant: tenant config (colors, logo) loaded from `tenants` table
- Chat guardrail: AI only responds about fitness / training / sports nutrition

---

## Live Infrastructure

> Real, not mock. Do not recreate. Status snapshots and runbooks live in `docs/INFRA.md`; this section is the durable contract.

- **Supabase project** `gohan-ai`, region `sa-east-1`. Project ref + URL in `.env.local` (gitignored — ask @DanteDia or use `.env.example`).
- **Edge function** `ai-chat` at `/functions/v1/ai-chat`, no-verify-jwt (gateway still requires the anon key).
- **`ANTHROPIC_API_KEY`** is an edge function secret — never commit.
- **Demo user** creds in `.env.local`. Reset to canonical state via `scripts/seed-demo.sql`.

### SSE event contract

The `ai-chat` streaming endpoint emits `data: {...}\n\n` events terminated by `data: [DONE]\n\n`:

- `{type: "text", content: "<delta>"}` — token chunk for the visible reply
- `{type: "tool_start", content: "<toolName>", toolName: "<toolName>"}` — Claude is about to invoke a tool
- `{type: "tool_end", content: "<toolName>", toolName: "<toolName>", toolSuccess: boolean}` — DB write finished
- `{type: "error", content: "<msg>"}` — only on failure

Pass header `x-no-stream: true` to get the full JSON `{content, toolCalls, routineModified}` instead.

### Known quirks (plan around them)

- **`order_index` gaps after delete**: `remove_exercise` does not reindex siblings, so order may go `0,1,2,3,5,6`. Sort by `order_index`; do not assume contiguous integers.
- **`onboardingCompleted` not auto-set**: the edge function does not flip the profile flag after `create_routine`. The client should call `markOnboardingCompleted` after a successful `create_routine` SSE event (or move that into the tool handler).
- **Tenants RLS is `authenticated`-only**: pre-login branding is not supported yet. If the demo needs it, open the policy to `anon` in a follow-up migration.
