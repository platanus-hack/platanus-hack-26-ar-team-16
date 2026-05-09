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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top']}>
        <RoutineHeader routine={null} onPressCalendar={() => {}} />
        <View style={{ paddingHorizontal: 16, marginTop: 12, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ height: 96, borderRadius: 16, backgroundColor: '#18181B' }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (!routine || !routine.days?.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top']}>
        <RoutineHeader routine={null} onPressCalendar={() => setCalendarVisible(true)} />
        <EmptyState onStartChat={() => router.push('/(tabs)/coach')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top']}>
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
          <View style={{ backgroundColor: '#18181B', borderRadius: 16, padding: 24, alignItems: 'center' }}>
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
    <View style={{ backgroundColor: '#18181B', borderRadius: 16, padding: 16 }}>
      <Text style={{ color: '#A1A1AA', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Entrenamiento de hoy
      </Text>
      <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{day.name}</Text>
      {day.muscle_groups?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {day.muscle_groups.map((m) => (
            <View key={m} style={{ backgroundColor: 'rgba(255,107,0,0.2)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#FF6B00', fontSize: 12, fontWeight: '600' }}>{m}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
