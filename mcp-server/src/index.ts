// Gohan AI MCP Server
// ---------------------
// Per ARCHITECTURE.md §7.3 + §11, the MCP server is the *server-to-server*
// integration surface for gym operators that want to drive Gohan AI from
// their own backend (e.g. an admin dashboard, batch import job, or another
// LLM agent). It is multi-tenant: every request must carry a tenant API
// key (`Authorization: Bearer gk_live_*`) which we verify by SHA-256 hash
// against `tenant_api_keys`. The resolved `tenant_id` then scopes every
// downstream Postgres query so a key for tenant A cannot read tenant B's
// users / routines / etc.
//
// Transports:
//   - HTTP (default): Streamable HTTP transport from @modelcontextprotocol/sdk.
//     Listens on `PORT` (default 3000) at `/mcp`. Stateless mode — each
//     request authenticates independently via its `Authorization` header.
//   - stdio (--stdio flag): Legacy fallback for local dev tooling that pipes
//     JSON-RPC over stdin/stdout. Skips API-key auth (uses service role).
//
// User identity:
//   Tools that operate on a specific user accept either:
//     - `user_id` argument (Gohan internal UUID), OR
//     - the `X-External-Id` request header (the gym's own user id, resolved
//       to a Gohan profile via the matching `(tenant_id, external_id)` row).
//   When both are provided, `user_id` wins. The resolved user must belong
//   to the same tenant as the API key.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

// -------------------------------------------------------------------------
// Supabase client (service role — auth is done at the API-key layer above).
// -------------------------------------------------------------------------

let _supabase: any = null;

// Returns the supabase client typed as `any`. Without this, supabase-js's
// PostgrestQueryBuilder generics combine with nested `.select(\`...\`)` template
// strings across ~10 tool handlers and blow up tsc with TS2589 (excessively
// deep instantiation) — 20M+ type instantiations, ~5GB heap. Runtime is
// unaffected; we only lose query-shape typing inside this file.
function getSupabase(): any {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Test-only seam: inject a fake supabase client. The HTTP transport and
 * every tool handler in this file routes through `getSupabase()`, so this
 * lets the integration test substitute a mock at the boundary without
 * needing a live database connection.
 */
export function __setSupabaseForTest(client: unknown): void {
  _supabase = client;
}

// -------------------------------------------------------------------------
// Per-request context. We use AsyncLocalStorage so tool handlers can read
// the resolved tenant_id + external_id without threading them through
// every signature. Each HTTP request opens a fresh context; stdio mode
// runs in a single context with `tenantId = null` (service-role behavior).
// -------------------------------------------------------------------------

import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  tenantId: string | null; // null => stdio dev mode (no scoping)
  externalId: string | null;
}

const ctxStorage = new AsyncLocalStorage<RequestContext>();

function ctx(): RequestContext {
  return ctxStorage.getStore() ?? { tenantId: null, externalId: null };
}

/** Add `tenant_id = <ctx>` to a query when running under an API key.
 *  Typed as `any` to avoid the supabase-js builder's deep generic-instantiation
 *  blowing up TypeScript (TS2589). The runtime cast is safe — `.eq` is the
 *  same method on every PostgrestFilterBuilder. */
function scopeTenant(query: any): any {
  const c = ctx();
  if (c.tenantId) return query.eq('tenant_id', c.tenantId);
  return query;
}

/**
 * Resolve a target user from explicit `user_id` arg or the `X-External-Id`
 * header. Returns the canonical Gohan profile id, or an error message
 * suitable for echoing back as a tool result.
 */
async function resolveUserId(explicit?: string): Promise<{ id: string } | { error: string }> {
  const c = ctx();
  if (explicit) {
    if (!c.tenantId) return { id: explicit }; // stdio dev mode
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('id')
      .eq('id', explicit)
      .eq('tenant_id', c.tenantId)
      .maybeSingle();
    if (error) return { error: `Failed to resolve user_id: ${error.message}` };
    if (!data) return { error: 'user_id does not belong to this tenant' };
    return { id: data.id };
  }
  if (c.externalId && c.tenantId) {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('id')
      .eq('tenant_id', c.tenantId)
      .eq('external_id', c.externalId)
      .maybeSingle();
    if (error) return { error: `Failed to resolve external_id: ${error.message}` };
    if (!data) return { error: 'No profile matches X-External-Id for this tenant' };
    return { id: data.id };
  }
  return {
    error: 'Missing user identity — provide user_id arg or X-External-Id header',
  };
}

// -------------------------------------------------------------------------
// MCP server + tools.
//
// Factory: returns a *fresh* McpServer with all tools registered. The HTTP
// transport in stateless mode requires one server instance per request
// (the SDK throws "Already connected to a transport" if the same server
// is reconnected to a new transport), so we call this from every request
// handler. stdio mode calls it once at startup.
// -------------------------------------------------------------------------

const txt = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });

export function createMcpServer(): McpServer {
const server = new McpServer({
  name: 'gohan-ai',
  version: '1.0.0',
});

// Type-erased wrapper around `server.tool`. The MCP SDK's overloaded
// signature combined with zod schema inference per-handler produces a
// quadratic-feeling type-check (~20M instantiations, ~5GB heap) across
// 10 tools in this file. Schemas are still validated at runtime by the
// SDK; we only drop compile-time inference of handler arg shapes.
const tool = (
  name: string,
  description: string,
  schema: Record<string, unknown>,
  handler: (args: any) => any
): void => {
  (server as any).tool(name, description, schema, handler);
};

tool(
  'get_user_routine',
  'Get the active routine for a user, including all days and exercises. Provide user_id OR rely on X-External-Id header.',
  {
    user_id: z.string().optional().describe('UUID of the user (omit to use X-External-Id header)'),
  },
  async ({ user_id }) => {
    const u = await resolveUserId(user_id);
    if ('error' in u) return txt(`Error: ${u.error}`);

    let q = getSupabase()
      .from('routines')
      .select(`
        id, name, is_active, created_at, updated_at,
        routine_days (
          id, day_of_week, muscle_groups, label,
          routine_exercises (
            id, exercise_name, sets, reps, weight_kg,
            rest_seconds, order_index, notes, ai_reasoning, completed
          )
        )
      `)
      .eq('user_id', u.id)
      .eq('is_active', true);
    q = scopeTenant(q);
    const { data, error } = await q.single();

    if (error) return txt(`Error: ${error.message}`);
    return txt(JSON.stringify(data, null, 2));
  }
);

tool(
  'list_exercises_for_day',
  'List all exercises for a specific day of the week in the active routine',
  {
    user_id: z.string().optional().describe('UUID of the user (omit to use X-External-Id header)'),
    day_of_week: z.number().min(0).max(6).describe('0=Sunday, 1=Monday, ..., 6=Saturday'),
  },
  async ({ user_id, day_of_week }) => {
    const u = await resolveUserId(user_id);
    if ('error' in u) return txt(`Error: ${u.error}`);

    let rq = getSupabase()
      .from('routines')
      .select('id')
      .eq('user_id', u.id)
      .eq('is_active', true);
    rq = scopeTenant(rq);
    const { data: routine } = await rq.single();
    if (!routine) return txt('No active routine found');

    const { data, error } = await getSupabase()
      .from('routine_days')
      .select(`
        id, day_of_week, muscle_groups, label,
        routine_exercises (
          id, exercise_name, sets, reps, weight_kg,
          rest_seconds, order_index, notes, completed
        )
      `)
      .eq('routine_id', routine.id)
      .eq('day_of_week', day_of_week)
      .single();

    if (error) return txt(`Error: ${error.message}`);
    return txt(JSON.stringify(data, null, 2));
  }
);

/**
 * Verify that an exercise (by id) belongs to a routine owned by the current
 * tenant. We hop exercise → routine_day → routine and compare tenant_id.
 * Returns true on match, false otherwise. In stdio dev mode (no tenantId)
 * always returns true.
 */
async function exerciseBelongsToTenant(exerciseId: string): Promise<boolean> {
  const c = ctx();
  if (!c.tenantId) return true;
  // Post-migration 008, tenant_id is denormalized onto routine_exercises;
  // no JOIN through routines/routine_days needed.
  const { data } = await getSupabase()
    .from('routine_exercises')
    .select('tenant_id')
    .eq('id', exerciseId)
    .maybeSingle();
  return (data as { tenant_id?: string } | null)?.tenant_id === c.tenantId;
}

async function routineDayBelongsToTenant(routineDayId: string): Promise<boolean> {
  const c = ctx();
  if (!c.tenantId) return true;
  // Post-migration 008, tenant_id is denormalized onto routine_days.
  const { data } = await getSupabase()
    .from('routine_days')
    .select('tenant_id')
    .eq('id', routineDayId)
    .maybeSingle();
  return (data as { tenant_id?: string } | null)?.tenant_id === c.tenantId;
}

tool(
  'update_exercise',
  'Update an exercise in the routine (sets, reps, weight, notes)',
  {
    exercise_id: z.string().describe('UUID of the exercise'),
    sets: z.number().optional().describe('Number of sets'),
    reps: z.number().optional().describe('Number of reps'),
    weight_kg: z.number().nullable().optional().describe('Weight in kg'),
    notes: z.string().nullable().optional().describe('Notes or form cues'),
  },
  async ({ exercise_id, ...updates }) => {
    if (!(await exerciseBelongsToTenant(exercise_id))) {
      return txt('Error: exercise not found for this tenant');
    }
    const cleanUpdates: Record<string, unknown> = {};
    if (updates.sets !== undefined) cleanUpdates.sets = updates.sets;
    if (updates.reps !== undefined) cleanUpdates.reps = updates.reps;
    if (updates.weight_kg !== undefined) cleanUpdates.weight_kg = updates.weight_kg;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;

    const { error } = await getSupabase()
      .from('routine_exercises')
      .update(cleanUpdates)
      .eq('id', exercise_id);

    if (error) return txt(`Error: ${error.message}`);
    return txt('Exercise updated successfully');
  }
);

tool(
  'add_exercise',
  'Add a new exercise to a specific day in the routine',
  {
    routine_day_id: z.string().describe('UUID of the routine day'),
    exercise_name: z.string(),
    sets: z.number().default(3),
    reps: z.number().default(10),
    weight_kg: z.number().nullable().optional(),
    rest_seconds: z.number().default(60),
    notes: z.string().nullable().optional(),
  },
  async ({ routine_day_id, ...exercise }) => {
    if (!(await routineDayBelongsToTenant(routine_day_id))) {
      return txt('Error: routine_day not found for this tenant');
    }

    // Migration 008 denormalized user_id + tenant_id onto routine_days
    // and routine_exercises (ARCHITECTURE.md §16.1). Pull them from the
    // parent row so the insert can populate the NOT NULL columns.
    const { data: parent } = await getSupabase()
      .from('routine_days')
      .select('user_id, tenant_id')
      .eq('id', routine_day_id)
      .single();

    if (!parent) return txt('Error: routine_day not found');

    const { data: maxOrder } = await getSupabase()
      .from('routine_exercises')
      .select('order_index')
      .eq('routine_day_id', routine_day_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const { error } = await getSupabase().from('routine_exercises').insert({
      routine_day_id,
      user_id: parent.user_id,
      tenant_id: parent.tenant_id,
      ...exercise,
      order_index: (maxOrder?.order_index ?? -1) + 1,
    });

    if (error) return txt(`Error: ${error.message}`);
    return txt('Exercise added successfully');
  }
);

tool(
  'remove_exercise',
  'Remove an exercise from a routine day',
  {
    exercise_id: z.string().describe('UUID of the exercise to remove'),
  },
  async ({ exercise_id }) => {
    if (!(await exerciseBelongsToTenant(exercise_id))) {
      return txt('Error: exercise not found for this tenant');
    }
    const { error } = await getSupabase()
      .from('routine_exercises')
      .delete()
      .eq('id', exercise_id);

    if (error) return txt(`Error: ${error.message}`);
    return txt('Exercise removed successfully');
  }
);

tool(
  'replace_exercise',
  'Replace an exercise with a new one, keeping the same position and day',
  {
    exercise_id: z.string().describe('UUID of the exercise to replace'),
    exercise_name: z.string().describe('Name of the new exercise'),
    sets: z.number().default(3),
    reps: z.number().default(10),
    weight_kg: z.number().nullable().optional(),
    rest_seconds: z.number().default(60),
    notes: z.string().nullable().optional(),
  },
  async ({ exercise_id, ...newExercise }) => {
    if (!(await exerciseBelongsToTenant(exercise_id))) {
      return txt('Error: exercise not found for this tenant');
    }

    const { data: existing, error: fetchError } = await getSupabase()
      .from('routine_exercises')
      .select('routine_day_id, order_index, user_id, tenant_id')
      .eq('id', exercise_id)
      .single();

    if (fetchError || !existing) return txt('Error: exercise not found');

    const { error: deleteError } = await getSupabase()
      .from('routine_exercises')
      .delete()
      .eq('id', exercise_id);

    if (deleteError) return txt(`Error: ${deleteError.message}`);

    const { error: insertError } = await getSupabase()
      .from('routine_exercises')
      .insert({
        routine_day_id: existing.routine_day_id,
        user_id: existing.user_id,
        tenant_id: existing.tenant_id,
        order_index: existing.order_index,
        ...newExercise,
      });

    if (insertError) return txt(`Error: ${insertError.message}`);
    return txt('Exercise replaced successfully');
  }
);

tool(
  'get_user_profile',
  'Get a user profile including fitness level, injuries, equipment, and goals',
  {
    user_id: z.string().optional().describe('UUID of the user (omit to use X-External-Id header)'),
  },
  async ({ user_id }) => {
    const u = await resolveUserId(user_id);
    if ('error' in u) return txt(`Error: ${u.error}`);

    let q = getSupabase().from('profiles').select('*').eq('id', u.id);
    q = scopeTenant(q);
    const { data, error } = await q.single();

    if (error) return txt(`Error: ${error.message}`);
    return txt(JSON.stringify(data, null, 2));
  }
);

tool(
  'get_tenant_info',
  'Get branding and config for the current tenant (colors, logo, name). Scoped to the API key tenant — tenant_slug arg is ignored when called via HTTP.',
  {
    tenant_slug: z
      .string()
      .optional()
      .describe('Slug identifier (only honored in stdio dev mode; HTTP uses the API key tenant)'),
  },
  async ({ tenant_slug }) => {
    const c = ctx();
    let q = getSupabase().from('tenants').select('*');
    if (c.tenantId) {
      q = q.eq('id', c.tenantId);
    } else if (tenant_slug) {
      q = q.eq('slug', tenant_slug);
    } else {
      return txt('Error: tenant_slug required in stdio mode');
    }
    const { data, error } = await q.single();

    if (error) return txt(`Error: ${error.message}`);
    return txt(JSON.stringify(data, null, 2));
  }
);

tool(
  'list_tenant_users',
  'List all users that belong to the current tenant',
  {
    tenant_slug: z
      .string()
      .optional()
      .describe('Slug (stdio dev mode only; HTTP scopes by API key tenant)'),
  },
  async ({ tenant_slug }) => {
    const c = ctx();
    let tenantId = c.tenantId;
    if (!tenantId) {
      if (!tenant_slug) return txt('Error: tenant_slug required in stdio mode');
      const { data: tenant } = await getSupabase()
        .from('tenants')
        .select('id')
        .eq('slug', tenant_slug)
        .single();
      if (!tenant) return txt('Tenant not found');
      tenantId = tenant.id;
    }

    const { data, error } = await getSupabase()
      .from('profiles')
      .select('id, display_name, fitness_level, goals, training_days_per_week, onboarding_completed')
      .eq('tenant_id', tenantId);

    if (error) return txt(`Error: ${error.message}`);
    return txt(JSON.stringify(data, null, 2));
  }
);

  return server;
}

// -------------------------------------------------------------------------
// API-key auth (HTTP transport).
// -------------------------------------------------------------------------

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

interface ResolvedKey {
  tenantId: string;
  keyId: string;
}

async function authenticateApiKey(authHeader: string | undefined): Promise<ResolvedKey | null> {
  if (!authHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!m) return null;
  const raw = m[1].trim();
  if (!raw) return null;
  const hash = sha256Hex(raw);

  const { data, error } = await getSupabase()
    .from('tenant_api_keys')
    .select('id, tenant_id, revoked_at')
    .eq('key_hash', hash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data) return null;

  // Fire-and-forget last_used_at update — we don't want to block the request.
  void getSupabase()
    .from('tenant_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return { tenantId: data.tenant_id, keyId: data.id };
}

// -------------------------------------------------------------------------
// HTTP transport runner.
// -------------------------------------------------------------------------

async function readBody(req: IncomingMessage): Promise<unknown | undefined> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      if (chunks.length === 0) return resolve(undefined);
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(raw.length ? JSON.parse(raw) : undefined);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export async function runHttp(opts?: { port?: number }): Promise<{ close: () => Promise<void>; port: number }> {
  const port = opts?.port ?? Number(process.env.PORT ?? 3000);

  // Stateless mode (per the SDK contract) requires a *fresh* transport per
  // request — reusing a stateless transport throws
  // "Stateless transport cannot be reused across requests" on the second
  // call. So we connect a new transport instance inside each request
  // handler. The `McpServer` itself is shared and just maps the transport's
  // protocol layer to our tool registry.
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      if (url.pathname !== '/mcp') {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      const authResult = await authenticateApiKey(
        req.headers['authorization'] as string | undefined
      );
      if (!authResult) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid or missing API key' }));
        return;
      }

      const externalIdHeader = req.headers['x-external-id'];
      const externalId = Array.isArray(externalIdHeader)
        ? externalIdHeader[0]
        : externalIdHeader ?? null;

      const requestCtx: RequestContext = {
        tenantId: authResult.tenantId,
        externalId,
      };

      // Pre-parse body for POSTs so the SDK doesn't re-read the stream.
      let parsedBody: unknown | undefined;
      if (req.method === 'POST') {
        parsedBody = await readBody(req);
      }

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      // Stateless: one server + one transport per request. Both get closed
      // when the response ends. Reusing a single McpServer across requests
      // throws "Already connected to a transport" on the second connect.
      const server = createMcpServer();
      res.on('close', () => {
        transport.close().catch(() => {});
        server.close().catch(() => {});
      });
      await server.connect(transport);

      await ctxStorage.run(requestCtx, async () => {
        await transport.handleRequest(req, res, parsedBody);
      });
    } catch (err) {
      console.error('[mcp-http] request error', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    }
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      console.log(`[mcp] HTTP transport listening on http://0.0.0.0:${port}/mcp`);
      resolve();
    });
  });

  const actualPort =
    typeof httpServer.address() === 'object' && httpServer.address()
      ? (httpServer.address() as { port: number }).port
      : port;

  return {
    port: actualPort,
    close: () =>
      new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

async function runStdio() {
  const transport = new StdioServerTransport();
  const server = createMcpServer();
  await server.connect(transport);
  console.error('[mcp] stdio transport ready');
}

async function main() {
  const useStdio = process.argv.includes('--stdio');
  if (useStdio) await runStdio();
  else await runHttp();
}

// Only auto-run when executed as a script (node dist/index.js), not when
// imported by tests (`require('../src/index.ts')`).
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
