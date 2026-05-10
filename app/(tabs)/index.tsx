import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/theme';
import { useAuthStore, useRoutineStore } from '@/store';
import { getWeekStreak } from '@/services/streak';
import { StreakBadge, StreakModal } from '@/components/routine';
import { useOpenWearables } from '@/hooks/useOpenWearables';

const RECOMENDADOS = [
  {
    id: 'pers-1',
    title: 'ENTRENAMIENTO PERSONALIZADO',
    subtitle: 'Reservá un PT',
    image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80',
  },
  {
    id: 'pers-2',
    title: 'NUTRICIÓN',
    subtitle: 'Plan a medida',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
  },
];

function greeting(now: Date) {
  const h = now.getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function InicioScreen() {
  const { tenant } = useTheme();
  const c = tenant.colors;

  const displayName = useAuthStore((s) => s.user?.displayName ?? null);
  const routine = useRoutineStore((s) => s.routine);
  const { connected: wearableConnected } = useOpenWearables();

  const [streak, setStreak] = useState({ daysTrained: 0, totalLogs: 0 });
  const [streakVisible, setStreakVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWeekStreak().then((s) => {
      if (!cancelled) setStreak({ daysTrained: s.daysTrained, totalLogs: s.totalLogs });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = (displayName ?? '').split(' ')[0];
  const todayDayIdx = new Date().getDay(); // 0 Sun..6 Sat
  const todayDay = routine?.days?.find((d) => (d as any).day_of_week === todayDayIdx);
  const todayExerciseCount = todayDay?.exercises?.length ?? 0;

  const features = [
    {
      id: 'routine',
      title: 'Mi rutina',
      subtitle: routine?.name
        ? todayExerciseCount > 0
          ? `Mirá tu rutina · hoy ${todayExerciseCount} ejercicios`
          : 'Mirá tu rutina'
        : 'Mirá tu rutina',
      icon: 'dumbbell' as const,
      color: '#FF6B00',
      onPress: () => router.push('/(tabs)/routine'),
    },
    {
      id: 'coach',
      title: 'Gohan AI Coach',
      subtitle: 'Pedile cambios o consejos',
      icon: 'message-text-outline' as const,
      color: '#6366F1',
      onPress: () => router.push('/(tabs)/coach'),
    },
    {
      id: 'metrics',
      title: 'Métricas',
      subtitle: wearableConnected ? 'Reloj sincronizado' : 'Conectá tu reloj',
      icon: 'heart-pulse' as const,
      color: '#22C55E',
      onPress: () => router.push('/(tabs)/mas'),
    },
    {
      id: 'qr',
      title: 'Check-in',
      subtitle: 'Escaneá el QR del gym',
      icon: 'qrcode-scan' as const,
      color: '#FACC15',
      onPress: () => router.push('/(tabs)/qr'),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Greeting header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Text style={{ color: c.textMuted, fontSize: 13 }}>
              {greeting(new Date())}{firstName ? `, ${firstName}` : ''}
            </Text>
            <MaterialCommunityIcons name="bell-outline" size={22} color={c.text} />
          </View>

          <Text
            style={{
              color: c.text,
              fontSize: 28,
              fontWeight: '800',
              letterSpacing: 0.2,
              marginBottom: 14,
            }}
          >
            ¡Hola, a entrenar! 💪
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Pressable onPress={() => setStreakVisible(true)}>
              <StreakBadge daysTrained={streak.daysTrained} />
            </Pressable>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: c.surface,
              }}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={14} color={c.text} />
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>
                {streak.totalLogs} {streak.totalLogs === 1 ? 'serie' : 'series'}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: c.surface,
              }}
            >
              <MaterialCommunityIcons
                name={wearableConnected ? 'watch-variant' : 'watch'}
                size={14}
                color={wearableConnected ? '#4ADE80' : c.textMuted}
              />
              <Text
                style={{
                  color: wearableConnected ? '#4ADE80' : c.textMuted,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {wearableConnected ? 'Reloj' : 'Sin reloj'}
              </Text>
            </View>
          </View>
        </View>

        {/* Feature cards grid */}
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {features.map((f) => (
            <Pressable
              key={f.id}
              onPress={f.onPress}
              accessibilityRole="button"
              accessibilityLabel={f.title}
              style={({ pressed }) => ({
                width: '47.5%',
                borderRadius: 16,
                backgroundColor: c.surface,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: pressed ? 0.8 : 1,
                borderWidth: 1,
                borderColor: c.surfaceElevated,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${f.color}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name={f.icon} size={22} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                  {f.title}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                  {f.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* CTA: Open chat */}
        <Pressable
          onPress={() => router.push('/(tabs)/coach')}
          style={({ pressed }) => ({
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 16,
            backgroundColor: '#FF6B00',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <MaterialCommunityIcons name="message-text" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Hablá con Gohan
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>
              Armá o modificá tu rutina y pedí consejos en vivo
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
        </Pressable>

        {/* Recomendados */}
        <Text
          style={{
            color: c.textMuted,
            fontSize: 12,
            fontWeight: '500',
            letterSpacing: 1.5,
            paddingHorizontal: 16,
            marginTop: 24,
            marginBottom: 10,
          }}
        >
          RECOMENDADOS
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {RECOMENDADOS.map((r) => (
            <View
              key={r.id}
              style={{ width: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: c.surface }}
            >
              <Image source={{ uri: r.image }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
              <View style={{ padding: 12 }}>
                <Text
                  style={{ color: c.text, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 }}
                >
                  {r.title}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{r.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <StreakModal
        visible={streakVisible}
        daysTrained={streak.daysTrained}
        totalLogs={streak.totalLogs}
        onClose={() => setStreakVisible(false)}
      />
    </SafeAreaView>
  );
}
