import api from '@/lib/api'
import type { StaffRole } from '@/types/auth'

export interface TenantPermissionItem {
  id: string
  tenantId: string
  permissionKey: string
  allowedRoles: StaffRole[]
  updatedAt: string
  updatedBy: string
}

export interface PermissionWithDefaults {
  key: string
  label: string
  description: string
  complianceLocked: boolean
  effectiveRoles: StaffRole[]
  isOverridden: boolean
  defaultRoles: StaffRole[]
}

// GET /api/settings/permissions
export async function getPermissions(): Promise<PermissionWithDefaults[]> {
  const res = await api.get<PermissionWithDefaults[]>('/settings/permissions')
  return res.data
}

// PUT /api/settings/permissions/:key
export async function updatePermission(
  key: string,
  allowedRoles: StaffRole[],
): Promise<TenantPermissionItem> {
  const res = await api.put<TenantPermissionItem>(`/settings/permissions/${key}`, {
    allowedRoles,
  })
  return res.data
}