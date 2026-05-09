export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  createdAt: string;
}

export interface TenantConfig {
  tenant: Tenant;
  isLoaded: boolean;
}
