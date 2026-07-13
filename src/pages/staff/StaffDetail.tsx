import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft, Shield, UserCog, Activity, Save,
  Phone, Mail, Calendar, Building,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Toggle } from '@/components/ui/atoms/Toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface StaffDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string | null
  isHOD: boolean
  canVerify: boolean
  phoneNumber: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface StaffActivity {
  id: string
  action: string
  entityType: string
  createdAt: string
}

const ALL_ROLES = [
  'DOCTOR', 'NURSES', 'LAB_SCIENTIST', 'IMAGING_TECH', 'PHARMACIST',
  'PROCUREMENT_OFFICER', 'RECEPTIONIST', 'BILLING_OFFICER', 'HIM_OFFICER',
  'MANAGER', 'ADMIN', 'IT_SUPPORT',
]

const DEPARTMENTS = [
  'GENERAL', 'EMERGENCY', 'PAEDIATRICS', 'OBSTETRICS', 'SURGERY',
  'CARDIOLOGY', 'RADIOLOGY', 'LABORATORY', 'PHARMACY', 'ADMINISTRATION',
]

function roleLabel(role: string) {
  return role.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const canManage = ['IT_SUPPORT', 'ADMIN', 'MANAGER'].includes(currentUser?.role ?? '')

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<StaffDetail>>({})

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', id],
    queryFn: async () => {
      const res = await api.get<StaffDetail>(`/staff/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  const { data: activity } = useQuery({
    queryKey: ['staff', id, 'activity'],
    queryFn: async () => {
      const res = await api.get<StaffActivity[]>(`/staff/${id}/activity`)
      return res.data
    },
    enabled: !!id,
  })

  const updateMut = useMutation({
    mutationFn: (data: any) => api.put(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Profile updated')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const permissionsMut = useMutation({
    mutationFn: (data: any) => api.patch(`/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      toast.success('Permissions updated')
    },
    onError: () => toast.error('Failed to update permissions'),
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-bold text-[#0F172A]">Staff member not found</p>
        <ButtonPill variant="ghost" icon={ArrowLeft} onClick={() => navigate('/staff')}>
          Back to Staff
        </ButtonPill>
      </div>
    )
  }

  const fullName = `${staff.firstName} ${staff.lastName}`

  const handleSaveEdit = async () => {
    const profileData: any = {}
    if (editData.firstName !== undefined && editData.firstName !== staff.firstName) profileData.firstName = editData.firstName
    if (editData.lastName !== undefined && editData.lastName !== staff.lastName) profileData.lastName = editData.lastName
    if (editData.phoneNumber !== undefined) profileData.phoneNumber = editData.phoneNumber || null
    if (editData.department !== undefined && editData.department !== staff.department) profileData.department = editData.department || null

    const roleChanged = editData.role !== undefined && editData.role !== staff.role

    try {
      if (Object.keys(profileData).length > 0) {
        await updateMut.mutateAsync(profileData)
      }
      if (roleChanged) {
        await permissionsMut.mutateAsync({ role: editData.role })
      }
      setIsEditing(false)
    } catch {
      // Errors handled by onError callbacks
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => navigate('/staff')}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft size={15} /> Back to Staff
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={fullName} size="xl" className="ring-4 ring-[#F0F4FF]" />
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">{fullName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge variant="default" label={roleLabel(staff.role)} />
                {staff.isHOD && (
                  <span className="text-xs text-[#5580F4] bg-[#F0F4FF] px-2 py-0.5 rounded-full font-medium">
                    Head of Department
                  </span>
                )}
                {staff.canVerify && (
                  <span className="text-xs text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full font-medium">
                    Result Verifier
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {staff.email && (
                  <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Mail size={12} className="text-[#94A3B8]" />
                    {staff.email}
                  </span>
                )}
                {staff.phoneNumber && (
                  <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Phone size={12} className="text-[#94A3B8]" />
                    {staff.phoneNumber}
                  </span>
                )}
                {staff.department && (
                  <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Building size={12} className="text-[#94A3B8]" />
                    {staff.department.charAt(0) + staff.department.slice(1).toLowerCase()}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Calendar size={12} className="text-[#94A3B8]" />
                  Joined {fmtDate(staff.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {canManage && (
            <ButtonPill
              variant={isEditing ? 'primary' : 'outline'}
              icon={isEditing ? Save : UserCog}
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit()
                } else {
                  setEditData({
                    firstName: staff.firstName,
                    lastName: staff.lastName,
                    phoneNumber: staff.phoneNumber ?? '',
                    department: staff.department ?? '',
                    role: staff.role,
                  })
                  setIsEditing(true)
                }
              }}
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </ButtonPill>
          )}
        </div>

        {/* Edit form */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-[#EEF1F8]">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">First Name</Label>
              <Input
                value={editData.firstName ?? ''}
                onChange={(e) => setEditData((p) => ({ ...p, firstName: e.target.value }))}
                className="border-[#EEF1F8]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Last Name</Label>
              <Input
                value={editData.lastName ?? ''}
                onChange={(e) => setEditData((p) => ({ ...p, lastName: e.target.value }))}
                className="border-[#EEF1F8]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Phone</Label>
              <Input
                value={editData.phoneNumber ?? ''}
                onChange={(e) => setEditData((p) => ({ ...p, phoneNumber: e.target.value }))}
                className="border-[#EEF1F8]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Department</Label>
              <Select
                value={editData.department ?? ''}
                onValueChange={(v) => setEditData((p) => ({ ...p, department: v }))}
              >
                <SelectTrigger className="border-[#EEF1F8]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Role</Label>
              <Select
                value={editData.role ?? ''}
                onValueChange={(v) => setEditData((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger className="border-[#EEF1F8]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Permissions */}
      {canManage && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-4">
            <Shield size={15} className="text-[#5580F4]" />
            Permissions
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Head of Department</p>
                <p className="text-xs text-[#94A3B8]">Can manage department workflows and finalize results</p>
              </div>
              <Toggle
                checked={staff.isHOD}
                onChange={(checked) => permissionsMut.mutate({ isHOD: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Result Verification</p>
                <p className="text-xs text-[#94A3B8]">Can verify and sign off on lab/imaging results</p>
              </div>
              <Toggle
                checked={staff.canVerify}
                onChange={(checked) => permissionsMut.mutate({ canVerify: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {activity && activity.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <Activity size={15} className="text-[#5580F4]" />
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-[#F8FAFF]">
            {activity.slice(0, 15).map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-[#0F172A]">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[#94A3B8]">{a.entityType}</p>
                </div>
                <span className="text-xs text-[#94A3B8]">{fmtDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}