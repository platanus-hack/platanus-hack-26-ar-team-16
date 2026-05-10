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
      <Text style={styles.section}>RUTINAS</Text>
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
              style={[styles.card, isActive && styles.cardActive]}
            >
              {isActive && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#000"
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[styles.cardText, isActive && styles.cardTextActive]}
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
    paddingTop: 4,
    paddingBottom: 6,
  },
  section: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#262626',
  },
  cardActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  cardText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cardTextActive: {
    color: '#000',
  },
});
