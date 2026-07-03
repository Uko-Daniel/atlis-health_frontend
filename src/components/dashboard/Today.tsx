import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowRight } from 'lucide-react'
import { getAllEncounters } from '@/services/encounterService'
import { ENCOUNTER_TYPE_LABELS, type Encounter } from '@/types/encounter'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function isToday(d: string): boolean {
  const now  = new Date()
  const date = new Date(d)
  return (
    date.getDate()     === now.getDate()     &&
    date.getMonth()    === now.getMonth()    &&
    date.getFullYear() === now.getFullYear()
  )
}

function fmt(d: string) {
  return new Date(d).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit',
  })
}

function AgendaCard({
  enc,
  isActive,
}: {
  enc:      Encounter
  isActive: boolean
}) {
  const navigate = useNavigate()
  const name     = enc.patient
    ? `${enc.patient.firstName} ${enc.patient.lastName}`
    : 'Unknown Patient'
  const isClosed = !!enc.stopTime

  return (
    <div
      onClick={() => navigate(`/appointments/${enc.id}`)}
      className={cn(
        'shrink-0 w-48 rounded-2xl p-4 cursor-pointer',
        'flex flex-col gap-3 transition-all duration-150',
        isActive
          ? 'bg-white border-1 border-[#5580F4] shadow-md scale-[1.00]'
          : isClosed
          ? 'bg-white border border-[#EEF1F8] opacity-70'
          : 'bg-white border border-[#EEF1F8] hover:border-[#5580F4]/40 hover:shadow-sm'
      )}
    >
      {/* Time */}
      <p className="text-xs font-semibold text-subtle">
        {fmt(enc.startTime)}
        {enc.stopTime && ` — ${fmt(enc.stopTime)}`}
      </p>

      {/* Patient */}
      <div className="flex items-center gap-2 min-w-0">
        <Avatar name={name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate leading-tight text-ink">
            {name}
          </p>
          <p className="text-xs truncate mt-0.5 text-subtle">
            {enc.chiefComplaint ?? ENCOUNTER_TYPE_LABELS[enc.type]}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          isActive
            ? 'bg-[#5580F4] text-white'
            : isClosed
            ? 'bg-green-100 text-green-700'
            : 'bg-amber-100 text-amber-700'
        )}>
          {isClosed ? 'Closed' : isActive ? 'Active' : 'Upcoming'}
        </span>
        <ArrowRight
          size={13}
          className={cn(
            isActive ? 'text-[#5580F4]' : 'text-subtle'
          )}
        />
      </div>
    </div>
  )
}

export default function TodayAgenda() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['encounters', 'today-agenda'],
    queryFn:  () => getAllEncounters({ limit: 50 }),
  })

  const today = (data?.data ?? [])
    .filter((e) => isToday(e.startTime))
    .sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )

  // First unclosed encounter is "active"
  const activeIdx = today.findIndex((e) => !e.stopTime)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Today's Schedule</h3>
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center gap-1 text-xs text-[#5580F4]
                     font-medium hover:underline"
        >
          View all <ArrowRight size={12} />
        </button>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Loading */}
        {isLoading && Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="shrink-0 w-48 h-35 rounded-2xl" />
        ))}

        {/* Empty */}
        {!isLoading && today.length === 0 && (
          <div className="flex items-center gap-4 bg-white rounded-2xl
                          border border-[#EEF1F8] px-6 py-5 w-full">
            <div className="flex size-10 items-center justify-center
                            rounded-xl bg-primary-50 shrink-0">
              <Calendar size={18} className="text-[#5580F4]" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">
                Schedule is clear
              </p>
              <p className="text-xs text-subtle mt-0.5">
                No appointments scheduled for today
              </p>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="ml-auto text-xs font-medium text-[#5580F4]
                         bg-primary-50 px-3 py-2 rounded-full
                         hover:bg-[#5580F4]/15 transition-colors shrink-0"
            >
              + New Appointment
            </button>
          </div>
        )}

        {/* Cards */}
        {!isLoading && today.map((enc, i) => (
          <AgendaCard key={enc.id} enc={enc} isActive={i === activeIdx} />
        ))}
      </div>
    </div>
  )
}