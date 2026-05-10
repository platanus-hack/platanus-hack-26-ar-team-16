/**
 * Más — hardcoded profile screen mirroring Megatlon's Más tab.
 *
 * Pulls the display name from useAuthStore (UserProfile.displayName).
 * All rows are static — they exist for visual continuity only.
 */

import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../../src/store/useAuthStore';
import { useOpenWearables } from '../../src/hooks/useOpenWearables';

const ROWS = [
  { id: 'reservas', label: 'RESERVAS', icon: 'calendar-blank-outline', section: 'top' },
  { id: 'cuenta', label: 'MI CUENTA', icon: 'account-outline', section: 'middle' },
  { id: 'reloj', label: 'Conectar Reloj', icon: null, section: 'middle-sub' },
  { id: 'estado', label: 'Estado de cuenta', icon: null, section: 'middle-sub' },
  { id: 'jurada', label: 'Declaración jurada', icon: null, section: 'middle-sub' },
  { id: 'noti', label: 'NOTIFICACIONES', icon: 'bell-outline', section: 'middle' },
  { id: 'avisos', label: 'Mis avisos', icon: null, section: 'middle-sub' },
  { id: 'sedes', label: 'SEDES', icon: 'map-marker-outline', section: 'top' },
  { id: 'ayuda', label: 'AYUDA', icon: 'whatsapp', section: 'top' },
] as const;

function ConectarRelojModal({
  visible,
  onClose,
  connected,
  syncing,
  loading,
  onConnect,
  onSync,
}: {
  visible: boolean;
  onClose: () => void;
  connected: boolean;
  syncing: boolean;
  loading: boolean;
  onConnect: () => void;
  onSync: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <SafeAreaView style={{ backgroundColor: '#111111', borderTopLeftRadius: 24, borderTopRightRadius: 24 }} edges={['bottom']}>
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 32, paddingHorizontal: 24 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', marginBottom: 28 }} />

              <View style={{
                width: 72, height: 72, borderRadius: 20,
                backgroundColor: connected ? '#1a2e1a' : '#1A1A1A',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <MaterialCommunityIcons
                  name={connected ? 'watch-variant' : 'watch-variant'}
                  size={36}
                  color={connected ? '#4ADE80' : '#FF6B00'}
                />
              </View>

              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.4, marginBottom: 8 }}>
                {connected ? 'Reloj Conectado' : 'Conectar Reloj'}
              </Text>
              <Text style={{ color: '#888888', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                {connected
                  ? 'Tu smartwatch está sincronizando datos de salud con Gohan AI.'
                  : 'Sincronizá tu smartwatch para registrar tus entrenamientos automáticamente.'}
              </Text>

              {connected && (
                <View style={{
                  width: '100%', flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16,
                  backgroundColor: '#1A1A1A', borderRadius: 12, marginBottom: 16,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: syncing ? '#4ADE80' : '#666' }} />
                    <Text style={{ color: '#FFFFFF', fontSize: 14 }}>
                      {syncing ? 'Sincronizando...' : 'Sync pausado'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="sync" size={18} color="#888" />
                </View>
              )}

              {connected ? (
                <Pressable
                  onPress={onSync}
                  style={({ pressed }) => ({
                    width: '100%', height: 52, borderRadius: 14,
                    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>
                    Sincronizar ahora
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onConnect}
                  disabled={loading}
                  style={({ pressed }) => ({
                    width: '100%', height: 52, borderRadius: 14,
                    backgroundColor: '#FF6B00',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: loading ? 0.6 : pressed ? 0.85 : 1,
                  })}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>
                      Conectar
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function MasScreen() {
  const [watchModalVisible, setWatchModalVisible] = useState(false);
  const { connected, syncing, loading, connect, forceSync } = useOpenWearables();

  const userName = useAuthStore((s: any) => s.user?.displayName ?? null);
  const displayName = (userName ?? 'Tomás Calligaris').toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 24 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#2A2A2A',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <MaterialCommunityIcons name="account" size={44} color="#666666" />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 1.5 }}>
            {displayName}
          </Text>
        </View>

        <View>
          {ROWS.map((row) => {
            const isSubRow = row.section === 'middle-sub';
            const isWatch = row.id === 'reloj';

            const content = (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: isSubRow ? 12 : 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#1A1A1A',
                }}
              >
                <Text
                  style={{
                    color: isWatch ? (connected ? '#4ADE80' : '#FF6B00') : isSubRow ? '#B8B8B8' : '#FFFFFF',
                    fontSize: isSubRow ? 14 : 15,
                    fontWeight: isSubRow ? '400' : '600',
                    letterSpacing: isSubRow ? 0 : 1.2,
                  }}
                >
                  {isWatch && connected ? 'Reloj Conectado' : row.label}
                </Text>
                {isWatch ? (
                  <MaterialCommunityIcons name="watch-variant" size={18} color={connected ? '#4ADE80' : '#FF6B00'} />
                ) : row.icon ? (
                  <MaterialCommunityIcons name={row.icon as any} size={20} color="#FFFFFF" />
                ) : null}
              </View>
            );

            if (isWatch) {
              return (
                <Pressable
                  key={row.id}
                  onPress={() => setWatchModalVisible(true)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  {content}
                </Pressable>
              );
            }

            return <View key={row.id}>{content}</View>;
          })}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ color: '#666666', fontSize: 14, marginBottom: 12 }}>Acerca de Megatlon</Text>
          <Text style={{ color: '#666666', fontSize: 14, marginBottom: 12 }}>Cerrar sesión</Text>
          <Text style={{ color: '#444444', fontSize: 11 }}>Versión 3.0.1</Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <ConectarRelojModal
        visible={watchModalVisible}
        onClose={() => setWatchModalVisible(false)}
        connected={connected}
        syncing={syncing}
        loading={loading}
        onConnect={connect}
        onSync={forceSync}
      />
    </SafeAreaView>
  );
}
