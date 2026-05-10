/**
 * Tabs layout — Megatlon-skinned shell.
 *
 * When tenant.slug === 'megatlon': renders the 5-tab Megatlon shell with
 * a custom black navbar and elevated QR FAB.
 * For all other tenants: falls back to DefaultTabsLayout (existing Gohan UI).
 *
 * Territory: app/ → @alexndr-n. Opened as part of thblu/megatlon-shell-demo
 * as an intentional cross-territory exception — requires @alexndr-n review.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// ASSUMPTION: useTenantStore lives in src/store/. If the path differs, fix here.
import { useTenantStore } from '../../src/store/useTenantStore';

/* ─── Megatlon brand tokens ─────────────────────────────────────── */
const MT = {
  bg: '#000000',
  navBg: '#0F0F0F',
  navBorder: '#1A1A1A',
  textActive: '#FFFFFF',
  textIdle: '#6B6B6B',
  brand: '#FF6B00',
  fabBg: '#FFFFFF',
} as const;

const TAB_ICONS = {
  index: 'home-variant-outline',
  coach: 'message-outline',
  qr: 'qrcode-scan',
  routine: 'dumbbell',
  mas: 'menu',
} as const;

const TAB_LABELS = {
  index: 'INICIO',
  coach: 'GOHAN',
  qr: 'QR',
  routine: 'RUTINAS',
  mas: 'MÁS',
} as const;

type TabName = keyof typeof TAB_ICONS;

function MegatlonTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const qrRoute = state.routes.find((r) => r.name === 'qr');
  const qrIndex = state.routes.findIndex((r) => r.name === 'qr');
  const qrFocused = state.index === qrIndex;

  const onTabPress = (routeName: string, key: string, isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(routeName as never);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: MT.navBg,
        borderTopWidth: 1,
        borderTopColor: MT.navBorder,
        height: 76,
        paddingBottom: 8,
      }}
    >
      {state.routes.map((route, idx) => {
        const isFocused = state.index === idx;
        const isQr = route.name === 'qr';

        if (isQr) return <View key={route.key} style={{ flex: 1 }} />;

        const iconName = TAB_ICONS[route.name as TabName] ?? 'help-circle-outline';
        const label = TAB_LABELS[route.name as TabName] ?? (descriptors[route.key]?.options.title ?? '');

        return (
          <Pressable
            key={route.key}
            onPress={() => onTabPress(route.name, route.key, isFocused)}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}
          >
            {isFocused ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 22,
                  height: 2,
                  backgroundColor: MT.textActive,
                  borderRadius: 1,
                }}
              />
            ) : null}
            <MaterialCommunityIcons
              name={iconName as any}
              size={22}
              color={isFocused ? MT.textActive : MT.textIdle}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '500',
                letterSpacing: 0.6,
                marginTop: 4,
                color: isFocused ? MT.textActive : MT.textIdle,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}

      {qrRoute ? (
        <Pressable
          onPress={() => onTabPress('qr', qrRoute.key, qrFocused)}
          accessibilityRole="button"
          accessibilityLabel="Acceder con QR"
          style={{
            position: 'absolute',
            top: -22,
            left: '50%',
            marginLeft: -28,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: MT.fabBg,
            borderWidth: 3,
            borderColor: MT.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={26} color={MT.brand} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  // ASSUMPTION: useTenantStore has tenant?.slug. If the store shape differs, fix here.
  const tenantSlug = useTenantStore((s) => s.tenant?.slug ?? null);

  if (tenantSlug !== 'megatlon') {
    return <DefaultTabsLayout />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: MT.bg },
      }}
      tabBar={(props) => <MegatlonTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'INICIO' }} />
      <Tabs.Screen name="coach" options={{ title: 'GOHAN' }} />
      <Tabs.Screen name="qr" options={{ title: 'QR' }} />
      <Tabs.Screen name="routine" options={{ title: 'RUTINAS' }} />
      <Tabs.Screen name="mas" options={{ title: 'MÁS' }} />
    </Tabs>
  );
}

/**
 * Fallback for non-Megatlon tenants. Ale can replace this with his real
 * default layout — it's a 1-line swap.
 */
function DefaultTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: 'Rutina',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Gohan AI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="qr" options={{ href: null }} />
      <Tabs.Screen name="mas" options={{ href: null }} />
    </Tabs>
  );
}
