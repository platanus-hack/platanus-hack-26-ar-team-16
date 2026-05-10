import { Platform } from 'react-native';
import { supabase } from './supabase';

const rawHost = process.env.EXPO_PUBLIC_OW_HOST ?? 'http://localhost:8000';
const OW_HOST = Platform.OS === 'android' ? rawHost.replace('localhost', '10.0.2.2') : rawHost;
const OW_API_KEY = process.env.EXPO_PUBLIC_OW_API_KEY ?? '';

let initialized = false;
let owUserId: string | null = null;

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${OW_HOST}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin@admin.com&password=GohanAdmin2026!',
  });
  const data = await res.json();
  return data.access_token;
}

async function ensureOWUser(adminToken: string, email: string, name: string): Promise<string> {
  const listRes = await fetch(`${OW_HOST}/api/v1/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await listRes.json();
  const users = data.items ?? data;
  const existing = users.find((u: { email: string }) => u.email === email);
  if (existing) return existing.id;

  const createRes = await fetch(`${OW_HOST}/api/v1/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, first_name: name }),
  });
  const created = await createRes.json();
  return created.id;
}

export async function initOpenWearables(): Promise<void> {
  if (initialized) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const adminToken = await getAdminToken();
  const email = session.user.email ?? `${session.user.id}@gohan.ai`;
  owUserId = await ensureOWUser(adminToken, email, session.user.user_metadata?.first_name ?? 'User');

  initialized = true;
}

export async function syncNow(): Promise<void> {
  if (!owUserId) return;
  await fetch(`${OW_HOST}/api/v1/sdk/users/${owUserId}/sync`, {
    method: 'POST',
    headers: {
      'X-Open-Wearables-API-Key': OW_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
}

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

function todayRange(): { start_date: string; end_date: string } {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return { start_date: today, end_date: tomorrow };
}

export async function getActivitySummary(date?: string): Promise<OWActivitySummary | null> {
  if (!owUserId) return null;
  const adminToken = await getAdminToken();
  const { start_date, end_date } = date
    ? { start_date: date, end_date: new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0] }
    : todayRange();
  const res = await fetch(
    `${OW_HOST}/api/v1/users/${owUserId}/summaries/activity?start_date=${start_date}&end_date=${end_date}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body.data?.[0] ?? null;
}

export async function getSleepSummary(date?: string): Promise<OWSleepSummary | null> {
  if (!owUserId) return null;
  const adminToken = await getAdminToken();
  const { start_date, end_date } = date
    ? { start_date: new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0], end_date: date }
    : todayRange();
  const res = await fetch(
    `${OW_HOST}/api/v1/users/${owUserId}/summaries/sleep?start_date=${start_date}&end_date=${end_date}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  if (!res.ok) return null;
  const body = await res.json();
  return body.data?.[0] ?? null;
}

export async function getWorkouts(date?: string): Promise<OWWorkout[]> {
  if (!owUserId) return [];
  const adminToken = await getAdminToken();
  const { start_date, end_date } = date
    ? { start_date: date, end_date: new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0] }
    : todayRange();
  const res = await fetch(
    `${OW_HOST}/api/v1/users/${owUserId}/events/workouts?start_date=${start_date}&end_date=${end_date}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  if (!res.ok) return [];
  const body = await res.json();
  return body.data ?? [];
}

export function isInitialized(): boolean {
  return initialized;
}

export function getUserId(): string | null {
  return owUserId;
}
