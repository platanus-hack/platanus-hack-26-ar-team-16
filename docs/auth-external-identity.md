# Auth & External Identity — Working With Client Apps' Auth Without Duplicating User Data

## Original question

> Regarding auth — many times we will need to work with the client apps' auth, possibly duplicating user data.

---

You're right, and this is the standard B2B integration headache. The good news: the answer is **don't try to own auth at all for embedded customers.** Make Gohan accept the gym's identity claims and stop there. Here's the model:

## The pattern: external IDs + signed handoff, no password sync

Your `profiles` table grows two columns:

```sql
ALTER TABLE profiles
  ADD COLUMN external_id   text,           -- the gym's user ID, opaque to us
  ADD COLUMN external_idp  text,           -- "smartfit", "megatlon", etc.
  ADD UNIQUE (tenant_id, external_id);
```

Now there is no Gohan password for embedded users. The Gohan `user_id` is just an internal handle keyed off the gym's ID. No duplicate credentials, no "reset password" flow, no email collisions across tenants. Two members at two different gyms can even share an email — they're different rows because `(tenant_id, external_id)` is the real identity.

## Three handoff modes, pick per customer

**1. Backend-to-backend JWT (the default — recommended)**

Gym's backend already authenticated their user. They sign a short-lived JWT with a shared secret you gave them:

```json
{
  "sub": "smartfit_user_8821",      // their external_id
  "tenant": "smartfit",
  "name": "Ana López",
  "exp": 1731024000
}
```

Their mobile app sends that JWT to your public API. Your edge function verifies the signature with the tenant's secret, upserts the `profiles` row by `(tenant_id, external_id)`, returns a Gohan session token. The user never types a password into anything Gohan-owned. This is exactly how Intercom Identity Verification, Stream Chat, and Sendbird do it — battle-tested pattern.

Implementation cost: ~half a day. One `verify_tenant_jwt` helper, one upsert, done.

**2. OIDC / SAML for enterprise gyms**

Big chains (Megatlon, SmartFit corporate) will have Okta or Azure AD. Add OIDC support to the same upsert flow — the `sub` claim from their IdP becomes `external_id`, the `iss` claim resolves to a tenant. Same database shape, different verification path. Don't build this until a customer asks; it's 2–3 days when you do.

**3. Pure API-key + external_id (server-to-server only, no end-user auth)**

For the MCP server / backend integration use case where the gym's *server* is the caller and there is no user session at all, you skip JWTs entirely. The gym sends `{api_key, external_id}` and you trust it because the API key is already scoped to the tenant. Already covered in the previous design.

## What this kills

- **No duplicate user data.** You don't store passwords, password hashes, MFA secrets, recovery emails. The only PII you hold is whatever the gym chooses to send (display name, fitness profile). When a user deletes their account at SmartFit, SmartFit calls `DELETE /api/users/{external_id}` and you cascade-delete the profile + routines. Clean GDPR story.
- **No "which auth system is source of truth" debate.** Theirs is, always. You're a downstream consumer of identity, never the issuer.
- **No password reset surface.** Their problem, not yours. Fewer support tickets, fewer security audits.

## What it costs

- **Tenant secret management.** Each gym gets a signing secret (separate from API key, ideally). Rotation matters — support `kid` (key ID) in the JWT header so you can rotate without downtime. ~1 day to do properly.
- **Profile drift.** If the gym renames a user, you don't know until they next chat. Solution: accept name/email claims from the JWT on every request and update opportunistically. The JWT is fresh, so the data is fresh. No background sync job needed.
- **Realtime is slightly trickier.** Your existing `useRealtimeRoutine.ts` uses Supabase Realtime, which expects a Supabase auth JWT. For external-auth users you have two options: (a) mint a Supabase JWT scoped to the user's row using your service role + RLS, return it alongside the Gohan session token, or (b) proxy Realtime through your own SSE endpoint. Option (a) is faster (~1 day), option (b) is cleaner long-term. Start with (a).

## The standalone consumer app keeps working

Crucially: this doesn't break the consumer app path. For standalone Gohan, *you* are the identity provider — `external_idp = 'gohan'`, `external_id = supabase_auth_user_id`. Same `profiles` table, same edge functions. The consumer app just happens to be the one tenant where Gohan owns the auth too. No code fork.

## Concrete edge-function sketch

```ts
// POST /api/session
// Headers: Authorization: Bearer <gym_jwt>, X-Tenant-Slug: smartfit
const claims = await verifyTenantJWT(req, tenantSecret);  // throws on bad sig/exp

const { data: profile } = await supabaseAdmin
  .from('profiles')
  .upsert({
    tenant_id: tenant.id,
    external_id: claims.sub,
    external_idp: tenant.slug,
    display_name: claims.name,
  }, { onConflict: 'tenant_id,external_id' })
  .select('id')
  .single();

const gohanSessionJWT = signGohanJWT({ user_id: profile.id, tenant_id: tenant.id, exp: 15min });
return { session: gohanSessionJWT };
```

That's the entire bridge. ~30 lines including error handling. Their RN app calls this once per session (or when the gym JWT expires), caches the Gohan session token, then every chat call uses it.

## Bottom line

You don't need to dedupe user data because you should never have created the duplicate in the first place. Treat gym identity as a foreign key, not as something to mirror. The `external_id` column + signed JWT handoff is the entire pattern, and it's ~1.5 days of work on top of the API-key refactor we already scoped — not a separate project.
