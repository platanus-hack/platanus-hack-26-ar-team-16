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
      style={{ borderColor, borderWidth: 1.5 }}
      className="bg-zinc-900 rounded-2xl p-4 flex-row"
    >
      <View className="w-1 rounded-full bg-primary mr-4" />

      <View className="flex-1">
        <Text className="text-white text-base font-semibold mb-1" numberOfLines={2}>
          {exercise.name}
        </Text>

        <View className="flex-row items-center flex-wrap">
          <Text className="text-primary text-sm font-bold mr-3">
            {setsLabel}{repsLabel}
          </Text>

          {weightLabel ? (
            <Text className="text-zinc-300 text-sm font-medium mr-3">{weightLabel}</Text>
          ) : null}

          {restLabel ? (
            <Text className="text-zinc-400 text-xs">{restLabel} descanso</Text>
          ) : null}
        </View>

        {exercise.notes ? (
          <Text className="text-zinc-400 text-xs mt-2 italic" numberOfLines={2}>
            {exercise.notes}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );

  if (!onPress) return Body;

  return (
    <Pressable onPress={() => onPress(exercise)} className="active:opacity-80">
      {Body}
    </Pressable>
  );
}
