import type { Tenant } from '../types';
import { supabase } from './supabase';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
}

const FALLBACK_TENANT: Tenant = {
  id: 'default',
  name: 'Gohan AI',
  slug: 'default',
  logoUrl: null,
  primaryColor: '#6366F1',
  secondaryColor: '#4F46E5',
  createdAt: new Date(0).toISOString(),
};

function rowToTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    createdAt: row.created_at,
  };
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToTenant(data as TenantRow) : null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToTenant(data as TenantRow) : null;
}

export async function getDefaultTenant(): Promise<Tenant> {
  const slug = process.env.EXPO_PUBLIC_DEFAULT_TENANT ?? 'default';
  try {
    const remote = await getTenantBySlug(slug);
    if (remote) return remote;
  } catch {
    // network/RLS error — fall through to local default so the UI can still render
  }
  return FALLBACK_TENANT;
}
