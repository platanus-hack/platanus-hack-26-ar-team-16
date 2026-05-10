# Tech Debt Register

Living list of known shortcuts, deferred refactors, and security items that need follow-up. Each entry has an owner, an explicit "what would 'done' look like", and a rough size. Update on resolve / re-prioritize.

> **Convention:** keep entries terse. Detailed design lives in `ARCHITECTURE.md` or a per-item ADR; this file is the index.
>
> **TD-1 / TD-2** are the original wearables incident. **TD-10–TD-19** are design-level items that were tracked in `ARCHITECTURE.md` §16 until the 2026-05-10 review and were moved here so the architecture doc can stay focused on *current* state, not pending work.

---

## Open

### TD-2 — Bundled OW admin credential rotation (operational)

**Severity:** High (credential exposure)
**Owner:** unassigned (whoever owns the OW backend operationally)
**Surface:** the OW backend's `admin@admin.com` account.

**Problem.** The credential `GohanAdmin2026!` was committed in clear text in `src/services/openWearables.ts` (commit `82d2750`). It is in the git history of every clone of `origin/main`. After TD-1 closure (2026-05-10) the literal is no longer in the bundle, but the historical commit remains discoverable.

**Definition of done.**
- [ ] Rotate the admin password on the OW deployment.
- [ ] Confirm no other repos / docs / Slack threads reference the old value (search before / after rotation).
- [ ] Optional: `git filter-repo` to scrub the literal from history. Coordinate with the team — this rewrites SHAs.

**Estimated size.** 30 min for rotation + verification. History scrub is a separate ~half-day with team coordination.

---

### TD-10 — Embedded module realtime is broken until `realtime_jwt` mint lands

**Severity:** Medium-high (feature gap, B2B-blocking)
**Surface:** `supabase/functions/api-session/index.ts`, `src/hooks/useRealtimeRoutine.ts:93–106`.
**Architecture ref:** `ARCHITECTURE.md` §10.4.

**Problem.** §10.4 promises that `api-session` mints a Supabase-scoped JWT alongside the Gohan session token so the embedded module can subscribe to Realtime. It is not implemented. The consumer side already does `supabase.realtime.setAuth(token)` and falls through silently when the token is rejected. **Today, the embedded npm module receives no realtime events** — gym integrations ship without live routine updates.

**Definition of done.**
- [ ] `api-session` mints a Supabase JWT scoped to the resolved profile row (service-role + RLS) and returns it as `realtime_jwt` in the session response.
- [ ] `useCoachContext.config.getAuthToken` exposes the realtime JWT separately so `useRealtimeRoutine` doesn't hand it the session JWT.
- [ ] Smoke test: live edit from gym JWT path produces a routine update on the embedded screen.

**Estimated size.** ~half a day.

---

### TD-11 — `_shared/chat-handler.ts` god-module split

**Severity:** Medium (maintainability, regression-blast)
**Surface:** `supabase/functions/_shared/chat-handler.ts` (~960 lines).
**Architecture ref:** `ARCHITECTURE.md` §7.1.

**Problem.** Holds tool schemas + executors + Anthropic streaming loop + non-streaming fallback + system-prompt assembly + DB mutations. Two entrypoints (`ai-chat`, `api-chat`) share it, so any edit risks both surfaces. Per-tool tests are awkward because the handlers are nested inside the loop.

**Definition of done.**
- [ ] Split into `_shared/tools/` (one file per executor), `_shared/prompt.ts` (system-prompt — partly already in `coach-instructions.ts`), `_shared/stream.ts` (loop), `_shared/index.ts` (entry).
- [ ] No behaviour change; identical SSE output.
- [ ] Per-tool Deno tests added in the same PR (TD-15 enabling).

**Estimated size.** ~half a day for the split, +half a day for tests.

---

### TD-12 — Chat persistence (ADR #8): schema lives, code doesn't

**Severity:** Low operationally, **product-shaping** strategically
**Surface:** `src/modules/chat/ChatManager.ts:15` (`MOCK_CONVERSATION_ID`); `conversations` + `messages` tables (migrations 001/002).
**Architecture ref:** `ARCHITECTURE.md` §13 dead-code / stale-schema list, ADR #8.

**Problem.** Chat history is in-memory only — the tables exist with RLS but nothing reads/writes them. The user has confirmed (2026-05-10) this stays parked, but a coach that can't recall yesterday's session is a strictly different product than one that can. Re-evaluate when the demo ships.

**Definition of done.** *(when re-prioritized)*
- [ ] Hydrate `useChatStore.messages` from `messages` table on session start, scoped to the active conversation.
- [ ] Append on every send/receive (user + assistant turn) inside `ChatManager.sendUserMessage`.
- [ ] Drop `MOCK_CONVERSATION_ID`; the conversation row is created on first send if absent.
- [ ] Decide retention policy (full transcripts forever vs. summary-after-N-days).

**Estimated size.** ~1 day (one-shot if no retention policy debate).

---

### TD-13 — Module-level chat transport singleton

**Severity:** Low (works for shipped apps; awkward for tests)
**Surface:** `src/modules/chat/ChatManager.ts:41`.
**Architecture ref:** `ARCHITECTURE.md` §6.

**Problem.** `let activeTransport: ChatTransport | null = null` constrains "one active transport per JS bundle." Compatible refactor: thread transport through `useCoachContext` (already exists for realtime). Worth doing if a "switch tenant mid-session" flow ever ships, or to make component tests easier to mock.

**Definition of done.**
- [ ] `useCoachContext.config` carries `apiClient` + `endpoint`; `ChatManager` reads from context, not module state.
- [ ] `setChatTransport` / `getOrBuildTransport` deleted.
- [ ] Components rendered without a `<CoachProvider>` no longer fall through to env-derived defaults silently — explicit error.

**Estimated size.** ~2 hours.

---

### TD-14 — `tenant_signing_secrets.kid` rotation is over-modelled vs. implementation

**Severity:** Low (works fine for one-row-per-tenant; debt only when rotation is needed)
**Surface:** `migrations/004_external_identity_and_api_keys.sql`, `supabase/functions/api-session/index.ts`.

**Problem.** Schema supports `kid` selection with grace-period overlap; `api-session` ignores the JWT header `kid` and verifies against the single un-revoked secret. Either implement rotation or simplify the schema until needed.

**Definition of done (path A — implement).**
- [ ] `api-session` reads `kid` from gym JWT header, selects matching `tenant_signing_secrets` row.
- [ ] Overlap window: keep both old + new active for 24h on rotation.
- [ ] Rotation runbook in `docs/`.

**Definition of done (path B — simplify).**
- [ ] Drop `kid` column; constrain to one un-revoked row per tenant.

**Estimated size.** Path A: ~half a day. Path B: ~30 min + migration.

---

### TD-15 — Test coverage (Deno tool-executor tests)

**Severity:** Medium (regression risk on auth-critical code)
**Surface:** `supabase/functions/_shared/chat-handler.ts` (and post-TD-11 `tools/*`).

**Problem.** 1 test file in the repo (`mcp-server/test/http-transport.test.ts`). The chat-handler tool executors mutate user data based on LLM input; a bug in `(user_id, tenant_id)` scoping is a security bug. CI minimum (`tsc --noEmit` + gitleaks) landed 2026-05-10 but doesn't validate behaviour.

**Definition of done.**
- [ ] One Deno test per tool executor: each asserts that a request with `ctx.userId=A, ctx.tenantId=X` cannot mutate rows owned by `(B, X)` or `(A, Y)`.
- [ ] Mock Supabase admin client (or run against a Supabase local stack — preferred).
- [ ] Wire `deno test` into `.github/workflows/ci.yml`.

**Estimated size.** ~half a day for ~10 tests.

---

### TD-16 — `usage_events` write path: failure attribution + indexing + roll-ups

**Severity:** Low (observability completeness)
**Surface:** `supabase/functions/_shared/chat-handler.ts:709–724`, migration 004.

**Problem.** `recordUsage` is wired (closed in `ARCHITECTURE.md` §11) but: (a) no `event_type='tool.error'` row when `executeTool` returns `success:false` so failures aren't attributable; (b) `usage_events` has only `(tenant_id, created_at DESC)` — per-user queries seq-scan; (c) no aggregation view for the dashboard.

**Definition of done.**
- [ ] Emit `tool.error` events from inside `executeTool` on failure path.
- [ ] Add `(user_id, created_at DESC)` index.
- [ ] Daily roll-up view (`usage_events_daily`) for dashboard reads.

**Estimated size.** ~2 hours.

---

### TD-17 — ADR #6 (single-Postgres) trigger is unmeasurable

**Severity:** Low (forward-looking; no immediate breakage)
**Architecture ref:** `ARCHITECTURE.md` §12 ADR #6.

**Problem.** ADR #6 says "re-evaluate when largest tenant > 30% MAU." There is no instrumentation that surfaces that ratio. Trigger fires silently or never.

**Definition of done.**
- [ ] SQL view `tenant_mau_share` derived from `usage_events`.
- [ ] Dashboard panel + alert at 25% (early warning).

**Estimated size.** ~1 hour.

---

### TD-18 — Inline-style violations of CLAUDE.md "use className" rule

**Severity:** Low (consistency, not correctness)
**Surface:** ~20 files across `src/components/chat/`, `src/components/routine/`.

**Problem.** CLAUDE.md mandates `className` for static layout/spacing/colors and `style` only for runtime-dynamic values. Many files have static `style={{}}` blocks that should be Tailwind classes.

**Definition of done.**
- [ ] Sweep the offending files; convert what Tailwind expresses, leave only the truly dynamic.
- [ ] (Optional) ESLint rule `react-native/no-inline-styles` configured to warn.

**Estimated size.** ~1–2 hours of mechanical work.

---

### TD-19 — No ESLint config

**Severity:** Low (hygiene)
**Surface:** repo root + each workspace.

**Problem.** Only `tsc --noEmit` runs as "lint." CLAUDE.md conventions (className-first, no-`any`-without-justification, no-console-spam) cannot be auto-enforced.

**Definition of done.**
- [ ] `eslint` + `@typescript-eslint` + `eslint-plugin-react-native` set up at root.
- [ ] One `npm run lint` script per workspace.
- [ ] Added to `.github/workflows/ci.yml` as a third matrix step.

**Estimated size.** ~1 hour.

---

### TD-20 — Embeddable npm module: import-graph guard

**Severity:** Low after TD-1 closure (no creds to leak); kept as belt-and-braces.
**Surface:** `packages/react-native-coach/` build output, `.gitleaks.toml`.

**Problem.** `packages/react-native-coach/src/index.ts` reaches into `../../../src/components/GohanCoach` directly. Tree-shaking is the only thing keeping unrelated services out of the bundle. Today this is safe (post-ow-bridge nothing in `src/services/` carries secrets), but the boundary is implicit.

**Definition of done.**
- [ ] Either: extract a `packages/coach-core/` lib that both `app/` and `packages/react-native-coach/` consume, OR
- [ ] CI assertion on `packages/react-native-coach/dist/` content (e.g. it does not bundle anything from `app/`, `src/services/openWearables.ts`, or `src/services/supabase.ts`).

**Estimated size.** Lib extraction: ~half a day. CI assertion only: ~30 min.

---

## Resolved

### TD-1 — Open Wearables integration bypasses auth refactor invariants — RESOLVED 2026-05-10

Closed by:
- `supabase/migrations/009_wearables_links.sql` — mapping table created.
- `supabase/functions/ow-bridge/index.ts` — admin auth + identity resolution + OW proxy moved server-side.
- `src/services/openWearables.ts` — rewritten as a thin Supabase-JWT-authenticated wrapper; no admin token, no `OW_HOST` calls, no module-level state.
- `.gitleaks.toml` — flags any re-introduction of the historical literal.

**Deploy steps still required (operational, see TD-2):**
- `supabase secrets set OW_HOST=... OW_ADMIN_USERNAME=... OW_ADMIN_PASSWORD=... OW_API_KEY=...`
- `supabase functions deploy ow-bridge`
- Apply migration 009.

### Asymmetric `(user_id, tenant_id)` denormalization — RESOLVED 2026-05-10

Closed by `supabase/migrations/008_denormalize_user_tenant_to_children.sql` (mirror of ADR #7) + insert-site updates in `_shared/chat-handler.ts` and `mcp-server/src/index.ts` + realtime hook switching to wire-side `user_id=eq.${userId}` filters. See `docs/architectural-changes/2026-05-10-denormalize-child-tables.md`.

### `usage_events` unwritten — RESOLVED (was never open)

`recordUsage()` is called from all three completion paths in `_shared/chat-handler.ts`. The "OPEN" status in earlier doc revisions was stale. Follow-ups tracked as TD-16.

### Edge function trusts body `userProfile.id` — RESOLVED (was never open)

`ai-chat/index.ts:74` strips the body `id`; identity comes from the verified Supabase JWT. `api-chat/index.ts:113` same pattern. The "OPEN — Phase 0.1" status in earlier doc revisions was stale.

### MCP server unscoped service role — RESOLVED (was never open)

`mcp-server/src/index.ts:86–93` `scopeTenant()` is applied to every tool entry; API key resolves `tenant_id` at request entry. The "OPEN — Phase 3.3" status in earlier doc revisions was stale.

### `onboardingCompleted` not auto-set + dual-write — RESOLVED 2026-05-10

Server-side flip in `_shared/chat-handler.ts:306–311` is authoritative. The redundant client-side `markOnboardingCompleted` call in `ChatManager.ts` was removed; `markOnboardingCompleted` itself was deleted from `src/services/profiles.ts`. Local store still mirrors the flag immediately so `ONBOARDING MODE` doesn't gate the next turn.

### CI minimum — LANDED 2026-05-10

`.github/workflows/ci.yml` runs `tsc --noEmit` across root + each workspace and `gitleaks` with `.gitleaks.toml`. Behaviour tests still owed (TD-15).

### Build-time tenant policy formalized — DECIDED 2026-05-10

`app/(tabs)/_layout.tsx` is hardcoded build-time Megatlon. Earlier doc revisions claimed a runtime branch on `tenant.slug`; that branch never existed. Policy: tenant identity locked at build time via `EXPO_PUBLIC_TENANT_SLUG`. See `docs/architectural-changes/2026-05-10-build-time-tenant-policy.md`.
