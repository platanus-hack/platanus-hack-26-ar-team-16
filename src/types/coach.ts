// Shared contracts for the embeddable Gohan Coach module.
//
// `CoachConfig` is what the host app passes into `<GohanCoach />`. The
// standalone Expo shell builds it from `supabase.auth.getSession()`; a future
// embedded npm consumer will build it from their own session-token cache.
//
// `ApiClient` is the thin HTTP wrapper produced from a CoachConfig. It is
// passed (via React context, see `src/modules/coach/CoachProvider.tsx`) into
// every service that needs to talk to the Gohan edge functions.

export interface CoachConfig {
  /** e.g. `https://<ref>.supabase.co/functions/v1` */
  apiBaseUrl: string;
  /**
   * Returns a JWT (or API key) authenticating the *current* user against the
   * Gohan API. Called fresh on every request so the wrapper picks up token
   * rotation. May return `null` if no session is available (callers must
   * tolerate this and treat the request as unauth).
   */
  getAuthToken: () => Promise<string | null>;
  /**
   * Optional anon/publishable key sent as `apikey` header. Required by the
   * Supabase functions gateway today (the gateway demands it even when the
   * function is `--no-verify-jwt`). Not needed when calling a non-Supabase
   * deployment.
   */
  anonKey?: string;
}

export interface ApiRequestInit {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  /** When true, do not parse the body — return the raw `Response`. */
  raw?: boolean;
  signal?: AbortSignal;
}

export interface ApiClient {
  /** Base URL the client targets. Useful for sub-clients (e.g. SSE). */
  readonly apiBaseUrl: string;
  /** Resolve the current auth token. Convenience passthrough. */
  getAuthToken: () => Promise<string | null>;
  /** Headers used on every request, including `apikey` if configured. */
  buildHeaders: (extra?: Record<string, string>) => Promise<Record<string, string>>;
  /** Fetch a JSON endpoint relative to `apiBaseUrl`. Throws on non-2xx. */
  request: <T = unknown>(path: string, init?: ApiRequestInit) => Promise<T>;
  /** Raw fetch escape hatch — used by the SSE streamer. */
  fetch: (path: string, init?: ApiRequestInit) => Promise<Response>;
}
