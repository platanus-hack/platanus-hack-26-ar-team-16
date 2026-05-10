// @ts-nocheck — Deno runtime, not Node.js
// Supabase Edge Function: AI Chat with Claude API
// Legacy entry point — auth is the Supabase JWT (standalone consumer app).
//
// Owner: @Juampiman (DEV 4 — AI logic)
// Deployed by: @DanteDia (DEV 3 — infrastructure)
//
// SECURITY (docs/ARCHITECTURE.md §11): user_id and tenant_id are derived
// from the verified Supabase JWT — NEVER from the request body. The body's
// `userProfile` is still accepted but only its non-id fields are used to
// build the system prompt.
//
// Streaming + tool_use behavior is unchanged — see ../_shared/chat-handler.ts
// for the actual logic. SSE event contract is documented in CLAUDE.md.

import {
  callChat,
  getTenantIdForUser,
  streamChat,
  supabaseAdmin,
} from '../_shared/chat-handler.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, apikey, x-no-stream, cache-control, x-requested-with, x-client-info',
  'Access-Control-Max-Age': '86400',
};

async function verifySupabaseJwt(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const userId = await verifySupabaseJwt(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const tenantId = await getTenantIdForUser(userId);
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'No profile found for this user' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const { userMessage, conversationHistory, userProfile } = await req.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userMessage required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Body's userProfile is allowed only for non-id fields (system-prompt
    // building). The handler never reads userProfile.id.
    const safeProfile = userProfile ? { ...userProfile, id: undefined } : undefined;

    const ctx = { userId, tenantId };
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
