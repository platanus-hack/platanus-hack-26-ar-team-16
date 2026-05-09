import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface EmptyStateProps {
  onStartChat: () => void;
}

export function EmptyState({ onStartChat }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <View style={{ width: 80, height: 80, borderRadius: 9999, backgroundColor: '#27272A', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 30 }}>💬</Text>
      </View>

      <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
        Todavía no tenés rutina
      </Text>
      <Text style={{ color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
        Charlá con Gohan, contale tu objetivo y nivel, y te arma una rutina
        personalizada en menos de un minuto.
      </Text>

      <Pressable
        onPress={onStartChat}
        accessibilityRole="button"
        style={{ width: '100%', height: 48, borderRadius: 12, backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Charlar con Gohan</Text>
      </Pressable>
    </View>
  );
}
