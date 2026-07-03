import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { getAllEncounters } from '@/services/encounterService'
import { ENCOUNTER_TYPE_LABELS, type Encounter } from '@/types/encounter'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8)
const DAYS  = ['MON','TUE','WED','THU','FRI','SAT','SUN']

function getWeekDates(anchor: Date): Date[] {
  const day  = anchor.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  const mon  = new Date(anchor)
  mon.setDate(anchor.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function sameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export default function CalendarView() {
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState(new Date())
  const weekDates = getWeekDates(anchor)

  const { data, isLoading } = useQuery({
    queryKey: ['encounters', 'calendar'],
    queryFn:  () => getAllEncounters({ limit: 200 }),
  })

  const encounters = data?.data ?? []
  const encForDay = (date: Date): Encounter[] =>
    encounters.filter((e) => sameDay(new Date(e.startTime), date))
  const encForDayHour = (date: Date, hour: number) =>
    encForDay(date).filter((e) => new Date(e.startTime).getHours() === hour)
  const todayEncs = encForDay(new Date())

  const monthLabel = anchor.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })

  return (
    <div className="flex gap-4 flex-col lg:flex-row">

      {/* Calendar grid */}
      <div className="flex-1 bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">

        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F8FAFF]">
          <button
            onClick={() => setAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
            className="flex size-7 items-center justify-center rounded-full
                       bg-[#F8FAFF] hover:bg-[#F0F4FF] transition-colors"
          >
            <ChevronLeft size={14} className="text-[#64748B]" />
          </button>
          <span className="text-sm font-bold text-[#0F172A] min-w-28">{monthLabel}</span>
          <button
            onClick={() => setAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
            className="flex size-7 items-center justify-center rounded-full
                       bg-[#F8FAFF] hover:bg-[#F0F4FF] transition-colors"
          >
            <ChevronRight size={14} className="text-[#64748B]" />
          </button>
        </div>

        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[#F8FAFF]">
          <div />
          {weekDates.map((date, i) => (
            <div key={i} className="py-2 text-center">
              <p className="text-xs text-[#94A3B8]">{DAYS[i]}</p>
              <p className={cn(
                'text-sm font-bold mt-0.5',
                sameDay(date, new Date()) ? 'text-[#5580F4]' : 'text-[#0F172A]',
              )}>
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[480px]">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-[#94A3B8]">
              Loading calendar…
            </div>
          )}
          {!isLoading && HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[56px_repeat(7,1fr)]
                                       border-b border-[#F8FAFF] min-h-[60px]">
              <div className="py-2 px-2 text-right">
                <span className="text-xs text-[#94A3B8]">
                  {hour > 12 ? `${hour - 12}PM` : `${hour}AM`}
                </span>
              </div>
              {weekDates.map((date, di) => (
                <div key={di} className="border-l border-[#F8FAFF] p-1 space-y-1">
                  {encForDayHour(date, hour).map((enc) => (
                    <div
                      key={enc.id}
                      onClick={() => navigate(`/patients/${enc.patientId}`)}
                      className="bg-[#F0F4FF] rounded-lg p-1.5 cursor-pointer
                                 hover:bg-[#5580F4]/15 transition-colors"
                    >
                      <p className="text-xs font-medium text-[#5580F4] truncate">
                        {enc.patient?.firstName} {enc.patient?.lastName}
                      </p>
                      <p className="text-xs text-[#5580F4]/70">
                        {ENCOUNTER_TYPE_LABELS[enc.type]}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Daily sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0F172A]">Today</h3>
          <span className="text-xs text-[#94A3B8] flex items-center gap-1">
            <Clock size={12} />
            {new Date().toLocaleDateString('en-NG', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>

        <div className="space-y-2">
          {todayEncs.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#EEF1F8]
                            p-4 text-center text-sm text-[#94A3B8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              No appointments today
            </div>
          )}
          {todayEncs.map((enc) => {
            const name = enc.patient ? `${enc.patient.firstName} ${enc.patient.lastName}` : 'Unknown'
            return (
              <div
                key={enc.id}
                onClick={() => navigate(`/patients/${enc.patientId}`)}
                className="bg-white rounded-2xl border border-[#EEF1F8] p-3.5 cursor-pointer
                           hover:border-[#5580F4]/30 hover:shadow-md transition-all
                           shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F172A] truncate">{name}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {new Date(enc.startTime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{ENCOUNTER_TYPE_LABELS[enc.type]}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}