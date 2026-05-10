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
  backgroundColor?: string;
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
  backgroundColor,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bgColor =
    backgroundColor ??
    (variant === 'primary'
      ? theme.primary
      : variant === 'secondary'
        ? '#EEF2FF'
        : 'transparent');

  const textColor =
    variant === 'primary' ? '#FFFFFF' : theme.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${sizePadding[size]} rounded-2xl flex-row items-center justify-center ${fullWidth ? 'w-full' : ''}`}
      style={({ pressed }) => ({
        backgroundColor: bgColor,
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`font-semibold ${sizeText[size]}`} style={{ color: textColor }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
