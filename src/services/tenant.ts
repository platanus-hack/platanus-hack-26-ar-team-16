import type { Tenant } from '../types';

// TODO: @DanteDia — implement with Supabase queries

export async function getTenantBySlug(_slug: string): Promise<Tenant | null> {
  throw new Error('Not implemented');
}

export async function getDefaultTenant(): Promise<Tenant> {
  return {
    id: 'default',
    name: 'Gohan AI',
    slug: 'default',
    logoUrl: null,
    primaryColor: '#6366F1',
    secondaryColor: '#4F46E5',
    createdAt: new Date().toISOString(),
  };
}
