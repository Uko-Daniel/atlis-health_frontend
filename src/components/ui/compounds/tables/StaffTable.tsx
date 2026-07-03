import { useNavigate } from 'react-router-dom'
import { UserCog, UserPlus } from 'lucide-react'
import { TableCard, type TableColumn, type RowAction } from '../TableCard'
import { Avatar }      from '@/components/ui/atoms/Avatar'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import type { AuthUser } from '@/types/auth'

// Staff list item shape from GET /staff
export interface StaffListItem {
  id:          string
  firstName:   string
  lastName:    string
  email:       string
  role:        AuthUser['role']
  department:  string | null
  isHOD:       boolean
  canVerify:   boolean
  phoneNumber: string | null
  createdAt:   string
}

interface StaffTableProps {
  data:        StaffListItem[]
  isLoading?:  boolean
  isError?:    boolean
  page?:       number
  total?:      number
  limit?:      number
  onPage?:     (page: number) => void
  onNew?:      () => void
  search?:     { value: string; onChange: (v: string) => void }
  onEdit?:     (staff: StaffListItem) => void
  onDelete?:   (staff: StaffListItem) => void
}

export function StaffTable({
  data,
  isLoading,
  isError,
  page = 1,
  total = 0,
  limit = 20,
  onPage,
  onNew,
  search,
  onEdit,
  onDelete,
}: StaffTableProps) {
  const navigate = useNavigate()

  const columns: TableColumn<StaffListItem>[] = [
    {
      key:   'firstName',
      label: 'Staff Member',
      render: (_, row) => {
        const name = `${row.firstName} ${row.lastName}`
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {name}
                {row.isHOD && (
                  <span className="ml-1.5 text-xs text-indigo-500 font-normal">
                    HOD
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400 truncate">{row.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      key:   'role',
      label: 'Role',
      hide:  'sm',
      render: (_, row) => {
        const label = row.role
          .split('_')
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(' ')
        return (
          <StatusBadge
            variant="default"
            label={label}
          />
        )
      },
    },
    {
      key:   'department',
      label: 'Department',
      hide:  'md',
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {row.department
            ? row.department.charAt(0) + row.department.slice(1).toLowerCase()
            : <span className="text-slate-300">—</span>
          }
        </span>
      ),
    },
    {
      key:   'canVerify',
      label: 'Can Verify',
      align: 'center',
      hide:  'lg',
      render: (_, row) => (
        <span className={cn(
          'text-xs font-medium',
          row.canVerify ? 'text-emerald-600' : 'text-slate-300',
        )}>
          {row.canVerify ? 'Yes' : 'No'}
        </span>
      ),
    },
  ]

  const rowActions: RowAction<StaffListItem>[] = [
    ...(onEdit   ? [{ label: 'Edit',   onClick: onEdit   }] : []),
    ...(onDelete ? [{ label: 'Delete', variant: 'danger' as const, onClick: onDelete }] : []),
  ]

  return (
    <TableCard
      columns    ={columns}
      data       ={data}
      isLoading  ={isLoading}
      isError    ={isError}
      onRowClick ={(row) => navigate(`/staff/${row.id}`)}
      rowActions ={rowActions}
      emptyState ={{
        icon:  UserCog,
        title: 'No staff found',
        body:  'Add staff members to get started',
        action: onNew
          ? { label: 'Add Staff', onClick: onNew }
          : undefined,
      }}
      header={{
        title: 'Staff',
        search,
        cta: onNew
          ? { label: 'Add Staff', icon: UserPlus, onClick: onNew }
          : undefined,
      }}
      pagination={onPage && total > limit ? {
        page, total, limit, onPage,
      } : undefined}
    />
  )
}

// Need this import at top of StaffTable
import { cn } from '@/lib/utils'