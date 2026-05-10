import React from 'react';
import { Image, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const WATCH_PHOTO = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=900&q=70&auto=format&fit=crop';

const NOVEDADES = [
  {
    id: 'gohan',
    title: 'GOHAN Chat',
    sub: 'Tu AI Personal Trainer',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
    isGohan: true,
  },
  {
    id: 'jardin',
    title: 'INFORMACIÓN IMPORTANTE',
    sub: 'Sede Barrio Jardín',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80',
    isGohan: false,
  },
  {
    id: 'devoto',
    title: 'INFORMACIÓN IMPORTANTE',
    sub: 'Sede Devoto',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
    isGohan: false,
  },
];

const RECOMENDADOS = [
  {
    id: 'pers-1',
    title: 'ENTRENAMIENTO PERSONALIZADO',
    sub: 'Reservá un PT',
    image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80',
  },
  {
    id: 'pers-2',
    title: 'NUTRICIÓN',
    sub: 'Plan a medida',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
  },
  {
    id: 'pers-3',
    title: 'CLASES GRUPALES',
    sub: 'Reservá tu lugar',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
  },
];

export default function InicioScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 18, paddingTop: 6, paddingBottom: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 13, fontWeight: '600', letterSpacing: 1.8, color: '#fff', textAlign: 'center' }}>
          MEGATLON
        </Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Hero — reloj con botón CONECTAR */}
        <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
          <View style={{ height: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: '#161616', justifyContent: 'flex-end' }}>
            <ImageBackground
              source={{ uri: WATCH_PHOTO }}
              style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.55 }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
            />
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: 0.5, marginBottom: 12 }}>
                CONECTÁ TU RELOJ
              </Text>
              <Pressable
                onPress={() => router.push('/watch-stats')}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  backgroundColor: '#fff',
                  borderRadius: 999,
                  paddingVertical: 9,
                  paddingHorizontal: 18,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#000', letterSpacing: 0.6 }}>
                  CONECTAR →
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* CTA Tu AI Personal Trainer */}
        <Pressable
          onPress={() => router.push('/(tabs)/coach')}
          style={({ pressed }) => ({
            marginHorizontal: 16, marginBottom: 18,
            borderRadius: 14, overflow: 'hidden',
            backgroundColor: '#E30613',
            padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 14,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <MaterialCommunityIcons name="robot-outline" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
              Tu AI Personal Trainer
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
              Hablá con Gohan y armá tu rutina
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>

        {/* NOVEDADES */}
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: '#b8b8b8', paddingHorizontal: 16, marginBottom: 10 }}>
          NOVEDADES
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {NOVEDADES.map(n => (
            <Pressable
              key={n.id}
              onPress={() => n.isGohan ? router.push('/(tabs)/coach') : undefined}
              style={({ pressed }) => ({
                width: 220, borderRadius: 14, overflow: 'hidden',
                backgroundColor: '#161616',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Image source={{ uri: n.image }} style={{ width: '100%', height: 130 }} resizeMode="cover" />
              {n.isGohan && (
                <View style={{
                  position: 'absolute', top: 10, left: 10,
                  backgroundColor: '#E30613', borderRadius: 6,
                  paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>GOHAN AI</Text>
                </View>
              )}
              <View style={{ padding: 12 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 }}>
                  {n.title}
                </Text>
                <Text style={{ color: '#888', fontSize: 11 }}>{n.sub}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* RECOMENDADOS */}
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: '#b8b8b8', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 }}>
          RECOMENDADOS
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {RECOMENDADOS.map(r => (
            <View key={r.id} style={{ width: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: '#161616' }}>
              <Image source={{ uri: r.image }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
              <View style={{ padding: 12 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 }}>
                  {r.title}
                </Text>
                <Text style={{ color: '#888', fontSize: 11 }}>{r.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}
