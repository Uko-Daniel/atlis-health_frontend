import { useAuthStore }   from '@/stores/authStore'
import GreetingHero       from '@/components/dashboard/GreetingHero'
import TodayAgenda        from '@/components/dashboard/Today'
import PriorityQueue      from '@/components/dashboard/PriorityQueue'
import RecentPatients     from '@/components/dashboard/RecentPatients'
import { RESULT_BLIND_ROLES } from '@/types/auth'

// Clinical roles — see full dashboard
const CLINICAL = ['ADMIN', 'DOCTOR', 'NURSES']

export default function DoctorDashboard() {
  const user          = useAuthStore((s) => s.user)
  const isClinical    = CLINICAL.includes(user?.role ?? '')
  const isResultBlind = user?.role ? RESULT_BLIND_ROLES.includes(user.role) : false

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Always visible */}
      <GreetingHero />
      <TodayAgenda />

      {/* Clinical users: priority queue + recent patients */}
      {isClinical && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <PriorityQueue />
          <RecentPatients />
        </div>
      )}

      {/* Non-clinical, non-blind: just recent patients */}
      {!isClinical && !isResultBlind && (
        <RecentPatients />
      )}

    </div>
  )
}