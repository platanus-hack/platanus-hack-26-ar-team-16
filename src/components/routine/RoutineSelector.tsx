import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RoutineSummary } from '../../services/routines';

interface RoutineSelectorProps {
  routines: RoutineSummary[];
  onSelect: (routineId: string) => void;
}

export function RoutineSelector({ routines, onSelect }: RoutineSelectorProps) {
  if (routines.length <= 1) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionRow}>
        <Ionicons name="layers-outline" size={12} color="#777" />
        <Text style={styles.section}>RUTINAS</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {routines.map((r) => {
          const isActive = r.isActive;
          return (
            <Pressable
              key={r.id}
              onPress={() => !isActive && onSelect(r.id)}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar a rutina ${r.name}`}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.chip,
                isActive ? styles.chipActive : styles.chipIdle,
                pressed && !isActive && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isActive ? '#000' : '#FF6B00' },
                ]}
              />
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
                numberOfLines={1}
              >
                {r.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0F0F0F',
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  section: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#777',
    textTransform: 'uppercase',
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipIdle: {
    backgroundColor: '#0F0F0F',
    borderColor: '#262626',
  },
  chipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    color: '#D4D4D4',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '800',
  },
});
