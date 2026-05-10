export type TenantId = 'default' | 'smartfit' | 'megatlon';

export interface TenantImages {
  logoUrl: string | null;
  loginHero: string | null;
}

export interface TenantClassNames {
  /** Tailwind classes for the page-level background (works with NativeWind on web + native). */
  pageBg: string;
  /** Tailwind classes for an elevated card/surface. */
  surface: string;
  /** Default text color class for primary copy. */
  text: string;
  /** Tailwind class for muted/secondary copy. */
  textMuted: string;
}

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
  classNames: TenantClassNames;
  images: TenantImages;
  heroGradient: [string, string];
  fontFamily: {
    sans: string;
    mono: string;
  };
}
