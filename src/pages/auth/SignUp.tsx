import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Check, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { submitSignupRequest } from '@/services/signupService'
import { useTenantStore } from '@/hooks/useTenant'

const ROLES = [
  { value: 'DOCTOR', label: 'Medical Doctor' },
  { value: 'NURSES', label: 'Nurse' },
  { value: 'LAB_SCIENTIST', label: 'Lab Scientist / Technician' },
  { value: 'IMAGING_TECH', label: 'Imaging Technician (Radiographer, Sonographer)' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'BILLING_OFFICER', label: 'Billing Officer' },
  { value: 'HIM_OFFICER', label: 'Health Information Management Officer' },
]

const DEPARTMENTS = [
  { value: 'GENERAL',         label: 'General Practice' },
  { value: 'EMERGENCY',       label: 'Emergency' },
  { value: 'PAEDIATRICS',     label: 'Paediatrics' },
  { value: 'OBSTETRICS',      label: 'Obstetrics' },
  { value: 'SURGERY',         label: 'Surgery' },
  { value: 'CARDIOLOGY',      label: 'Cardiology' },
  { value: 'RADIOLOGY',       label: 'Radiology' },
  { value: 'LABORATORY',      label: 'Laboratory' },
  { value: 'PHARMACY',        label: 'Pharmacy' },
  { value: 'ADMINISTRATION',  label: 'Administration' },
]

const signupSchema = z.object({
  firstName:     z.string().min(1, 'First name is required').max(50),
  lastName:      z.string().min(1, 'Last name is required').max(50),
  email:         z.string().email('Valid email is required'),
  phone:         z.string().min(10, 'Phone number must be at least 10 digits'),
  profession:    z.string().min(1, 'Profession is required'),
  role:          z.string().min(1, 'Role is required'),
  department:    z.string().min(1, 'Department is required'),
  facility:      z.string().optional(),
  licenseNumber: z.string().optional(),
  message:       z.string().optional(),
})

type SignupFormData = z.infer<typeof signupSchema>

interface SignupErrorResponse {
  error?: string
}

function getSignupErrorMessage(error: unknown) {
  if (isAxiosError<SignupErrorResponse>(error)) {
    return error.response?.data?.error
  }
  return undefined
}

export default function Signup() {
  const [submitted, setSubmitted] = useState(false)
  const themeColor = useTenantStore((s) => s.themePrimaryColor) ?? '#5580F4'
  const logoUrl = useTenantStore((s) => s.logoUrl)
  const facilityName = useTenantStore((s) => s.facilityName) ?? 'Atlis Health'

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      profession: '',
      role: '',
      department: '',
      facility: '',
      licenseNumber: '',
      message: '',
    },
  })

  const department = useWatch({ control, name: 'department' })
  const role = useWatch({ control, name: 'role' })

  const mutation = useMutation({
    mutationFn: submitSignupRequest,
    onSuccess: () => {
      setSubmitted(true)
      reset()
    },
  })

  const onSubmit = (data: SignupFormData) => {
    mutation.mutate(data)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#ECFDF5] mx-auto mb-4">
            <Check size={26} className="text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">Request Submitted</h2>
          <p className="text-sm text-[#64748B] mb-6 max-w-xs mx-auto">
            Your sign-up request has been received. A facility administrator
            will review it and you will be notified via email.
          </p>
          <ButtonPill variant="ghost" icon={ArrowLeft} onClick={() => setSubmitted(false)}>
            Submit Another Request
          </ButtonPill>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#EEF1F8] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src={logoUrl ?? '/atlis-logo.svg'} alt={facilityName} className="h-10 w-auto" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0F172A]">Request Staff Access</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Submit a request to join {facilityName}. An administrator will review and approve your account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">First Name <span className="text-red-500">*</span></Label>
              <Input placeholder="John" className="border-[#EEF1F8]" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Last Name <span className="text-red-500">*</span></Label>
              <Input placeholder="Doe" className="border-[#EEF1F8]" {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Email Address <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="john.doe@hospital.com" className="border-[#EEF1F8]" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Phone Number <span className="text-red-500">*</span></Label>
            <Input type="tel" placeholder="08012345678" className="border-[#EEF1F8]" {...register('phone')} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Profession <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. Medical Laboratory Scientist, Registered Nurse" className="border-[#EEF1F8]" {...register('profession')} />
            {errors.profession && <p className="text-xs text-red-500">{errors.profession.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Role <span className="text-red-500">*</span></Label>
            <Select value={role} onValueChange={(value) => setValue('role', value, { shouldValidate: true })}>
              <SelectTrigger className="w-full rounded-xl border-[#EEF1F8] bg-white text-[#0F172A]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Department <span className="text-red-500">*</span></Label>
            <Select value={department} onValueChange={(value) => setValue('department', value, { shouldValidate: true })}>
              <SelectTrigger className="w-full rounded-xl border-[#EEF1F8] bg-white text-[#0F172A]">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Facility</Label>
            <Input placeholder="Name of the hospital or clinic" className="border-[#EEF1F8]" {...register('facility')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">License Number</Label>
            <Input placeholder="Professional license or registration number" className="border-[#EEF1F8]" {...register('licenseNumber')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Message (optional)</Label>
            <textarea
              {...register('message')}
              rows={3}
              placeholder="Any additional information for the administrator…"
              className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30 resize-none"
            />
          </div>

          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
              {getSignupErrorMessage(mutation.error) || 'Failed to submit request. Please try again.'}
            </div>
          )}

          <ButtonPill type="submit" variant="primary" className="w-full" loading={mutation.isPending}>
            Submit Request
          </ButtonPill>
        </form>

        <p className="text-center text-xs text-[#94A3B8] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: themeColor }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}