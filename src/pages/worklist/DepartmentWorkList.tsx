import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Play, FileWarning } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getOrdersByStatus, updateOrderStatus } from '@/services/orderService'
import { createResult } from '@/services/resultService'
import { getPatientById } from '@/services/patientService'
import { flattenToWorklistRows, type WorklistRow } from '@/types/order'
import { TableCard, type TableColumn } from '@/components/ui/compounds/TableCard'
import { Avatar }      from '@/components/ui/atoms/Avatar'

// Map staff role → the department label their services should match
const ROLE_DEPT_HINT: Record<string, string[]> = {
  LAB_TECH:    ['hematology', 'parasitology', 'chemistry', 'microbiology', 'serology', 'pathology'],
  RADIOLOGIST: ['imaging'],
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DepartmentWorklist() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const user         = useAuthStore((s) => s.user)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', 'status', 'PENDING'],
    queryFn:  () => getOrdersByStatus('PENDING', 1, 100),
  })

  const allRows = useMemo(() => flattenToWorklistRows(data?.data ?? []), [data])

  // Filter to this staff member's department by matching service category
  const hints = ROLE_DEPT_HINT[user?.role ?? ''] ?? []
  const myRows = hints.length
    ? allRows.filter((r) =>
        hints.some((h) => r.category?.toLowerCase().includes(h)),
      )
    : allRows

  const beginMutation = useMutation({
    mutationFn: async (row: WorklistRow) => {
      if (!row.templateId) throw new Error('No template configured for this service')

      const patient  = await getPatientById(row.patientId)
      const recordId = patient.records?.[0]?.id

      const result = await createResult({
        patientId:  row.patientId,
        orderId:    row.orderId,
        recordId,
        templateId: row.templateId,
        department: user?.department ?? '',
      })

      await updateOrderStatus(row.orderId, 'PROCESSING')
      return result
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/editor/${result.id}`)
    },
  })

  const columns: TableColumn<WorklistRow>[] = [
    {
      key: 'patientName', label: 'Patient',
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.patientName} size="sm" />
          <span className="text-sm font-medium text-[#0F172A]">{row.patientName}</span>
        </div>
      ),
    },
    {
      key: 'serviceName', label: 'Service',
      render: (_, row) => (
        <div>
          <p className="text-sm text-[#0F172A]">{row.serviceName}</p>
          {!row.templateId && (
            <p className="text-xs text-[#F59E0B] flex items-center gap-1 mt-0.5">
              <FileWarning size={11} /> No template configured
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'orderDate', label: 'Ordered', align: 'right', hide: 'sm',
      render: (_, row) => <span className="text-xs text-[#94A3B8]">{fmtDate(row.orderDate)}</span>,
    },
  ]

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Worklist</h2>
        <p className="text-sm text-[#94A3B8] mt-0.5">
          Pending orders awaiting{' '}
          {user?.department ? user.department.charAt(0) + user.department.slice(1).toLowerCase() : 'your'} action
        </p>
      </div>

      {beginMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {(beginMutation.error as Error)?.message ?? 'Failed to begin service'}
        </div>
      )}

      <TableCard
        columns    ={columns}
        data       ={myRows}
        isLoading  ={isLoading}
        isError    ={isError}
        keyField   ={'serviceId' as keyof WorklistRow}
        rowActions ={[
          {
            label:   'Begin',
            icon:    Play,
            variant: 'success',
            onClick: (row) => beginMutation.mutate(row),
            hidden:  () => beginMutation.isPending,
          },
        ]}
        emptyState ={{
          icon: ClipboardList,
          title: 'Worklist is clear',
          body:  'No pending orders for your department right now',
        }}
        header={{ title: 'Pending Orders' }}
      />
    </div>
  )
}