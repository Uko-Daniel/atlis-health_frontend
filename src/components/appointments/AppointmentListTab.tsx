import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAllEncounters } from '@/services/encounterService'
import {
  ENCOUNTER_TYPE_LABELS,
  ENCOUNTER_TYPE_COLORS,
  type EncounterType,
} from '@/types/encounter'
import { Badge }    from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn }       from '@/lib/utils'

function formatTimeRange(startTime: string, stopTime?: string | null) {
  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('en-NG', {
      hour:   '2-digit',
      minute: '2-digit',
    })
  if (!stopTime) return fmt(startTime)
  return `${fmt(startTime)} — ${fmt(stopTime)}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

export default function AppointmentListTab() {
  const navigate    = useNavigate()
  const [search,   setSearch]   = useState('')
  const [typeFilter, setTypeFilter] = useState<EncounterType | ''>('')
  const [page, setPage]         = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['encounters', 'list', typeFilter, page],
    queryFn:  () => getAllEncounters({
      type:  typeFilter as EncounterType || undefined,
      page,
      limit: 20,
    }),
  })

  const encounters = data?.data ?? []

  // Client-side name filter
  const filtered = search.trim()
    ? encounters.filter((e) => {
        const name = `${e.patient?.firstName} ${e.patient?.lastName}`.toLowerCase()
        return name.includes(search.toLowerCase())
      })
    : encounters

  return (
    <div className="space-y-4">

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-8 pr-4 py-2 bg-white rounded-full border border-slate-200
                       text-sm text-slate-700 placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-200 w-36"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as EncounterType | '')
            setPage(1)
          }}
          className="pl-3 pr-8 py-2 bg-white rounded-full border border-slate-200
                     text-sm text-slate-700 focus:outline-none
                     focus:ring-2 focus:ring-indigo-200 appearance-none"
        >
          <option value="">Type</option>
          {Object.entries(ENCOUNTER_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">

        {/* Loading */}
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4
                                  border-b border-slate-50 last:border-0">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}

        {/* Error */}
        {isError && (
          <div className="py-16 text-center text-sm text-red-500">
            Failed to load appointments
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">
            No appointments found
          </div>
        )}

        {/* Rows */}
        {!isLoading && !isError && filtered.map((enc, i) => (
          <div
            key={enc.id}
            onClick={() => navigate(`/patients/${enc.patientId}`)}
            className={cn(
              'flex items-center gap-4 px-6 py-4 border-b border-slate-50',
              'last:border-0 cursor-pointer transition-colors hover:bg-indigo-50/40',
              i === 1 && 'bg-indigo-50/60', // subtle active highlight like design
            )}
          >
            {/* Name + complaint */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {enc.patient?.firstName} {enc.patient?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {enc.chiefComplaint ?? enc.type}
              </p>
            </div>

            {/* Type badge */}
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-normal shrink-0 hidden sm:flex',
                ENCOUNTER_TYPE_COLORS[enc.type],
              )}
            >
              {ENCOUNTER_TYPE_LABELS[enc.type]}
            </Badge>

            {/* Time range */}
            <span className="text-xs text-slate-400 shrink-0 hidden md:block">
              {formatTimeRange(enc.startTime, enc.stopTime)}
            </span>

            {/* Date */}
            <span className="text-xs font-semibold text-slate-600 shrink-0">
              {formatDate(enc.startTime)}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {(data?.total ?? 0) > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Page {page} of {Math.ceil((data?.total ?? 0) / 20)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-1.5 rounded-full text-xs bg-white border
                         border-slate-200 text-slate-600 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil((data?.total ?? 0) / 20)}
              className="px-4 py-1.5 rounded-full text-xs bg-[#252660]
                         text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}