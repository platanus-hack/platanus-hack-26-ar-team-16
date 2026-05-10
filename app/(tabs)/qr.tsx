/**
 * QR — hardcoded demo screen.
 *
 * Replicates Megatlon's "Accedé a tu sede" screen. The QR is a static
 * SVG — visually convincing but not scannable. To make it scannable,
 * swap MockQRCode for: import QRCode from 'react-native-qrcode-svg';
 * <QRCode value="https://gohan.ai" size={220} />
 */

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const QR_GRID = [
  '111111101011010111111',
  '100000101101010100000',
  '101110101100110101110',
  '101110100100100101110',
  '101110101011110101110',
  '100000101010100100000',
  '111111101010101111111',
  '000000001100110000000',
  '110011110001110110010',
  '011000101110110001011',
  '101110010101010110100',
  '110011010110110010011',
  '101010100110001010101',
  '010110011000111100010',
  '111111100110011110011',
  '100000100100100110010',
  '101110101110110010111',
  '101110101011010110100',
  '101110101011000010110',
  '100000100110100010001',
  '111111100100100100110',
];

function MockQRCode({ size = 220 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${QR_GRID.length} ${QR_GRID.length}`}>
      <Rect x={0} y={0} width={QR_GRID.length} height={QR_GRID.length} fill="#FFFFFF" />
      {QR_GRID.map((row, y) =>
        row.split('').map((ch, x) =>
          ch === '1' ? (
            <Rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000000" />
          ) : null
        )
      )}
    </Svg>
  );
}

export default function QRScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <View style={{ paddingTop: 8, paddingBottom: 24 }} />

      <View style={{ alignItems: 'center', paddingHorizontal: 32, marginTop: 8 }}>
        <Text
          style={{ color: '#FFFFFF', fontSize: 38, fontWeight: '700', letterSpacing: 1, textAlign: 'center', lineHeight: 42 }}
        >
          ACCEDÉ A TU
        </Text>
        <Text
          style={{ color: '#FF6B00', fontSize: 38, fontWeight: '700', letterSpacing: 1, textAlign: 'center', lineHeight: 42, marginTop: 4 }}
        >
          SEDE
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8 }}>
          <MockQRCode size={220} />
        </View>
        <Text style={{ color: '#B8B8B8', fontSize: 13, marginTop: 12 }}>1</Text>
      </View>

      <View style={{ height: 16 }} />
    </SafeAreaView>
  );
}
