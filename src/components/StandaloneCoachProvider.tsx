// `<StandaloneCoachProvider>` — the standalone Expo app's wiring around
// `<CoachProvider>`. Pulls the auth token from the live Supabase session
// (`supabase.auth.getSession()`), points the API at the legacy `ai-chat`
// endpoint, and inherits anon-key + apiBaseUrl from `EXPO_PUBLIC_*` env
// vars. The embedded npm module (Phase 3) uses `<CoachProvider>` directly
// with a host-supplied config — this file is excluded from the package.

import React, { useMemo } from 'react';
import { CoachProvider } from '@/modules/coach';
import { supabase } from '@/services/supabase';
import { useTenantStore } from '@/store';
import type { CoachConfig } from '@/types';

interface Props {
  children: React.ReactNode;
}

export function StandaloneCoachProvider({ children }: Props) {
  const tenantSlug = useTenantStore((s) => s.tenant?.slug ?? 'default');

  const config = useMemo<CoachConfig>(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
    return {
      apiBaseUrl: `${url.replace(/\/$/, '')}/functions/v1`,
      anonKey,
      // Re-read on every request so token rotation lands without
      // remounting the provider.
      getAuthToken: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      },
    };
  }, []);

  return (
    <CoachProvider config={config} chatEndpoint="ai-chat" tenantSlug={tenantSlug}>
      {children}
    </CoachProvider>
  );
}
