import { View, Text } from 'react-native';

type Variant = 'default' | 'success' | 'warning' | 'error' | 'brand';
type Size = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, { bg: string; text: string }> = {
  default: { bg: 'bg-slate-100', text: 'text-slate-700' },
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700' },
  error: { bg: 'bg-red-100', text: 'text-red-700' },
  brand: { bg: 'bg-brand-100', text: 'text-brand-700' },
};

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  const v = variantClasses[variant];
  return (
    <View className={`${v.bg} px-2.5 ${size === 'md' ? 'py-1.5' : 'py-1'} rounded-full self-start`}>
      <Text className={`${v.text} font-medium ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
        {label}
      </Text>
    </View>
  );
}
