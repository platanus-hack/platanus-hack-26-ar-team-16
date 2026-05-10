// @ts-nocheck — Deno runtime
// Public edge function: POST /functions/v1/api-session
//
// Embedded-module entry point per docs/ARCHITECTURE.md §10.1 (mode 1).
// Accepts a gym-issued JWT + tenant slug, verifies it against the tenant's
// active signing secrets, upserts the corresponding profiles row by
// (tenant_id, external_id=claims.sub), and mints a short-lived Gohan
// session JWT. The host app uses that session token to call /api/chat.
//
// Owner: @DanteDia (DEV 3 — infrastructure)

import { supabaseAdmin } from '../_shared/chat-handler.ts';
import { decodeJwtParts, signHs256, verifyHs256 } from '../_shared/jwt.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-Slug, apikey',
};

const SESSION_TTL_SECONDS = 15 * 60; // 15 minutes

function badRequest(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return badRequest('Method not allowed', 405);
  }

  try {
    const auth = req.headers.get('Authorization') ?? req.headers.get('authorization');
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      return badRequest('Missing Authorization: Bearer <gym_jwt>', 401);
    }
    const gymJwt = auth.slice(7).trim();
    if (!gymJwt) return badRequest('Empty bearer token', 401);

    const tenantSlug = req.headers.get('X-Tenant-Slug') ?? req.headers.get('x-tenant-slug');
    if (!tenantSlug) return badRequest('Missing X-Tenant-Slug header', 400);

    // 1. Resolve tenant
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from('tenants')
      .select('id, slug')
      .eq('slug', tenantSlug)
      .single();

    if (tenantErr || !tenant) return badRequest('Unknown tenant', 404);

    // 2. Pick a signing secret. Prefer match on `kid`; otherwise most recent
    //    active secret. Multiple active secrets enable rotation without
    //    downtime (per §10.5).
    const parsed = decodeJwtParts(gymJwt);
    if (!parsed) return badRequest('Malformed JWT', 401);

    const { data: secrets, error: secretsErr } = await supabaseAdmin
      .from('tenant_signing_secrets')
      .select('kid, secret, created_at')
      .eq('tenant_id', tenant.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (secretsErr || !secrets || secrets.length === 0) {
      return badRequest('No active signing secrets configured for tenant', 500);
    }

    const candidates = parsed.header.kid
      ? secrets.filter((s) => s.kid === parsed.header.kid)
      : secrets;

    let claims = null;
    for (const s of candidates) {
      const verified = await verifyHs256(gymJwt, s.secret);
      if (verified) {
        claims = verified;
        break;
      }
    }
    if (!claims) return badRequest('JWT signature verification failed', 401);

    const externalId = typeof claims.sub === 'string' ? claims.sub : null;
    if (!externalId) return badRequest('JWT missing sub claim', 401);

    // 3. Upsert the profile by (tenant_id, external_id)
    const displayName =
      (typeof claims['name'] === 'string' && (claims['name'] as string)) ||
      (typeof claims['display_name'] === 'string' && (claims['display_name'] as string)) ||
      '';
    const email = typeof claims['email'] === 'string' ? (claims['email'] as string) : null;

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('external_id', externalId)
      .maybeSingle();

    let userId: string;
    if (existing?.id) {
      userId = existing.id;
      const updates: Record<string, unknown> = { last_active_at: new Date().toISOString() };
      if (displayName) updates.display_name = displayName;
      // email is not currently a profiles column — only update if/when added.
      await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
    } else {
      // Create a new profiles row. profiles.id has a FK to auth.users — for
      // gym-origin users we mint a UUID and rely on the FK being relaxed in a
      // later migration (TODO Phase 2: drop the FK to auth.users so external
      // users can have profiles without a Supabase auth row).
      const newId = crypto.randomUUID();
      const { error: insertErr } = await supabaseAdmin.from('profiles').insert({
        id: newId,
        tenant_id: tenant.id,
        external_id: externalId,
        external_idp: 'gym',
        display_name: displayName,
        last_active_at: new Date().toISOString(),
      });
      if (insertErr) {
        // Most likely the FK to auth.users still exists. Surface a clear
        // error so the team can apply the FK-relaxation migration.
        return badRequest(
          `Failed to create profile: ${insertErr.message}. ` +
            'Phase 2 TODO: relax profiles.id FK to auth.users for external-IdP users.',
          500
        );
      }
      userId = newId;
    }

    // 4. Mint Gohan session JWT
    const gohanSecret = Deno.env.get('GOHAN_SESSION_SECRET');
    if (!gohanSecret) {
      return badRequest('Server misconfigured: GOHAN_SESSION_SECRET not set', 500);
    }
    const now = Math.floor(Date.now() / 1000);
    const sessionToken = await signHs256(
      {
        sub: userId,
        user_id: userId,
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        external_id: externalId,
        iat: now,
        exp: now + SESSION_TTL_SECONDS,
        iss: 'gohan-ai',
        aud: 'gohan-api',
      },
      gohanSecret
    );

    // 5. Realtime JWT — TODO (Phase 2 / §10.4):
    //    Supabase doesn't expose a documented service-role API to mint a
    //    user-scoped access token. The clean path is one of:
    //      (a) sign a Supabase-compatible JWT using the project's JWT secret
    //          (Deno.env.get('SUPABASE_JWT_SECRET')) with role='authenticated'
    //          and sub=auth_user_id. This requires the gym-origin profile to
    //          be linked to an auth.users row (FK relaxation work above).
    //      (b) proxy realtime through a Gohan-hosted websocket gateway.
    //    For now we return only session_token. Realtime subscription from
    //    the embedded module is a Phase-2 deliverable.
    const realtimeJwt: string | undefined = undefined;

    return new Response(
      JSON.stringify({
        session_token: sessionToken,
        realtime_jwt: realtimeJwt,
        expires_in: SESSION_TTL_SECONDS,
        user_id: userId,
        tenant_id: tenant.id,
      }),
      { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
