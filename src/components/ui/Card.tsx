import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends ViewProps {
  children: ReactNode;
  padding?: Padding;
  className?: string;
}

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, padding = 'md', className = '', ...rest }: CardProps) {
  return (
    <View
      {...rest}
      className={`bg-white rounded-2xl border border-slate-200 ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </View>
  );
}
