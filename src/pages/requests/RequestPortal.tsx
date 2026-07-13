import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, ClipboardList, CheckCircle, XCircle, Package,
  Clock, AlertTriangle,
} from 'lucide-react'
import api from '@/lib/api'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'

interface RequestItem {
  id: string
  type: string
  status: string
  title: string
  description: string | null
  amount: number | null
  requestedBy: string
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  fulfilledAt: string | null
  createdAt: string
}

const REQUEST_TYPES = [
  { value: 'ITEM_REQUEST', label: 'Item Request', icon: Package, color: 'text-[#5580F4]', bg: 'bg-[#F0F4FF]' },
  { value: 'FUND_DISBURSEMENT', label: 'Fund Disbursement', icon: Package, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
  { value: 'RESULT_APPROVAL', label: 'Result Approval', icon: ClipboardList, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]' },
  { value: 'TEMPORARY_ACCESS', label: 'Temporary Access', icon: Clock, color: 'text-[#9B6DFF]', bg: 'bg-[#F5F0FF]' },
  { value: 'MAINTENANCE_REQUEST', label: 'Maintenance', icon: AlertTriangle, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]' },
  { value: 'LEAVE_REQUEST', label: 'Leave Request', icon: Clock, color: 'text-[#0ACDBA]', bg: 'bg-[#ECFDFD]' },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'border-l-[#F59E0B]',
  APPROVED: 'border-l-[#10B981]',
  REJECTED: 'border-l-[#EF4444]',
  FULFILLED: 'border-l-[#5580F4]',
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function RequestPortal() {
  const queryClient = useQueryClient()
  const canApprove = usePermission('allowApproveRequests')
  const [showCreate, setShowCreate] = useState(false)
  const [formType, setFormType] = useState('ITEM_REQUEST')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [rejectTarget, setRejectTarget] = useState<RequestItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: allRequests, isLoading } = useQuery({
    queryKey: ['requests', tab],
    queryFn: async () => {
      const endpoint = tab === 'mine' ? '/requests/mine' : '/requests'
      const res = await api.get(endpoint)
      return (tab === 'mine' ? res.data : res.data.data) as RequestItem[]
    },
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      toast.success('Request submitted')
      setShowCreate(false)
      resetForm()
    },
    onError: () => toast.error('Failed to submit'),
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      toast.success('Request approved')
    },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/requests/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      toast.success('Request rejected')
      setRejectTarget(null)
      setRejectReason('')
    },
    onError: () => toast.error('Failed to reject'),
  })

  const fulfillMut = useMutation({
    mutationFn: (id: string) => api.patch(`/requests/${id}/fulfill`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      toast.success('Request fulfilled')
    },
    onError: () => toast.error('Failed to fulfill'),
  })

  const resetForm = () => {
    setFormType('ITEM_REQUEST')
    setFormTitle('')
    setFormDescription('')
    setFormAmount('')
  }

  const handleCreate = () => {
    createMut.mutate({
      type: formType,
      title: formTitle,
      description: formDescription || undefined,
      amount: formAmount ? parseFloat(formAmount) : undefined,
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Request Portal</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Submit and track requests</p>
        </div>
        <ButtonPill variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>
          New Request
        </ButtonPill>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EEF1F8] pb-0">
        {canApprove && (
          <button
            onClick={() => setTab('all')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-[2px]',
              tab === 'all' ? 'text-[#5580F4] border-[#5580F4]' : 'text-[#64748B] border-transparent',
            )}
          >
            All Requests
          </button>
        )}
        <button
          onClick={() => setTab('mine')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-[2px]',
            tab === 'mine' ? 'text-[#5580F4] border-[#5580F4]' : 'text-[#64748B] border-transparent',
          )}
        >
          My Requests
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(allRequests ?? []).map((req) => {
            const typeCfg = REQUEST_TYPES.find((t) => t.value === req.type)
            const Icon = typeCfg?.icon ?? ClipboardList

            return (
              <div
                key={req.id}
                className={cn(
                  'bg-white rounded-2xl border border-[#EEF1F8] border-l-4 p-4',
                  STATUS_COLORS[req.status] ?? 'border-l-[#EEF1F8]',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', typeCfg?.bg)}>
                      <Icon size={14} className={typeCfg?.color} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#0F172A]">{req.title}</p>
                        <StatusBadge
                          value={req.status}
                          label={req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                        />
                      </div>
                      {req.description && (
                        <p className="text-xs text-[#94A3B8] mt-0.5">{req.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#94A3B8]">
                        <span>{typeCfg?.label}</span>
                        {req.amount && <span>{naira(req.amount)}</span>}
                        <span>{fmtDate(req.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canApprove && req.status === 'PENDING' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <ButtonPill variant="success" size="sm" icon={CheckCircle}
                        onClick={() => approveMut.mutate(req.id)}>
                        Approve
                      </ButtonPill>
                      <ButtonPill variant="danger" size="sm" icon={XCircle}
                        onClick={() => setRejectTarget(req)}>
                        Reject
                      </ButtonPill>
                    </div>
                  )}
                  {req.status === 'APPROVED' && (
                    <ButtonPill variant="primary" size="sm" icon={CheckCircle}
                      onClick={() => fulfillMut.mutate(req.id)}>
                      Fulfill
                    </ButtonPill>
                  )}
                  {req.status === 'FULFILLED' && (
                    <span className="text-xs text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded-full">
                      Done
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {(allRequests ?? []).length === 0 && (
            <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
              <ClipboardList size={24} className="text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">No requests yet</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0F172A]">New Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="border-[#EEF1F8]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Brief title..." className="border-[#EEF1F8]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Description</Label>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3}
                className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30" />
            </div>
            {(formType === 'FUND_DISBURSEMENT' || formType === 'ITEM_REQUEST') && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">Amount (₦)</Label>
                <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="border-[#EEF1F8]" />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => setShowCreate(false)}>Cancel</ButtonPill>
            <ButtonPill variant="primary" loading={createMut.isPending} onClick={handleCreate} disabled={!formTitle}>
              Submit Request
            </ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason('') }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0F172A]">Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#64748B]">Reject: <span className="font-medium">{rejectTarget?.title}</span></p>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Reason *</Label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                placeholder="Why is this being rejected?"
                className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason('') }}>Cancel</ButtonPill>
            <ButtonPill variant="danger" loading={rejectMut.isPending} disabled={!rejectReason.trim()}
              onClick={() => rejectTarget && rejectMut.mutate({ id: rejectTarget.id, reason: rejectReason })}>
              Reject
            </ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}