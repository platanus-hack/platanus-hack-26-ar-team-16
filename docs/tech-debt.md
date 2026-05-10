# Tech Debt Register

Living list of known shortcuts, deferred refactors, and security items that need follow-up. Each entry has an owner, an explicit "what would 'done' look like", and a rough size. Update on resolve / re-prioritize.

> **Convention:** keep entries terse. Detailed design lives in `ARCHITECTURE.md` or a per-item ADR; this file is the index.

---

## Open

### TD-1 — Open Wearables integration bypasses auth refactor invariants

**Severity:** High (security + arch)
**Owner:** unassigned
**Surface:** `src/services/openWearables.ts`, `src/hooks/useOpenWearables.ts`, `app/(tabs)/mas.tsx`
**Origin:** commit `82d2750` (`feat: open wearables integration + CORS fix`), pre-auth-refactor.
**Architecture ref:** `ARCHITECTURE.md` §14.

**Problem.** The wearables client talks directly to a third-party Open Wearables backend (`OW_HOST`) using bundled admin credentials. Three properties of the current path are out of compliance with `ARCHITECTURE.md` §10–§11:

1. Admin email + password are string literals in `openWearables.ts` — shipped in the Hermes bundle and present in git history of `origin/main` since `82d2750`.
2. `ensureOWUser(email)` lets the client choose which OW user it operates as. There is no Gohan-side mapping table linking `profiles.id ↔ ow_user_id`; nothing prevents impersonation by passing a different `email`.
3. The resolved `ow_user_id` lives in a module-level `let` that resets on cold start, forcing a re-auth round-trip every time.

**Definition of done.**
- [ ] Rotate the OW admin credential (current value is in the public git history — must happen regardless of refactor timeline).
- [ ] Move OW admin auth into a new edge function `ow-bridge` (Deno, `supabase/functions/ow-bridge/`). Admin creds live in edge-function secrets, never in the client bundle.
- [ ] New table `public.wearables_links (user_id, tenant_id, provider, external_id, connected_at)` with `(tenant_id, provider, external_id)` uniqueness; RLS scoped on `user_id = auth.uid()`.
- [ ] `ow-bridge` exposes `/connect`, `/sync`, `/activity`, `/sleep` — all JWT-resolved like `api-chat`.
- [ ] `src/services/openWearables.ts` reduced to thin `apiClient.request('/wearables/...')` wrappers; no `fetch(OW_HOST/...)`, no module-level state, no admin token plumbing.
- [ ] Once the above is true, the wearables files are eligible to ship in the embeddable `@gohan-ai/react-native` module.

**Estimated size.** ~1 day of focused work (one edge function, one migration, one client refactor).

**Workaround until done.** Do not extend `openWearables.ts` with additional providers (Whoop / Oura / Garmin). Do not export the wearables hook from the embeddable module. Demo only.

---

### TD-2 — Bundled OW admin credential rotation

**Severity:** High (credential exposure)
**Owner:** unassigned (whoever owns the OW backend operationally)
**Surface:** the OW backend's `admin@admin.com` account.

**Problem.** The credential `GohanAdmin2026!` was committed in clear text in `src/services/openWearables.ts` (commit `82d2750`). It is in the git history of every clone of `origin/main`. Even after TD-1 removes the literal from the bundle, the historical commit remains discoverable.

**Definition of done.**
- [ ] Rotate the admin password on the OW deployment.
- [ ] Confirm no other repos / docs / Slack threads reference the old value (search before / after rotation).
- [ ] Optional: `git filter-repo` to scrub the literal from history. Coordinate with the team — this rewrites SHAs.

**Estimated size.** 30 min for rotation + verification. History scrub is a separate ~half-day with team coordination.

---

## Resolved

*(none yet — entries move here with the resolving commit SHA when closed)*
