import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/stores/authStore'
import { getPatients, searchPatients } from '@/services/patientService'
import { PatientTable } from '@/components/ui/compounds'

const PAGE_LIMIT = 15

export default function PatientList() {
  const navigate    = useNavigate()
  const user        = useAuthStore((s) => s.user)
  const canCreate   = user &&
    ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSES'].includes(user.role)

  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const debounced           = useDebounce(search, 400)
  const isSearching         = debounced.trim().length > 0

  const listQuery = useQuery({
    queryKey: ['patients', page],
    queryFn:  () => getPatients({ page, limit: PAGE_LIMIT }),
    enabled:  !isSearching,
  })

  const searchQuery = useQuery({
    queryKey: ['patients', 'search', debounced],
    queryFn:  () => searchPatients({ name: debounced }),
    enabled:  isSearching,
  })

  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading
  const isError   = isSearching ? searchQuery.isError   : listQuery.isError
  const data      = isSearching
    ? (searchQuery.data?.data ?? [])
    : (listQuery.data?.data ?? [])
  const total     = isSearching
    ? (searchQuery.data?.total ?? 0)
    : (listQuery.data?.total ?? 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Patients</h2>
        {!isSearching && !isLoading && (
          <p className="text-sm text-slate-500 mt-0.5">
            {total.toLocaleString()} registered
          </p>
        )}
      </div>

      <PatientTable
        data       ={data}
        isLoading  ={isLoading}
        isError    ={isError}
        page       ={page}
        total      ={total}
        limit      ={PAGE_LIMIT}
        onPage     ={!isSearching ? setPage : undefined}
        onNew      ={canCreate ? () => navigate('/patients/new') : undefined}
        search     ={{ value: search, onChange: (v) => { setSearch(v); setPage(1) } }}
      />
    </div>
  )
}