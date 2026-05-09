import type { ReactNode } from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const sizePadding: Record<Size, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

const sizeText: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bgStyle =
    variant === 'primary'
      ? { backgroundColor: theme.primary }
      : variant === 'secondary'
        ? { backgroundColor: '#EEF2FF' }
        : undefined;

  const textColor =
    variant === 'primary' ? '#FFFFFF' : theme.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        bgStyle,
        { opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
      className={`${sizePadding[size]} rounded-2xl flex-row items-center justify-center ${fullWidth ? 'w-full' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {icon}
          <Text style={{ color: textColor }} className={`font-semibold ${sizeText[size]}`}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
