// `<GohanCoach />` — single-component root for the embeddable Gohan AI module.
// Wraps the CoachProvider + the chat/routine screens that the standalone
// Expo app today renders inside `app/(tabs)/`.
//
// Per ARCHITECTURE.md §14, this component is the public surface of the
// future `@gohan-ai/react-native` package (Phase 3). It must NOT depend on
// `expo-router`, `app/`, or Supabase Auth — those belong to the standalone
// shell. Auth is injected via `getAuthToken` OR resolved via `api-session`
// when the host hands us a short-lived `gymJwt`. The two are mutually
// exclusive — pick the path that matches your integration:
//
//   - Standalone Expo / API-key:   pass `getAuthToken` (+ optional userId,
//                                  externalId).
//   - Embedded module (gym-issued JWT): pass `gymJwt` + `tenantSlug`. We
//     POST it to `/api-session`, cache the returned `session_token`, and
//     refresh transparently on 401. If the response carries `realtime_jwt`
//     we forward it to the supabase realtime client via `setAuth`.
//
// Until the session resolves we render a minimal placeholder; failures are
// surfaced via `onError`.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CoachProvider } from '@/modules/coach';
import { useAuthStore } from '@/store';
import type { CoachConfig } from '@/types';
import { supabase } from '@/services/supabase';
import { CoachChatView, CoachRoutineView } from './GohanCoachViews';

export interface GohanCoachProps {
  apiBaseUrl: string;
  /**
   * Async getter for the host's bearer token (Supabase JWT, Gohan session
   * JWT, or `gk_live_*` API key). Mutually exclusive with `gymJwt`.
   */
  getAuthToken?: () => Promise<string | null>;
  /**
   * Short-lived gym-issued JWT. When provided, `<GohanCoach />` resolves a
   * Gohan session token via POST `/api-session` and uses it for downstream
   * requests. Mutually exclusive with `getAuthToken`.
   */
  gymJwt?: string;
  /** Pre-resolved user id (standalone path). Embedded path resolves via api-session. */
  userId?: string;
  tenantSlug?: string;
  onError?: (e: Error) => void;
  /** Anon/publishable key for the Supabase functions gateway. */
  anonKey?: string;
  /**
   * The gym's own user id. Forwarded as `X-External-Id` on every request so
   * the edge functions / MCP server can resolve the matching profile when
   * the auth token is a tenant API key (`gk_live_*`). Ignored on the
   * standalone path where `userId` is a Gohan profile id.
   */
  externalId?: string;
  /** Which screen to land on. */
  initialView?: 'chat' | 'routine';
  /**
   * Endpoint name for the chat stream relative to `apiBaseUrl`. Defaults to
   * the legacy `ai-chat`; embedded hosts that point at the public API
   * should pass `'api-chat'`.
   */
  chatEndpoint?: string;
}

interface ApiSessionResponse {
  session_token: string;
  realtime_jwt?: string | null;
  expires_in?: number;
  user_id?: string;
  tenant_id?: string;
}

export function GohanCoach({
  apiBaseUrl,
  getAuthToken,
  gymJwt,
  userId,
  tenantSlug = 'default',
  onError,
  anonKey,
  externalId,
  initialView = 'chat',
  chatEndpoint = 'ai-chat',
}: GohanCoachProps) {
  const [view, setView] = useState<'chat' | 'routine'>(initialView);
  const setUser = useAuthStore((s) => s.setUser);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  // Cached session token from /api-session. We hold it in a ref so the
  // memoized `resolveAuthToken` keeps the same identity across re-renders
  // (rebuilding the ApiClient on every refresh would invalidate the
  // CoachProvider's chat transport, dropping in-flight streams).
  const sessionTokenRef = useRef<string | null>(null);
  const sessionInflightRef = useRef<Promise<string | null> | null>(null);
  const [sessionResolved, setSessionResolved] = useState<boolean>(!gymJwt);

  const reportError = useCallback(
    (err: unknown) => {
      const e = err instanceof Error ? err : new Error(String(err));
      if (onError) onError(e);
      else console.warn('[GohanCoach]', e);
    },
    [onError],
  );

  const fetchApiSession = useCallback(async (): Promise<string | null> => {
    if (!gymJwt) return null;
    // Coalesce concurrent refresh attempts.
    if (sessionInflightRef.current) return sessionInflightRef.current;
    const url = `${apiBaseUrl.replace(/\/$/, '')}/api-session`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gymJwt}`,
      'X-Tenant-Slug': tenantSlug,
    };
    if (anonKey) headers.apikey = anonKey;

    const promise = (async () => {
      try {
        const res = await fetch(url, { method: 'POST', headers });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`api-session failed (${res.status}): ${text}`);
        }
        const json = (await res.json()) as ApiSessionResponse;
        sessionTokenRef.current = json.session_token;
        if (json.user_id) {
          // Hydrate just enough of the auth store for the chat
          // user-profile builder to work. Embedded hosts that need richer
          // profile data should fetch it separately.
          const existing = useAuthStore.getState().user;
          if (!existing || existing.id !== json.user_id) {
            setUser({
              id: json.user_id,
              tenantId: json.tenant_id ?? 'default',
              displayName: '',
              avatarUrl: null,
              fitnessLevel: 'beginner',
              equipmentAvailable: [],
              injuries: [],
              trainingDaysPerWeek: 0,
              goals: [],
              onboardingCompleted: false,
              createdAt: new Date(0).toISOString(),
            });
          }
        }
        if (json.realtime_jwt) {
          try {
            (supabase.realtime as { setAuth: (t: string) => void }).setAuth(json.realtime_jwt);
          } catch (e) {
            // Realtime auth wiring is best-effort — see useRealtimeRoutine.
            console.warn('[GohanCoach] realtime setAuth rejected', e);
          }
        }
        return json.session_token;
      } finally {
        sessionInflightRef.current = null;
      }
    })();
    sessionInflightRef.current = promise;
    return promise;
  }, [apiBaseUrl, anonKey, gymJwt, setUser, tenantSlug]);

  // Build the auth-token resolver passed to ApiClient. When `gymJwt` is the
  // identity source we read from the cache, refresh on cache-miss, and
  // re-fetch on 401 (handled by buildHeaders consumers — see below).
  const resolveAuthToken = useCallback(async (): Promise<string | null> => {
    if (gymJwt) {
      if (sessionTokenRef.current) return sessionTokenRef.current;
      try {
        return await fetchApiSession();
      } catch (e) {
        reportError(e);
        return null;
      }
    }
    if (getAuthToken) return getAuthToken();
    return null;
  }, [gymJwt, getAuthToken, fetchApiSession, reportError]);

  // Mount-time session resolution for the gymJwt path.
  useEffect(() => {
    if (!gymJwt) {
      setSessionResolved(true);
      return;
    }
    setSessionResolved(false);
    let cancelled = false;
    fetchApiSession()
      .then(() => {
        if (!cancelled) setSessionResolved(true);
      })
      .catch((e) => {
        if (!cancelled) {
          reportError(e);
          setSessionResolved(true); // unblock UI; inner views will surface fetch errors
        }
      });
    return () => {
      cancelled = true;
    };
  }, [gymJwt, fetchApiSession, reportError]);

  // 401 refresh hook: when any downstream fetch comes back 401 we want to
  // drop the cached token so the next ApiClient call refetches it. We expose
  // this via a global the ApiClient checks (kept inline to avoid leaking a
  // refresh API into the public types). For now, callers can also clear the
  // cache by remounting; this is a pragmatic Phase 4 minimum.
  useEffect(() => {
    if (!gymJwt) return undefined;
    const handler = () => {
      sessionTokenRef.current = null;
    };
    // Subscribe to a window-level event the ApiClient dispatches on 401. The
    // ApiClient implementation lives in `src/services/api/client.ts`; if that
    // event is not wired (older versions) this effect is a harmless no-op.
    if (typeof globalThis !== 'undefined' && 'addEventListener' in (globalThis as object)) {
      (globalThis as unknown as EventTarget).addEventListener?.(
        'gohan:auth:invalidate',
        handler as EventListener,
      );
      return () => {
        (globalThis as unknown as EventTarget).removeEventListener?.(
          'gohan:auth:invalidate',
          handler as EventListener,
        );
      };
    }
    return undefined;
  }, [gymJwt]);

  const config = useMemo<CoachConfig>(
    () => ({
      apiBaseUrl,
      getAuthToken: resolveAuthToken,
      anonKey,
      externalId,
    }),
    [apiBaseUrl, resolveAuthToken, anonKey, externalId],
  );

  // Standalone path: caller passes userId. Hydrate the auth store so the
  // chat user-profile builder works. The gymJwt path hydrates from the
  // api-session response above.
  useEffect(() => {
    if (!userId) return;
    if (currentUserId === userId) return;
    const existing = useAuthStore.getState().user;
    if (!existing || existing.id !== userId) {
      setUser({
        id: userId,
        tenantId: 'default',
        displayName: '',
        avatarUrl: null,
        fitnessLevel: 'beginner',
        equipmentAvailable: [],
        injuries: [],
        trainingDaysPerWeek: 0,
        goals: [],
        onboardingCompleted: false,
        createdAt: new Date(0).toISOString(),
      });
    }
  }, [userId, currentUserId, setUser]);

  if (gymJwt && !sessionResolved) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', opacity: 0.6 }}>Conectando...</Text>
      </View>
    );
  }

  return (
    <CoachProvider config={config} chatEndpoint={chatEndpoint} tenantSlug={tenantSlug}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 8,
            backgroundColor: '#000',
          }}
        >
          <ViewTab label="Chat" active={view === 'chat'} onPress={() => setView('chat')} />
          <ViewTab
            label="Rutina"
            active={view === 'routine'}
            onPress={() => setView('routine')}
          />
        </View>
        {view === 'chat' ? (
          <CoachChatView onError={reportError} />
        ) : (
          <CoachRoutineView onError={reportError} />
        )}
      </View>
    </CoachProvider>
  );
}

function ViewTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? '#fff' : '#222',
      }}
    >
      <Text style={{ color: active ? '#000' : '#fff', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
