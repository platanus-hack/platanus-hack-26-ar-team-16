import { ScrollView, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Badge, Avatar } from '@/components/ui';
import { useAuthStore, useRoutineStore } from '@/store';
import { useTheme } from '@/theme';
import { DAY_LABELS, type DayOfWeek } from '@/types';

const WEEK_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const routine = useRoutineStore((s) => s.routine);
  const theme = useTheme();

  const today = new Date().getDay() as DayOfWeek;
  const todaysDay = routine?.days.find((d) => d.dayOfWeek === today);
  const greeting = `Hola${user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}`;

  const completedDays =
    routine?.days.filter(
      (d) => d.exercises.length > 0 && d.exercises.every((e) => e.completed),
    ).length ?? 0;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-3xl font-bold text-slate-900">{greeting}</Text>
          <Text className="text-base text-slate-500 mt-1">{theme.brandName}</Text>
        </View>
        {user ? (
          <Avatar name={user.displayName} uri={user.avatarUrl} size={48} />
        ) : (
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="px-3 py-2 rounded-full"
            style={{ backgroundColor: theme.primary }}
          >
            <Text className="text-white font-semibold text-sm">Ingresar</Text>
          </Pressable>
        )}
      </View>

      <Card padding="lg">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Hoy
          </Text>
          <Badge label={DAY_LABELS[today]} variant="brand" />
        </View>
        {todaysDay && todaysDay.exercises.length > 0 ? (
          <>
            <Text className="text-2xl font-bold text-slate-900">
              {todaysDay.label}
            </Text>
            <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
              {todaysDay.muscleGroups.map((g) => (
                <Badge key={g} label={g} />
              ))}
            </View>
            <Text className="text-base text-slate-500 mt-3">
              {todaysDay.exercises.length} ejercicios ·{' '}
              {todaysDay.exercises.filter((e) => e.completed).length} completados
            </Text>
          </>
        ) : (
          <>
            <Text className="text-xl font-bold text-slate-900">Día de descanso</Text>
            <Text className="text-base text-slate-500 mt-1">
              Hablá con Gohan si querés ajustar tu rutina.
            </Text>
          </>
        )}
      </Card>

      <Pressable
        onPress={() => router.push('/coach')}
        style={{ backgroundColor: theme.primary }}
        className="rounded-2xl p-5 flex-row items-center"
      >
        <View className="flex-1 pr-3">
          <Text className="text-white font-semibold text-lg">Hablá con Gohan</Text>
          <Text className="text-white/80 text-sm mt-0.5">
            Ajustá tu rutina, agregá ejercicios o resolvé dudas
          </Text>
        </View>
        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
      </Pressable>

      <Card padding="lg">
        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Esta semana
        </Text>
        <View className="flex-row justify-between" style={{ gap: 6 }}>
          {WEEK_ORDER.map((d) => {
            const day = routine?.days.find((rd) => rd.dayOfWeek === d);
            const isComplete =
              !!day &&
              day.exercises.length > 0 &&
              day.exercises.every((e) => e.completed);
            const isToday = d === today;
            return (
              <View key={d} className="items-center flex-1">
                <View
                  className="w-9 h-9 rounded-full items-center justify-center mb-1"
                  style={{
                    backgroundColor: isComplete ? theme.primary : '#F1F5F9',
                    borderWidth: isToday ? 2 : 0,
                    borderColor: isToday ? theme.primary : 'transparent',
                  }}
                >
                  {isComplete ? (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  ) : (
                    <Text className="text-slate-500 text-xs font-medium">
                      {DAY_LABELS[d][0]}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        <Text className="text-base text-slate-500 mt-3">
          {completedDays} días completados
        </Text>
      </Card>
    </ScrollView>
  );
}
