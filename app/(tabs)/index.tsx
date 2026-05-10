import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store';

export default function InicioScreen() {
  const theme = useTheme();
  const displayName = useAuthStore((s) => s.user?.displayName ?? 'Atleta');

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-sm text-slate-500">Hola,</Text>
        <Text className="text-2xl font-bold text-slate-900 mt-0.5">
          {displayName}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Pressable
          onPress={() => router.push('/(tabs)/coach')}
          className="rounded-2xl p-6"
          style={({ pressed }) => ({
            backgroundColor: theme.primary,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
            </View>
            <Text className="text-xl font-bold text-white">Gohan AI Coach</Text>
          </View>
          <Text className="text-sm leading-5" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Pedile a tu coach de IA que te arme una rutina personalizada, modifique ejercicios o te guíe en tu entrenamiento.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/routine')}
          className="bg-white rounded-2xl p-6 border border-slate-200"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-11 h-11 rounded-full bg-indigo-50 items-center justify-center">
              <Ionicons name="barbell" size={22} color={theme.primary} />
            </View>
            <Text className="text-xl font-bold text-slate-900">Mi Rutina</Text>
          </View>
          <Text className="text-sm text-slate-500 leading-5">
            Mirá tu rutina semanal, los ejercicios de cada día con series, repeticiones y descanso.
          </Text>
        </Pressable>

        <View className="bg-white rounded-2xl p-6 border border-slate-200">
          <Text className="text-base font-bold text-slate-900 mb-3">
            Cómo funciona
          </Text>
          <View style={{ gap: 16 }}>
            {[
              { icon: 'chatbubble-outline' as const, text: 'Contale a Gohan tus objetivos, equipamiento y días disponibles' },
              { icon: 'flash-outline' as const, text: 'La IA te genera una rutina personalizada al instante' },
              { icon: 'sync-outline' as const, text: 'Pedí cambios por chat y se actualizan en tiempo real' },
            ].map((step, i) => (
              <View key={i} className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                  <Ionicons name={step.icon} size={16} color={theme.primary} />
                </View>
                <Text className="flex-1 text-sm text-slate-600 leading-5">{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
