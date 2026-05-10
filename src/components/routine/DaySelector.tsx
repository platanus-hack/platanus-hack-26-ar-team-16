import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RoutineDay } from '../../modules/routine/types';

interface DaySelectorProps {
  days: RoutineDay[];
  selectedDayId: string | null;
  onSelect: (dayId: string) => void;
}

const DAY_ABBREVS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export function DaySelector({ days, selectedDayId, onSelect }: DaySelectorProps) {
  if (!days.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day, idx) => {
        const isActive = day.id === selectedDayId;
        const abbrev = DAY_ABBREVS[day.day_index] ?? DAY_ABBREVS[idx % 7];
        const muscle = day.muscle_groups?.[0] ?? day.name;

        return (
          <Pressable
            key={day.id}
            onPress={() => onSelect(day.id)}
            accessibilityRole="button"
            accessibilityLabel={`${abbrev}: ${muscle}`}
            accessibilityState={{ selected: isActive }}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={styles.pillName} numberOfLines={1}>
              {abbrev}
            </Text>
            <Text style={[styles.pillSub, isActive && styles.pillSubActive]} numberOfLines={1}>
              {muscle}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    minWidth: 88,
    height: 64,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#FF6B00',
  },
  pillName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pillSub: {
    fontSize: 11,
    color: '#B8B8B8',
    marginTop: 2,
  },
  pillSubActive: {
    color: '#FFFFFF',
  },
});
