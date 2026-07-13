import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { CheckCircle, UserPlus } from 'lucide-react'
import api from '@/lib/api'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Toggle } from '@/components/ui/atoms/Toggle'

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

interface ApiErrorResponse {
  error?: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? fallback
  }
  return fallback
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function AddStaffModal({ open, onClose }: Props) {
  const queryClient = useQueryClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [canVerify, setCanVerify] = useState(false)
  const [isHOD, setIsHOD] = useState(false)

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff account created')
      handleClose()
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to create staff')),
  })

  const handleClose = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setRole('')
    setDepartment('')
    setPassword('')
    setCanVerify(false)
    setIsHOD(false)
    onClose()
  }

  const handleSubmit = () => {
    createMut.mutate({
      firstName,
      lastName,
      email,
      phoneNumber: phone || undefined,
      role,
      department: department || undefined,
      password,
      canVerify,
      isHOD,
    })
  }

  const isValid = firstName && lastName && email && role && password && password.length >= 8

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F4FF]">
              <UserPlus size={17} className="text-[#5580F4]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              Add Staff Member
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">First Name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-[#EEF1F8]" placeholder="John" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Last Name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-[#EEF1F8]" placeholder="Doe" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-[#EEF1F8]" placeholder="john@hospital.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="border-[#EEF1F8]" placeholder="08012345678" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="border-[#EEF1F8]"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (<SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="border-[#EEF1F8]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (<SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Password *</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-[#EEF1F8]" placeholder="Min 8 characters" />
          </div>

          <div className="flex items-center gap-4 bg-[#F8FAFF] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Toggle checked={canVerify} onChange={setCanVerify} />
              <Label className="text-xs text-[#64748B]">Can verify results</Label>
            </div>
            <div className="flex items-center gap-2">
              <Toggle checked={isHOD} onChange={setIsHOD} />
              <Label className="text-xs text-[#64748B]">Head of Department</Label>
            </div>
          </div>

          {createMut.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
              {getApiErrorMessage(createMut.error, 'Failed to create staff')}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <ButtonPill variant="ghost" onClick={handleClose}>Cancel</ButtonPill>
          <ButtonPill
            variant="primary"
            icon={CheckCircle}
            loading={createMut.isPending}
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Create Account
          </ButtonPill>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}