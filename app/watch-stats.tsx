import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  PALETTE,
  STAT_COLORS,
  StatIconBlock,
  SubStat,
  DayWeekMonthTabs,
} from '@/components/watch';

type TabKey = 'day' | 'week' | 'month';

function WatchIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="6" width="12" height="12" rx="3" stroke={color} strokeWidth="1.6" />
      <Path d="M9 6V4h6v2M9 18v2h6v-2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M12 10v2.5l1.7 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function DeviceConnectedHero() {
  return (
    <View style={{
      borderRadius: 22, backgroundColor: PALETTE.surface,
      borderWidth: 1, borderColor: PALETTE.border,
      padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
    }}>
      <StatIconBlock icon="watch-variant" color="heart" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: PALETTE.textMuted }}>
          CONECTADO
        </Text>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 2 }}>
          Apple Watch · Martín
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#5EE08A' }} />
          <Text style={{ fontSize: 12, color: PALETTE.textSecondary }}>Sincronizado hace 2 min</Text>
        </View>
      </View>
    </View>
  );
}

function StepsCard() {
  const [tab, setTab] = useState<TabKey>('day');
  const days = [
    { d: 'L', v: 7820 }, { d: 'M', v: 9210 }, { d: 'M', v: 6450 },
    { d: 'J', v: 11340 }, { d: 'V', v: 8200 }, { d: 'S', v: 12850 },
    { d: 'D', v: 8420 },
  ];
  const goal = 10000;
  const today = days[days.length - 1];
  const maxV = Math.max(goal, ...days.map(d => d.v));

  return (
    <View style={{
      backgroundColor: PALETTE.surfaceCard, borderRadius: 22,
      padding: 18, borderWidth: 1, borderColor: PALETTE.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <StatIconBlock icon="shoe-print" color="steps" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: PALETTE.textSecondary }}>
            PASOS · HOY
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: PALETTE.textPrimary, letterSpacing: -1 }}>
              8.420
            </Text>
            <Text style={{ fontSize: 13, color: PALETTE.textMuted }}>de 10.000</Text>
          </View>
        </View>
      </View>

      <DayWeekMonthTabs active={tab} onChange={setTab} />

      <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 14 }}>
        <View style={{ width: '84%', height: '100%', backgroundColor: STAT_COLORS.steps.bg }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 18 }}>
        {days.map((day, i) => {
          const isToday = i === days.length - 1;
          const barH = Math.round((day.v / maxV) * 80);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ width: '100%', height: 80, justifyContent: 'flex-end' }}>
                <View style={{
                  width: '100%', height: barH, borderRadius: 4,
                  backgroundColor: isToday ? STAT_COLORS.steps.bg : 'rgba(14,165,165,0.3)',
                }} />
              </View>
              <Text style={{
                fontSize: 11,
                fontWeight: isToday ? '800' : '500',
                color: isToday ? PALETTE.textPrimary : PALETTE.textMuted,
              }}>
                {day.d}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: PALETTE.border }}>
        <SubStat icon="map-marker-outline" value="6,2" unit="km" color="steps" />
        <SubStat icon="fire" value="412" unit="kcal" color="steps" />
        <SubStat icon="stairs" value="14" unit="pisos" color="steps" />
      </View>
    </View>
  );
}

function SleepCard() {
  const [tab, setTab] = useState<TabKey>('day');
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
      backgroundColor: PALETTE.surfaceCard, borderRadius: 22,
      padding: 18, borderWidth: 1, borderColor: PALETTE.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <StatIconBlock icon="sleep" color="sleep" />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: PALETTE.textSecondary }}>
              SUEÑO · ANOCHE
            </Text>
            <Text style={{ fontSize: 11, color: PALETTE.textTertiary }}>23:42 → 07:10</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: PALETTE.textPrimary, letterSpacing: -1 }}>7</Text>
            <Text style={{ fontSize: 13, color: PALETTE.textMuted }}>h</Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: PALETTE.textPrimary, letterSpacing: -1, marginLeft: 4 }}>28</Text>
            <Text style={{ fontSize: 13, color: PALETTE.textMuted }}>min</Text>
            <Text style={{ marginLeft: 'auto', fontSize: 11, fontWeight: '700', color: '#5EE08A', letterSpacing: 1 }}>
              ↑ 12%
            </Text>
          </View>
        </View>
      </View>

      <DayWeekMonthTabs active={tab} onChange={setTab} />

      {/* Stage bar */}
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
        {stages.map(s => (
          <View key={s.key} style={{ width: `${(s.mins / total) * 100}%`, backgroundColor: s.color }} />
        ))}
      </View>

      {/* Stage legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        {stages.map(s => (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: s.color }} />
            <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1, color: PALETTE.textSecondary }}>
              {s.label}
            </Text>
            <Text style={{ fontSize: 10, color: '#fff' }}>
              {Math.floor(s.mins / 60)}h {s.mins % 60}m
            </Text>
          </View>
        ))}
      </View>

      {/* Last 7 days */}
      <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: PALETTE.border, marginBottom: 14 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: PALETTE.textMuted, marginBottom: 10 }}>
          ÚLTIMOS 7 DÍAS
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 56 }}>
          {last7.map((h, i) => (
            <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
              <View style={{
                width: '100%',
                height: (h / maxH) * 44,
                backgroundColor: i === 6 ? STAT_COLORS.sleep.bg : 'rgba(123,108,246,0.35)',
                borderRadius: 3,
              }} />
              <Text style={{ fontSize: 9, color: PALETTE.textTertiary }}>{dayLabels[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: PALETTE.border }}>
        <SubStat icon="moon-waxing-crescent" value="1h28m" unit="profundo" color="sleep" />
        <SubStat icon="brain" value="1h42m" unit="REM" color="sleep" />
        <SubStat icon="heart-pulse" value="96%" unit="eficiencia" color="sleep" />
      </View>
    </View>
  );
}

function HeartCard() {
  const [tab, setTab] = useState<TabKey>('day');
  const data = [58, 57, 55, 54, 53, 55, 58, 62, 75, 88, 82, 78, 84, 110, 135, 128, 95, 88, 82, 76, 72, 68, 64, 60];
  const minV = 50, maxV = 145;
  const w = 320, h = 100, pad = 4;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    pad + (1 - (v - minV) / (maxV - minV)) * (h - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;

  return (
    <View style={{
      backgroundColor: PALETTE.surfaceCard, borderRadius: 22,
      padding: 18, borderWidth: 1, borderColor: PALETTE.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <StatIconBlock icon="heart-pulse" color="heart" />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: PALETTE.textSecondary }}>
              FRECUENCIA CARDÍACA
            </Text>
            <Text style={{ fontSize: 11, color: PALETTE.textTertiary }}>HOY</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: PALETTE.textPrimary, letterSpacing: -1 }}>72</Text>
            <Text style={{ fontSize: 13, color: PALETTE.textMuted }}>bpm prom</Text>
            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: STAT_COLORS.heart.bg }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>68 ahora</Text>
            </View>
          </View>
        </View>
      </View>

      <DayWeekMonthTabs active={tab} onChange={setTab} />

      <Svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <Defs>
          <LinearGradient id="hrFill2" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0%" stopColor={STAT_COLORS.heart.bg} stopOpacity="0.45" />
            <Stop offset="100%" stopColor={STAT_COLORS.heart.bg} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map(p => (
          <Line
            key={p}
            x1={pad} x2={w - pad}
            y1={pad + p * (h - pad * 2)} y2={pad + p * (h - pad * 2)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2,3"
          />
        ))}
        <Path d={area} fill="url(#hrFill2)" />
        <Path d={line} fill="none" stroke={STAT_COLORS.heart.bg} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 14 }}>
        {['00', '06', '12', '18', '24'].map(t => (
          <Text key={t} style={{ fontSize: 10, color: PALETTE.textTertiary }}>{t}h</Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: PALETTE.border }}>
        <SubStat icon="arrow-down" value="53" unit="mín" color="heart" />
        <SubStat icon="arrow-up" value="142" unit="máx" color="heart" />
        <SubStat icon="bed" value="57" unit="reposo" color="heart" />
      </View>
    </View>
  );
}

export default function WatchStatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.bg }} edges={['top']}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>

        {/* Header */}
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
          <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}>
          <DeviceConnectedHero />
          <StepsCard />
          <SleepCard />
          <HeartCard />
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}
