/**
 * Más — hardcoded profile screen mirroring Megatlon's Más tab.
 *
 * Pulls the display name from useAuthStore (UserProfile.displayName).
 * All rows are static — they exist for visual continuity only.
 */

import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ASSUMPTION: useAuthStore at this path, s.user.displayName. Fix here if differs.
import { useAuthStore } from '../../src/store/useAuthStore';

const ROWS = [
  { id: 'reservas', label: 'RESERVAS', icon: 'calendar-blank-outline', section: 'top' },
  { id: 'cuenta', label: 'MI CUENTA', icon: 'account-outline', section: 'middle' },
  { id: 'datos', label: 'Mis datos', icon: null, section: 'middle-sub' },
  { id: 'estado', label: 'Estado de cuenta', icon: null, section: 'middle-sub' },
  { id: 'jurada', label: 'Declaración jurada', icon: null, section: 'middle-sub' },
  { id: 'noti', label: 'NOTIFICACIONES', icon: 'bell-outline', section: 'middle' },
  { id: 'avisos', label: 'Mis avisos', icon: null, section: 'middle-sub' },
  { id: 'sedes', label: 'SEDES', icon: 'map-marker-outline', section: 'top' },
  { id: 'ayuda', label: 'AYUDA', icon: 'whatsapp', section: 'top' },
] as const;

export default function MasScreen() {
  // UserProfile.displayName is the real field name per src/types/user.ts
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
            return (
              <View
                key={row.id}
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
                    color: isSubRow ? '#B8B8B8' : '#FFFFFF',
                    fontSize: isSubRow ? 14 : 15,
                    fontWeight: isSubRow ? '400' : '600',
                    letterSpacing: isSubRow ? 0 : 1.2,
                  }}
                >
                  {row.label}
                </Text>
                {row.icon ? (
                  <MaterialCommunityIcons name={row.icon as any} size={20} color="#FFFFFF" />
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ color: '#666666', fontSize: 14, marginBottom: 12 }}>Acerca de Megatlon</Text>
          <Text style={{ color: '#666666', fontSize: 14, marginBottom: 12 }}>Cerrar sesión</Text>
          <Text style={{ color: '#444444', fontSize: 11 }}>Versión 3.0.1</Text>
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
