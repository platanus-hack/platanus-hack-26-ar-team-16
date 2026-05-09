import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Exercise } from '../../modules/routine/types';
import { formatRest } from '../../modules/routine/groupByDay';

interface ExerciseDetailScreenProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseDetailScreen({ exercise, onClose }: ExerciseDetailScreenProps) {
  if (!exercise) return null;

  const setsLabel = exercise.sets > 0 ? `${exercise.sets}×` : '';
  const repsLabel = exercise.reps?.trim() || '–';
  const restLabel = formatRest(exercise.rest_seconds);
  const weightLabel =
    exercise.weight_kg != null && exercise.weight_kg > 0
      ? `${exercise.weight_kg} kg`
      : null;

  const metaParts = [
    `${setsLabel}${repsLabel}`,
    weightLabel,
    restLabel ? `${restLabel} descanso` : null,
  ].filter(Boolean) as string[];

  return (
    <Modal
      visible={!!exercise}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.hdr}>
          <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.hdrTitle} numberOfLines={1}>{exercise.name.toUpperCase()}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Video placeholder */}
          <View style={styles.video}>
            <Ionicons name="play-circle" size={40} color="#FF6B00" />
            <Text style={styles.videoLbl}>VIDEO PRÓXIMAMENTE</Text>
            <Text style={styles.videoSub}>Demostración de la técnica</Text>
          </View>

          {/* Exercise info */}
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.meta}>{metaParts.join(' · ')}</Text>

          {exercise.notes ? (
            <>
              <Text style={styles.sectionTitle}>NOTAS</Text>
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{exercise.notes}</Text>
              </View>
            </>
          ) : null}

          {/* Tips placeholder — future: populated by AI or Supabase */}
          <Text style={styles.sectionTitle}>CÓMO HACERLO BIEN</Text>
          {[
            'Controlá el movimiento en la fase excéntrica (bajada). No uses impulso.',
            'Mantené el core activado durante todo el recorrido.',
            'Si el peso compromete la técnica, bajalo. Primero el patrón de movimiento.',
          ].map((tip, i) => (
            <View key={i} style={styles.tip}>
              <View style={styles.tipNum}>
                <Text style={styles.tipNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  hdrTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#fff',
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  videoLbl: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#888',
  },
  videoSub: {
    fontSize: 10,
    color: '#555',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  meta: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#b8b8b8',
    marginBottom: 10,
    marginTop: 4,
  },
  noteBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  noteText: {
    fontSize: 13,
    color: '#d8d8d8',
    lineHeight: 20,
  },
  tip: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  tipNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#d8d8d8',
  },
});
