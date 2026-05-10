# 2026-05-10 — Denormalize `(user_id, tenant_id)` onto routine_days + routine_exercises

**Status:** Adopted.
**Migration:** `supabase/migrations/008_denormalize_user_tenant_to_children.sql`.
**Affects:** ARCHITECTURE.md §4 (data model), §8 (realtime), §11 (security table), §12 (ADR list).

## Context

ADR #7 already denormalized `tenant_id` onto `routines` for hot-path scoping and simpler RLS. The same trade was never extended to the child rows. As a result:

- `useRealtimeRoutine` could not wire-filter `routine_exercises` events — the row had only `routine_day_id`. The earlier workaround filtered `routine_days` by `routine_id IN (...)` (using a list resolved at mount) and left `routine_exercises` unfiltered. RLS gated the *payload* but not the event fan-out.
- Tenant-scoping helpers in the chat handler (`assertExerciseOwnership`, `assertDayOwnership`) and MCP server had to JOIN through `routines` to answer "is this row mine?" — every authority check was a multi-table read.

## Decision

Apply the same denormalization to both child tables that ADR #7 applied to `routines`:

- `routine_days.user_id` (UUID, NOT NULL)
- `routine_days.tenant_id` (UUID, NOT NULL, FK → `tenants(id)`)
- `routine_exercises.user_id` (UUID, NOT NULL)
- `routine_exercises.tenant_id` (UUID, NOT NULL, FK → `tenants(id)`)

Backfilled from the parent rows in the same migration; NOT NULL applied after successful backfill. New indexes on `user_id` and `tenant_id` for both tables.

## Consequences

**Wins.**
- All three Realtime subscriptions in `useRealtimeRoutine.ts` now filter `user_id=eq.${userId}` wire-side — events stay scoped per user regardless of how many tenants share the cluster.
- Ownership helpers collapse to single-table reads: `assertExerciseOwnership` and `assertDayOwnership` now just `select user_id, tenant_id from routine_{days,exercises} where id = ?`. Same simplification on the MCP side (`exerciseBelongsToTenant`, `routineDayBelongsToTenant`).
- RLS policies that need to reference tenant_id can now be written without a join.

**Costs.**
- Two columns must be kept consistent with the parent on every insert. Insert sites updated: `_shared/chat-handler.ts:executeCreateRoutine` (routine_days insert + routine_exercises bulk insert), `_shared/chat-handler.ts:executeAddExercise`, `mcp-server/src/index.ts:add_exercise`, `mcp-server/src/index.ts:replace_exercise`. Future inserts must populate both.
- `routine_id` and `routine_day_id` remain the structural FKs; `user_id` / `tenant_id` are denormalized for *scoping*, not identity.

**ADR promotion.** Worth promoting to ADR #11 in the next pass through `ARCHITECTURE.md` §12 — the rationale matches ADR #7 exactly and the policy now applies consistently to the entire routine subtree.

## Deploy order

Per `ARCHITECTURE.md` §15.1: apply migration 008 to the live DB first, then deploy the chat-handler / MCP / client changes. Without 008, the new inserts fail on NOT NULL.
