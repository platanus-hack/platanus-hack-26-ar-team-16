// Inner views for `<GohanCoach />`. These are the **router-free** mirror of
// the screens at `app/(tabs)/coach.tsx` and `app/(tabs)/routine.tsx` so the
// embedded module can render them outside Expo Router. The standalone app
// keeps using its tab screens — those screens delegate to these views (see
// next commit) so render code lives in exactly one place.

import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MessageList, MessageInput, CoachStylePicker } from '@/components/chat';
import {
  CalendarModal,
  DaySelector,
  EmptyState,
  ExerciseCard,
  ExerciseDetailScreen,
  RoutineHeader,
  RoutineSelector,
} from '@/components/routine';
import { useTheme } from '@/theme';
import { useChatStore, useAuthStore, useRoutineStore } from '@/store';
import { sendUserMessage, seedWelcomeMessage } from '@/modules/chat';
import { useSpeechRecognition, useRealtimeRoutine } from '@/hooks';
import { normalizeRoutine, sortExercises } from '@/modules/routine/groupByDay';
import type { Exercise } from '@/modules/routine/types';
import { setActiveRoutine } from '@/services/routines';
import { toast } from '@/store';

interface CommonProps {
  onError?: (e: Error) => void;
}

export function CoachChatView({ onError }: CommonProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.streaming.isStreaming);
  const activeTool = useChatStore((s) => s.activeTool);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const theme = useTheme();
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  // Wait for auth hydration so seedWelcomeMessage() can branch on
  // `userProfile.onboardingCompleted` and the active coach style.
  useEffect(() => {
    if (!isAuthLoading) seedWelcomeMessage();
  }, [isAuthLoading]);

  const handleSend = (text: string) => {
    void sendUserMessage(text).catch((e) => onError?.(e instanceof Error ? e : new Error(String(e))));
  };

  const handleStopRecording = async () => {
    const text = await stopListening();
    if (text.trim()) {
      void sendUserMessage(text.trim()).catch((e) =>
        onError?.(e instanceof Error ? e : new Error(String(e))),
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#1A1A1A',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.primary,
            }}
          >
            <Ionicons name="fitness" size={16} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Gohan</Text>
        </View>
        <CoachStylePicker />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1">
          <MessageList messages={messages} isStreaming={isStreaming} activeTool={activeTool} />
        </View>
        <MessageInput
          onSend={handleSend}
          onStartRecording={startListening}
          onStopRecording={handleStopRecording}
          isRecording={isListening}
          liveTranscript={transcript}
          disabled={isStreaming}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export interface CoachRoutineViewProps extends CommonProps {
  /** Called when the user taps "empty state → start chat" so the host can
   *  navigate. Defaults to a no-op (embedded hosts can wire their own nav). */
  onRequestChat?: () => void;
}

export function CoachRoutineView({ onError, onRequestChat }: CoachRoutineViewProps) {
  const userId = useAuthStore((s) => s.user?.id ?? null) ?? undefined;

  useRealtimeRoutine(userId);

  const rawRoutine = useRoutineStore((s) => s.routine);
  const routines = useRoutineStore((s) => s.routines);
  const isLoading = useRoutineStore((s) => s.isLoading);

  const handleSwitchRoutine = async (routineId: string) => {
    if (!userId) return;
    try {
      await setActiveRoutine(userId, routineId);
      // Realtime listener picks up the change and refetches.
    } catch (err) {
      toast.error('No pudimos cambiar la rutina.');
      onError?.(err as Error);
    }
  };

  const routine = useMemo(() => normalizeRoutine(rawRoutine), [rawRoutine]);

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

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

  // Recently-changed pulse — same logic as the original routine.tsx.
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
    [routine, selectedDayId],
  );

  const exercises = useMemo(() => sortExercises(selectedDay?.exercises), [selectedDay]);

  // Surface fetch errors when realtime/refetch reports something exceptional.
  // (Today the hook only console.warns; wiring a callback through is Phase 3.)
  void onError;

  if (isLoading && !routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
        <RoutineHeader selectedDay={null} onPressCalendar={() => {}} />
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
        <RoutineHeader selectedDay={null} onPressCalendar={() => setCalendarVisible(true)} />
        <EmptyState onStartChat={() => onRequestChat?.()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <RoutineHeader
        selectedDay={selectedDay}
        onPressCalendar={() => setCalendarVisible(true)}
        activeRoutineName={routine.name}
      />

      <RoutineSelector routines={routines} onSelect={handleSwitchRoutine} />

      <DaySelector
        days={routine.days}
        selectedDayId={selectedDayId}
        onSelect={setSelectedDayId}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
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
              onPress={(e) => setSelectedExercise(e)}
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

      <ExerciseDetailScreen
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </SafeAreaView>
  );
}
