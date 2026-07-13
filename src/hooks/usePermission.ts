import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getPermissions } from '@/services/permissionService'
import { hasPermission } from '@/utils/permissions'

export function usePermission(permissionKey: string): boolean {
  const user = useAuthStore((s) => s.user)

  const { data: permissions } = useQuery({
    queryKey: ['settings', 'permissions'],
    queryFn: getPermissions,
    staleTime: 1000 * 60 * 5, // 5 min — permissions don't change often
    enabled: !!user,
  })

  if (!user) return false

  const tenantPermissions = (permissions ?? []).map((p) => ({
    permissionKey: p.key,
    allowedRoles: p.effectiveRoles,
  }))

  return hasPermission(user, permissionKey, tenantPermissions)
}