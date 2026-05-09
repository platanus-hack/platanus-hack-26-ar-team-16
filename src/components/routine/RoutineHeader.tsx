import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Routine } from '../../modules/routine/types';
import { summarizeDays } from '../../modules/routine/groupByDay';

interface RoutineHeaderProps {
  routine: Routine | null;
  onPressCalendar: () => void;
}

export function RoutineHeader({ routine, onPressCalendar }: RoutineHeaderProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: '#A1A1AA', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Mi entrenamiento
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }} numberOfLines={1}>
          {routine?.name ?? 'Sin rutina activa'}
        </Text>

        {routine?.days?.length ? (
          <View style={{ backgroundColor: '#27272A', alignSelf: 'flex-start', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 }}>
            <Text style={{ color: '#E4E4E7', fontSize: 12, fontWeight: '500' }}>
              {summarizeDays(routine.days)}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onPressCalendar}
        accessibilityRole="button"
        accessibilityLabel="Abrir calendario"
        style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: '#27272A', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 18 }}>📅</Text>
      </Pressable>
    </View>
  );
}
