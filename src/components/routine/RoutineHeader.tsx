import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Routine } from '../../modules/routine/types';
import { summarizeDays } from '../../modules/routine/groupByDay';

interface RoutineHeaderProps {
  routine: Routine | null;
  onPressCalendar: () => void;
}

export function RoutineHeader({ routine, onPressCalendar }: RoutineHeaderProps) {
  return (
    <View className="px-4 pt-2 pb-1 flex-row items-start justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
          Mi entrenamiento
        </Text>
        <Text className="text-white text-2xl font-bold" numberOfLines={1}>
          {routine?.name ?? 'Sin rutina activa'}
        </Text>

        {routine?.days?.length ? (
          <View className="bg-zinc-800 self-start rounded-full px-3 py-1 mt-2">
            <Text className="text-zinc-200 text-xs font-medium">
              {summarizeDays(routine.days)}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onPressCalendar}
        accessibilityRole="button"
        accessibilityLabel="Abrir calendario"
        className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center active:opacity-70"
      >
        <Text className="text-white text-lg">📅</Text>
      </Pressable>
    </View>
  );
}
