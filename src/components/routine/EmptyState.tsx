import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface EmptyStateProps {
  onStartChat: () => void;
}

export function EmptyState({ onStartChat }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-20 h-20 rounded-full bg-zinc-800 items-center justify-center mb-5">
        <Text className="text-3xl">💬</Text>
      </View>

      <Text className="text-white text-xl font-bold text-center mb-2">
        Todavía no tenés rutina
      </Text>
      <Text className="text-zinc-400 text-sm text-center mb-8 leading-5">
        Charlá con Gohan, contale tu objetivo y nivel, y te arma una rutina
        personalizada en menos de un minuto.
      </Text>

      <Pressable
        onPress={onStartChat}
        accessibilityRole="button"
        className="w-full h-12 rounded-xl bg-primary items-center justify-center active:opacity-90"
      >
        <Text className="text-white text-base font-bold">Charlar con Gohan</Text>
      </Pressable>
    </View>
  );
}
