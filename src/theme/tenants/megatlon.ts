/**
 * Megatlon tenant — first concrete demo case for the hackathon.
 *
 * Brand identity (extracted from the live app, May 2026):
 *   - Pure black background, very dark gray surfaces
 *   - Aggressive orange accent (#FF6B00) for CTAs and the QR FAB ring
 *   - Geometric sans-serif, mostly bold, frequently uppercase
 *
 * The brand orange matches smartfit (#FF6B00). Tokens are kept duplicated
 * rather than aliased so future divergence between the two brands doesn't
 * accidentally couple them.
 */

import type { TenantTheme } from '../tokens';

export const megatlonTenant: TenantTheme = {
  id: 'megatlon',
  name: 'Megatlon',
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
  heroGradient: ['#FF6B00', '#A04500'],
  fontFamily: {
    sans: 'Inter',
    mono: 'JetBrainsMono',
  },
};
