import { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface ToolIndicatorProps {
  toolName: string;
}

const TOOL_LABELS: Record<string, string> = {
  create_routine: 'Creando tu rutina',
  update_exercise: 'Modificando ejercicio',
  replace_exercise: 'Reemplazando ejercicio',
  add_exercise: 'Agregando ejercicio',
  remove_exercise: 'Quitando ejercicio',
  update_day: 'Actualizando día',
  explain_exercise: 'Pensando',
};

function labelFor(toolName: string): string {
  return TOOL_LABELS[toolName] ?? 'Modificando rutina';
}

export function ToolIndicator({ toolName }: ToolIndicatorProps) {
  const theme = useTheme();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 22,
        gap: 8,
      }}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="sparkles" size={14} color={theme.primary} />
      </Animated.View>
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary, letterSpacing: 0.2 }}>
        {labelFor(toolName)}
        <Text style={{ color: '#666' }}> …</Text>
      </Text>
    </View>
  );
}
