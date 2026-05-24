import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import { getPatients } from '@/services/patientService'
import { getInitials } from '@/types/patient'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'

const CARD_GRADIENTS = [
  'from-indigo-400 to-indigo-700',
  'from-violet-400 to-violet-700',
  'from-blue-400 to-blue-700',
  'from-indigo-500 to-purple-700',
]

export default function RecentRegistrations() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const canCreate = user &&
    ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSES'].includes(user.role)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'strip'],
    queryFn:  () => getPatients({ page: 1, limit: 10 }),
  })

  const patients = data?.data ?? []

  return (
    <div className="space-y-4">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-800">
          Recent Registrations
        </h3>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={() => navigate('/patients/new')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         border border-slate-200 bg-white text-slate-600
                         text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              <UserPlus size={13} />
              New Patient
            </button>
          )}
          <div className="flex items-center gap-1">
            <button className="flex size-8 items-center justify-center
                               rounded-full bg-slate-200 hover:bg-slate-300
                               transition-colors text-slate-600">
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 text-sm font-medium text-slate-700 select-none">
              Today
            </span>
            <button className="flex size-8 items-center justify-center
                               rounded-full bg-[#252660] hover:bg-[#1a1b4b]
                               transition-colors text-white">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Cards strip */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex gap-3 overflow-x-auto pb-1"
             style={{ scrollbarWidth: 'none' }}>

          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="shrink-0 w-44 h-36 rounded-xl"
            />
          ))}

          {!isLoading && patients.length === 0 && (
            <div className="flex-1 flex items-center justify-center
                            py-10 text-slate-400 text-sm">
              No patients registered yet
            </div>
          )}

          {!isLoading && patients.map((patient, i) => (
            <div
              key={patient.id}
              onClick={() => navigate(`/patients/${patient.id}`)}
              className={`shrink-0 w-44 rounded-xl p-3.5 cursor-pointer
                         bg-linear-to-b ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
                         hover:brightness-110 transition-all select-none`}
            >
              <p className="text-white/70 text-xs">Consultation</p>
              <p className="text-white font-semibold text-sm mt-0.5 truncate">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-white/50 text-xs truncate mt-0.5">
                {patient.email ?? patient.phoneNumber ?? '—'}
              </p>

              {/* Avatar + date row */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex size-10 items-center justify-center
                               rounded-full bg-white/25 text-white
                               text-xs font-bold select-none">
                  {getInitials(patient)}
                </div>
                <span className="text-white/60 text-xs">
                  {new Date(patient.createdAt).toLocaleDateString('en-NG', {
                    day:   '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}