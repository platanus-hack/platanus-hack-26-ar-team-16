import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * Theme-aware text input. Surface, border, label, and value colors all derive
 * from the active tenant theme so the same component fits a light Gohan
 * shell, the Megatlon dark shell, or a future tenant without per-screen
 * overrides.
 */
export function Input({ label, error, className, ...rest }: InputProps) {
  const { tenant } = useTheme();
  const isDark = tenant.id === 'megatlon' || tenant.id === 'smartfit';
  return (
    <View className="w-full">
      {label && (
        <Text className={`text-sm font-medium mb-1.5 ${tenant.classNames.text}`}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
        {...rest}
        style={{
          backgroundColor: tenant.colors.surface,
          color: tenant.colors.text,
          borderColor: error ? tenant.colors.danger : tenant.colors.border,
        }}
        className={`px-4 py-3 border rounded-2xl text-base ${className ?? ''}`}
      />
      {error && (
        <Text className="text-sm mt-1" style={{ color: tenant.colors.danger }}>
          {error}
        </Text>
      )}
    </View>
  );
}
