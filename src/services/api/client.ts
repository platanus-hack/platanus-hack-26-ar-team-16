// Thin fetch wrapper used by every service that talks to the public Gohan
// API (today: the Supabase Edge Functions gateway). Created from a
// `CoachConfig` so the same code path serves both the standalone Expo shell
// (token = Supabase JWT) and the embedded npm module (token = Gohan session
// JWT or API key).
//
// Why not just hand around a pre-built supabase-js client? Because the
// embedded module won't ship with supabase-js — it talks to public REST
// endpoints (`api-chat`, `api-session`, ...) where the auth header is the
// host app's responsibility, not ours.

import type { ApiClient, ApiRequestInit, CoachConfig } from '@/types';

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export function createApiClient(config: CoachConfig): ApiClient {
  const { apiBaseUrl, getAuthToken, anonKey, externalId } = config;

  async function buildHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    };
    if (anonKey) headers.apikey = anonKey;
    // Forward the gym's own user id when configured. The MCP server / edge
    // functions resolve the matching `(tenant_id, external_id)` profile when
    // the auth token is a tenant API key. Harmless when the token is a
    // session JWT (server prefers claims).
    if (externalId && headers['X-External-Id'] === undefined) {
      headers['X-External-Id'] = externalId;
    }
    const token = await getAuthToken().catch(() => null);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (anonKey) {
      // Supabase gateway requires *some* bearer; falling back to anon key
      // matches the legacy behaviour of the standalone app today.
      headers.Authorization = `Bearer ${anonKey}`;
    }
    return headers;
  }

  async function rawFetch(path: string, init: ApiRequestInit = {}): Promise<Response> {
    const headers = await buildHeaders(init.headers);
    const body =
      init.body === undefined
        ? undefined
        : typeof init.body === 'string'
        ? init.body
        : JSON.stringify(init.body);
    const res = await fetch(joinUrl(apiBaseUrl, path), {
      method: init.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      signal: init.signal,
    });
    // On 401 emit a global event so token caches (e.g. <GohanCoach />'s
    // session-token ref) can invalidate. Best-effort — environments without
    // dispatchEvent (e.g. some Node test runners) silently skip.
    if (res.status === 401) {
      try {
        (globalThis as unknown as EventTarget).dispatchEvent?.(
          new Event('gohan:auth:invalidate'),
        );
      } catch {
        // ignore — Event ctor unavailable in some RN versions
      }
    }
    return res;
  }

  async function request<T = unknown>(path: string, init: ApiRequestInit = {}): Promise<T> {
    const res = await rawFetch(path, init);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[api] ${init.method ?? 'GET'} ${path} failed (${res.status}): ${text}`);
    }
    if (init.raw) return res as unknown as T;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  }

  return {
    apiBaseUrl,
    getAuthToken,
    buildHeaders,
    request,
    fetch: rawFetch,
  };
}
