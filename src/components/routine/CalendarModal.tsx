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
        className="flex-1 bg-black/60 justify-end"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar calendario"
      >
        <Pressable onPress={() => {}} className="bg-zinc-900 rounded-t-3xl px-4 pt-3 pb-8">
          <View className="w-10 h-1.5 rounded-full bg-zinc-700 self-center mb-4" />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">{monthLabel}</Text>
            <Pressable onPress={onClose} className="px-2 py-1">
              <Text className="text-zinc-400 text-sm">Cerrar</Text>
            </Pressable>
          </View>

          <View className="flex-row justify-between">
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
                  className={[
                    'flex-1 mx-0.5 items-center py-3 rounded-xl',
                    isToday ? 'bg-primary' : 'bg-zinc-800',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'text-[10px] uppercase mb-1',
                      isToday ? 'text-white/80' : 'text-zinc-400',
                    ].join(' ')}
                  >
                    {WEEKDAYS_SHORT[i]}
                  </Text>
                  <Text
                    className={[
                      'text-base font-bold mb-1',
                      isToday ? 'text-white' : 'text-zinc-100',
                    ].join(' ')}
                  >
                    {String(date.getDate()).padStart(2, '0')}
                  </Text>
                  <View
                    className={[
                      'w-6 h-6 rounded-full items-center justify-center',
                      isToday ? 'bg-white/25' : 'bg-zinc-700',
                    ].join(' ')}
                  >
                    <Text
                      className={[
                        'text-[10px] font-bold',
                        isToday ? 'text-white' : 'text-zinc-300',
                      ].join(' ')}
                    >
                      {dayLetter}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-zinc-500 text-xs text-center mt-4">
            Tu rutina se rota por los días de la semana. Tocá un día para saltar a esa sesión.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
