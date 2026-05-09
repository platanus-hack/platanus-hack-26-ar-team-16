import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface ToolIndicatorProps {
  toolName: string;
}

const TOOL_LABELS: Record<string, string> = {
  create_routine: 'Creando tu rutina...',
  update_exercise: 'Modificando ejercicio...',
  replace_exercise: 'Reemplazando ejercicio...',
  add_exercise: 'Agregando ejercicio...',
  remove_exercise: 'Quitando ejercicio...',
  update_day: 'Actualizando día...',
  explain_exercise: 'Pensando...',
};

function labelFor(toolName: string): string {
  return TOOL_LABELS[toolName] ?? 'Modificando rutina...';
}

export function ToolIndicator({ toolName }: ToolIndicatorProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 9999,
        gap: 8,
        backgroundColor: `${theme.primary}1A`,
      }}
    >
      <Ionicons name="construct" size={14} color={theme.primary} />
      <Text style={{ fontSize: 14, fontWeight: '500', color: theme.primary }}>
        {labelFor(toolName)}
      </Text>
    </View>
  );
}
