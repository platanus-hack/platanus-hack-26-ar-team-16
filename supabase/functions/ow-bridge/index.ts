// @ts-nocheck — Deno runtime
// Public edge function: POST /functions/v1/ow-bridge
//
// Open Wearables bridge per docs/ARCHITECTURE.md §14.
// Replaces direct client → OW admin calls (src/services/openWearables.ts)
// which previously shipped admin credentials in the JS bundle.
//
// Auth: Supabase JWT only (consumer-app path). The embedded module
// path will need an extension once api-session mints a session JWT
// for non-chat resources — out of scope here.
//
// Action dispatch (body.action):
//   - 'connect'  : admin-auth on OW + find-or-create OW user keyed by
//                  Gohan email, persist mapping in `wearables_links`.
//   - 'sync'     : trigger OW sync for the linked external_id.
//   - 'activity' : fetch activity summary for a date (defaults today).
//   - 'sleep'    : fetch sleep summary for a date.
//   - 'workouts' : fetch workouts for a date.
//
// The OW admin credentials live in edge-function env (OW_ADMIN_USERNAME,
// OW_ADMIN_PASSWORD, OW_HOST). They never leave the function.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const OW_HOST = Deno.env.get('OW_HOST') ?? '';
const OW_ADMIN_USERNAME = Deno.env.get('OW_ADMIN_USERNAME') ?? '';
const OW_ADMIN_PASSWORD = Deno.env.get('OW_ADMIN_PASSWORD') ?? '';
const OW_API_KEY = Deno.env.get('OW_API_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, apikey, x-requested-with, x-client-info',
  'Access-Control-Max-Age': '86400',
};

interface AuthCtx {
  userId: string;
  tenantId: string;
  email: string | null;
  displayName: string | null;
}

function jsonError(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function verifySupabaseJwt(req: Request): Promise<AuthCtx | null> {
  const auth = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  const userId = data.user.id;
  const email = data.user.email ?? null;
  const displayName = (data.user.user_metadata?.first_name ?? null) as string | null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle();
  if (!profile?.tenant_id) return null;
  return { userId, tenantId: profile.tenant_id, email, displayName };
}

// ─── Open Wearables admin client ───────────────────────────────

let cachedAdminToken: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string> {
  // Short-lived cache (5 min) so we don't admin-login on every call.
  if (cachedAdminToken && cachedAdminToken.expiresAt > Date.now()) {
    return cachedAdminToken.token;
  }
  const res = await fetch(`${OW_HOST}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(OW_ADMIN_USERNAME)}&password=${encodeURIComponent(OW_ADMIN_PASSWORD)}`,
  });
  if (!res.ok) throw new Error(`OW admin login failed: ${res.status}`);
  const data = await res.json();
  cachedAdminToken = { token: data.access_token, expiresAt: Date.now() + 5 * 60 * 1000 };
  return data.access_token;
}

async function findOrCreateOwUser(adminToken: string, email: string, name: string): Promise<string> {
  const listRes = await fetch(`${OW_HOST}/api/v1/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!listRes.ok) throw new Error(`OW list users failed: ${listRes.status}`);
  const data = await listRes.json();
  const users = data.items ?? data;
  const existing = users.find((u: { email: string }) => u.email === email);
  if (existing) return existing.id;

  const createRes = await fetch(`${OW_HOST}/api/v1/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, first_name: name }),
  });
  if (!createRes.ok) throw new Error(`OW create user failed: ${createRes.status}`);
  const created = await createRes.json();
  return created.id;
}

async function getLinkedExternalId(ctx: AuthCtx): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('wearables_links')
    .select('external_id')
    .eq('user_id', ctx.userId)
    .eq('provider', 'open_wearables')
    .maybeSingle();
  return data?.external_id ?? null;
}

function todayRange(): { start_date: string; end_date: string } {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return { start_date: today, end_date: tomorrow };
}

function rangeAround(date?: string): { start_date: string; end_date: string } {
  if (!date) return todayRange();
  const start = date;
  const end = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0];
  return { start_date: start, end_date: end };
}

// ─── Action handlers ───────────────────────────────────────────

async function handleConnect(ctx: AuthCtx): Promise<Response> {
  if (!ctx.email) return jsonError('Profile has no email; cannot link OW user', 400);

  const adminToken = await getAdminToken();
  const owUserId = await findOrCreateOwUser(
    adminToken,
    ctx.email,
    ctx.displayName ?? ctx.email.split('@')[0],
  );

  const { error } = await supabaseAdmin
    .from('wearables_links')
    .upsert(
      {
        user_id: ctx.userId,
        tenant_id: ctx.tenantId,
        provider: 'open_wearables',
        external_id: owUserId,
      },
      { onConflict: 'user_id' },
    );

  if (error) return jsonError(`Failed to persist link: ${error.message}`, 500);
  return jsonOk({ connected: true });
}

async function handleSync(ctx: AuthCtx): Promise<Response> {
  const externalId = await getLinkedExternalId(ctx);
  if (!externalId) return jsonError('Not connected', 409);

  const res = await fetch(`${OW_HOST}/api/v1/sdk/users/${externalId}/sync`, {
    method: 'POST',
    headers: {
      'X-Open-Wearables-API-Key': OW_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) return jsonError(`OW sync failed: ${res.status}`, 502);
  return jsonOk({ synced: true });
}

async function fetchSummary(
  ctx: AuthCtx,
  endpoint: 'activity' | 'sleep',
  date?: string,
): Promise<Response> {
  const externalId = await getLinkedExternalId(ctx);
  if (!externalId) return jsonOk({ data: null });

  const adminToken = await getAdminToken();
  const range =
    endpoint === 'sleep' && date
      ? {
          start_date: new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0],
          end_date: date,
        }
      : rangeAround(date);

  const url = `${OW_HOST}/api/v1/users/${externalId}/summaries/${endpoint}?start_date=${range.start_date}&end_date=${range.end_date}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (!res.ok) return jsonOk({ data: null });
  const body = await res.json();
  return jsonOk({ data: body.data?.[0] ?? null });
}

async function fetchWorkouts(ctx: AuthCtx, date?: string): Promise<Response> {
  const externalId = await getLinkedExternalId(ctx);
  if (!externalId) return jsonOk({ data: [] });

  const adminToken = await getAdminToken();
  const range = rangeAround(date);
  const url = `${OW_HOST}/api/v1/users/${externalId}/events/workouts?start_date=${range.start_date}&end_date=${range.end_date}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${adminToken}` } });
  if (!res.ok) return jsonOk({ data: [] });
  const body = await res.json();
  return jsonOk({ data: body.data ?? [] });
}

// ─── Entry ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  if (!OW_HOST || !OW_ADMIN_USERNAME || !OW_ADMIN_PASSWORD) {
    return jsonError('OW not configured on this deployment', 503);
  }

  try {
    const ctx = await verifySupabaseJwt(req);
    if (!ctx) return jsonError('Missing or invalid Authorization', 401);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    switch (action) {
      case 'connect':
        return await handleConnect(ctx);
      case 'sync':
        return await handleSync(ctx);
      case 'activity':
        return await fetchSummary(ctx, 'activity', body?.date);
      case 'sleep':
        return await fetchSummary(ctx, 'sleep', body?.date);
      case 'workouts':
        return await fetchWorkouts(ctx, body?.date);
      default:
        return jsonError(`Unknown action: ${action}`, 400);
    }
  } catch (err: any) {
    return jsonError(err?.message ?? 'Internal error', 500);
  }
});
