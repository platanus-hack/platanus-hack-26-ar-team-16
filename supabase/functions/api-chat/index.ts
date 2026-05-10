// @ts-nocheck — Deno runtime
// Public edge function: POST /functions/v1/api-chat
//
// Public chat entry point per docs/ARCHITECTURE.md §5.4. Accepts EITHER:
//   - Authorization: Bearer gk_live_*           (server-to-server API key)
//   - Authorization: Bearer <gohan_session_jwt> (issued by /api-session)
//
// Resolves (user_id, tenant_id) from whichever credential is provided, then
// delegates to the shared chat-handler. Same SSE event contract as ai-chat.
//
// Owner: @DanteDia (DEV 3 — infrastructure)

import { callChat, streamChat, supabaseAdmin } from '../_shared/chat-handler.ts';
import { sha256Hex, verifyHs256 } from '../_shared/jwt.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-no-stream, x-external-id',
};

interface ResolvedAuth {
  userId: string;
  tenantId: string;
}

function jsonError(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function resolveApiKey(token: string, externalId: string | null): Promise<ResolvedAuth | null> {
  const keyHash = await sha256Hex(token);
  const { data: row, error } = await supabaseAdmin
    .from('tenant_api_keys')
    .select('id, tenant_id')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !row) return null;

  // Update last_used_at (best-effort, fire-and-forget pattern is fine but
  // we await for predictable test behavior).
  await supabaseAdmin
    .from('tenant_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id);

  // API-key callers must pass X-External-Id (the gym's user ID) so we can
  // resolve which profile in the tenant is being acted on. Per §10.1 mode 3.
  if (!externalId) return null;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('tenant_id', row.tenant_id)
    .eq('external_id', externalId)
    .maybeSingle();

  if (!profile) return null;
  return { userId: profile.id, tenantId: row.tenant_id };
}

async function resolveSessionJwt(token: string): Promise<ResolvedAuth | null> {
  const secret = Deno.env.get('GOHAN_SESSION_SECRET');
  if (!secret) return null;
  const claims = await verifyHs256(token, secret);
  if (!claims) return null;
  if (claims.iss !== 'gohan-ai') return null;
  const userId = typeof claims.user_id === 'string' ? (claims.user_id as string) : null;
  const tenantId = typeof claims.tenant_id === 'string' ? (claims.tenant_id as string) : null;
  if (!userId || !tenantId) return null;
  return { userId, tenantId };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  try {
    const auth = req.headers.get('Authorization') ?? req.headers.get('authorization');
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      return jsonError('Missing Authorization: Bearer <token>', 401);
    }
    const token = auth.slice(7).trim();
    if (!token) return jsonError('Empty bearer token', 401);

    let resolved: ResolvedAuth | null;
    if (token.startsWith('gk_live_')) {
      const externalId = req.headers.get('X-External-Id') ?? req.headers.get('x-external-id');
      resolved = await resolveApiKey(token, externalId);
      if (!resolved) {
        return jsonError(
          'Invalid API key, missing X-External-Id, or unknown user for that tenant',
          401
        );
      }
    } else {
      resolved = await resolveSessionJwt(token);
      if (!resolved) return jsonError('Invalid or expired session token', 401);
    }

    const { userMessage, conversationHistory, userProfile } = await req.json();
    if (!userMessage || typeof userMessage !== 'string') {
      return jsonError('userMessage required', 400);
    }
    const safeProfile = userProfile ? { ...userProfile, id: undefined } : undefined;

    const ctx = { userId: resolved.userId, tenantId: resolved.tenantId };
    const noStream = req.headers.get('x-no-stream') === 'true';

    if (noStream) {
      const response = await callChat({
        ctx,
        userMessage,
        conversationHistory,
        userProfile: safeProfile,
      });
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (chunk: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        };
        try {
          await streamChat(
            { ctx, userMessage, conversationHistory, userProfile: safeProfile },
            send
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err: any) {
          send({ type: 'error', content: err.message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
