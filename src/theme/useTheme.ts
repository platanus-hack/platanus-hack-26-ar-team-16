import { ACTIVE_TENANT_SLUG } from '@/config/tenant';
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
 * Resolves the active tenant theme.
 *
 * Theming is locked to the **build-time** tenant slug (`ACTIVE_TENANT_SLUG`)
 * because each tenant ships as its own app. The brand identity should be
 * consistent from the very first paint — including the login screen, before
 * any user is authenticated and before any tenant record is fetched from
 * Supabase.
 *
 * If you need the DB-side tenant metadata (id, name, etc.) for API calls,
 * read it from `useTenantStore` directly. This hook is purely for styling.
 */
export function useTheme(): ThemeColors {
  const resolved = getTenantTheme(ACTIVE_TENANT_SLUG);
  return {
    primary: resolved.colors.primary,
    secondary: resolved.colors.secondary,
    logoUrl: resolved.images.logoUrl,
    brandName: resolved.name,
    tenant: resolved,
  };
}
