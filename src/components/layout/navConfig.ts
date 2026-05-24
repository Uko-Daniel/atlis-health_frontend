import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileText,
  LayoutTemplate,
  UserCog,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { StaffRole } from '@/types/auth'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  allowedRoles: StaffRole[]
}

const ALL_ROLES: StaffRole[] = [
  'ADMIN',
  'DOCTOR',
  'NURSES',
  'LAB_TECH',
  'RADIOLOGIST',
  'PHARMACIST',
  'RECEPTIONIST',
  'BILLING_OFFICER',
  'HIM_OFFICER',
  'MANAGER',
  'IT_SUPPORT',
]

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ALL_ROLES,
  },
  {
    label: 'Patients',
    path: '/patients',
    icon: Users,
    // BILLING_OFFICER and result-blind roles excluded from patient records
    allowedRoles: ['ADMIN', 'DOCTOR', 'NURSES', 'PHARMACIST', 'RECEPTIONIST', 'HIM_OFFICER'],
  },
  {
    label: 'Appointments',
    path:  '/appointments',
    icon:  CalendarClock,
    allowedRoles: [
      'ADMIN', 'DOCTOR', 'NURSES',
      'RECEPTIONIST', 'LAB_TECH', 'RADIOLOGIST',
    ],
  },
  {
    label: 'Results',
    path: '/results',
    icon: FileText,
    // RECEPTIONIST and BILLING_OFFICER never see results — spec is explicit
    allowedRoles: ['ADMIN', 'DOCTOR', 'NURSES', 'LAB_TECH', 'RADIOLOGIST'],
  },
  {
    label: 'Templates',
    path: '/templates',
    icon: LayoutTemplate,
    allowedRoles: ['ADMIN', 'LAB_TECH', 'RADIOLOGIST'],
  },
  {
    label: 'Staff',
    path: '/staff',
    icon: UserCog,
    allowedRoles: ['ADMIN'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    allowedRoles: ['ADMIN', 'IT_SUPPORT', 'MANAGER', 'HIM_OFFICER'],
  },
]