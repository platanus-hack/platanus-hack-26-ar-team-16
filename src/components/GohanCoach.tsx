// `<GohanCoach />` — single-component root for the embeddable Gohan AI module.
// Wraps the CoachProvider + the chat/routine screens that the standalone
// Expo app today renders inside `app/(tabs)/`.
//
// Per ARCHITECTURE.md §14, this component is the public surface of the
// future `@gohan-ai/react-native` package (Phase 3). It must NOT depend on
// `expo-router`, `app/`, or Supabase Auth — those belong to the standalone
// shell. Auth is injected via `getAuthToken`; the user identity is either
// passed in directly (`userId`, the standalone path) or resolved via
// `api-session` against `tenantSlug` (the embedded path, Phase 3 wiring).
//
// Props mirror §14 of ARCHITECTURE.md:
//   - apiBaseUrl     base URL of the Gohan edge functions
//   - getAuthToken   async getter for the host's bearer token
//   - userId         optional pre-resolved user id (standalone path)
//   - tenantSlug     for the embedded path (defaults to "default")
//   - onError        optional error sink; defaults to console.warn
//   - initialView    pick whether the embedded view shows chat or routine
//                    by default. Hosts that own their own nav can render
//                    `<GohanCoachChat />` / `<GohanCoachRoutine />` directly
//                    once those are factored out (Phase 3).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CoachProvider } from '@/modules/coach';
import { useAuthStore } from '@/store';
import type { CoachConfig } from '@/types';
import { CoachChatView, CoachRoutineView } from './GohanCoachViews';

export interface GohanCoachProps {
  apiBaseUrl: string;
  getAuthToken: () => Promise<string | null>;
  /** Pre-resolved user id (standalone path). Embedded path resolves via api-session. */
  userId?: string;
  tenantSlug?: string;
  onError?: (e: Error) => void;
  /** Anon/publishable key for the Supabase functions gateway. */
  anonKey?: string;
  /** Which screen to land on. */
  initialView?: 'chat' | 'routine';
  /**
   * Endpoint name for the chat stream relative to `apiBaseUrl`. Defaults to
   * the legacy `ai-chat`; embedded hosts that point at the public API
   * should pass `'api-chat'`.
   */
  chatEndpoint?: string;
}

export function GohanCoach({
  apiBaseUrl,
  getAuthToken,
  userId,
  tenantSlug = 'default',
  onError,
  anonKey,
  initialView = 'chat',
  chatEndpoint = 'ai-chat',
}: GohanCoachProps) {
  const [view, setView] = useState<'chat' | 'routine'>(initialView);
  const setUser = useAuthStore((s) => s.setUser);
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const config = useMemo<CoachConfig>(
    () => ({ apiBaseUrl, getAuthToken, anonKey }),
    [apiBaseUrl, getAuthToken, anonKey],
  );

  const reportError = useCallback(
    (err: unknown) => {
      const e = err instanceof Error ? err : new Error(String(err));
      if (onError) onError(e);
      else console.warn('[GohanCoach]', e);
    },
    [onError],
  );

  // Standalone path: caller passes userId. Embedded path will resolve via
  // api-session against the host JWT. Phase 2 covers only the former; the
  // embedded resolver is a Phase 3 TODO (would call POST /api-session and
  // hydrate `useAuthStore` with the returned profile).
  useEffect(() => {
    if (!userId) return;
    if (currentUserId === userId) return;
    // Hydrate just enough of the auth store for the chat user-profile
    // builder to work. The full profile is loaded by the standalone shell
    // (`app/_layout.tsx`); embedded hosts that don't have a Supabase
    // session will need to bring their own profile sync (Phase 3).
    const existing = useAuthStore.getState().user;
    if (!existing || existing.id !== userId) {
      // Minimal shape — fields will be filled in by the standalone shell or
      // by a future api-session response.
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
