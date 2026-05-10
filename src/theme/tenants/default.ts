import type { TenantTheme } from '../tokens';

export const defaultTenant: TenantTheme = {
  id: 'default',
  name: 'Gohan AI',
  signature: '#6366F1',
  colors: {
    primary: '#6366F1',
    primaryMuted: '#4F46E5',
    onPrimary: '#FFFFFF',

    secondary: '#A5B4FC',
    onSecondary: '#1E1B4B',

    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceElevated: '#FFFFFF',

    text: '#0F172A',
    textMuted: '#64748B',

    border: '#E2E8F0',

    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',
  },
  classNames: {
    pageBg: 'bg-white',
    surface: 'bg-slate-50 border border-slate-200',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
  },
  images: {
    logoUrl: null,
    loginHero: null,
  },
  heroGradient: ['#6366F1', '#A855F7'],
  fontFamily: {
    sans: 'Inter',
    mono: 'JetBrainsMono',
  },
};
