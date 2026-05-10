# 2026-05-10 — Build-time tenant policy formalized

**Status:** Adopted.
**Affects:** ARCHITECTURE.md §6 (frontend), §10.3 (standalone vs embedded), CLAUDE.md "Key Patterns".

## Context

CLAUDE.md has long stated that tenant identity is "locked at build time via `EXPO_PUBLIC_TENANT_SLUG`." A 2026-05-10 review of `app/(tabs)/_layout.tsx` found:

- The file is 141 lines, hardcoded to the Megatlon visual shell. There is no runtime branch on `tenant.slug`.
- Earlier ARCHITECTURE.md revisions claimed a runtime branch existed at lines 149–172. That branch never existed (or was removed earlier and the doc didn't catch up).
- `useTenantStore.tenant` is still queried at runtime, but only for *metadata* (id, name) — it does not drive layout.

The de-facto state already matches the claimed policy. The drift was in the documentation, not the code.

## Decision

- **Build-time tenant** is the policy. One binary per tenant. The `EXPO_PUBLIC_TENANT_SLUG` env var is read at compile time and selects the visual shell, theme tokens, and any tenant-specific copy at build time.
- **Today's binary** ships with `default` as the slug and the Megatlon visual shell. The consumer "Gohan AI" app and the Megatlon shell co-exist in the same binary until a second tenant ships, at which point a separate EAS profile builds the second binary.
- **`useTenantStore`** is *not* removed. It still holds the runtime metadata fetched from Postgres (id, name) so server-side joins work. It just does not drive UI structure.

## Consequences

**Wins.**
- The "no runtime tenant branch" rule is now an enforced contract, not a coincidence. Future PRs that try to switch shells based on `tenant.slug` should be rejected on review.
- Theme tokens for a tenant can be tree-shaken — only the active tenant's tokens ship in the bundle.
- Pre-login branding (CLAUDE.md known quirk: tenants RLS is `authenticated`-only) is no longer a blocker for the consumer app — it doesn't need to read the tenants table to know who it is.

**Costs.**
- One binary per tenant means N App Store / Play Store listings if N gym customers want their own app. This is consistent with the embedded-module path being the default integration: gyms with existing apps embed `@gohan-ai/react-native`, which is unaffected by this policy. Standalone consumer binaries are the exception, not the rule.

## Follow-ups

- Wire a build-time read of `EXPO_PUBLIC_TENANT_SLUG` in `app/(tabs)/_layout.tsx` (or a small `getActiveTenantConfig()` helper) so the shell selection is explicit when a second tenant ships, instead of being implicit in the hardcoded Megatlon code.
- Update CLAUDE.md "Key Patterns" line if it still implies runtime tenant resolution. (Already correct as of this date.)
