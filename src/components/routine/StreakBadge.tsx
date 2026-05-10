import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StreakBadgeProps {
  daysTrained: number;
  onPress?: () => void;
  variant?: 'pill' | 'chip';
}

export function StreakBadge({ daysTrained, onPress, variant = 'pill' }: StreakBadgeProps) {
  const dim = daysTrained === 0;
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Racha: ${daysTrained} días entrenados esta semana`}
      style={({ pressed }: { pressed?: boolean }) => [
        variant === 'chip' ? styles.chip : styles.pill,
        dim && { opacity: 0.55 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <MaterialCommunityIcons name="fire" size={variant === 'chip' ? 14 : 16} color="#FF6B00" />
      <Text style={[styles.text, variant === 'chip' && { fontSize: 12 }]}>
        {daysTrained}
        <Text style={styles.suffix}>/7</Text>
      </Text>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,0,0.12)',
  },
  text: {
    color: '#FF6B00',
    fontWeight: '700',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  suffix: { color: '#FF6B00', opacity: 0.6, fontWeight: '600' },
});
