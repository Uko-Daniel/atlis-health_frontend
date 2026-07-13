import { create } from 'zustand'

interface TenantContext {
  tenantId: string | null
  facilityName: string | null
  themePrimaryColor: string | null
  logoUrl: string | null
  subscriptionStatus: string | null
  setTenant: (tenant: {
    tenantId: string
    facilityName: string
    themePrimaryColor: string | null
    logoUrl: string | null
    subscriptionStatus: string
  }) => void
}

export const useTenantStore = create<TenantContext>((set) => ({
  tenantId: null,
  facilityName: null,
  themePrimaryColor: null,
  logoUrl: null,
  subscriptionStatus: null,
  setTenant: (tenant) => set(tenant),
}))