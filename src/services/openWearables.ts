import { supabase } from './supabase';

// Open Wearables client — thin wrapper over the ow-bridge edge function
// (supabase/functions/ow-bridge/). Per docs/ARCHITECTURE.md §14, the
// admin credentials and identity mapping moved server-side; this module
// is now safe to ship inside the embeddable npm bundle.
//
// All calls are authenticated via the user's Supabase session JWT — the
// edge function resolves the OW external_id from `wearables_links`.

export interface OWActivitySummary {
  date: string;
  steps: number | null;
  distance_meters: number | null;
  active_calories_kcal: number | null;
  total_calories_kcal: number | null;
  active_minutes: number | null;
  heart_rate: {
    avg_bpm: number | null;
    max_bpm: number | null;
    min_bpm: number | null;
  } | null;
}

export interface OWSleepSummary {
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  efficiency_percent: number | null;
  stages: {
    awake_minutes: number;
    light_minutes: number;
    deep_minutes: number;
    rem_minutes: number;
  } | null;
}

export interface OWWorkout {
  id: string;
  type: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  calories_kcal: number | null;
  avg_heart_rate_bpm: number | null;
  max_heart_rate_bpm: number | null;
}

let connectedCache = false;

async function callBridge<T>(action: string, extra?: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active Supabase session');

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ow-bridge`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({ action, ...extra }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ow-bridge ${action} ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function initOpenWearables(): Promise<void> {
  await callBridge<{ connected: boolean }>('connect');
  connectedCache = true;
}

export async function syncNow(): Promise<void> {
  await callBridge<{ synced: boolean }>('sync');
}

export async function getActivitySummary(date?: string): Promise<OWActivitySummary | null> {
  const { data } = await callBridge<{ data: OWActivitySummary | null }>('activity', { date });
  return data;
}

export async function getSleepSummary(date?: string): Promise<OWSleepSummary | null> {
  const { data } = await callBridge<{ data: OWSleepSummary | null }>('sleep', { date });
  return data;
}

export async function getWorkouts(date?: string): Promise<OWWorkout[]> {
  const { data } = await callBridge<{ data: OWWorkout[] }>('workouts', { date });
  return data;
}

export function isInitialized(): boolean {
  return connectedCache;
}
