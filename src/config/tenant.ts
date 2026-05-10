import type { TenantId } from '@/theme';

/**
 * Build-time tenant slug. Each tenant ships as its own app — Megatlon, SmartFit,
 * the standalone Gohan app, etc. The slug is baked into the bundle via
 * `EXPO_PUBLIC_TENANT_SLUG` so the brand identity (colors, surfaces, copy) is
 * decided at build time, not at runtime after login.
 *
 * Authoritative theme source: `useTheme()` resolves directly from this slug.
 * The runtime tenant store (`useTenantStore`) still holds the DB-side tenant
 * record (id, name) for multi-tenant API calls, but it does NOT influence
 * styling — that's locked to the shipped brand.
 *
 * Defaults to `megatlon` because that's the hackathon demo build. Override
 * via `.env.local` or per-build env when packaging a different tenant.
 */
export const ACTIVE_TENANT_SLUG: TenantId =
  ((process.env.EXPO_PUBLIC_TENANT_SLUG ?? 'megatlon') as TenantId);
