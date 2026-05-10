import { supabase } from './supabase';

const OW_HOST = process.env.EXPO_PUBLIC_OW_HOST ?? 'http://localhost:8000';
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
  const users = await listRes.json();
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
  steps: number | null;
  active_calories: number | null;
  total_calories: number | null;
  distance_meters: number | null;
}

export interface OWSleepSummary {
  total_sleep_minutes: number | null;
  deep_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
}

export async function getActivitySummary(date?: string): Promise<OWActivitySummary | null> {
  if (!owUserId) return null;
  const adminToken = await getAdminToken();
  const d = date ?? new Date().toISOString().split('T')[0];
  const res = await fetch(`${OW_HOST}/api/v1/users/${owUserId}/summaries/activity?date=${d}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getSleepSummary(date?: string): Promise<OWSleepSummary | null> {
  if (!owUserId) return null;
  const adminToken = await getAdminToken();
  const d = date ?? new Date().toISOString().split('T')[0];
  const res = await fetch(`${OW_HOST}/api/v1/users/${owUserId}/summaries/sleep?date=${d}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export function isInitialized(): boolean {
  return initialized;
}

export function getUserId(): string | null {
  return owUserId;
}
