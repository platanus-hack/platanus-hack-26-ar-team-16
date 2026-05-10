// End-to-end integration test for the MCP HTTP transport + API-key auth.
//
// Spins up the real `runHttp()` server on an ephemeral port, swaps in a
// fake supabase client at the boundary via `__setSupabaseForTest`, and
// drives a real MCP `initialize` + `tools/call` flow over HTTP using the
// SDK's StreamableHTTPClientTransport.
//
// What's mocked: ONLY the supabase client. The HTTP server, MCP server,
// transport, JSON-RPC framing, request scoping (AsyncLocalStorage), and
// API-key auth path all run for real.
//
// Run: `npm test` from mcp-server/.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// We import compiled code from dist/ so the test doesn't depend on tsc
// being able to build the source — the tsc perf workaround for index.ts
// is owned by another agent (out of scope per the phase brief).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const indexModule = require('../dist/index.js') as {
  runHttp: (opts?: { port?: number }) => Promise<{ close: () => Promise<void>; port: number }>;
  __setSupabaseForTest: (client: unknown) => void;
};

const { runHttp, __setSupabaseForTest } = indexModule;

// -------------------------------------------------------------------------
// Tiny mock for the supabase-js builder API surface that index.ts uses.
// We only model the methods exercised by:
//   - authenticateApiKey:  from('tenant_api_keys').select(...).eq(...).is(...).maybeSingle()
//   - get_user_profile:    from('profiles').select('*').eq('id', X).eq('tenant_id', Y).single()
//                          (eq is added by scopeTenant)
//   - last_used_at update: from('tenant_api_keys').update({...}).eq('id', X)  (fire-and-forget)
// -------------------------------------------------------------------------

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const VALID_KEY = 'gk_live_demo_test123';
const VALID_HASH = createHash('sha256').update(VALID_KEY, 'utf8').digest('hex');

const PROFILE_ROW = {
  id: USER_ID,
  tenant_id: TENANT_ID,
  display_name: 'Demo User',
  fitness_level: 'intermediate',
  goals: 'hypertrophy',
};

interface PendingFilter {
  table: string;
  filters: Record<string, unknown>;
  isNull: string[];
}

function makeBuilder(table: string) {
  const state: PendingFilter = { table, filters: {}, isNull: [] };

  const resolve = async () => {
    if (table === 'tenant_api_keys') {
      if (state.filters['key_hash'] === VALID_HASH && state.isNull.includes('revoked_at')) {
        return { data: { id: 'key-1', tenant_id: TENANT_ID, revoked_at: null }, error: null };
      }
      return { data: null, error: null };
    }
    if (table === 'profiles') {
      if (state.filters['id'] === USER_ID && state.filters['tenant_id'] === TENANT_ID) {
        // Two callers: resolveUserId selects only 'id'; get_user_profile selects '*'.
        return { data: PROFILE_ROW, error: null };
      }
      return { data: null, error: null };
    }
    return { data: null, error: null };
  };

  const builder: any = {
    select: (_cols?: string) => builder,
    update: (_vals: unknown) => builder,
    insert: (_vals: unknown) => builder,
    delete: () => builder,
    eq: (col: string, val: unknown) => {
      state.filters[col] = val;
      return builder;
    },
    is: (col: string, val: unknown) => {
      if (val === null) state.isNull.push(col);
      return builder;
    },
    order: () => builder,
    limit: () => builder,
    maybeSingle: () => resolve(),
    single: () => resolve(),
    // Allow `await builder` to resolve directly (used by fire-and-forget update).
    then: (onFulfilled: any, onRejected: any) => resolve().then(onFulfilled, onRejected),
  };
  return builder;
}

const fakeSupabase = {
  from: (table: string) => makeBuilder(table),
};

// -------------------------------------------------------------------------
// Boot the real HTTP server with the fake supabase wired in.
// -------------------------------------------------------------------------

let baseUrl: string;
let close: () => Promise<void>;

test('boot mcp http server with fake supabase', async () => {
  __setSupabaseForTest(fakeSupabase);
  const handle = await runHttp({ port: 0 }); // ephemeral
  baseUrl = `http://127.0.0.1:${handle.port}/mcp`;
  close = handle.close;
  assert.ok(handle.port > 0);
});

// -------------------------------------------------------------------------
// Helper: drive the StreamableHTTP client against the running server.
// -------------------------------------------------------------------------

async function runMcpRoundTrip(
  apiKey: string | null
): Promise<{ status: 'ok'; result: unknown } | { status: 'auth-failed'; httpStatus: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

  const requestInit: RequestInit = {};
  if (apiKey) {
    requestInit.headers = { Authorization: `Bearer ${apiKey}` };
  }

  const transport = new StreamableHTTPClientTransport(new URL(baseUrl), { requestInit });
  const client = new Client({ name: 'test-client', version: '0.0.1' }, { capabilities: {} });

  try {
    await client.connect(transport);
  } catch (e: any) {
    // The streamable HTTP client attaches the HTTP status code as `.code`
    // on the thrown Error (e.g. 401 for our auth failures).
    if (typeof e?.code === 'number') {
      return { status: 'auth-failed', httpStatus: e.code };
    }
    const msg = String(e?.message ?? e);
    const m = /HTTP (\d{3})/.exec(msg);
    if (m) return { status: 'auth-failed', httpStatus: Number(m[1]) };
    throw e;
  }

  const result = await client.callTool({
    name: 'get_user_profile',
    arguments: { user_id: USER_ID },
  });
  await client.close().catch(() => {});
  return { status: 'ok', result };
}

test('401 without api key', async () => {
  const r = await runMcpRoundTrip(null);
  assert.equal(r.status, 'auth-failed');
  if (r.status === 'auth-failed') assert.equal(r.httpStatus, 401);
});

test('401 with bad api key', async () => {
  const r = await runMcpRoundTrip('gk_live_demo_does_not_exist');
  assert.equal(r.status, 'auth-failed');
  if (r.status === 'auth-failed') assert.equal(r.httpStatus, 401);
});

test('200 with good api key returns user profile', async () => {
  const r = await runMcpRoundTrip(VALID_KEY);
  assert.equal(r.status, 'ok');
  if (r.status !== 'ok') return;

  // MCP tool result is { content: [{ type: 'text', text: '<json string>' }] }
  const result = r.result as { content: Array<{ type: string; text: string }> };
  assert.ok(Array.isArray(result.content));
  assert.equal(result.content[0]?.type, 'text');
  const payload = JSON.parse(result.content[0].text);
  assert.equal(payload.id, USER_ID);
  assert.equal(payload.tenant_id, TENANT_ID);
  assert.equal(payload.display_name, 'Demo User');
});

test('teardown', async () => {
  await close();
});
