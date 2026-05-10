import type { TenantTheme } from '../tokens';

export const smartfitTenant: TenantTheme = {
  id: 'smartfit',
  name: 'SmartFit Demo',
  signature: '#FF6B00',
  colors: {
    primary: '#FF6B00',
    primaryMuted: '#CC5500',
    onPrimary: '#FFFFFF',

    secondary: '#FFFFFF',
    onSecondary: '#000000',

    background: '#000000',
    surface: '#161616',
    surfaceElevated: '#1F1F1F',

    text: '#FFFFFF',
    textMuted: '#B8B8B8',

    border: '#2A2A2A',

    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  classNames: {
    pageBg: 'bg-black',
    surface: 'bg-neutral-900 border border-neutral-800',
    text: 'text-white',
    textMuted: 'text-neutral-400',
  },
  images: {
    logoUrl: null,
    loginHero: null,
  },
  heroGradient: ['#FF6B00', '#A04500'],
  fontFamily: {
    sans: 'Inter',
    mono: 'JetBrainsMono',
  },
};
