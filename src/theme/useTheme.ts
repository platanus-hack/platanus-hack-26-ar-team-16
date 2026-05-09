import { useTenantStore } from '@/store';
import { colors } from './colors';

export interface ThemeColors {
  primary: string;
  secondary: string;
  logoUrl: string | null;
  brandName: string;
}

export function useTheme(): ThemeColors {
  const tenant = useTenantStore((s) => s.tenant);
  return {
    primary: tenant?.primaryColor ?? colors.brand[500],
    secondary: tenant?.secondaryColor ?? colors.brand[300],
    logoUrl: tenant?.logoUrl ?? null,
    brandName: tenant?.name ?? 'Gohan AI',
  };
}
