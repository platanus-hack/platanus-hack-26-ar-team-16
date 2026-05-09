import * as Linking from 'expo-linking';
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

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL('auth/callback');
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
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
