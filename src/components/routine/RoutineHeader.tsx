import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RoutineDay } from '../../modules/routine/types';

interface RoutineHeaderProps {
  selectedDay: RoutineDay | null;
  onPressCalendar: () => void;
  /** Active routine name shown as the header title (replaces the static label
   *  when present so the user always sees which routine they're viewing). */
  activeRoutineName?: string | null;
}

export function RoutineHeader({ onPressCalendar, activeRoutineName }: RoutineHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.section}>MI ENTRENAMIENTO</Text>
        {activeRoutineName && (
          <Text style={styles.name} numberOfLines={1}>
            {activeRoutineName}
          </Text>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  section: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#B8B8B8',
    textTransform: 'uppercase',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
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
