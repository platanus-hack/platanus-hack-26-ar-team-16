import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Exercise } from '../../modules/routine/types';
import { formatRest } from '../../modules/routine/groupByDay';
import { getLastLog } from '../../services/exerciseLog';
import type { ExerciseLog } from '../../services/exerciseLog';

// Cardio exercises are detected by name — for these we show duration in minutes
// instead of a sets×reps tag (e.g. "20min" instead of "1×20").
const CARDIO_KEYWORDS = [
  'caminata', 'cinta', 'trotada', 'trote', 'correr', 'running', 'cardio',
  'bicicleta', 'bici', 'bike', 'spinning', 'elíptica', 'eliptica',
  'step', 'soga', 'saltar soga', 'jumprope', 'natación', 'nadar', 'swimming',
  'remo ergómetro', 'remo máquina', 'caminar',
];

function isCardio(name: string): boolean {
  const lower = name.toLowerCase();
  return CARDIO_KEYWORDS.some((k) => lower.includes(k));
}

function formatTag(exercise: Exercise): string {
  if (isCardio(exercise.name)) {
    const reps = exercise.reps?.trim() || '0';
    if (exercise.sets > 1) return `${exercise.sets}×${reps}min`;
    return `${reps}min`;
  }
  const setsLabel = exercise.sets > 0 ? `${exercise.sets}×` : '';
  const repsLabel = exercise.reps?.trim() || '–';
  return `${setsLabel}${repsLabel}`;
}

function formatLastLog(log: ExerciseLog): string {
  const parts: string[] = [];
  if (log.weight != null && log.weight > 0) parts.push(`${log.weight}kg`);
  parts.push(`×${log.reps}`);
  return `↑ ${parts.join(' ')}`;
}

interface ExerciseCardProps {
  exercise: Exercise;
  highlighted?: boolean;
  onPress?: (exercise: Exercise) => void;
  onPressLog?: (exercise: Exercise) => void;
  logVersion?: number;
}

export function ExerciseCard({
  exercise,
  highlighted,
  onPress,
  onPressLog,
  logVersion = 0,
}: ExerciseCardProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [lastLog, setLastLog] = useState<ExerciseLog | null>(null);

  useEffect(() => {
    getLastLog(exercise.id).then(setLastLog).catch(() => {});
  }, [exercise.id, logVersion]);

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

  const restLabel = formatRest(exercise.rest_seconds);
  const weightLabel =
    exercise.weight_kg != null && exercise.weight_kg > 0
      ? `${exercise.weight_kg} kg`
      : null;

  const subParts = [weightLabel, restLabel ? `${restLabel} desc` : null].filter(
    Boolean,
  ) as string[];

  const tag = formatTag(exercise);

  return (
    <Animated.View style={[styles.card, { borderColor }]}>
      {/* Main tappable area: name + sub + tag */}
      <Pressable
        onPress={onPress ? () => onPress(exercise) : undefined}
        style={({ pressed }) => [styles.body, { opacity: pressed ? 0.75 : 1 }]}
      >
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {exercise.name}
          </Text>
          <View style={styles.subRow}>
            {subParts.length > 0 && (
              <Text style={styles.sub} numberOfLines={1}>
                {subParts.join(' · ')}
              </Text>
            )}
            {lastLog && (
              <Text style={styles.lastLog} numberOfLines={1}>
                {subParts.length > 0 ? '  ' : ''}{formatLastLog(lastLog)}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.tag}>{tag}</Text>
        <Ionicons name="chevron-forward" size={14} color="#555" style={{ marginLeft: 4 }} />
      </Pressable>

      {/* Log button */}
      {onPressLog && (
        <Pressable
          onPress={() => onPressLog(exercise)}
          hitSlop={8}
          style={({ pressed }) => [styles.logBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FF6B00" />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
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
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  sub: {
    fontSize: 10,
    color: '#888',
    marginTop: 1,
  },
  lastLog: {
    fontSize: 10,
    color: '#FF6B00',
    marginTop: 1,
    fontWeight: '600',
  },
  tag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  logBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
