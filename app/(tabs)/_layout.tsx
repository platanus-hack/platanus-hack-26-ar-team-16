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


/* ─── Megatlon brand tokens ─────────────────────────────────────── */
const MT = {
  bg: '#000000',
  navBg: '#0F0F0F',
  navBorder: '#1A1A1A',
  textActive: '#FFFFFF',
  textIdle: '#B5B5B5',
  brand: '#FF6B00',
  fabBg: '#FFFFFF',
} as const;

const TAB_ICONS = {
  index: 'home',
  coach: 'body',
  qr: 'qr-code',
  routine: 'barbell',
  mas: 'grid',
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
  const onTabPress = (routeName: string, key: string, isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(routeName as never);
  };

  const ICON_SIZE = 30;
  const FAB_DIAMETER = 60;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: MT.navBg,
        borderTopWidth: 1,
        borderTopColor: MT.navBorder,
        height: 60,
        paddingBottom: 6,
        overflow: 'visible',
      }}
    >
      {state.routes.map((route, idx) => {
        const isFocused = state.index === idx;
        const isQr = route.name === 'qr';
        const isCoach = route.name === 'coach';
        const IconComponent: any = isCoach ? MaterialCommunityIcons : Ionicons;

        const iconName = TAB_ICONS[route.name as TabName] ?? 'help-circle-outline';
        const label = TAB_LABELS[route.name as TabName] ?? (descriptors[route.key]?.options.title ?? '');

        if (isQr) {
          return (
            <Pressable
              key={route.key}
              onPress={() => onTabPress(route.name, route.key, isFocused)}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                // @ts-expect-error web-only: suppress browser default focus ring
                outline: 'none',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -(FAB_DIAMETER / 2),
                  width: FAB_DIAMETER,
                  height: FAB_DIAMETER,
                  borderRadius: FAB_DIAMETER / 2,
                  backgroundColor: MT.bg,
                  borderWidth: 1.5,
                  borderColor: MT.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={iconName as any}
                  size={ICON_SIZE}
                  color={isFocused ? MT.textActive : MT.textIdle}
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '500',
                  letterSpacing: 0.6,
                  marginBottom: 4,
                  color: isFocused ? MT.textActive : MT.textIdle,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={() => onTabPress(route.name, route.key, isFocused)}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingTop: 6,
              // @ts-expect-error web-only: suppress browser default focus ring
              outline: 'none',
            }}
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
            <Ionicons
              name={iconName as any}
              size={ICON_SIZE}
              color={isFocused ? MT.textActive : MT.textIdle}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '500',
                letterSpacing: 0.6,
                marginTop: 2,
                color: isFocused ? MT.textActive : MT.textIdle,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
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

