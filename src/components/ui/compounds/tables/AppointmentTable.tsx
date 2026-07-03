import { useNavigate } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { TableCard, type TableColumn, type RowAction } from '../TableCard'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Avatar }      from '@/components/ui/atoms/Avatar'
import type { Encounter } from '@/types/encounter'
import { ENCOUNTER_TYPE_LABELS } from '@/types/encounter'

interface AppointmentTableProps {
  data:        Encounter[]
  isLoading?:  boolean
  isError?:    boolean
  page?:       number
  total?:      number
  limit?:      number
  onPage?:     (page: number) => void
  onNew?:      () => void
  search?:     { value: string; onChange: (v: string) => void }
  extraActions?: RowAction<Encounter>[]
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function AppointmentTable({
  data,
  isLoading,
  isError,
  page = 1,
  total = 0,
  limit = 20,
  onPage,
  onNew,
  search,
  extraActions = [],
}: AppointmentTableProps) {
  const navigate = useNavigate()

  const columns: TableColumn<Encounter>[] = [
    {
      key:   'patient',
      label: 'Patient',
      render: (_, row) => {
        const name = row.patient
          ? `${row.patient.firstName} ${row.patient.lastName}`
          : 'Unknown'
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {row.chiefComplaint ?? row.type}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key:   'type',
      label: 'Type',
      hide:  'md',
      render: (_, row) => (
        <StatusBadge value={row.type} label={ENCOUNTER_TYPE_LABELS[row.type]} />
      ),
    },
    {
      key:   'startTime',
      label: 'Time',
      hide:  'sm',
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {formatTime(row.startTime)}
          {row.stopTime && ` — ${formatTime(row.stopTime)}`}
        </span>
      ),
    },
    {
      key:   'encounteredAt',
      label: 'Date',
      align: 'right',
      render: (_, row) => (
        <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">
          {formatDate(row.startTime)}
        </span>
      ),
    },
  ]

  const rowActions: RowAction<Encounter>[] = [
    {
      label:   'View Patient',
      onClick: (row) => navigate(`/patients/${row.patientId}`),
    },
    ...extraActions,
  ]

  return (
    <TableCard
      columns    ={columns}
      data       ={data}
      isLoading  ={isLoading}
      isError    ={isError}
      onRowClick ={(row) => navigate(`/appointments/${row.id}`)}
      rowActions ={rowActions}
      emptyState ={{
        icon:  Calendar,
        title: 'No appointments found',
        body:  'New appointments will appear here once created',
        action: onNew ? { label: 'New Appointment', onClick: onNew } : undefined,
      }}
      header={{
        title:   'Appointments',
        search,
        cta: onNew
          ? { label: 'New Appointment', onClick: onNew, variant: 'primary' }
          : undefined,
      }}
      pagination={onPage && total > limit ? {
        page, total, limit, onPage,
      } : undefined}
    />
  )
}