import React, { useMemo } from 'react';
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

import type { RoutineDay } from '../../modules/routine/types';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  days: RoutineDay[];
  onSelectDay: (dayId: string) => void;
}

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DOW_LABELS = ['L','M','M','J','V','S','D'];

const WORKOUT_DOT_COLOR: Record<string, string> = {
  push: '#FF6B00',
  pull: '#3B82F6',
  legs: '#10B981',
  cardio: '#A855F7',
};
const DOT_LEGEND = [
  { color: '#FF6B00', label: 'Push' },
  { color: '#3B82F6', label: 'Pull' },
  { color: '#10B981', label: 'Legs' },
  { color: '#A855F7', label: 'Cardio' },
];
function getDotColor(workout: string): string {
  return WORKOUT_DOT_COLOR[workout.toLowerCase()] ?? '#FF6B00';
}

// Mock — reemplazar cuando Dante exponga getWorkoutsForMonth(userId, year, month)
const TRAINED_DATES_MAY_2026: { date: number; workout: 'push' | 'pull' | 'legs' }[] = [
  { date: 4, workout: 'push' },
  { date: 6, workout: 'pull' },
  { date: 8, workout: 'legs' },
  { date: 11, workout: 'push' },
  { date: 13, workout: 'pull' },
  { date: 15, workout: 'legs' },
];

interface CalCell {
  date: number | null;
  type: 'empty' | 'done' | 'scheduled' | 'rest' | 'today-done' | 'today-scheduled' | 'today-rest';
  badge: string;
  dayId: string | null;
}

function buildCells(days: RoutineDay[]): { cells: CalCell[]; monthLabel: string; summary: Record<string, number> } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const monthLabel = `${MONTHS_ES[month]} ${year}`;

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset
  const firstDow = (first.getDay() + 6) % 7;

  // Map weekday (0=Mon) → routine day. Round-robin through days.
  // Weekdays 5 (Sat) and 6 (Sun) default to rest if no day assigned.
  const workDays = days.filter(Boolean);

  function getDayForWeekday(dow: number): RoutineDay | null {
    if (!workDays.length) return null;
    // Assign the first N weekdays (Mon-Fri) to routine days in order
    const WORK_DOW = [0, 1, 2, 3, 4]; // Mon-Fri
    const idx = WORK_DOW.indexOf(dow);
    if (idx === -1) return null; // weekend → rest
    return workDays[idx % workDays.length] ?? null;
  }

  const cells: CalCell[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ date: null, type: 'empty', badge: '', dayId: null });
  }

  const summary: Record<string, number> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = (date.getDay() + 6) % 7; // 0=Mon
    const routineDay = getDayForWeekday(dow);
    const isToday = d === todayDate;
    const isPast = d < todayDate;

    if (!routineDay) {
      cells.push({
        date: d,
        type: isToday ? 'today-rest' : 'rest',
        badge: '·',
        dayId: null,
      });
    } else if (isPast) {
      summary[routineDay.name] = (summary[routineDay.name] ?? 0) + 1;
      cells.push({
        date: d,
        type: isToday ? 'today-done' : 'done',
        badge: routineDay.name,
        dayId: routineDay.id,
      });
    } else {
      cells.push({
        date: d,
        type: isToday ? 'today-scheduled' : 'scheduled',
        badge: routineDay.name,
        dayId: routineDay.id,
      });
    }
  }

  return { cells, monthLabel, summary };
}

export function CalendarModal({ visible, onClose, days, onSelectDay }: CalendarModalProps) {
  const { cells, monthLabel, summary } = useMemo(() => buildCells(days), [days]);

  const weeks: CalCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7).concat(
      Array(Math.max(0, 7 - cells.slice(i, i + 7).length)).fill({ date: null, type: 'empty', badge: '', dayId: null })
    ));
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.hdr}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#1A1A1A',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.hdrTitle}>{monthLabel.toUpperCase()}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Day of week row */}
          <View style={styles.dowRow}>
            {DOW_LABELS.map((l, i) => (
              <Text key={i} style={styles.dowLabel}>{l}</Text>
            ))}
          </View>

          {/* Month grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((cell, ci) => {
                if (cell.type === 'empty' || cell.date === null) {
                  return <View key={ci} style={[styles.cell, styles.cellEmpty]} />;
                }

                const isToday = cell.type.startsWith('today');
                const isDone = cell.type === 'done' || cell.type === 'today-done';
                const isScheduled = cell.type === 'scheduled' || cell.type === 'today-scheduled';

                const handlePress = () => {
                  if (cell.dayId) {
                    onSelectDay(cell.dayId);
                    onClose();
                  }
                };

                return (
                  <Pressable
                    key={ci}
                    onPress={cell.dayId ? handlePress : undefined}
                    style={[styles.cell, isToday && styles.cellToday]}
                  >
                    <Text style={[styles.cellNum, isToday && styles.cellNumToday]}>{cell.date}</Text>
                    {(() => {
                      const trained = TRAINED_DATES_MAY_2026.find(t => t.date === cell.date);
                      return trained ? (
                        <View style={[styles.dot, { backgroundColor: getDotColor(trained.workout) }]} />
                      ) : (
                        <View style={styles.dot} />
                      );
                    })()}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legend}>
            {DOT_LEGEND.map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const CELL_RADIUS = 10;

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
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: '#fff',
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingVertical: 6,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1 / 1.15,
    backgroundColor: '#0f0f0f',
    borderRadius: CELL_RADIUS,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellToday: {
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  cellNum: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b8b8b8',
  },
  cellNumToday: {
    color: '#fff',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#888',
  },
});
