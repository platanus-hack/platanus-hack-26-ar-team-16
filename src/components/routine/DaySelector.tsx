import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

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
        const isRest = !day.exercises?.length;
        const muscle = isRest ? 'REST' : (day.muscle_groups?.[0] ?? day.name);
        const label = (muscle || '').toUpperCase();

        return (
          <Pressable
            key={day.id}
            onPress={() => onSelect(day.id)}
            accessibilityRole="button"
            accessibilityLabel={`${abbrev}: ${label}`}
            accessibilityState={{ selected: isActive }}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text
              style={[styles.weekday, isActive && styles.weekdayActive]}
              numberOfLines={1}
            >
              {abbrev}
            </Text>
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {label}
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
    minWidth: 110,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#FF6B00',
  },
  weekday: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  weekdayActive: {
    color: 'rgba(0,0,0,0.7)',
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: '#000',
  },
});
