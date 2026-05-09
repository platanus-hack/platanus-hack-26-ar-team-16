import { create } from 'zustand';
import type { Tenant } from '../types';

interface TenantState {
  tenant: Tenant | null;
  isLoaded: boolean;
  setTenant: (tenant: Tenant) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  isLoaded: false,
  setTenant: (tenant) => set({ tenant, isLoaded: true }),
}));
