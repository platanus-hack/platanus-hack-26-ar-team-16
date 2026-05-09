import React, { useMemo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import type { RoutineDay } from '../../modules/routine/types';
import { sortDays } from '../../modules/routine/groupByDay';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  days: RoutineDay[];
  onSelectDay: (dayId: string) => void;
}

const WEEKDAYS_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const dow = today.getDay();
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offsetToMonday);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function CalendarModal({ visible, onClose, days, onSelectDay }: CalendarModalProps) {
  const week = useMemo(getCurrentWeekDates, []);
  const sortedDays = useMemo(() => sortDays(days), [days]);
  const todayIso = new Date().toDateString();

  const monthLabel = useMemo(() => {
    const m = new Date().toLocaleString('es-AR', { month: 'long' });
    return m.charAt(0).toUpperCase() + m.slice(1);
  }, []);

  function getScheduledDay(weekdayIndex: number): RoutineDay | null {
    if (!sortedDays.length) return null;
    return sortedDays[weekdayIndex % sortedDays.length] ?? null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar calendario"
      >
        <Pressable onPress={() => {}} style={{ backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 6, borderRadius: 9999, backgroundColor: '#3F3F46', alignSelf: 'center', marginBottom: 16 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{monthLabel}</Text>
            <Pressable onPress={onClose} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: '#A1A1AA', fontSize: 14 }}>Cerrar</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {week.map((date, i) => {
              const isToday = date.toDateString() === todayIso;
              const scheduled = getScheduledDay(i);
              const dayLetter = scheduled
                ? String.fromCharCode(65 + sortedDays.indexOf(scheduled))
                : '·';

              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    if (scheduled) onSelectDay(scheduled.id);
                    onClose();
                  }}
                  style={[
                    { flex: 1, marginHorizontal: 2, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
                    isToday ? { backgroundColor: '#FF6B00' } : { backgroundColor: '#27272A' },
                  ]}
                >
                  <Text
                    style={[
                      { fontSize: 10, textTransform: 'uppercase', marginBottom: 4 },
                      isToday ? { color: 'rgba(255,255,255,0.8)' } : { color: '#A1A1AA' },
                    ]}
                  >
                    {WEEKDAYS_SHORT[i]}
                  </Text>
                  <Text
                    style={[
                      { fontSize: 16, fontWeight: '700', marginBottom: 4 },
                      isToday ? { color: '#FFFFFF' } : { color: '#F4F4F5' },
                    ]}
                  >
                    {String(date.getDate()).padStart(2, '0')}
                  </Text>
                  <View
                    style={[
                      { width: 24, height: 24, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
                      isToday ? { backgroundColor: 'rgba(255,255,255,0.25)' } : { backgroundColor: '#3F3F46' },
                    ]}
                  >
                    <Text
                      style={[
                        { fontSize: 10, fontWeight: '700' },
                        isToday ? { color: '#FFFFFF' } : { color: '#D4D4D8' },
                      ]}
                    >
                      {dayLetter}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ color: '#71717A', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
            Tu rutina se rota por los días de la semana. Tocá un día para saltar a esa sesión.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
