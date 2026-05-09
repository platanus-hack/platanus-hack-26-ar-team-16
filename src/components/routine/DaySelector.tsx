import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RoutineDay } from '../../modules/routine/types';

interface DaySelectorProps {
  days: RoutineDay[];
  selectedDayId: string | null;
  onSelect: (dayId: string) => void;
}

const DAY_ABBREVS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
        const sub = day.muscle_groups?.length
          ? day.muscle_groups.slice(0, 2).join(' · ')
          : DAY_ABBREVS[idx % 7];

        return (
          <Pressable
            key={day.id}
            onPress={() => onSelect(day.id)}
            accessibilityRole="button"
            accessibilityLabel={`${day.name}: ${sub}`}
            accessibilityState={{ selected: isActive }}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={[styles.pillName, isActive && styles.pillNameActive]} numberOfLines={1}>
              {day.name}
            </Text>
            <Text style={[styles.pillSub, isActive && styles.pillSubActive]} numberOfLines={1}>
              {sub}
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
    minWidth: 70,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#FF6B00',
  },
  pillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  pillNameActive: {
    color: '#fff',
  },
  pillSub: {
    fontSize: 10,
    color: '#b8b8b8',
  },
  pillSubActive: {
    color: '#fff',
  },
});
