import type { StaffRole } from '@/types/auth'

interface TenantPermission {
  permissionKey: string
  allowedRoles: StaffRole[]
}

// Hard defaults — same as backend
const DEFAULTS: Record<string, StaffRole[]> = {
  allowOrderTest: ['DOCTOR', 'NURSES', 'ADMIN'],
  allowRecordVitalsWithoutActiveEncounter: ['DOCTOR', 'NURSES', 'ADMIN'],
  allowViewDiagnoses: ['DOCTOR', 'ADMIN'],
  requireDoctorCosignOnPrescription: [],
  allowViewOrderStatus: ['BILLING_OFFICER'],
  allowCreateRequests: ['DOCTOR', 'NURSES', 'LAB_SCIENTIST', 'IMAGING_TECH', 'PHARMACIST', 'RECEPTIONIST', 'BILLING_OFFICER', 'HIM_OFFICER', 'PROCUREMENT_OFFICER', 'ADMIN', 'MANAGER'],
  allowApproveRequests: ['ADMIN', 'MANAGER', 'BILLING_OFFICER', 'HIM_OFFICER'],
  allowManageInventory: ['PROCUREMENT_OFFICER', 'ADMIN', 'MANAGER'],
  allowViewAuditLogs: ['HIM_OFFICER', 'ADMIN', 'MANAGER'],
  allowExportRecords: ['HIM_OFFICER', 'ADMIN', 'DOCTOR'],
}

const COMPLIANCE_LOCKED: StaffRole[] = ['RECEPTIONIST', 'BILLING_OFFICER']

export function hasPermission(
  user: { role: StaffRole },
  key: string,
  tenantPermissions: TenantPermission[],
): boolean {
  // Compliance: these roles never see clinical data
  if ((key === 'viewResultData' || key === 'viewDiagnoses') && COMPLIANCE_LOCKED.includes(user.role)) {
    return false
  }

  // Check tenant override
  const override = tenantPermissions.find((p) => p.permissionKey === key)
  if (override) return override.allowedRoles.includes(user.role)

  // Fall back to default
  return DEFAULTS[key]?.includes(user.role) ?? false
}

export const ALL_STAFF_ROLES: StaffRole[] = [
  'ADMIN', 'DOCTOR', 'NURSES', 'LAB_SCIENTIST', 'IMAGING_TECH',
  'PHARMACIST', 'RECEPTIONIST', 'BILLING_OFFICER',
  'HIM_OFFICER', 'MANAGER', 'IT_SUPPORT',
]