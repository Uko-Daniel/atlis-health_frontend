import GreetingHero    from '@/components/dashboard/GreetingHero'
import StatTiles       from '@/components/dashboard/StatTiles'
import RecentPatients  from '@/components/dashboard/RecentPatients'
import PendingOrders   from '@/components/dashboard/PendingOrders'
import { useAuthStore } from '@/stores/authStore'
import { RESULT_BLIND_ROLES } from '@/types/auth'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  // RECEPTIONIST and BILLING_OFFICER never see patient/result data
  const isResultBlind = user && RESULT_BLIND_ROLES.includes(user.role)

  return (
    <div className="space-y-6">
      <GreetingHero />
      <StatTiles />

      <div className={
        isResultBlind
          ? 'grid grid-cols-1 gap-4'
          : 'grid grid-cols-1 gap-4 xl:grid-cols-2'
      }>
        {!isResultBlind && <RecentPatients />}
        <PendingOrders />
      </div>
    </div>
  )
}