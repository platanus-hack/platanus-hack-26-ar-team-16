import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
  CalendarModal,
  DaySelector,
  EmptyState,
  ExerciseCard,
  RoutineHeader,
} from '../../src/components/routine';
import {
  normalizeRoutine,
  sortExercises,
} from '../../src/modules/routine/groupByDay';
import type { Exercise } from '../../src/modules/routine/types';

// useRealtimeRoutine writes to useRoutineStore — it returns void.
// Read routine and isLoading from the store directly.
import { useRealtimeRoutine } from '../../src/hooks/useRealtimeRoutine';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRoutineStore } from '../../src/store/useRoutineStore';

export default function RoutineScreen() {
  const userId = useAuthStore((s: any) => s.user?.id ?? null);

  useRealtimeRoutine(userId);

  const rawRoutine = useRoutineStore((s) => s.routine);
  const isLoading = useRoutineStore((s) => s.isLoading);

  const routine = useMemo(() => normalizeRoutine(rawRoutine), [rawRoutine]);

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (!routine?.days?.length) {
      setSelectedDayId(null);
      return;
    }
    const stillExists = routine.days.some((d) => d.id === selectedDayId);
    if (!stillExists) {
      setSelectedDayId(routine.days[0].id);
    }
  }, [routine, selectedDayId]);

  // Track which exercises changed since the last realtime push so we can
  // pulse the card border (the "AI updated your routine" wow moment).
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());
  const previousIds = React.useRef<Set<string>>(new Set());
  const previousByKey = React.useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!routine?.days) return;
    const allExercises = routine.days.flatMap((d) => d.exercises ?? []);

    const newlyChanged = new Set<string>();
    const newKeyMap = new Map<string, string>();

    for (const ex of allExercises) {
      const key = `${ex.name}|${ex.sets}|${ex.reps}|${ex.weight_kg}|${ex.rest_seconds}`;
      const prevKey = previousByKey.current.get(ex.id);
      if (previousIds.current.size > 0 && prevKey !== undefined && prevKey !== key) {
        newlyChanged.add(ex.id);
      }
      newKeyMap.set(ex.id, key);
    }

    previousIds.current = new Set(newKeyMap.keys());
    previousByKey.current = newKeyMap;

    if (newlyChanged.size > 0) {
      setRecentlyChanged(newlyChanged);
      const timeout = setTimeout(() => setRecentlyChanged(new Set()), 1500);
      return () => clearTimeout(timeout);
    }
  }, [routine]);

  const selectedDay = useMemo(
    () => routine?.days?.find((d) => d.id === selectedDayId) ?? null,
    [routine, selectedDayId]
  );

  const exercises = useMemo(
    () => sortExercises(selectedDay?.exercises),
    [selectedDay]
  );

  if (isLoading && !routine) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={['top']}>
        <RoutineHeader routine={null} onPressCalendar={() => {}} />
        <View className="px-4 mt-3 gap-3">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-24 rounded-2xl bg-zinc-900" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (!routine || !routine.days?.length) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={['top']}>
        <RoutineHeader routine={null} onPressCalendar={() => setCalendarVisible(true)} />
        <EmptyState onStartChat={() => router.push('/(tabs)/coach')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <RoutineHeader
        routine={routine}
        onPressCalendar={() => setCalendarVisible(true)}
      />

      <DaySelector
        days={routine.days}
        selectedDayId={selectedDayId}
        onSelect={setSelectedDayId}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {selectedDay ? <SelectedDayBanner day={selectedDay} /> : null}

        {exercises.length === 0 ? (
          <View className="bg-zinc-900 rounded-2xl p-6 items-center">
            <ExerciseCard
              exercise={{
                id: 'no-exercises',
                day_id: selectedDay?.id ?? '',
                name: 'Este día no tiene ejercicios todavía',
                sets: 0,
                reps: '',
                notes: 'Pedile a Gohan que te lo arme desde el chat.',
                order_index: 0,
              }}
            />
          </View>
        ) : (
          exercises.map((ex: Exercise) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              highlighted={recentlyChanged.has(ex.id)}
              onPress={() => {}}
            />
          ))
        )}
      </ScrollView>

      <CalendarModal
        visible={calendarVisible}
        days={routine.days}
        onClose={() => setCalendarVisible(false)}
        onSelectDay={(dayId) => setSelectedDayId(dayId)}
      />
    </SafeAreaView>
  );
}

function SelectedDayBanner({ day }: { day: { name: string; muscle_groups?: string[] | null } }) {
  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
        Entrenamiento de hoy
      </Text>
      <Text className="text-white text-xl font-bold mb-2">{day.name}</Text>
      {day.muscle_groups?.length ? (
        <View className="flex-row flex-wrap gap-2">
          {day.muscle_groups.map((m) => (
            <View key={m} className="bg-primary/20 rounded-full px-2.5 py-1">
              <Text className="text-primary text-xs font-semibold">{m}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
