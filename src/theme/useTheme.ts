import { useTenantStore } from '@/store';
import { getTenantTheme } from './tenants';
import type { TenantTheme } from './tokens';

export interface ThemeColors {
  /** Hex primary brand color (kept for back-compat). */
  primary: string;
  /** Hex secondary color (kept for back-compat). */
  secondary: string;
  /** Tenant logo URL or null. */
  logoUrl: string | null;
  /** Brand display name. */
  brandName: string;
  /** Full resolved tenant theme — use this for tokens, classNames and images. */
  tenant: TenantTheme;
}

/**
 * Resolves the active tenant theme from the tenant store and exposes:
 *   - the legacy primary/secondary/logoUrl/brandName shape (back-compat)
 *   - the full `tenant` token bundle from `src/theme/tenants/*`.
 *
 * Components should prefer `tenant.classNames.*`, `tenant.colors.*`, and
 * `tenant.images.*` for any new styling so the look stays consistent across
 * the login screen, the tabs shell, and the embedded widgets.
 */
/**
 * Slug used before the user is authenticated and the tenant has been hydrated
 * from their profile. Driven by `EXPO_PUBLIC_DEFAULT_TENANT` so the demo can
 * stay on the Megatlon dark shell on the login page instead of flashing the
 * Gohan-default light theme.
 */
const PRE_AUTH_TENANT_SLUG =
  process.env.EXPO_PUBLIC_DEFAULT_TENANT ?? 'megatlon';

export function useTheme(): ThemeColors {
  const tenant = useTenantStore((s) => s.tenant);
  const resolved = getTenantTheme(tenant?.slug ?? PRE_AUTH_TENANT_SLUG);
  return {
    primary: tenant?.primaryColor ?? resolved.colors.primary,
    secondary: tenant?.secondaryColor ?? resolved.colors.secondary,
    logoUrl: tenant?.logoUrl ?? resolved.images.logoUrl,
    brandName: tenant?.name ?? resolved.name,
    tenant: resolved,
  };
}
