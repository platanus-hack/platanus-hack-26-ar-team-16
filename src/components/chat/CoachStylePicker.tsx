import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useCoachStyleStore } from '@/store';
import type { CoachStyle } from '@/types';

const STYLES: { key: CoachStyle; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  {
    key: 'amable',
    label: 'Amable',
    icon: 'heart-outline',
    desc: 'Paciente, empático, celebra cada logro',
  },
  {
    key: 'intenso',
    label: 'Intenso',
    icon: 'flash-outline',
    desc: 'Directo, profesional, sin vueltas',
  },
  {
    key: 'picante',
    label: 'Picante',
    icon: 'flame-outline',
    desc: 'Humor ácido, te reta a dar más',
  },
];

export function CoachStylePicker() {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const currentStyle = useCoachStyleStore((s) => s.style);
  const setStyle = useCoachStyleStore((s) => s.setStyle);

  const currentLabel = STYLES.find((s) => s.key === currentStyle)?.label ?? 'Intenso';

  const handleSelect = (style: CoachStyle) => {
    setStyle(style);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: theme.primary + '15' }}
      >
        <Text className="text-sm font-medium" style={{ color: theme.primary }}>
          {currentLabel}
        </Text>
        <Ionicons name="chevron-down" size={14} color={theme.primary} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setVisible(false)}
        >
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <Text className="text-lg font-bold text-slate-900 mb-1">Estilo del Coach</Text>
            <Text className="text-sm text-slate-500 mb-5">
              Elegí cómo querés que Gohan te hable
            </Text>

            <View style={{ gap: 10 }}>
              {STYLES.map((s) => {
                const isActive = s.key === currentStyle;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => handleSelect(s.key)}
                    className="flex-row items-center gap-3 p-4 rounded-2xl border"
                    style={{
                      borderColor: isActive ? theme.primary : '#E2E8F0',
                      backgroundColor: isActive ? theme.primary + '08' : '#FFFFFF',
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: isActive ? theme.primary + '20' : '#F1F5F9' }}
                    >
                      <Ionicons
                        name={s.icon}
                        size={20}
                        color={isActive ? theme.primary : '#64748B'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-semibold"
                        style={{ color: isActive ? theme.primary : '#0F172A' }}
                      >
                        {s.label}
                      </Text>
                      <Text className="text-sm text-slate-500">{s.desc}</Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
