import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { getPatients } from '@/services/patientService'
import { getPatientAge } from '@/types/patient'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { Skeleton } from '@/components/ui/skeleton'

export default function RecentPatients() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'dash-recent'],
    queryFn:  () => getPatients({ page: 1, limit: 6 }),
  })

  const patients = data?.data ?? []

  return (
    <div className="bg-white rounded-2xl border border-[#EEF1F8]
                    shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(85,128,244,0.05)]
                    overflow-hidden">

      <div className="flex items-center justify-between px-4 py-4
                      border-b border-bg">
        <h3 className="text-sm font-bold text-ink">Recent Patients</h3>
        <button
          onClick={() => navigate('/patients')}
          className="text-xs text-[#5580F4] font-medium hover:underline"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-bg">

        {isLoading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="size-4 rounded" />
          </div>
        ))}

        {!isLoading && patients.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center px-4">
            <Users size={20} className="text-subtle mb-2" />
            <p className="text-xs text-subtle">No patients registered yet</p>
          </div>
        )}

        {!isLoading && patients.map((p) => {
          const name = `${p.firstName} ${p.lastName}`
          return (
            <div
              key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer
                         hover:bg-bg transition-colors group"
            >
              <Avatar name={name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {name}
                </p>
                <p className="text-xs text-subtle mt-0.5">
                  {getPatientAge(p.dob)}y ·{' '}
                  {p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}
                  {p.phoneNumber && ` · ${p.phoneNumber}`}
                </p>
              </div>
              <ChevronRight
                size={15}
                className="text-subtle shrink-0 opacity-0
                           group-hover:opacity-100 transition-opacity"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}