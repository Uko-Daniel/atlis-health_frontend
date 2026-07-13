import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileText,
  LayoutTemplate,
  UserCog,
  Settings,
  ListChecks,
  ClipboardList,
  FlaskConical,
  CreditCard
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
  'SUPER_ADMIN',
  'ADMIN',
  'DOCTOR',
  'NURSES',
  'LAB_SCIENTIST',
  'IMAGING_TECH',
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
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSES', 'PHARMACIST', 'RECEPTIONIST', 'HIM_OFFICER'],
  },
  {
    label: 'Appointments',
    path:  '/appointments',
    icon:  CalendarClock,
    allowedRoles: [ 'DOCTOR', 'IT_SUPPORT',
      'RECEPTIONIST',
    ],
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: ClipboardList,
    allowedRoles: ['IT_SUPPORT', 'ADMIN', 'MANAGER', 'BILLING_OFFICER', 'HIM_OFFICER'],
  },
  {
    label: 'Services',
    path: '/services',
    icon: FlaskConical,
    allowedRoles: ['IT_SUPPORT', 'ADMIN', 'MANAGER', 'BILLING_OFFICER'],
  },
  {
    label: 'Worklist',
    path:  '/worklist',
    icon:  ListChecks,
    allowedRoles: ['LAB_SCIENTIST', 'IMAGING_TECH', 'ADMIN', 'IT_SUPPORT'],
  },
  {
    label: 'Billing',
    path:  '/settings/billing',
    icon:  CreditCard,
    allowedRoles: ['BILLING_OFFICER', 'ADMIN', 'MANAGER'],
  },
  {
    label: 'Requests',
    path: '/requests',
    icon: ClipboardList,
    allowedRoles: ALL_ROLES, // Everyone can access
  },
  {
    label: 'Results',
    path:  '/results',
    icon:  FileText,
    allowedRoles: [
      'ADMIN', 'DOCTOR', 'LAB_SCIENTIST',
      'IMAGING_TECH', 'HIM_OFFICER',
    ],
  },
  {
    label: 'Templates',
    path: '/templates',
    icon: LayoutTemplate,
    allowedRoles: ['ADMIN', 'LAB_SCIENTIST', 'IMAGING_TECH', 'IT_SUPPORT'],
  },
  {
    label: 'Staff',
    path: '/staff',
    icon: UserCog,
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    allowedRoles: ['ADMIN', 'IT_SUPPORT', 'MANAGER', 'HIM_OFFICER'],
  },
]