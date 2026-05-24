import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { getAllEncounters } from '@/services/encounterService'
import {
  ENCOUNTER_TYPE_LABELS,
  type Encounter,
} from '@/types/encounter'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 8AM–6PM
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
  return (
    a.getDate()     === b.getDate()   &&
    a.getMonth()    === b.getMonth()  &&
    a.getFullYear() === b.getFullYear()
  )
}

function getHour(d: string) {
  return new Date(d).getHours()
}

export default function CalendarView() {
  const navigate    = useNavigate()
  const [mode, setMode]       = useState<'week' | 'month'>('week')
  const [anchor, setAnchor]   = useState(new Date())
  const weekDates             = getWeekDates(anchor)

  const { data, isLoading } = useQuery({
    queryKey: ['encounters', 'calendar'],
    queryFn:  () => getAllEncounters({ limit: 200 }),
  })

  const encounters = data?.data ?? []

  const encForDay = (date: Date): Encounter[] =>
    encounters.filter((e) => sameDay(new Date(e.startTime), date))

  const encForDayHour = (date: Date, hour: number): Encounter[] =>
    encForDay(date).filter((e) => getHour(e.startTime) === hour)

  const todayEncs = encForDay(new Date())

  const prevWeek = () => {
    const d = new Date(anchor)
    d.setDate(d.getDate() - 7)
    setAnchor(d)
  }

  const nextWeek = () => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + 7)
    setAnchor(d)
  }

  const monthLabel = anchor.toLocaleDateString('en-NG', {
    month: 'long', year: 'numeric',
  })

  return (
    <div className="flex gap-4">

      {/* ── Calendar grid ── */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">

        {/* Controls */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <button
            onClick={prevWeek}
            className="flex size-7 items-center justify-center
                       rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-24">
            {monthLabel}
          </span>
          <button
            onClick={nextWeek}
            className="flex size-7 items-center justify-center
                       rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ChevronRight size={14} />
          </button>

          <div className="ml-auto flex gap-2">
            {(['week', 'month'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  mode === m
                    ? 'bg-[#252660] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-100">
          <div />
          {weekDates.map((date, i) => (
            <div key={i} className="py-2 text-center">
              <p className="text-xs text-slate-400">{DAYS[i]}</p>
              <p className={cn(
                'text-sm font-semibold mt-0.5',
                sameDay(date, new Date())
                  ? 'text-indigo-600'
                  : 'text-slate-700',
              )}>
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid — scrollable */}
        <div className="overflow-y-auto max-h-120">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              Loading calendar…
            </div>
          )}

          {!isLoading && HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[56px_repeat(7,1fr)] border-b
                         border-slate-50 min-h-16"
            >
              {/* Hour label */}
              <div className="py-2 px-2 text-right">
                <span className="text-xs text-slate-400">
                  {hour > 12 ? `${hour - 12}PM` : `${hour}AM`}
                </span>
              </div>

              {/* Day cells */}
              {weekDates.map((date, di) => {
                const encs = encForDayHour(date, hour)
                return (
                  <div
                    key={di}
                    className="border-l border-slate-50 p-1 space-y-1"
                  >
                    {encs.map((enc) => (
                      <div
                        key={enc.id}
                        onClick={() => navigate(`/patients/${enc.patientId}`)}
                        className="bg-indigo-100 rounded-lg p-1.5 cursor-pointer
                                   hover:bg-indigo-200 transition-colors"
                      >
                        <p className="text-xs font-medium text-indigo-800 truncate">
                          {enc.patient?.firstName} {enc.patient?.lastName}
                        </p>
                        <p className="text-xs text-indigo-500">
                          {ENCOUNTER_TYPE_LABELS[enc.type]}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily sidebar ── */}
      <div className="w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-indigo-600">Daily</h3>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} />
            {new Date().toLocaleDateString('en-NG', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            })}
          </span>
        </div>

        <div className="space-y-2">
          {todayEncs.length === 0 && (
            <div className="bg-white rounded-xl p-4 text-center
                            text-sm text-slate-400 shadow-sm">
              No appointments today
            </div>
          )}

          {todayEncs.map((enc) => (
            <div
              key={enc.id}
              onClick={() => navigate(`/patients/${enc.patientId}`)}
              className="bg-indigo-100/60 rounded-xl p-3.5 cursor-pointer
                         hover:bg-indigo-200/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-indigo-800 truncate">
                  {enc.patient?.firstName} {enc.patient?.lastName}
                </p>
                <Clock size={13} className="text-indigo-400 shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-indigo-500 mt-0.5">
                {new Date(enc.startTime).toLocaleTimeString('en-NG', {
                  hour: '2-digit', minute: '2-digit',
                })}
                {enc.stopTime && ` — ${new Date(enc.stopTime).toLocaleTimeString('en-NG', {
                  hour: '2-digit', minute: '2-digit',
                })}`}
              </p>
              <p className="text-xs text-indigo-400 mt-0.5">
                {ENCOUNTER_TYPE_LABELS[enc.type]}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}