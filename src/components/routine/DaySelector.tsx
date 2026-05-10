import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { RoutineDay } from '../../modules/routine/types';

interface DaySelectorProps {
  days: RoutineDay[];
  selectedDayId: string | null;
  onSelect: (dayId: string) => void;
}

// Aligned to Postgres / JS Date day_of_week convention: 0=Sun ... 6=Sat.
// Indexed directly by `day.day_index` (the DB's `day_of_week`). Previously
// this array was Lun-first, which silently shifted every label by one day
// vs. what the AI / DB believed the day was — user saw an exercise under
// "VIE" but the DB had it on day_of_week=4 (Thursday), so when they asked
// Gohan to edit "el viernes" the bot looked at day_of_week=5 and found
// nothing. Aligning to the DB convention fixes the mismatch.
const DAY_ABBREVS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// Visual order: Monday first, Sunday last (Argentina convention). The DB
// stores day_of_week with Sunday=0, but for the pill row the user expects
// to see the week starting on Monday. Sort doesn't change day.day_index.
function sortMondayFirst(days: RoutineDay[]): RoutineDay[] {
  return [...days].sort((a, b) => {
    const orderA = a.day_index === 0 ? 7 : a.day_index;
    const orderB = b.day_index === 0 ? 7 : b.day_index;
    return orderA - orderB;
  });
}

export function DaySelector({ days, selectedDayId, onSelect }: DaySelectorProps) {
  if (!days.length) return null;

  const orderedDays = sortMondayFirst(days);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {orderedDays.map((day, idx) => {
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
    paddingTop: 10,
    paddingBottom: 12,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  pillActive: {
    backgroundColor: '#FF6B00',
  },
  weekday: {
    fontSize: 10,
    lineHeight: 14,
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
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    includeFontPadding: false as any,
  },
  labelActive: {
    color: '#000',
  },
});
