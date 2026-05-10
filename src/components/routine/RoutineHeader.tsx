import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RoutineDay } from '../../modules/routine/types';

interface RoutineHeaderProps {
  selectedDay: RoutineDay | null;
  onPressCalendar: () => void;
}

export function RoutineHeader({ onPressCalendar }: RoutineHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>MI ENTRENAMIENTO</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#B8B8B8',
    textTransform: 'uppercase',
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
