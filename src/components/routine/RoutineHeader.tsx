import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RoutineDay } from '../../modules/routine/types';
import { StreakBadge } from './StreakBadge';

interface RoutineHeaderProps {
  selectedDay: RoutineDay | null;
  /** Active routine name shown as the header title (replaces the static label
   *  when present so the user always sees which routine they're viewing). */
  activeRoutineName?: string | null;
  /** Streak info — when provided, shows a tappable fire badge that opens the
   *  weekly streak modal. */
  streakDays?: number;
  onPressStreak?: () => void;
}

export function RoutineHeader({
  activeRoutineName,
  streakDays,
  onPressStreak,
}: RoutineHeaderProps) {
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
      {typeof streakDays === 'number' && (
        <StreakBadge daysTrained={streakDays} onPress={onPressStreak} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
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
});
