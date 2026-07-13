import { useAuthStore } from '@/stores/authStore'
import DoctorDashboard from './DoctorDashboard'
import PharmacistDashboard from './PharmacistDashboard'
import BillingDashboard from './BillingDashboard'
import LabDashboard from './LabDashboard'
import ReceptionistDashboard from './ReceptionistDashboard'
import ManagerDashboard from './ManagerDashboard'
import HIMDashboard from './HIMDashboard'
import ProcurementDashboard from './ProcurementDashboard'
import NurseDashboard from './NurseDashboard'
import PlaceholderDashboard from './PlaceholderDashboard'

export default function DashboardIndex() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  console.log('DashboardIndex: user role =', role)

  switch (role) {
    case 'DOCTOR':
      return <DoctorDashboard />
    case 'NURSES':
      return <NurseDashboard />
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
      return <HIMDashboard />
    case 'MANAGER':
      return <ManagerDashboard />
    case 'ADMIN':
      return <ManagerDashboard /> // Same KPIs
    case 'SUPER_ADMIN':
      return <ManagerDashboard />
    case 'PROCUREMENT_OFFICER':
      return <ProcurementDashboard />
    case 'IT_SUPPORT':
      return <PlaceholderDashboard role="IT Support" />
    default:
      return <PlaceholderDashboard role="User" />
  }
}