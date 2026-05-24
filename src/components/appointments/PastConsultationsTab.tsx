import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getAllEncounters } from '@/services/encounterService'
import { ENCOUNTER_TYPE_LABELS } from '@/types/encounter'
import { Skeleton } from '@/components/ui/skeleton'

export default function PastConsultationsTab() {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['encounters', 'past'],
    queryFn:  () => getAllEncounters({ limit: 50 }),
  })

  // Past = has a stopTime (encounter was closed)
  const past = (data?.data ?? []).filter((e) => e.stopTime !== null)

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })

  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-NG', {
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">

      {isLoading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4
                                border-b border-slate-50 last:border-0">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      ))}

      {isError && (
        <div className="py-16 text-center text-sm text-red-500">
          Failed to load past consultations
        </div>
      )}

      {!isLoading && !isError && past.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400">
          No closed consultations yet
        </div>
      )}

      {!isLoading && !isError && past.map((enc) => (
        <div
          key={enc.id}
          onClick={() => navigate(`/patients/${enc.patientId}`)}
          className="flex items-center gap-4 px-6 py-4 border-b border-slate-50
                     last:border-0 cursor-pointer hover:bg-indigo-50/40 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {enc.patient?.firstName} {enc.patient?.lastName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {enc.chiefComplaint ?? ENCOUNTER_TYPE_LABELS[enc.type]}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">
              {fmtTime(enc.startTime!)} — {fmtTime(enc.stopTime!)}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {fmt(enc.startTime)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}