import type { TenantId, TenantTheme } from '../tokens';
import { defaultTenant } from './default';
import { smartfitTenant } from './smartfit';
import { megatlonTenant } from './megatlon';

export { defaultTenant, smartfitTenant, megatlonTenant };

const REGISTRY: Record<TenantId, TenantTheme> = {
  default: defaultTenant,
  smartfit: smartfitTenant,
  megatlon: megatlonTenant,
};

/**
 * Resolve a tenant slug/id to a full TenantTheme. Unknown slugs fall back
 * to the default tenant so callers never need a null check.
 */
export function getTenantTheme(slug: string | null | undefined): TenantTheme {
  if (!slug) return defaultTenant;
  return REGISTRY[slug as TenantId] ?? defaultTenant;
}
