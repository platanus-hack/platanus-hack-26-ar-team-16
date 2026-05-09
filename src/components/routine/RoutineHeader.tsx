import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RoutineDay } from '../../modules/routine/types';

interface RoutineHeaderProps {
  selectedDay: RoutineDay | null;
  onPressCalendar: () => void;
}

export function RoutineHeader({ selectedDay, onPressCalendar }: RoutineHeaderProps) {
  const subtitle = selectedDay
    ? [selectedDay.name.toUpperCase(), ...(selectedDay.muscle_groups ?? []).map(g => g.toUpperCase())].join(' · ')
    : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.section}>MI ENTRENAMIENTO</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable
        onPress={onPressCalendar}
        accessibilityRole="button"
        accessibilityLabel="Abrir calendario"
        style={({ pressed }) => [styles.calBtn, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="calendar-outline" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  section: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#b8b8b8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B00',
    letterSpacing: 0.5,
  },
  calBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
