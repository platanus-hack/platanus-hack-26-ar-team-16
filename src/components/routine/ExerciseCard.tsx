import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import type { Exercise } from '../../modules/routine/types';
import { formatRest } from '../../modules/routine/groupByDay';

interface ExerciseCardProps {
  exercise: Exercise;
  /** Pulse the card border briefly when realtime patches this row. */
  highlighted?: boolean;
  onPress?: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, highlighted, onPress }: ExerciseCardProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!highlighted) return;
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: false }),
    ]).start();
  }, [highlighted, pulse]);

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(63,63,70,1)', 'rgba(255,107,0,0.95)'],
  });

  const setsLabel = exercise.sets > 0 ? `${exercise.sets}×` : '';
  const repsLabel = exercise.reps?.trim() || '–';
  const restLabel = formatRest(exercise.rest_seconds);
  const weightLabel =
    exercise.weight_kg != null && exercise.weight_kg > 0
      ? `${exercise.weight_kg} kg`
      : null;

  const Body = (
    <Animated.View
      style={{ borderColor, borderWidth: 1.5, backgroundColor: '#18181B', borderRadius: 16, padding: 16, flexDirection: 'row' }}
    >
      <View style={{ width: 4, borderRadius: 9999, backgroundColor: '#FF6B00', marginRight: 16 }} />

      <View style={{ flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 }} numberOfLines={2}>
          {exercise.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={{ color: '#FF6B00', fontSize: 14, fontWeight: '700', marginRight: 12 }}>
            {setsLabel}{repsLabel}
          </Text>

          {weightLabel ? (
            <Text style={{ color: '#D4D4D8', fontSize: 14, fontWeight: '500', marginRight: 12 }}>{weightLabel}</Text>
          ) : null}

          {restLabel ? (
            <Text style={{ color: '#A1A1AA', fontSize: 12 }}>{restLabel} descanso</Text>
          ) : null}
        </View>

        {exercise.notes ? (
          <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 8, fontStyle: 'italic' }} numberOfLines={2}>
            {exercise.notes}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );

  if (!onPress) return Body;

  return (
    <Pressable onPress={() => onPress(exercise)}>
      {Body}
    </Pressable>
  );
}
