import api from '@/lib/api'

export interface TenantInfo {
  id: string
  facilityName: string
  subdomain: string
  themePrimaryColor: string | null
  logoUrl: string | null
  subscriptionStatus: string
}

export async function getCurrentTenant(): Promise<TenantInfo> {
  const res = await api.get<TenantInfo>('/tenant/current')
  return res.data
}