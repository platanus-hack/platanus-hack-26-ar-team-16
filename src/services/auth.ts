import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface SignUpExtras {
  displayName?: string;
  tenantSlug?: string;
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  extras: SignUpExtras = {}
) {
  const tenantSlug = extras.tenantSlug ?? process.env.EXPO_PUBLIC_DEFAULT_TENANT ?? 'default';
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: extras.displayName ?? email.split('@')[0],
        tenant_slug: tenantSlug,
      },
    },
  });
}

/**
 * Drives the full Google OAuth flow.
 *
 * Web:    Supabase generates the auth URL, we navigate to it, Google
 *         redirects back to our origin, supabase-js (`detectSessionInUrl`)
 *         parses the hash fragment and fires `onAuthStateChange`.
 *
 * Native: We open the auth URL in an in-app browser session and wait for
 *         the redirect to our deep link (`gohan-ai://auth/callback`). The
 *         session lands as a `?code=...` PKCE param which we exchange.
 *
 * Returns `{ error }` shaped like the rest of supabase-js so callers can
 * await it the same way as `signInWithEmail`.
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const redirectTo = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // Skip the implicit redirect so we drive the browser ourselves on
      // native. supabase-js still respects this on web because the next
      // line handles navigation explicitly.
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) return { error: error ?? new Error('No auth URL returned') };

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.href = data.url;
    }
    return { error: null };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return { error: result.type === 'cancel' ? null : new Error(`OAuth ${result.type}`) };
  }

  const code = new URL(result.url).searchParams.get('code');
  if (!code) return { error: new Error('Missing auth code in callback URL') };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return { error: exchangeError };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export function onAuthStateChange(
  callback: (session: Session | null) => void
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
