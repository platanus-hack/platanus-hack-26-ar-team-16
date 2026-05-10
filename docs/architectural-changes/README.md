# Architectural Changes Log

This folder holds dated records of architectural changes to the project. Each file documents one decision: the context, the decision, the consequences, and any deploy steps.

> Per `CLAUDE.md`: "if you are building in this project and find that we need to make changes in the architecture and thus the architecture document, and these are for better than what's currently outlined, then make a MD file in a folder inside docs called architectural changes that documents the change and the decision and has a timestamp in the md file name. Sort of like migrations for the architecture document."

## Conventions

- File name format: `YYYY-MM-DD-short-slug.md`. If multiple changes land the same day, suffix with `-1`, `-2`, etc.
- Each file should answer: **What changed? Why? What does this break or enable? What deploy steps are required?**
- After landing the change, update `docs/ARCHITECTURE.md` to reflect the new state. The architecture doc describes the *current* state; this folder describes *how it got there*.
- Closed tech-debt items get a one-line entry in `docs/tech-debt.md` "Resolved" section pointing back to the relevant change file here.

## Index

| Date | Change | Touches |
|---|---|---|
| 2026-05-10 | [Denormalize `(user_id, tenant_id)` onto routine_days + routine_exercises](2026-05-10-denormalize-child-tables.md) | migration 008, ADR #7 mirror, realtime, ownership helpers |
| 2026-05-10 | [`ow-bridge` landed; client-side admin path removed](2026-05-10-ow-bridge-landed.md) | migration 009, `supabase/functions/ow-bridge/`, §14, TD-1 closed |
| 2026-05-10 | [Build-time tenant policy formalized](2026-05-10-build-time-tenant-policy.md) | §6, §10.3, CLAUDE.md key patterns |
