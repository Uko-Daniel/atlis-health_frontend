import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { getAllEncounters } from '@/services/encounterService'
import GreetingHero from '@/components/dashboard/GreetingHero'
import TodayAgenda from '@/components/dashboard/Today'
import PriorityQueue from '@/components/dashboard/PriorityQueue'
import RecentPatients from '@/components/dashboard/RecentPatients'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Active encounters — the doctor's unfinished work
  const { data: encounters, isLoading: encLoading } = useQuery({
    queryKey: ['encounters', 'my-active'],
    queryFn: () => getAllEncounters({ limit: 50 }),
  })

  const activeEncounters = (encounters?.data ?? []).filter(
    (e) => !e.stopTime && e.attendingStaff === user?.sub,
  )


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <GreetingHero />
      <TodayAgenda />

      {/* Active Encounters — Resume Work */}
      {activeEncounters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Active Encounters</h3>
            <span className="text-xs text-subtle">
              {activeEncounters.length} in progress
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {encLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="shrink-0 w-64 h-24 rounded-2xl" />
              ))
            ) : (
              activeEncounters.slice(0, 5).map((enc) => {
                const patientName = enc.patient
                  ? `${enc.patient.firstName} ${enc.patient.lastName}`
                  : 'Unknown'
                const startedAt = timeAgo(enc.startTime)

                return (
                  <div
                    key={enc.id}
                    onClick={() => navigate(`/encounters/${enc.id}`)}
                    className={cn(
                      'shrink-0 w-64 rounded-2xl p-4 cursor-pointer',
                      'bg-white border-2 border-[#5580F4] shadow-md',
                      'hover:shadow-lg transition-all',
                    )}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar name={patientName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink truncate">{patientName}</p>
                        <p className="text-xs text-subtle">{enc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#5580F4] bg-[#F0F4FF] px-2 py-0.5 rounded-full font-medium">
                        Started {startedAt}
                      </span>
                      <span className="text-xs text-[#5580F4] font-medium">Resume →</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Priority Queue + Recent Patients */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <PriorityQueue />
        <RecentPatients />
      </div>
    </div>
  )
}