import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  getResultsByDepartment, verifyResult, finalizeResult, releaseToPatient,
} from '@/services/resultService'
import { TableCard, type TableColumn } from '@/components/ui/compounds/TableCard'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { Avatar }      from '@/components/ui/atoms/Avatar'
import { STATUS_LABELS, type Result, type ResultStatus } from '@/types/result'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { value: ResultStatus | ''; label: string }[] = [
  { value: '',          label: 'All'       },
  { value: 'PENDING',   label: 'Pending'   },
  { value: 'VERIFIED',  label: 'Verified'  },
  { value: 'FINALIZED', label: 'Finalized' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Results() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const user         = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<ResultStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const canVerify   = user?.canVerify || user?.role === 'ADMIN'
  const canFinalize = user?.canVerify || user?.isHOD || user?.role === 'ADMIN'
  const canRelease  = ['DOCTOR', 'ADMIN', 'HIM_OFFICER'].includes(user?.role ?? '')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['results', 'department', status, page],
    queryFn:  () => getResultsByDepartment({ status: status as ResultStatus || undefined, page, limit: 20 }),
  })

  const verifyMut   = useMutation({ mutationFn: verifyResult,   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['results'] }) })
  const finalizeMut = useMutation({ mutationFn: finalizeResult, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['results'] }) })
  const releaseMut  = useMutation({ mutationFn: releaseToPatient, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['results'] }) })

  const results = data?.data ?? []
  const filtered = search.trim()
    ? results.filter((r) => `${r.patient?.firstName} ${r.patient?.lastName}`.toLowerCase().includes(search.toLowerCase()))
    : results

  const columns: TableColumn<Result>[] = [
    {
      key: 'patient', label: 'Patient',
      render: (_, row) => {
        const name = row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : 'Unknown'
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0F172A] truncate">{name}</p>
              <p className="text-xs text-[#94A3B8] truncate">{row.template?.name ?? '—'}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status', label: 'Status', hide: 'sm',
      render: (_, row) => <StatusBadge value={row.status} label={STATUS_LABELS[row.status]} size="sm" />,
    },
    {
      key: 'department', label: 'Department', hide: 'md',
      render: (_, row) => (
        <span className="text-sm text-[#64748B]">
          {row.department.charAt(0) + row.department.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: 'createdAt', label: 'Date', align: 'right', hide: 'sm',
      render: (_, row) => <span className="text-xs text-[#94A3B8] whitespace-nowrap">{fmtDate(row.createdAt)}</span>,
    },
  ]

  const isRowBusy = (id: string) =>
    (verifyMut.isPending && verifyMut.variables === id) ||
    (finalizeMut.isPending && finalizeMut.variables === id) ||
    (releaseMut.isPending && releaseMut.variables === id)

  const rowActions = [
    {
      label: 'View',
      onClick: (row: Result) => navigate(`/results/${row.id}`),
    },
    {
      label: 'Verify',
      variant: 'success' as const,
      hidden: (row: Result) => row.status !== 'PENDING' || !canVerify,
      onClick: (row: Result) => verifyMut.mutate(row.id),
    },
    {
      label: 'Finalize',
      variant: 'success' as const,
      hidden: (row: Result) => row.status !== 'VERIFIED' || !canFinalize,
      onClick: (row: Result) => finalizeMut.mutate(row.id),
    },
    {
      label: 'Release',
      hidden: (row: Result) => row.status !== 'FINALIZED' || !!row.releasedAt || !canRelease,
      onClick: (row: Result) => releaseMut.mutate(row.id),
    },
  ]

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Results</h2>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {user?.department
              ? `${user.department.charAt(0) + user.department.slice(1).toLowerCase()} worklist`
              : 'All departments'}
          </p>
        </div>
        <ButtonPill
          variant="outline"
          icon={ShieldAlert}
          onClick={() => navigate('/results/critical')}
        >
          Critical Pending
        </ButtonPill>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-1 w-fit">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatus(value); setPage(1) }}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-medium transition-all',
              status === value
                ? 'bg-[#5580F4] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <TableCard
        columns    ={columns}
        data       ={filtered}
        isLoading  ={isLoading}
        isError    ={isError}
        rowActions ={rowActions.map((a) => ({ ...a, onClick: (r: Result) => !isRowBusy(r.id) && a.onClick(r) }))}
        onRowClick ={(row) => navigate(`/results/${row.id}`)}
        emptyState ={{ title: 'No results found', body: status ? `No ${status.toLowerCase()} results` : 'Worklist is empty' }}
        header     ={{ title: 'Worklist', search: { value: search, onChange: setSearch, placeholder: 'Search patient…' } }}
        pagination ={(data?.total ?? 0) > 20 ? { page, total: data?.total ?? 0, limit: 20, onPage: setPage } : undefined}
      />
    </div>
  )
}