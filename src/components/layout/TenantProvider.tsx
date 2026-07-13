import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCurrentTenant } from '@/services/tenantService'
import { useTenantStore } from '@/hooks/useTenant'

export default function TenantProvider({ children }: { children: React.ReactNode }) {
  const setTenant = useTenantStore((s) => s.setTenant)

  const { data } = useQuery({
    queryKey: ['tenant'],
    queryFn: getCurrentTenant,
    staleTime: Infinity, // Tenant doesn't change per session
    retry: false,
  })

  useEffect(() => {
    if (data) {
      setTenant({
        tenantId: data.id,
        facilityName: data.facilityName,
        themePrimaryColor: data.themePrimaryColor,
        logoUrl: data.logoUrl,
        subscriptionStatus: data.subscriptionStatus,
      })
    }
  }, [data, setTenant])

  return <>{children}</>
}