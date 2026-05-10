const OPEN_WEARABLES_DISABLED_MESSAGE =
  'Open Wearables requires the server-side ow-bridge before it can be used safely.';

export async function initOpenWearables(): Promise<void> {
  throw new Error(OPEN_WEARABLES_DISABLED_MESSAGE);
}

export async function syncNow(): Promise<void> {
  throw new Error(OPEN_WEARABLES_DISABLED_MESSAGE);
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

export async function getActivitySummary(_date?: string): Promise<OWActivitySummary | null> {
  return null;
}

export async function getSleepSummary(_date?: string): Promise<OWSleepSummary | null> {
  return null;
}

export async function getWorkouts(_date?: string): Promise<OWWorkout[]> {
  return [];
}

export function isInitialized(): boolean {
  return false;
}

export function getUserId(): string | null {
  return null;
}
