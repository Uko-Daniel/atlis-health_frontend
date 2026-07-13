import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  UserCog, UserPlus, UserX, ShieldAlert, CheckCircle,
  Search, Filter,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import AddStaffModal from '@/components/staff/AddStaffModal'
import { cn } from '@/lib/utils'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string | null
  isHOD: boolean
  canVerify: boolean
  phoneNumber: string | null
  status?: string
  createdAt: string
}

interface SignupRequestItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  profession: string
  department: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

const ALL_ROLES = [
  'DOCTOR', 'NURSES', 'LAB_SCIENTIST', 'IMAGING_TECH', 'PHARMACIST',
  'RECEPTIONIST', 'BILLING_OFFICER', 'HIM_OFFICER', 'MANAGER', 'IT_SUPPORT',
]


function roleLabel(role: string) {
  return role.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

export default function StaffManagement() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canManage = ['IT_SUPPORT', 'ADMIN', 'MANAGER'].includes(user?.role ?? '')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [tab, setTab] = useState<'staff' | 'requests'>('staff')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null)

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.get<StaffMember[]>('/staff')
      return res.data
    },
  })

  const { data: requests, isLoading: reqLoading } = useQuery({
    queryKey: ['signup-requests'],
    queryFn: async () => {
      const res = await api.get('/admin/signup-requests?status=PENDING')
      return res.data.data as SignupRequestItem[]
    },
    enabled: tab === 'requests' && canManage,
  })

  const filteredStaff = (staff ?? []).filter((s) => {
    const matchesSearch = `${s.firstName} ${s.lastName} ${s.email}`
      .toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/signup-requests/${id}`, { action: 'APPROVE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signup-requests'] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Request approved — staff account created')
    },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/signup-requests/${id}`, { action: 'REJECT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signup-requests'] })
      toast.success('Request rejected')
    },
    onError: () => toast.error('Failed to reject'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff member deleted')
      setDeleteTarget(null)
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error ?? 'Failed to delete')
      setDeleteTarget(null)
    },
  })

  const pendingCount = requests?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Staff Management</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage staff accounts and sign-up requests
          </p>
        </div>
        {canManage && (
          <ButtonPill variant="primary" icon={UserPlus} onClick={() => setShowCreateModal(true)}>
            Add Staff
          </ButtonPill>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EEF1F8] pb-0">
        <button
          onClick={() => setTab('staff')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-[2px]',
            tab === 'staff'
              ? 'text-[#5580F4] border-[#5580F4]'
              : 'text-[#64748B] border-transparent hover:text-[#0F172A]',
          )}
        >
          Staff ({staff?.length ?? 0})
        </button>
        {canManage && (
          <button
            onClick={() => setTab('requests')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-[2px] relative',
              tab === 'requests'
                ? 'text-[#5580F4] border-[#5580F4]'
                : 'text-[#64748B] border-transparent hover:text-[#0F172A]',
            )}
          >
            Sign-up Requests
            {pendingCount > 0 && (
              <span className="ml-2 text-xs bg-[#FEF2F2] text-[#EF4444] px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Staff Tab */}
      {tab === 'staff' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name or email…"
                className="pl-9 border-[#EEF1F8]"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44 border-[#EEF1F8]">
                <Filter size={13} className="mr-1" />
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {staffLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStaff.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-[#EEF1F8]
                             shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4
                             flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {s.firstName} {s.lastName}
                        {s.isHOD && (
                          <span className="ml-1.5 text-xs text-[#5580F4] font-normal">HOD</span>
                        )}
                      </p>
                      <p className="text-xs text-[#94A3B8] truncate">{s.email}</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-3">
                    <StatusBadge variant="default" label={roleLabel(s.role)} />
                    {s.department && (
                      <span className="text-xs text-[#64748B]">
                        {s.department.charAt(0) + s.department.slice(1).toLowerCase()}
                      </span>
                    )}
                    {s.canVerify && (
                      <span className="text-xs text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                        Verifier
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <ButtonPill
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/staff/${s.id}`)}
                      >
                        Edit
                      </ButtonPill>
                      {s.id !== user?.sub && (
                        <ButtonPill
                          variant="danger"
                          size="sm"
                          icon={UserX}
                          onClick={() => setDeleteTarget(s)}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredStaff.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
                  <UserCog size={24} className="text-[#CBD5E1] mx-auto mb-2" />
                  <p className="text-sm text-[#94A3B8]">No staff found</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Sign-up Requests Tab */}
      {tab === 'requests' && canManage && (
        <>
          {reqLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {requests?.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#EEF1F8]
                             shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F172A]">
                        {req.firstName} {req.lastName}
                      </p>
                      <p className="text-xs text-[#94A3B8]">{req.email} · {req.phone}</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {req.profession} · {req.department.charAt(0) + req.department.slice(1).toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ButtonPill
                        variant="success"
                        size="sm"
                        icon={CheckCircle}
                        loading={approveMut.isPending}
                        onClick={() => approveMut.mutate(req.id)}
                      >
                        Approve
                      </ButtonPill>
                      <ButtonPill
                        variant="danger"
                        size="sm"
                        icon={UserX}
                        loading={rejectMut.isPending}
                        onClick={() => rejectMut.mutate(req.id)}
                      >
                        Reject
                      </ButtonPill>
                    </div>
                  </div>
                </div>
              ))}

              {(!requests || requests.length === 0) && (
                <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
                  <CheckCircle size={24} className="text-[#10B981] mx-auto mb-2" />
                  <p className="text-sm text-[#94A3B8]">No pending sign-up requests</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#FEF2F2]">
                <ShieldAlert size={17} className="text-[#EF4444]" />
              </div>
              <DialogTitle className="text-base font-bold text-[#0F172A]">
                Delete Staff Account
              </DialogTitle>
            </div>
          </DialogHeader>

          <p className="text-sm text-[#64748B]">
            Are you sure you want to delete{' '}
            <span className="font-medium text-[#0F172A]">
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </span>
            ? This action cannot be undone if the account has no audit history.
          </p>

          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </ButtonPill>
            <ButtonPill
              variant="danger"
              loading={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              Delete
            </ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Staff Modal — placeholder, will expand */}
      <AddStaffModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  )
}