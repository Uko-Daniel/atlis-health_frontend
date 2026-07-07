import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { isAxiosError } from 'axios'
import { TableCard, type TableColumn, type RowAction } from '@/components/ui/compounds/TableCard'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  getSignupRequests,
  reviewSignupRequest,
  type SignupRequestItem,
} from '@/services/signupService'

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'danger'> = {
  PENDING:  'default',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const DEPT_LABEL: Record<string, string> = {
  GENERAL:        'General Practice',
  EMERGENCY:      'Emergency',
  PAEDIATRICS:    'Paediatrics',
  OBSTETRICS:     'Obstetrics',
  SURGERY:        'Surgery',
  CARDIOLOGY:     'Cardiology',
  RADIOLOGY:      'Radiology',
  LABORATORY:     'Laboratory',
  PHARMACY:       'Pharmacy',
  ADMINISTRATION: 'Administration',
}

interface SignupReviewErrorResponse {
  error?: string
}

function getReviewErrorMessage(error: unknown) {
  if (isAxiosError<SignupReviewErrorResponse>(error)) {
    return error.response?.data?.error
  }

  return undefined
}

export default function SignupRequests() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const statusFilter = 'PENDING'

  // Review dialog state
  const [reviewTarget, setReviewTarget] = useState<SignupRequestItem | null>(null)
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['signup-requests', statusFilter, page],
    queryFn: () => getSignupRequests({ status: statusFilter, page, limit: 20 }),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'APPROVE' | 'REJECT'; notes?: string }) =>
      reviewSignupRequest(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signup-requests'] })
      setReviewTarget(null)
      setReviewAction(null)
      setReviewNotes('')
    },
  })

  const columns: TableColumn<SignupRequestItem>[] = [
    {
      key:   'firstName',
      label: 'Applicant',
      render: (_, row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0F172A] truncate">
            {row.firstName} {row.lastName}
          </p>
          <p className="text-xs text-[#94A3B8] truncate">{row.email}</p>
        </div>
      ),
    },
    {
      key:   'profession',
      label: 'Profession',
      hide:  'sm',
      render: (_, row) => (
        <span className="text-sm text-[#475569]">{row.profession}</span>
      ),
    },
    {
      key:   'department',
      label: 'Department',
      hide:  'md',
      render: (_, row) => (
        <span className="text-sm text-[#475569]">
          {DEPT_LABEL[row.department] ?? row.department}
        </span>
      ),
    },
    {
      key:   'status',
      label: 'Status',
      align: 'center',
      render: (_, row) => (
        <StatusBadge
          variant={STATUS_VARIANT[row.status]}
          label={row.status.charAt(0) + row.status.slice(1).toLowerCase()}
        />
      ),
    },
    {
      key:      'createdAt',
      label:    'Submitted',
      align:    'right',
      hide:     'lg',
      sortable: true,
      render: (_, row) => (
        <span className="text-xs text-[#94A3B8] whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString('en-NG', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
  ]

  const rowActions: RowAction<SignupRequestItem>[] = [
    {
      label: 'Approve',
      onClick: (row) => {
        setReviewTarget(row)
        setReviewAction('APPROVE')
      },
      // Only show for pending requests
      hidden: (row) => row.status !== 'PENDING',
    },
    {
      label: 'Reject',
      variant: 'danger',
      onClick: (row) => {
        setReviewTarget(row)
        setReviewAction('REJECT')
      },
      hidden: (row) => row.status !== 'PENDING',
    },
  ]

  return (
    <div className="-mt-6 -mx-6">
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-lg font-bold text-[#0F172A]">Sign-up Requests</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Review and approve staff access requests
        </p>
      </div>

      <div className="px-6 pb-6">
        <TableCard
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          rowActions={rowActions}
          emptyState={{
            icon: FileText,
            title: 'No sign-up requests',
            body: statusFilter === 'PENDING'
              ? 'All pending requests have been reviewed'
              : 'No requests match the selected filter',
          }}
          header={{
            title: '',
            // Simple status filter buttons instead of search
          }}
          pagination={
            data && data.total > data.limit
              ? { page, total: data.total, limit: data.limit, onPage: setPage }
              : undefined
          }
        />
      </div>

      {/* ── Review Dialog ──────────────────────────────────── */}
      <Dialog
        open={reviewTarget !== null && reviewAction !== null}
        onOpenChange={() => {
          setReviewTarget(null)
          setReviewAction(null)
          setReviewNotes('')
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              {reviewAction === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-3">
              <div className="bg-[#F8FAFF] rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-sm font-medium text-[#0F172A]">
                  {reviewTarget.firstName} {reviewTarget.lastName}
                </p>
                <p className="text-xs text-[#64748B]">{reviewTarget.email}</p>
                <p className="text-xs text-[#64748B]">
                  {reviewTarget.profession} · {DEPT_LABEL[reviewTarget.department]}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">
                  Notes (optional)
                </Label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'e.g. Verified credentials, welcome to the team…'
                      : 'e.g. Incomplete application, please reapply with…'
                  }
                  className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5
                             text-sm text-[#0F172A] placeholder:text-[#94A3B8]
                             focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30 resize-none"
                />
              </div>

              {reviewMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
                  {getReviewErrorMessage(reviewMutation.error) ||
                    'Failed to process request. Please try again.'}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <ButtonPill
              variant="ghost"
              onClick={() => {
                setReviewTarget(null)
                setReviewAction(null)
                setReviewNotes('')
              }}
            >
              Cancel
            </ButtonPill>
            <ButtonPill
              variant={reviewAction === 'APPROVE' ? 'primary' : 'danger'}
              loading={reviewMutation.isPending}
              onClick={() => {
                if (reviewTarget && reviewAction) {
                  reviewMutation.mutate({
                    id: reviewTarget.id,
                    action: reviewAction,
                    notes: reviewNotes || undefined,
                  })
                }
              }}
            >
              {reviewAction === 'APPROVE' ? 'Approve' : 'Reject'}
            </ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
