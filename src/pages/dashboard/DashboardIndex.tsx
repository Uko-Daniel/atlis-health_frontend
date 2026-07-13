import { useAuthStore } from '@/stores/authStore'
import DoctorDashboard from './DoctorDashboard'
import PharmacistDashboard from './PharmacistDashboard'
import BillingDashboard from './BillingDashboard'
import LabDashboard from './LabDashboard'
import ReceptionistDashboard from './ReceptionistDashboard'
import ManagerDashboard from './ManagerDashboard'
import PlaceholderDashboard from './PlaceholderDashboard'

export default function DashboardIndex() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  switch (role) {
    case 'DOCTOR':
      return <DoctorDashboard />
    case 'NURSES':
      return <PlaceholderDashboard role="Nurse" />
    case 'LAB_SCIENTIST':
      return <LabDashboard />
    case 'IMAGING_TECH':
      return <LabDashboard /> // Same worklist-based dashboard
    case 'PHARMACIST':
      return <PharmacistDashboard />
    case 'RECEPTIONIST':
      return <ReceptionistDashboard />
    case 'BILLING_OFFICER':
      return <BillingDashboard />
    case 'HIM_OFFICER':
      return <PlaceholderDashboard role="HIM Officer" />
    case 'MANAGER':
      return <ManagerDashboard />
    case 'ADMIN':
      return <ManagerDashboard /> // Same KPIs
    case 'SUPER_ADMIN':
      return <ManagerDashboard />
    case 'PROCUREMENT_OFFICER':
      return <PlaceholderDashboard role="Procurement Officer" />
    case 'IT_SUPPORT':
      return <PlaceholderDashboard role="IT Support" />
    default:
      return <PlaceholderDashboard role="User" />
  }
}