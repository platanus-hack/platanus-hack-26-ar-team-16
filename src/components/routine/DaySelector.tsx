import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RoutineDay } from '../../modules/routine/types';

interface DaySelectorProps {
  days: RoutineDay[];
  selectedDayId: string | null;
  onSelect: (dayId: string) => void;
}

export function DaySelector({ days, selectedDayId, onSelect }: DaySelectorProps) {
  if (!days.length) return null;

  return (
    <View style={styles.outer}>
      <View style={styles.sectionRow}>
        <Ionicons name="grid-outline" size={12} color="#777" />
        <Text style={styles.section}>DÍAS</Text>
      </View>
      <View style={styles.wrap}>
        {days.map((day) => {
          const isActive = day.id === selectedDayId;
          const isRest = !day.exercises?.length;
          const title = isRest
            ? 'REST'
            : (day.name || day.muscle_groups?.[0] || '').toUpperCase();

          return (
            <Pressable
              key={day.id}
              onPress={() => onSelect(day.id)}
              accessibilityRole="button"
              accessibilityLabel={title}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.pill,
                isActive ? styles.pillActive : styles.pillIdle,
                pressed && !isActive && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#020202',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1A1A1A',
    paddingTop: 12,
    paddingBottom: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  section: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#777',
    textTransform: 'uppercase',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pillIdle: {
    backgroundColor: '#1B1B1B',
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#1B1B1B',
    borderColor: '#FF6B00',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  labelInactive: {
    color: '#7A7A7A',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
