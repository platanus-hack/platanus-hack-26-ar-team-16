// CoachProvider — the embedded module's runtime root. Anything beneath it
// (chat UI, routine UI, hooks) reads its `ApiClient` and config from this
// context. The standalone Expo shell wraps the same provider around its
// existing tab screens (see `app/(tabs)/coach.tsx`, `routine.tsx`) so the
// two surfaces share render code 1:1.
//
// Owns no state of its own — Zustand stores still live where they always
// did (`src/store/`). This is purely a config dependency-injection hop so
// `ChatManager` and friends can ditch their hard reference to
// `EXPO_PUBLIC_SUPABASE_URL` / the global supabase client.

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ApiClient, CoachConfig } from '@/types';
import { createApiClient } from '@/services/api/client';
import { setChatTransport } from '@/modules/chat/ChatManager';

interface CoachContextValue {
  config: CoachConfig;
  apiClient: ApiClient;
  /**
   * Endpoint name (relative to `apiBaseUrl`) that handles the chat stream.
   * Standalone path → `ai-chat`. Embedded path → `api-chat`. Defaults to
   * `ai-chat` because the public endpoint is still rolling out.
   */
  chatEndpoint: string;
  tenantSlug: string;
}

const CoachContext = createContext<CoachContextValue | null>(null);

export interface CoachProviderProps {
  config: CoachConfig;
  chatEndpoint?: string;
  tenantSlug?: string;
  children: React.ReactNode;
}

export function CoachProvider({
  config,
  chatEndpoint = 'ai-chat',
  tenantSlug = 'default',
  children,
}: CoachProviderProps) {
  const value = useMemo<CoachContextValue>(() => {
    return {
      config,
      apiClient: createApiClient(config),
      chatEndpoint,
      tenantSlug,
    };
    // ApiClient is stateless beyond its config closure — rebuild only when
    // the config identity changes. Hosts are expected to memoize their
    // `getAuthToken` function (or accept the rebuild on every render).
  }, [config, chatEndpoint, tenantSlug]);

  // Register the active transport for module-scoped consumers (ChatManager).
  // See the comment at `setChatTransport` for why we use a module variable.
  useEffect(() => {
    setChatTransport({ apiClient: value.apiClient, endpoint: value.chatEndpoint });
    return () => setChatTransport(null);
  }, [value]);

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoachContext(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) {
    throw new Error(
      '[gohan-coach] useCoachContext() called outside <CoachProvider>. Wrap your screen in <GohanCoach /> or <CoachProvider config={...}>.',
    );
  }
  return ctx;
}

/** Optional variant — returns null when no provider is mounted. Used by the
 *  legacy ChatManager shim so a missing provider falls back to the env-var
 *  defaults of the standalone app. */
export function useCoachContextOrNull(): CoachContextValue | null {
  return useContext(CoachContext);
}
