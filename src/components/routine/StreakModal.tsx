import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StreakModalProps {
  visible: boolean;
  daysTrained: number;
  totalLogs: number;
  onClose: () => void;
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function StreakModal({ visible, daysTrained, totalLogs, onClose }: StreakModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}}>
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.handle} />

            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="fire" size={56} color="#FF6B00" />
            </View>

            <Text style={styles.title}>Tu racha de la semana</Text>
            <Text style={styles.bigNumber}>
              {daysTrained}
              <Text style={styles.bigNumberSuffix}> / 7</Text>
            </Text>
            <Text style={styles.subtitle}>
              {daysTrained === 0
                ? 'Todavía no entrenaste esta semana. ¡Arrancá hoy!'
                : daysTrained === 1
                  ? 'Entrenaste 1 día esta semana. Buen comienzo.'
                  : `Entrenaste ${daysTrained} días esta semana. ¡Seguí así!`}
            </Text>

            <View style={styles.dotsRow}>
              {DAY_LABELS.map((label, idx) => {
                const active = idx < daysTrained;
                return (
                  <View key={idx} style={styles.dotCol}>
                    <View
                      style={[
                        styles.dot,
                        active && { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
                      ]}
                    >
                      {active && <MaterialCommunityIcons name="fire" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.dotLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.footnote}>
              {totalLogs} {totalLogs === 1 ? 'serie registrada' : 'series registradas'}
            </Text>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    marginBottom: 20,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,107,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#B8B8B8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bigNumber: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  bigNumberSuffix: {
    color: '#666',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dotCol: { alignItems: 'center', gap: 6 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: { color: '#666', fontSize: 11, fontWeight: '600' },
  footnote: { color: '#555', fontSize: 12 },
});
