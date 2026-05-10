import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExerciseLog {
  weight: number | null;
  reps: number;
  loggedAt: string;
}

const key = (id: string) => `@gohan/log/${id}`;

export async function getLastLog(exerciseId: string): Promise<ExerciseLog | null> {
  try {
    const raw = await AsyncStorage.getItem(key(exerciseId));
    return raw ? (JSON.parse(raw) as ExerciseLog) : null;
  } catch {
    return null;
  }
}

export async function saveLog(
  exerciseId: string,
  log: { weight: number | null; reps: number },
): Promise<void> {
  const entry: ExerciseLog = { ...log, loggedAt: new Date().toISOString() };
  await AsyncStorage.setItem(key(exerciseId), JSON.stringify(entry));
}
