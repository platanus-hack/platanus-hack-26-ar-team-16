import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExerciseLog } from './exerciseLog';

const PREFIX = '@gohan/log/';

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  date.setDate(date.getDate() - diff);
  return date;
}

export interface WeekStreak {
  daysTrained: number;
  totalLogs: number;
  trainedDates: string[]; // YYYY-MM-DD, sorted
}

/** Count distinct days with at least one logged set in the current week (Mon–Sun). */
export async function getWeekStreak(now: Date = new Date()): Promise<WeekStreak> {
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  try {
    const keys = await AsyncStorage.getAllKeys();
    const logKeys = keys.filter((k) => k.startsWith(PREFIX));
    if (logKeys.length === 0) return { daysTrained: 0, totalLogs: 0, trainedDates: [] };

    const entries = await AsyncStorage.multiGet(logKeys);
    const dates = new Set<string>();
    let totalLogs = 0;

    for (const [, raw] of entries) {
      if (!raw) continue;
      try {
        const log = JSON.parse(raw) as ExerciseLog;
        const ts = new Date(log.loggedAt);
        if (ts >= weekStart && ts < weekEnd) {
          totalLogs++;
          dates.add(ts.toISOString().split('T')[0]);
        }
      } catch {
        // skip malformed
      }
    }

    return {
      daysTrained: dates.size,
      totalLogs,
      trainedDates: Array.from(dates).sort(),
    };
  } catch {
    return { daysTrained: 0, totalLogs: 0, trainedDates: [] };
  }
}
