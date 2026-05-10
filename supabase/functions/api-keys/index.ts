// @ts-nocheck — Deno runtime
// Admin endpoint: tenant API key management.
//
// Three actions are dispatched by `?action=issue|list|revoke` query param,
// which is the simplest deployment shape (one edge function, one URL).
//
//   POST /functions/v1/api-keys?action=issue
//     body: { tenant_slug: string, name: string }
//     returns: { api_key, key_id, name, created_at }   ← plaintext shown ONCE
//
//   POST /functions/v1/api-keys?action=list
//     body: { tenant_slug: string }
//     returns: { keys: Array<{ id, name, kid, created_at, last_used_at, revoked_at }> }
//     (NEVER returns plaintext or hashes)
//
//   POST /functions/v1/api-keys?action=revoke
//     body: { key_id: string }
//     returns: { id, revoked_at }
//
// Auth: gated by a static `GOHAN_ADMIN_TOKEN` env var compared via
// constant-time check. Sent as `Authorization: Bearer <token>` (or
// `X-Admin-Token`). This is intentional placeholder auth — the dashboard
// will replace this with a proper admin-user auth flow (Supabase Auth +
// admin role) once the operator UI lands. See ARCHITECTURE.md §10.6.
//
// Owner: @DanteDia (DEV 3 — infrastructure)

import { supabaseAdmin } from '../_shared/chat-handler.ts';
import { sha256Hex } from '../_shared/jwt.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Admin-Token, apikey',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

// Constant-time string comparison. Bails on length mismatch (which leaks
// length, but the admin token has a fixed length so this is fine).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function authorize(req: Request): boolean {
  const expected = Deno.env.get('GOHAN_ADMIN_TOKEN');
  if (!expected) return false; // refuse to operate without a configured token

  const auth = req.headers.get('Authorization') ?? req.headers.get('authorization');
  let provided: string | null = null;
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    provided = auth.slice(7).trim();
  } else {
    provided = req.headers.get('X-Admin-Token') ?? req.headers.get('x-admin-token');
  }
  if (!provided) return false;
  return timingSafeEqual(provided, expected);
}

// Generate a random URL-safe token. Base64url over 24 random bytes ≈ 32 chars.
function randomToken(byteLen = 24): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function findTenant(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data;
}

async function handleIssue(body: any) {
  const tenantSlug = typeof body?.tenant_slug === 'string' ? body.tenant_slug : null;
  const name = typeof body?.name === 'string' ? body.name : '';
  if (!tenantSlug) return err('tenant_slug is required');
  if (!name) return err('name is required');

  const tenant = await findTenant(tenantSlug);
  if (!tenant) return err('Unknown tenant', 404);

  const apiKey = `gk_live_${tenant.slug}_${randomToken(24)}`;
  const keyHash = await sha256Hex(apiKey);

  const { data, error } = await supabaseAdmin
    .from('tenant_api_keys')
    .insert({
      tenant_id: tenant.id,
      name,
      key_hash: keyHash,
    })
    .select('id, name, created_at')
    .single();

  if (error || !data) return err(`Failed to insert key: ${error?.message ?? 'unknown'}`, 500);

  // Plaintext is returned ONCE — the row only stores the SHA-256 hash.
  return json({
    api_key: apiKey,
    key_id: data.id,
    name: data.name,
    created_at: data.created_at,
  });
}

async function handleList(body: any) {
  const tenantSlug = typeof body?.tenant_slug === 'string' ? body.tenant_slug : null;
  if (!tenantSlug) return err('tenant_slug is required');

  const tenant = await findTenant(tenantSlug);
  if (!tenant) return err('Unknown tenant', 404);

  const { data, error } = await supabaseAdmin
    .from('tenant_api_keys')
    .select('id, name, kid, created_at, last_used_at, revoked_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  if (error) return err(error.message, 500);
  return json({ keys: data ?? [] });
}

async function handleRevoke(body: any) {
  const keyId = typeof body?.key_id === 'string' ? body.key_id : null;
  if (!keyId) return err('key_id is required');

  const { data, error } = await supabaseAdmin
    .from('tenant_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .select('id, revoked_at')
    .single();

  if (error || !data) return err(`Failed to revoke: ${error?.message ?? 'not found'}`, 404);
  return json({ id: data.id, revoked_at: data.revoked_at });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') return err('Method not allowed', 405);

  if (!authorize(req)) return err('Unauthorized', 401);

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  if (!action) return err('Missing ?action=issue|list|revoke');

  let body: any = {};
  try {
    const txt = await req.text();
    body = txt ? JSON.parse(txt) : {};
  } catch {
    return err('Invalid JSON body');
  }

  try {
    if (action === 'issue') return await handleIssue(body);
    if (action === 'list') return await handleList(body);
    if (action === 'revoke') return await handleRevoke(body);
    return err(`Unknown action: ${action}`);
  } catch (e: any) {
    return err(e?.message ?? 'Internal error', 500);
  }
});
