import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const STAT_COLORS = {
  steps: { bg: '#0EA5A5', shadow: 'rgba(14,165,165,0.35)' },
  sleep: { bg: '#7B6CF6', shadow: 'rgba(123,108,246,0.35)' },
  heart: { bg: '#E30613', shadow: 'rgba(227,6,19,0.35)' },
} as const;

export const PALETTE = {
  bg: '#000000',
  surface: '#0F0F0F',
  surfaceCard: '#161616',
  border: 'rgba(255,255,255,0.06)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.4)',
  textMuted: 'rgba(255,255,255,0.5)',
} as const;

type StatColor = keyof typeof STAT_COLORS;

export function StatIconBlock({
  icon,
  color,
  size = 50,
}: {
  icon: string;
  color: StatColor;
  size?: number;
}) {
  const c = STAT_COLORS[color];
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: 14,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.bg,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    }}>
      <MaterialCommunityIcons name={icon as any} size={size * 0.5} color="#fff" />
    </View>
  );
}

export function SubStat({
  icon,
  value,
  unit,
  color,
}: {
  icon: string;
  value: string;
  unit: string;
  color: StatColor;
}) {
  const c = STAT_COLORS[color];
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
      }}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#fff" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text style={{ color: PALETTE.textPrimary, fontSize: 16, fontWeight: '800' }}>{value}</Text>
        <Text style={{ color: PALETTE.textMuted, fontSize: 11 }}>{unit}</Text>
      </View>
    </View>
  );
}

type TabKey = 'day' | 'week' | 'month';

export function DayWeekMonthTabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (v: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'day', label: 'DÍA' },
    { key: 'week', label: 'SEMANA' },
    { key: 'month', label: 'MES' },
  ];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14 }}>
      {tabs.map(t => {
        const isActive = t.key === active;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={{ alignItems: 'center', paddingHorizontal: 16 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: isActive ? '700' : '500',
              letterSpacing: 1.5,
              color: isActive ? PALETTE.textPrimary : PALETTE.textTertiary,
            }}>
              {t.label}
            </Text>
            {isActive ? (
              <View style={{ marginTop: 6, width: 24, height: 2, backgroundColor: PALETTE.textPrimary, borderRadius: 1 }} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
