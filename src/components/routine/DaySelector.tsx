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
        const letter = String.fromCharCode(65 + idx);

        return (
          <Pressable
            key={day.id}
            onPress={() => onSelect(day.id)}
            accessibilityRole="button"
            accessibilityLabel={`Día ${letter}: ${day.name}`}
            accessibilityState={{ selected: isActive }}
            style={[
              { minWidth: 64, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
              isActive
                ? { backgroundColor: '#FF6B00' }
                : { backgroundColor: '#27272A', borderWidth: 1, borderColor: '#3F3F46' },
            ]}
          >
            <View
              style={[
                { width: 28, height: 28, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
                isActive
                  ? { backgroundColor: 'rgba(255,255,255,0.25)' }
                  : { backgroundColor: '#3F3F46' },
              ]}
            >
              <Text
                style={[
                  { fontSize: 14, fontWeight: '700' },
                  isActive ? { color: '#FFFFFF' } : { color: '#D4D4D8' },
                ]}
              >
                {letter}
              </Text>
            </View>
            <Text
              style={[
                { fontSize: 14, fontWeight: '600' },
                isActive ? { color: '#FFFFFF' } : { color: '#E4E4E7' },
              ]}
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
