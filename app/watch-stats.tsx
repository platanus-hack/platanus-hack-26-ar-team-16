import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const MEGATLON_RED = '#E30613';
const CARD_BG = '#1A1A1A';
const CARD_RADIUS = 22;

function WatchIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="6" width="12" height="12" rx="3" stroke={color} strokeWidth="1.6" />
      <Path d="M9 6V4h6v2M9 18v2h6v-2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M12 10v2.5l1.7 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function StatsHero() {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
      <View style={{
        borderRadius: CARD_RADIUS,
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      }}>
        <View style={{
          width: 56, height: 56, borderRadius: 14,
          backgroundColor: MEGATLON_RED,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <WatchIcon size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(255,255,255,0.5)' }}>
            CONECTADO
          </Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 2 }}>
            Apple Watch · Martín
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#5EE08A' }} />
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              Sincronizado hace 2 min
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SleepChart() {
  const stages = [
    { key: 'deep', label: 'PROFUNDO', mins: 88, color: '#3D5BF1' },
    { key: 'rem', label: 'REM', mins: 102, color: '#7B6CF6' },
    { key: 'light', label: 'LIGERO', mins: 232, color: '#A8B0FF' },
    { key: 'awake', label: 'DESPIERTO', mins: 26, color: '#3A3A3A' },
  ];
  const total = stages.reduce((s, x) => s + x.mins, 0);
  const last7 = [6.8, 7.2, 5.9, 7.5, 6.1, 8.0, 7.5];
  const maxH = 9;
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <View style={{
      backgroundColor: CARD_BG, borderRadius: CARD_RADIUS,
      padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
          SUEÑO · ANOCHE
        </Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>23:42 → 07:10</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <Text style={{ fontWeight: '900', fontSize: 38, color: '#fff', letterSpacing: -1 }}>7</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>h</Text>
        <Text style={{ fontWeight: '900', fontSize: 38, color: '#fff', letterSpacing: -1, marginLeft: 6 }}>28</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>min</Text>
        <Text style={{ marginLeft: 'auto', fontSize: 11, fontWeight: '700', color: '#5EE08A', letterSpacing: 1 }}>
          ↑ 12% VS PROM
        </Text>
      </View>

      <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' }}>
        {stages.map(s => (
          <View key={s.key} style={{ width: `${(s.mins / total) * 100}%`, backgroundColor: s.color }} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 }}>
        {stages.map(s => (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color }} />
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.1, color: 'rgba(255,255,255,0.6)' }}>
              {s.label}
            </Text>
            <Text style={{ fontSize: 11, color: '#fff' }}>
              {Math.floor(s.mins / 60)}h {s.mins % 60}m
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
          ÚLTIMOS 7 DÍAS
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 60 }}>
          {last7.map((h, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{
                width: '100%',
                height: (h / maxH) * 48,
                backgroundColor: i === 6 ? '#7B6CF6' : 'rgba(168,176,255,0.45)',
                borderRadius: 4,
              }} />
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{dayLabels[i]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function HeartChart() {
  const data = [58, 57, 55, 54, 53, 55, 58, 62, 75, 88, 82, 78, 84, 110, 135, 128, 95, 88, 82, 76, 72, 68, 64, 60];
  const minV = 50, maxV = 145;
  const w = 320, h = 110, pad = 4;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    pad + (1 - (v - minV) / (maxV - minV)) * (h - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  const gridLines = [0.25, 0.5, 0.75];
  const stats = [
    { k: 'MÍN', v: '53', u: 'bpm', c: '#4DA8FF' },
    { k: 'MÁX', v: '142', u: 'bpm', c: MEGATLON_RED },
    { k: 'REPOSO', v: '57', u: 'bpm', c: 'rgba(255,255,255,0.7)' },
  ];

  return (
    <View style={{
      backgroundColor: CARD_BG, borderRadius: CARD_RADIUS,
      padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
          FRECUENCIA CARDÍACA
        </Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>HOY</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <Text style={{ fontWeight: '900', fontSize: 38, color: '#fff', letterSpacing: -1 }}>72</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>bpm prom</Text>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: MEGATLON_RED }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>68 ahora</Text>
        </View>
      </View>

      <Svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <Defs>
          <LinearGradient id="hrFill" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0%" stopColor={MEGATLON_RED} stopOpacity="0.45" />
            <Stop offset="100%" stopColor={MEGATLON_RED} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {gridLines.map(p => (
          <Line
            key={p}
            x1={pad} x2={w - pad}
            y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2,3"
          />
        ))}
        <Path d={area} fill="url(#hrFill)" />
        <Path d={line} fill="none" stroke={MEGATLON_RED} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {['00', '06', '12', '18', '24'].map(t => (
          <Text key={t} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{t}h</Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        {stats.map(x => (
          <View key={x.k} style={{
            flex: 1, paddingVertical: 10, paddingHorizontal: 12,
            backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
          }}>
            <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: x.c }}>{x.k}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 3 }}>
              <Text style={{ fontWeight: '800', fontSize: 18, color: '#fff' }}>{x.v}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{x.u}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function StepsChart() {
  const days = [
    { d: 'L', v: 7820 }, { d: 'M', v: 9210 }, { d: 'M', v: 6450 },
    { d: 'J', v: 11340 }, { d: 'V', v: 8200 }, { d: 'S', v: 12850 },
    { d: 'D', v: 8420 },
  ];
  const goal = 10000;
  const maxV = Math.max(goal, ...days.map(d => d.v));
  const today = days[days.length - 1];
  const pct = Math.min(100, (today.v / goal) * 100);
  const extras = [
    { k: 'DISTANCIA', v: '6,2', u: 'km' },
    { k: 'CALORÍAS', v: '412', u: 'kcal' },
    { k: 'PISOS', v: '14', u: '' },
  ];

  return (
    <View style={{
      backgroundColor: CARD_BG, borderRadius: CARD_RADIUS,
      padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
          PASOS · HOY
        </Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>OBJETIVO 10.000</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <Text style={{ fontWeight: '900', fontSize: 42, color: '#fff', letterSpacing: -1 }}>8.420</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>pasos</Text>
      </View>

      <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 6 }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: MEGATLON_RED }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{Math.round(pct)}% del objetivo</Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>1.580 restantes</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110 }}>
        {days.map((day, i) => {
          const isToday = i === days.length - 1;
          const overGoal = day.v >= goal;
          const barH = (day.v / maxV) * 80;
          const goalLineTop = 80 - (goal / maxV) * 80;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                {(day.v / 1000).toFixed(1)}k
              </Text>
              <View style={{ width: '100%', height: 80, justifyContent: 'flex-end', position: 'relative' }}>
                <View style={{
                  position: 'absolute', left: -2, right: -2,
                  top: goalLineTop, height: 1,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }} />
                <View style={{
                  width: '100%', height: barH, borderRadius: 4,
                  backgroundColor: isToday
                    ? MEGATLON_RED
                    : overGoal ? 'rgba(227,6,19,0.55)' : 'rgba(255,255,255,0.18)',
                }} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: isToday ? '800' : '500',
                color: isToday ? '#fff' : 'rgba(255,255,255,0.55)',
              }}>{day.d}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        {extras.map(x => (
          <View key={x.k} style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.5)' }}>
              {x.k}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 3 }}>
              <Text style={{ fontWeight: '800', fontSize: 20, color: '#fff' }}>{x.v}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{x.u}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function WatchStatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 28 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M15 5l-7 7 7 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Text style={{ fontWeight: '700', fontSize: 15, letterSpacing: 3, color: '#fff' }}>MI RELOJ</Text>
        <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3a6 6 0 016 6v3l1.5 3h-15L6 12V9a6 6 0 016-6z M10 19a2 2 0 004 0"
            stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <StatsHero />
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <SleepChart />
          <HeartChart />
          <StepsChart />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
