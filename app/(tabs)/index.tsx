/**
 * Inicio (home) — hardcoded Megatlon demo screen.
 *
 * Replicates the look of the real Megatlon Inicio tab so the visitor
 * navigating around feels they're inside the actual app. No real data.
 *
 * Before the live demo: swap Unsplash URLs for local assets to eliminate
 * latency and any Unsplash downtime risk.
 */

import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MT_BRAND = '#FF6B00';

const NOVEDADES = [
  {
    id: 'norte',
    sede: 'Sede Barrio Norte',
    title: 'INFORMACIÓN IMPORTANTE',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
  },
  {
    id: 'jardin',
    sede: 'Sede Barrio Jardín',
    title: 'INFORMACIÓN IMPORTANTE',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80',
  },
  {
    id: 'devoto',
    sede: 'Sede Devoto',
    title: 'INFORMACIÓN IMPORTANTE',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
  },
];

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

export default function InicioScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ width: 24 }} />
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '500', letterSpacing: 2 }}>
          MEGATLON
        </Text>
        <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            height: 200,
            marginHorizontal: 16,
            marginTop: 4,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: '#1F1F1F',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80' }}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.55 }}
            resizeMode="cover"
          />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: '600',
              letterSpacing: 0.5,
              textAlign: 'center',
              lineHeight: 32,
            }}
          >
            CANALES DE{'\n'}ATENCIÓN
          </Text>
        </View>

        <Text
          style={{
            color: '#B8B8B8',
            fontSize: 12,
            fontWeight: '500',
            letterSpacing: 1.5,
            paddingHorizontal: 16,
            marginTop: 24,
            marginBottom: 10,
          }}
        >
          NOVEDADES
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {NOVEDADES.map((n) => (
            <View
              key={n.id}
              style={{ width: 240, borderRadius: 14, overflow: 'hidden', backgroundColor: '#161616' }}
            >
              <Image source={{ uri: n.image }} style={{ width: '100%', height: 130 }} resizeMode="cover" />
              <View style={{ padding: 12 }}>
                <Text
                  style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 }}
                >
                  {n.title}
                </Text>
                <Text style={{ color: '#888888', fontSize: 12 }}>{n.sede}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <Text
          style={{
            color: '#B8B8B8',
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
              style={{ width: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: '#161616' }}
            >
              <Image source={{ uri: r.image }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
              <View style={{ padding: 12 }}>
                <Text
                  style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 }}
                >
                  {r.title}
                </Text>
                <Text style={{ color: '#888888', fontSize: 11 }}>{r.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 96 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
