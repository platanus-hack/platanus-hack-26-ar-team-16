import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const ACCENT = '#FF6B00';
const CARD_BG = '#1A1A1A';
const CARD_DARK = '#0F0F0F';
const CARD_RADIUS = 22;

const PHOTOS = {
  phoneGym: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=900&q=70&auto=format&fit=crop',
  gymWide: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=70&auto=format&fit=crop',
  gymTreadmill: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=70&auto=format&fit=crop',
  watchDark: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=900&q=70&auto=format&fit=crop',
};

const NOVEDADES = [
  { id: 'rutina', title: 'MI RUTINA', sub: '', image: PHOTOS.gymWide },
  { id: 'info', title: 'INFORMACIÓN IMPORTANTE', sub: 'Sede Barrio Norte', image: PHOTOS.gymTreadmill },
];

const RECOMENDADOS = [
  { id: 'pers-1', title: 'ENTRENAMIENTO PERSONALIZADO', sub: 'Reservá un PT', image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80' },
  { id: 'pers-2', title: 'NUTRICIÓN', sub: 'Plan a medida', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80' },
  { id: 'pers-3', title: 'CLASES GRUPALES', sub: 'Reservá tu lugar', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
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

        {/* Hero — AI Personal Trainer */}
        <Pressable
          onPress={() => router.push('/(tabs)/coach')}
          style={({ pressed }) => ({ paddingHorizontal: 16, marginBottom: 18, opacity: pressed ? 0.9 : 1 })}
        >
          <View style={{ height: 200, borderRadius: CARD_RADIUS, overflow: 'hidden' }}>
            <Image
              source={{ uri: PHOTOS.phoneGym }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Text style={{
              position: 'absolute', top: 18, left: 20,
              fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: ACCENT,
            }}>
              NUEVO
            </Text>
            <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
              <Text style={{
                fontSize: 28, fontWeight: '900', color: '#fff',
                lineHeight: 30, letterSpacing: 0.3, marginBottom: 10,
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 12,
              }}>
                AI PERSONAL{'\n'}TRAINER
              </Text>
              <View style={{
                alignSelf: 'flex-start',
                backgroundColor: ACCENT, borderRadius: 999,
                paddingVertical: 6, paddingHorizontal: 14,
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }}>
                  CHATEÁ →
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Watch Widget */}
        <View style={{ paddingHorizontal: 16, marginBottom: 22 }}>
          <Text style={{
            fontSize: 13, fontWeight: '700', letterSpacing: 1.6,
            color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 12,
          }}>
            RELOJ INTELIGENTE
          </Text>
          <View style={{
            borderRadius: CARD_RADIUS, overflow: 'hidden',
            backgroundColor: CARD_DARK,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            minHeight: 180,
          }}>
            {/* Watch photo — absolutely on the right */}
            <Image
              source={{ uri: PHOTOS.watchDark }}
              style={{
                position: 'absolute', right: -40, top: -10, bottom: -10, width: 220,
                opacity: 0.55,
              }}
              resizeMode="cover"
            />
            {/* Gradient to fade photo into card background */}
            <LinearGradient
              colors={[CARD_DARK, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '75%' }}
            />
            {/* Content rendered on top */}
            <View style={{ padding: 26 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <MaterialCommunityIcons name="watch" size={22} color={ACCENT} />
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: ACCENT }}>
                  NUEVO
                </Text>
              </View>
              <Text style={{
                fontSize: 24, fontWeight: '900', color: '#fff',
                lineHeight: 26, letterSpacing: 0.3, marginBottom: 8, maxWidth: 145,
              }}>
                CONECTÁ TU{'\n'}RELOJ
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', maxWidth: 165, lineHeight: 17 }}>
                Sincronizá tu actividad y ganá puntos.
              </Text>
              <Pressable
                onPress={() => router.push('/watch-stats')}
                style={({ pressed }) => ({
                  marginTop: 18, alignSelf: 'flex-start',
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#fff', borderRadius: 999,
                  paddingVertical: 10, paddingHorizontal: 18,
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

        {/* NOVEDADES */}
        <Text style={{
          fontSize: 13, fontWeight: '700', letterSpacing: 1.6,
          color: 'rgba(255,255,255,0.55)', paddingHorizontal: 16, marginBottom: 12,
        }}>
          NOVEDADES
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {NOVEDADES.map(n => (
            <Pressable
              key={n.id}
              onPress={() => n.id === 'rutina' ? router.push('/(tabs)/routine') : undefined}
              style={({ pressed }) => ({
                width: 260, backgroundColor: CARD_BG, borderRadius: CARD_RADIUS, overflow: 'hidden',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Image source={{ uri: n.image }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
              <View style={{ padding: 14 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 }}>
                  {n.title}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{n.sub}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* RECOMENDADOS */}
        <Text style={{
          fontSize: 11, fontWeight: '600', letterSpacing: 1.5,
          color: '#b8b8b8', paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
        }}>
          RECOMENDADOS
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {RECOMENDADOS.map(r => (
            <View key={r.id} style={{ width: 200, borderRadius: 14, overflow: 'hidden', backgroundColor: CARD_BG }}>
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
