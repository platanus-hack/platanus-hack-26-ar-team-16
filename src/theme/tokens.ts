export type TenantId = 'default' | 'smartfit' | 'megatlon';

export interface TenantTheme {
  id: TenantId;
  name: string;
  /** Hex signature color — the one that defines the brand at a glance. */
  signature: string;
  colors: {
    primary: string;
    primaryMuted: string;
    onPrimary: string;
    secondary: string;
    onSecondary: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  heroGradient: [string, string];
  fontFamily: {
    sans: string;
    mono: string;
  };
}
