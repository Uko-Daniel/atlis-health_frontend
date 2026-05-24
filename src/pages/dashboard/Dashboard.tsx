import { useAuthStore } from '@/stores/authStore'
import { RESULT_BLIND_ROLES } from '@/types/auth'

import GreetingHero         from '@/components/dashboard/GreetingHero'
import StatsCard            from '@/components/dashboard/StatsCard'
import LatestPatientCard    from '@/components/dashboard/LatestPatientCard'
import PeriodTiles          from '@/components/dashboard/PeriodTiles'
import RecentRegistrations  from '@/components/dashboard/RecentRegistrations'
import CurrentPatientsGrid  from '@/components/dashboard/CurrentPatientsGrid'

export default function Dashboard() {
  const user         = useAuthStore((s) => s.user)
  const isResultBlind = user && RESULT_BLIND_ROLES.includes(user.role)

  return (
    // Full-bleed lavender bg overrides AppLayout's slate-50
    <div className="-m-6 min-h-full bg-[#EBEBFF] p-6 space-y-6">

      {/* ── Greeting ── */}
      <GreetingHero />

      {/* ── Top row: Stats | Latest Patient | Period Tiles ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Stats card */}
        <div className="w-full lg:w-72 shrink-0">
          <StatsCard />
        </div>

        {/* Latest patient */}
        {!isResultBlind && (
          <div className="w-full lg:w-56 shrink-0">
            <LatestPatientCard />
          </div>
        )}

        {/* Period tiles — flex-1 so they fill remaining space */}
        <div className="flex-1">
          <PeriodTiles />
        </div>
      </div>

      {/* ── Recent registrations strip ── */}
      {!isResultBlind && <RecentRegistrations />}

      {/* ── Current patients grid ── */}
      {!isResultBlind && <CurrentPatientsGrid />}

    </div>
  )
}