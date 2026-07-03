import { useNavigate } from 'react-router-dom'
import { Users, UserPlus } from 'lucide-react'
import { TableCard, type TableColumn, type RowAction } from '../TableCard'
import { Avatar } from '@/components/ui/atoms/Avatar'
import type { Patient } from '@/types/patient'
import { getPatientAge } from '@/types/patient'

interface PatientTableProps {
  data:        Patient[]
  isLoading?:  boolean
  isError?:    boolean
  page?:       number
  total?:      number
  limit?:      number
  onPage?:     (page: number) => void
  onNew?:      () => void
  search?:     { value: string; onChange: (v: string) => void }
  extraActions?: RowAction<Patient>[]
}

export function PatientTable({
  data,
  isLoading,
  isError,
  page = 1,
  total = 0,
  limit = 15,
  onPage,
  onNew,
  search,
  extraActions = [],
}: PatientTableProps) {
  const navigate = useNavigate()

  const columns: TableColumn<Patient>[] = [
    {
      key:   'firstName',
      label: 'Patient',
      render: (_, row) => {
        const name = `${row.firstName} ${row.lastName}`
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {row.phoneNumber ?? row.email ?? '—'}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key:   'dob',
      label: 'Age',
      align: 'center',
      hide:  'sm',
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {getPatientAge(row.dob)}y
        </span>
      ),
    },
    {
      key:   'gender',
      label: 'Gender',
      align: 'center',
      hide:  'md',
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {row.gender.charAt(0) + row.gender.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key:      'createdAt',
      label:    'Registered',
      align:    'right',
      hide:     'lg',
      sortable: true,
      render: (_, row) => (
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString('en-NG', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
  ]

  const rowActions: RowAction<Patient>[] = [
    {
      label:   'View',
      onClick: (row) => navigate(`/patients/${row.id}`),
    },
    ...extraActions,
  ]

  return (
    <TableCard
      columns    ={columns}
      data       ={data}
      isLoading  ={isLoading}
      isError    ={isError}
      onRowClick ={(row) => navigate(`/patients/${row.id}`)}
      rowActions ={rowActions}
      emptyState ={{
        icon:  Users,
        title: 'No patients found',
        body:  search?.value
          ? `No patients matching "${search.value}"`
          : 'Register the first patient to get started',
        action: onNew
          ? { label: 'Register Patient', onClick: onNew }
          : undefined,
      }}
      header={{
        title: 'Patients',
        search,
        cta: onNew
          ? { label: 'Register Patient', icon: UserPlus, onClick: onNew }
          : undefined,
      }}
      pagination={onPage && total > limit ? {
        page, total, limit, onPage,
      } : undefined}
    />
  )
}