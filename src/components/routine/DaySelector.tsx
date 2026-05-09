import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { RoutineDay } from '../../modules/routine/types';

interface DaySelectorProps {
  days: RoutineDay[];
  selectedDayId: string | null;
  onSelect: (dayId: string) => void;
}

export function DaySelector({ days, selectedDayId, onSelect }: DaySelectorProps) {
  if (!days.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
    >
      {days.map((day, idx) => {
        const isActive = day.id === selectedDayId;
        const letter = String.fromCharCode(65 + idx); // A, B, C, ...

        return (
          <Pressable
            key={day.id}
            onPress={() => onSelect(day.id)}
            accessibilityRole="button"
            accessibilityLabel={`Día ${letter}: ${day.name}`}
            accessibilityState={{ selected: isActive }}
            className={[
              'min-w-[64px] px-4 py-2 rounded-2xl flex-row items-center',
              isActive ? 'bg-primary' : 'bg-zinc-800 border border-zinc-700',
            ].join(' ')}
          >
            <View
              className={[
                'w-7 h-7 rounded-full items-center justify-center mr-2',
                isActive ? 'bg-white/25' : 'bg-zinc-700',
              ].join(' ')}
            >
              <Text
                className={[
                  'text-sm font-bold',
                  isActive ? 'text-white' : 'text-zinc-300',
                ].join(' ')}
              >
                {letter}
              </Text>
            </View>
            <Text
              className={[
                'text-sm font-semibold',
                isActive ? 'text-white' : 'text-zinc-200',
              ].join(' ')}
              numberOfLines={1}
            >
              {day.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
