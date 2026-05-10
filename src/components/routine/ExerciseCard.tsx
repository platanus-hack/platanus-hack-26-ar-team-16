import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Exercise } from '../../modules/routine/types';
import { formatRest } from '../../modules/routine/groupByDay';

interface ExerciseCardProps {
  exercise: Exercise;
  highlighted?: boolean;
  onPress?: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, highlighted, onPress }: ExerciseCardProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlighted) return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]).start();
  }, [highlighted, pulse]);

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(22,22,22,1)', 'rgba(255,107,0,0.9)'],
  });

  const setsLabel = exercise.sets > 0 ? `${exercise.sets}×` : '';
  const repsLabel = exercise.reps?.trim() || '–';
  const restLabel = formatRest(exercise.rest_seconds);
  const weightLabel =
    exercise.weight_kg != null && exercise.weight_kg > 0
      ? `${exercise.weight_kg} kg`
      : null;

  const setsRepsTag = `${setsLabel}${repsLabel}`;
  const subParts = [
    weightLabel,
    restLabel ? `${restLabel} desc` : null,
  ].filter(Boolean) as string[];

  const card = (
    <Animated.View style={[styles.card, { borderColor }]}>
      <View style={styles.textWrap}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>
        {subParts.length > 0 && (
          <Text style={styles.sub} numberOfLines={1}>
            {subParts.join(' · ')}
          </Text>
        )}
      </View>
      <Text style={styles.tag}>{setsRepsTag}</Text>
      <Ionicons name="chevron-forward" size={14} color="#555" style={{ marginLeft: 4 }} />
    </Animated.View>
  );

  if (!onPress) return card;

  return (
    <Pressable onPress={() => onPress(exercise)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  sub: {
    fontSize: 10,
    color: '#888',
    marginTop: 1,
  },
  tag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
    fontVariant: ['tabular-nums'],
  },
});
