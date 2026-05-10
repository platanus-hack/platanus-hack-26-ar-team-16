Plan: ARCHITECTURE.md + B2B Hosted-API Refactor
  
 Context

 Three docs in documentation/ describe an architectural pivot for Gohan AI:
 - productization-faq.md — publishing, IP exposure, minification, usage tracking
 - hosted-integration-model.md — flip from "clone repo + run your own Supabase" to "here's an 
  API key"
 - auth-external-identity.md — accept gym-issued JWTs, never duplicate user data

 Today the codebase has the right shape (multi-tenant schema, edge function, Zustand stores)  
 but several blockers prevent shipping it as a hosted product:

 1. Critical security gap: ai-chat edge function trusts userProfile.id from the request body  
 — no JWT verification (supabase/functions/ai-chat/index.ts:389). Any client can impersonate  
 any user.
 2. Cross-tenant Realtime leak: useRealtimeRoutine.ts:58,63 subscribes to routine_days and    
 routine_exercises with no user_id filter — every update fires for every user.
 3. MCP server has no scoping: uses service role key, accepts any user_id, no tenant boundary 
  (mcp-server/src/index.ts).
 4. No public API surface: gyms today would have to clone the Expo app and use Supabase auth  
 directly.
 5. No usage tracking, no billing primitive, no API keys, no self-serve onboarding.
 6. Dead client-side AI code (src/modules/ai/CoachEngine.ts, prompts.ts, tools.ts) — server   
 does inference, client templates are unused.
 7. Demo secrets were committed to git history (CLAUDE.md, scrubbed in latest commit but      
 still in history).

 This plan delivers two artifacts:
 - documentation/ARCHITECTURE.md — comprehensive system reference (current state + target     
 state, diagrams, security model, decisions)
 - A phased implementation roadmap for the architectural changes, scope: option 3 minus chat  
 persistence (everything except writing chat history to the messages table)

 ---
 Artifact 1: documentation/ARCHITECTURE.md

 Single doc, ~600–900 lines. Section outline:

 1. Overview

 - Vision: AI personal trainer modules for existing gym apps. B2B multi-tenant + standalone   
 consumer.
 - Distribution model: Module + MCP server + hosted edge function. "Your brand, your members, 
  our brain."
 - Three integration paths: drop-in RN component, hosted WebView, MCP HTTP endpoint.

 2. Tech Stack (with versions)

 - React Native 0.81.5 + Expo 54 (prebuild, NOT Expo Go)
 - Expo Router 6 (file-based)
 - NativeWind 4 + Tailwind 3
 - Zustand 5
 - Supabase (Postgres + Auth + Realtime + Storage + Edge Functions on Deno)
 - Anthropic SDK 0.95 (claude-sonnet-4-20250514, streaming + tool_use)
 - MCP SDK 1.0 (TypeScript, stdio transport today → HTTP transport target)
 - Landing: Next.js (separate landing/ directory)

 3. Repository Layout

 Tree with ownership annotations from CLAUDE.md:27–32 (@thblu, @alexndr-n, @DanteDia,
 @Juampiman).

 4. Data Model

 Full schema reference from 001_initial_schema.sql:
 - tenants (id, slug, name, primary/secondary_color, logo_url)
 - profiles (id FK→auth.users, tenant_id FK, fitness_level enum, equipment_available[],       
 injuries[], goals[], onboarding_completed, training_days_per_week)
 - routines (id, user_id FK, name, is_active)
 - routine_days (id, routine_id FK, day_of_week 0–6, muscle_groups[], label)
 - routine_exercises (id, routine_day_id FK, exercise_name, sets, reps, weight_kg,
 rest_seconds, notes, ai_reasoning, completed, order_index)
 - conversations, messages (currently unused at runtime — chat is in-memory)
 - ER diagram (mermaid)

 5. Architecture Diagrams (mermaid)

 - Current data flow — client → edge function (anon key) → Claude API + Postgres writes →     
 Realtime → Zustand store → UI
 - Current infrastructure — Expo client / Supabase project (sa-east-1) / Anthropic
 - Target data flow — gym app → public API (api key + gym JWT) → resolve tenant → existing    
 edge function → same DB
 - Multi-tenant request resolution — how a request's tenant_id is derived (api key lookup →   
 tenant row → scoped queries)
 - Three distribution channels diagram — RN module, WebView, MCP HTTP

 6. Frontend Architecture

 - Navigation tree (app/_layout.tsx → useProtectedRoute() guard → (auth)/login or (tabs)/*)   
 - Zustand stores: useAuthStore, useTenantStore, useRoutineStore, useChatStore (state shape + 
  write triggers per app/_layout.tsx:57–84)
 - Theming: useTheme() reads useTenantStore, fallback to indigo
 (src/theme/useTheme.ts:11–19). Static tenant tokens in src/theme/tenants/megatlon.ts. Tabs   
 layout switches Megatlon vs default at app/(tabs)/_layout.tsx:149–172.
 - Component inventory (chat / routine / ui — high level)

 7. Backend Architecture

 - Edge function ai-chat flow:
   - System prompt build (buildSystemPrompt, lines 296–333)
   - Routine context fetch (lines 338–371)
   - Tool loop (5 max iterations, lines 465–565)
   - SSE event contract (text / tool_start / tool_end / error / [DONE])
   - Tool handlers: create_routine / update_exercise / replace_exercise / add_exercise /      
 remove_exercise
 - MCP server tool surface (10 tools, currently service-role-key based)
 - Auth trigger handle_new_user() (002_rls_and_storage.sql:36–66) — auto-creates profile from 
  raw_user_meta_data.tenant_slug

 8. Realtime Architecture

 - Channels: routine-${userId} (useRealtimeRoutine.ts:50)
 - Subscribed tables: routines, routine_days, routine_exercises
 - Debounced refetch pattern (150ms)
 - Known bug to fix: missing user_id filter on routine_days / routine_exercises

 9. Authentication & Authorization (current)

 - Supabase Auth: email/password + Google OAuth (PKCE on native)
 - Session storage: AsyncStorage on native, localStorage on web (src/services/supabase.ts)    
 - RLS policies — tenants open to authenticated, others scoped by auth.uid()
 (002_rls_and_storage.sql)
 - Edge function: bypasses RLS via service role key, no JWT verification (security gap        
 documented)
 - MCP server: full DB access via service role key, no tenant boundary

 10. Authentication & Authorization (target)

 - Three auth modes per auth-external-identity.md:
   a. Backend-to-backend JWT (default for B2B embedded)
   b. OIDC/SAML for enterprise (deferred until first ask)
   c. Pure API key + external_id (server-to-server / MCP)
 - Standalone consumer: Gohan-owned auth, external_idp = 'gohan'
 - API keys: SHA-256 hashed, scoped per tenant, rotatable via kid
 - Realtime auth path: mint Supabase JWT scoped to user_id row from service role + RLS        

 11. Security Concerns (full table)

 - Secrets in git history (CLAUDE.md previous commits) — rotate + document in runbook
 - ANTHROPIC_API_KEY only in edge function secrets — never in client (CLAUDE.md:25)
 - Service role key never leaves backend
 - RLS bypass risk: any code path that uses supabaseAdmin must scope by tenant_id or user_id  
 from a verified token, not from request body
 - Prompt injection: user-controlled fields (display_name, goals) flow into system prompt —   
 flag for monitoring, not blocker
 - Rate limiting: none today, add per tenant_id and per user_id at the public API layer       
 - PII / data residency: sa-east-1 only, plan EU region for EU customers

 12. Architectural Decisions Record (ADR-style entries)

 - ADR-1: Edge function over client-side AI inference (security + IP protection)
 - ADR-2: Multi-tenant via shared schema + tenant_id discriminator (vs schema-per-tenant)     
 - ADR-3: External identity over Gohan-owned auth for embedded customers
 - ADR-4: Hosted MCP HTTP over distributed stdio binaries
 - ADR-5: API key + signed JWT handoff over OAuth for B2B (faster integration)
 - ADR-6: Single Supabase project for all tenants (vs project-per-tenant)
 - ADR-7: Tenant denormalization on routines (vs join through profiles)

 13. Build & Deploy

 - Expo: eas build produces Hermes bytecode bundle (minified). EAS profiles for consumer vs   
 whitelabel-<gym> flavor.
 - Edge function: supabase functions deploy ai-chat
 - MCP server: tsc → dist/index.js (today). Target: bundled + Dockerized.
 - Landing: Next.js, separate deploy (Vercel).

 14. Glossary

 tenant, external_id, gohan_user_id, api key, signing secret, kid, tool_use, SSE event types. 

 ---
 Artifact 2: Implementation Roadmap (phased)

 Sequenced so security blockers ship first. Total estimate ≈ 3 weeks.

 Phase 0 — Security blockers (Days 1–2, do first)

 0.1 JWT verification in ai-chat edge function
 - File: supabase/functions/ai-chat/index.ts
 - Change: lines 386–390 — extract userId from verified JWT (Authorization: Bearer) using     
 supabaseAdmin.auth.getUser(jwt), NOT from userProfile?.id in body. Body userProfile becomes  
 display-only context.
 - Reject 401 if token invalid/missing.
 - Update src/modules/ai/CoachEngine.ts:28–32 to send the actual user JWT instead of the anon 
  key.

 0.2 Realtime user_id filter
 - File: src/hooks/useRealtimeRoutine.ts:58,63
 - Add filter on routine_days and routine_exercises: filter by routine_id IN (SELECT id FROM  
 routines WHERE user_id = ?). Supabase Realtime doesn't support subqueries — alternative:     
 subscribe per-routine-id after the routine is fetched, or use a server-side broadcast        
 channel.
 - Recommended: switch to a Postgres function + pg_notify channel keyed by user_id, subscribe 
  to that channel only. ~half day.

 0.3 RLS audit + tenant_id denormalization
 - New migration: 004_routines_tenant_id.sql
   - ALTER TABLE routines ADD COLUMN tenant_id uuid REFERENCES tenants(id)
   - Backfill from profiles.tenant_id
   - Index (tenant_id, user_id)
   - Update RLS policy to also check tenant
 - Re-audit all RLS policies in 002_rls_and_storage.sql to confirm they still hold under      
 cross-tenant scenarios.

 0.4 Secrets rotation + history scrub
 - Rotate: ANTHROPIC_API_KEY (was leaked in earlier commit), demo user password, Supabase     
 anon key if it was committed.
 - Run git filter-repo on history for CLAUDE.md to remove leaked credentials. Force-push to a 
  fresh branch (coordinate with team — never to main without sign-off).
 - Add a pre-commit hook (detect-secrets or gitleaks) to .husky/ or lefthook.yml.

 Phase 1 — Schema migrations (Day 3)

 Five new migrations in supabase/migrations/:

 - 005_external_identity.sql — ALTER TABLE profiles ADD COLUMN external_id text, external_idp 
  text; ADD UNIQUE (tenant_id, external_id)
 - 006_tenant_api_keys.sql — CREATE TABLE tenant_api_keys (id uuid PK, tenant_id FK, key_hash 
  text NOT NULL, name text, created_at, last_used_at, revoked_at) + RLS denying all client    
 access (only edge functions touch this)
 - 007_tenant_signing_secrets.sql — CREATE TABLE tenant_signing_secrets (id uuid PK,
 tenant_id FK, kid text, secret text, algorithm text, created_at, revoked_at) for JWT
 verification per tenant
 - 008_usage_events.sql — CREATE TABLE usage_events (id, tenant_id, user_id, event_type,      
 tokens_in int, tokens_out int, tool_calls int, latency_ms int, created_at). Index
 (tenant_id, created_at).
 - 009_profiles_last_active.sql — ALTER TABLE profiles ADD COLUMN last_active_at timestamptz  

 Phase 2 — Public API surface (Days 4–6)

 New edge functions in supabase/functions/:

 api-session/index.ts — POST /functions/v1/api/session
 - Headers: Authorization: Bearer <gym_jwt>, X-Tenant-Slug: <slug>
 - Verifies gym JWT against tenant_signing_secrets
 - Upserts profiles row by (tenant_id, external_id)
 - Returns {session_token, supabase_realtime_jwt, expires_in}. Realtime JWT minted via        
 service role with custom sub = profile.id.
 - Sketch in auth-external-identity.md:67–88.

 api-users/index.ts — POST/GET/DELETE /functions/v1/api/users
 - Headers: Authorization: Bearer gk_live_xxx (api key, not user)
 - POST: provision user without session (S2S use case)
 - DELETE: cascade-delete profile + routines (GDPR)

 api-chat/index.ts — POST /functions/v1/api/chat
 - Wrapper around existing ai-chat logic
 - Auth: api key (server) OR session token (client)
 - Logs usage_events row on each call
 - Updates profiles.last_active_at

 api-keys-issue/index.ts — invoked from tenant dashboard, generates gk_live_<slug>_<random>,  
 hashes, stores hash. Returns plaintext once.

 Shared module: supabase/functions/_shared/auth.ts — verifyApiKey(), verifyTenantJWT(),       
 mintGohanSessionToken(), mintRealtimeJWT().

 Phase 3 — Distribution channels (Days 7–9)

 3.1 npm package @gohan-ai/react-native
 - New repo subfolder: packages/react-native/ (or split repo later)
 - Exports: <GohanCoach apiKey userId tenantSlug />, <GohanRoutine />, useGohan() hook        
 - Internally re-uses src/components/chat/, src/components/routine/, src/store/*, src/theme/* 
 - Replaces src/services/supabase.ts with httpClient.ts hitting the public API
 - Build with tsc + tsup for ESM/CJS dual output. package.json private: false,
 publishConfig.access: public.

 3.2 Hosted WebView
 - Use existing app.json web bundler config ("web": { "bundler": "metro" })
 - Add app/embed.tsx route — accepts ?token=<short_lived> query param, calls /api/session to  
 exchange for full session, renders <Coach /> + <Routine />
 - Deploy to embed.gohan.ai (Vercel or Cloudflare Pages)

 3.3 MCP HTTP transport
 - File: mcp-server/src/index.ts:2,291–296
 - Replace StdioServerTransport with StreamableHTTPServerTransport from
 @modelcontextprotocol/sdk/server/streamableHttp.js
 - Add API key auth middleware (header Authorization: Bearer gk_live_xxx)
 - Resolve tenant from api key, scope ALL tool queries to that tenant (get_user_routine,      
 list_exercises_for_day, get_user_profile, update_exercise, add_exercise, remove_exercise,    
 replace_exercise must all check user_id belongs to tenant_id)
 - Drop list_tenant_users from cross-tenant access
 - Deploy as Deno Deploy or fly.io service at mcp.gohan.ai

 Phase 4 — Standalone consumer app (Days 10–11)

 4.1 EAS build flavors
 - New eas.json at root with two build profiles:
   - consumer — EXPO_PUBLIC_DEFAULT_TENANT=default, bundle id com.gohanai.app
   - whitelabel-megatlon — different tenant slug, different bundle id (one per gym)
 - Document in README: eas build --profile consumer

 4.2 Pre-login tenant branding
 - Migration 010_tenants_anon_read.sql — open tenants SELECT policy to anon (CLAUDE.md:84     
 known quirk)
 - Update app/(auth)/login.tsx to call getTenantBySlug(EXPO_PUBLIC_DEFAULT_TENANT) before     
 auth so login screen shows correct branding

 4.3 Conditional gym-only screens
 - New tenants column: features jsonb (default '{}')
 - Hide app/(tabs)/qr.tsx and Megatlon-specific tab layout when features.qr_checkin !== true  
 — already partially scaffolded at app/(tabs)/_layout.tsx:149

 4.4 Billing/paywall stub
 - Add migration 011_subscriptions.sql — subscription_status text DEFAULT 'free',
 subscription_expires_at timestamptz on profiles
 - Gate chat send button + api-chat edge function on subscription_status IN
 ('active','trial') for consumer tenant only (B2B tenants billed by usage_events, not
 user-level)
 - Stub component in src/components/ui/Paywall.tsx — just shows "Upgrade" CTA. Real
 RevenueCat / Stripe integration is a follow-up.

 Phase 5 — Tenant dashboard (Days 12–14)

 New Next.js app: dashboard/
 - Auth: Supabase Auth (gym admin signs up with email)
 - Pages:
   - /signup — creates tenants row (name, slug, primary_color, logo upload)
   - /keys — list / create / revoke API keys (calls api-keys-issue)
   - /usage — basic chart: DAU per day, AI messages per day, tool_calls per day (queries      
 usage_events aggregated)
   - /integration — copy-pasteable snippets for RN / WebView / MCP, pre-filled with the       
 tenant's slug + key
   - /secrets — manage JWT signing secrets (create, list, revoke; show plaintext once)        
 - Deploy to dashboard.gohan.ai

 Phase 6 — Cleanup (Day 15)

 6.1 Delete dead client-side AI code
 - Remove src/modules/ai/CoachEngine.ts, prompts.ts, tools.ts, types.ts if confirmed unused   
 (Explore agent found these are templates only; server does inference at
 supabase/functions/ai-chat/index.ts:296–565)
 - Verify no imports first: grep -r "from.*modules/ai" in app/ and src/

 6.2 Landing page polish + deploy
 - landing/ is already scaffolded as a Next.js app
 - Update CTAs to point at dashboard.gohan.ai/signup
 - Deploy to Vercel under gohan.ai

 6.3 Docs
 - Update README.md to point at documentation/ARCHITECTURE.md
 - Add documentation/RUNBOOK.md with on-call basics (rotate keys, redeploy edge function,     
 restore demo user)
 - Add documentation/INTEGRATION.md — public API reference for gym engineers

 ---
 Verification

 ARCHITECTURE.md

 - Render mermaid diagrams locally (VS Code preview or mmdc CLI) before final commit
 - Cross-check every file:line citation against actual code state
 - Have @DanteDia (infra owner) review the data model + auth sections; @Juampiman (AI/MCP)    
 review the backend section

 Phase 0 (Security)

 - Smoke test from CLAUDE.md (lines 87–101) updated for JWT auth — should fail with 401 if    
 Authorization header is anon key only
 - Pen test: try sending another user's userProfile.id in the body → expect 401 (JWT user     
 mismatch) or silent override to JWT user
 - Realtime: open two demo users in two emulators, modify routine for user A, confirm user    
 B's routine-${userId} channel does NOT fire
 - RLS: as user A's JWT, try SELECT * FROM routines WHERE user_id = '<user_b_uuid>' → expect  
 0 rows

 Phase 1 (Schema)

 - Run all migrations against a local Supabase: supabase db reset
 - Confirm backfill query populated routines.tenant_id for existing rows
 - Confirm tenant_api_keys RLS denies all roles except service_role

 Phase 2 (Public API)

 - E2E: provision a test tenant + api key in dev DB, mint a gym JWT signed with their secret, 
  hit POST /api/session → get a session_token, hit POST /api/chat with it → get streaming     
 response, verify a usage_events row was written
 - Negative tests: revoked api key → 401; expired gym JWT → 401; wrong tenant slug for the    
 api key → 403

 Phase 3 (Distribution)

 - npm package: npm pack, install in a fresh Expo app, render <GohanCoach /> against staging, 
  send a message → routine updates in real time
 - WebView: hit embed.gohan.ai/coach?token=<test> from a sample iOS WebView, full chat flow   
 works
 - MCP HTTP: npx @modelcontextprotocol/inspector against mcp.gohan.ai with api key, list      
 tools, call get_user_routine → returns only that tenant's user

 Phase 4 (Consumer app)

 - eas build --profile consumer produces a build with tenant_slug = 'default', no QR tab,     
 indigo branding
 - Sign up flow works without a tenant_slug query param
 - Paywall gate: confirm chat send disabled when subscription_status = 'free'

 Phase 5 (Dashboard)

 - Self-serve sign up → tenant created → key generated (shown once) → integration snippets    
 render with the right slug → first API call from the snippet succeeds → usage chart shows    
 the call

 Phase 6 (Cleanup)

 - tsc --noEmit clean after deleting src/modules/ai/
 - Lighthouse on landing >= 90 across the board

 ---
 Critical files to modify

     │ - Lighthouse on landing >= 90 across the board                                        │
     │                                                                                       │
     │ ---                                                                                   │
     │ Critical files to modify                                                              │
     │                                                                                       │
     │ Security fixes (Phase 0)                                                              │
     │ ---                                                                                   │
     │ Critical files to modify                                                              │
     │                                                                                       │
     │ Security fixes (Phase 0)                                                              │
     │ - supabase/functions/ai-chat/index.ts — JWT verification (lines 386–390)              │
     │ - src/hooks/useRealtimeRoutine.ts — user_id filter (lines 50–65)                      │
     │ - src/modules/chat/ChatManager.ts, src/modules/ai/CoachEngine.ts — send user JWT      │
     │ instead of anon key (CoachEngine lines 28–32)                                         │
     │ - CLAUDE.md — already scrubbed; needs git history scrub via filter-repo               │
     │ - mcp-server/src/index.ts — tenant scoping on all tool handlers (lines 23–289)        │
     │                                                                                       │
     │ New files (Phases 1–6)                                                                │
     │ - supabase/migrations/004_routines_tenant_id.sql through 011_subscriptions.sql        │
     │ - supabase/functions/_shared/auth.ts                                                  │
     │ - supabase/functions/api-session/index.ts                                             │
     │ - supabase/functions/api-users/index.ts                                               │
     │ - supabase/functions/api-chat/index.ts                                                │
     │ - supabase/functions/api-keys-issue/index.ts                                          │
     │ - packages/react-native/ (new subdirectory + tsup config)                             │
     │ - app/embed.tsx                                                                       │
     │ - eas.json                                                                            │
     │ - dashboard/ (new Next.js app)                                                        │
     │ - documentation/ARCHITECTURE.md                                                       │
     │ - documentation/RUNBOOK.md                                                            │
     │ - documentation/INTEGRATION.md                                                        │
     │                                                                                       │
     │ Files to delete (Phase 6, after import audit)                                         │
     │ - src/modules/ai/CoachEngine.ts                                                       │
     │ - src/modules/ai/prompts.ts                                                           │
     │ - src/modules/ai/tools.ts                                                             │
     │ - src/modules/ai/types.ts                                                             │
     │ - src/modules/ai/index.ts                                                             │
     │                                                                                       │
     │ Reused functions / patterns                                                           │
     │                                                                                       │
     │ - getTenantBySlug / getTenantById (src/services/tenant.ts:36–67) — re-used by Phase   │
     │ 4.2 pre-login branding                                                                │
     │ - handle_new_user() trigger (supabase/migrations/002_rls_and_storage.sql:36–66) —     │
     │ pattern for the upsert in api-session                                                 │
     │ - Existing tool handlers in ai-chat (executeCreateRoutine etc., lines 149–292) —      │
     │ wrapped, not rewritten, by api-chat                                                   │
     │ - ChatManager SSE parsing (src/modules/chat/ChatManager.ts) — reused inside the       │
     │ @gohan-ai/react-native package                                                        │
     │ - Theme system (src/theme/useTheme.ts:11–19) — reused as-is in npm package and        │
     │ WebView  