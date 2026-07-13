export type StaffRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSES'
  | 'LAB_SCIENTIST'
  | 'IMAGING_TECH'
  | 'PHARMACIST'
  | 'RECEPTIONIST'
  | 'PROCUREMENT_OFFICER'
  | 'BILLING_OFFICER'
  | 'HIM_OFFICER'
  | 'MANAGER'
  | 'IT_SUPPORT'

export type Department =
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'PHARMACY'
  | 'GENERAL'
  | 'EMERGENCY'
  | 'PAEDIATRICS'
  | 'OBSTETRICS'

export interface AuthUser {
  sub:        string
  firstName:  string
  lastName:   string
  role:       StaffRole
  department: Department | null
  isHOD:      boolean
  canVerify:  boolean
  email:      string
  tenantId:   string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
}

// Roles that must NEVER see result data
export const RESULT_BLIND_ROLES: StaffRole[] = [
  'RECEPTIONIST',
  'BILLING_OFFICER',
]

// Helper — call this anywhere you need a role check
export function hasRole(user: AuthUser | null, ...roles: StaffRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}