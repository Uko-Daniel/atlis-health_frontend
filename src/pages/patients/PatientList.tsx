import type { Patient } from '@/types/patient'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

import { getPatients, searchPatients } from '@/services/patientService'
import { getPatientAge, getInitials } from '@/types/patient'
import { useAuthStore } from '@/stores/authStore'

import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_LIMIT = 15

// ── Skeleton row ──────────────────────────────────────────────
function PatientRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0">
      <Skeleton className="size-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 mb-4">
        <Search size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">
        {query ? `No patients matching "${query}"` : 'No patients registered yet'}
      </p>
      <p className="text-xs text-slate-400 mt-1 mb-4">
        {query ? 'Try a different name or clear the search' : 'Register the first patient to get started'}
      </p>
      {query && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear search
        </Button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function PatientList() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const canCreate = user && ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSES'].includes(user.role)

  const [searchInput, setSearchInput] = useState('')
  const [page, setPage]               = useState(1)
  const debouncedSearch               = useDebounce(searchInput, 400)
  const isSearching                   = debouncedSearch.trim().length > 0

  // Paginated list
  const listQuery = useQuery({
    queryKey: ['patients', page],
    queryFn:  () => getPatients({ page, limit: PAGE_LIMIT }),
    enabled:  !isSearching,
  })

  // Search
  const searchQuery = useQuery({
    queryKey: ['patients', 'search', debouncedSearch],
    queryFn:  () => searchPatients({ name: debouncedSearch }),
    enabled:  isSearching,
  })

  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading
  const isError   = isSearching ? searchQuery.isError   : listQuery.isError

  const patients: Patient[] = isSearching
  ? (searchQuery.data?.data ?? [])
  : (listQuery.data?.data ?? [])

  const total     = listQuery.data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_LIMIT)

  const handleClear = () => {
    setSearchInput('')
    setPage(1)
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Patients</h2>
          {!isSearching && !isLoading && (
            <p className="text-sm text-slate-500">
              {total.toLocaleString()} {total === 1 ? 'patient' : 'patients'} registered
            </p>
          )}
        </div>
        {canCreate && (
          <Button
            className="bg-slate-900 hover:bg-slate-700 text-white gap-2"
            onClick={() => navigate('/patients/new')}
          >
            <UserPlus size={16} />
            Register Patient
          </Button>
        )}
      </div>

      {/* ── Search bar ── */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <Input
          placeholder="Search by name…"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPage(1)
          }}
          className="pl-9 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {/* ── Table card ── */}
      <Card className="border-slate-200 shadow-none overflow-hidden">

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3
                        border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Patient
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Age
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Gender
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Registered
          </span>
        </div>

        <CardContent className="p-0">
          {/* Loading skeletons */}
          {isLoading && (
            Array.from({ length: 8 }).map((_, i) => (
              <PatientRowSkeleton key={i} />
            ))
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-red-500 font-medium">Failed to load patients</p>
              <p className="text-xs text-slate-400 mt-1">Check your connection and try again</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && patients.length === 0 && (
            <EmptyState query={debouncedSearch} onClear={handleClear} />
          )}

          {/* Rows */}
          {!isLoading && !isError && patients.map((patient) => {
            const age = getPatientAge(patient.dob)
            const initials = getInitials(patient)
            const regDate  = new Date(patient.createdAt).toLocaleDateString('en-NG', {
              day: '2-digit', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center
                           px-6 py-4 border-b border-slate-100 last:border-0
                           hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {/* Patient name + phone */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center
                                  rounded-full bg-blue-100 text-blue-700 text-xs
                                  font-semibold select-none">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {patient.phoneNumber}
                    </p>
                  </div>
                </div>

                <span className="text-sm text-slate-600 text-right">
                  {age}y
                </span>

                <Badge
                  variant="outline"
                  className="text-xs font-normal border-slate-200 text-slate-500 justify-self-end"
                >
                  {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}
                </Badge>

                <span className="text-xs text-slate-400 text-right whitespace-nowrap">
                  {regDate}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Pagination — only for list mode ── */}
      {!isSearching && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1 border-slate-200"
            >
              <ChevronLeft size={14} /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1 border-slate-200"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}