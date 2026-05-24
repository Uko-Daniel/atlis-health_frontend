import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import { createPatient } from '@/services/patientService'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const patientSchema = z.object({
  firstName:   z.string().min(1, 'First name is required'),
  lastName:    z.string().min(1, 'Last name is required'),
  dob:         z.string().min(1, 'Date of birth is required'),
  gender:      z.enum(['MALE', 'FEMALE', 'OTHER'] as const),
  phoneNumber: z.string().min(7, 'Enter a valid phone number').optional().or(z.literal('')),
  email:       z.string().email('Invalid email address').optional().or(z.literal('')),
})

type PatientForm = z.infer<typeof patientSchema>

// ── Reusable field wrapper ────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label:    string
  required?: boolean
  error?:   string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function PatientNew() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PatientForm>({ resolver: zodResolver(patientSchema) })

  const mutation = useMutation({
    mutationFn: createPatient,
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      navigate(`/patients/${patient.id}`)
    },
  })

  const onSubmit = (data: PatientForm) => {
    mutation.mutate({
      firstName:   data.firstName,
      lastName:    data.lastName,
      dob:         data.dob,
      gender:      data.gender,
      phoneNumber: data.phoneNumber || undefined,
      email:       data.email       || undefined,
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Back + title ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/patients')}
          className="gap-1.5 text-slate-500 hover:text-slate-800 -ml-2"
        >
          <ArrowLeft size={15} />
          Patients
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Register New Patient
        </h2>
        <p className="text-sm text-slate-500">
          Enter the patient's biodata to create a record
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Personal Information ── */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Field label="First Name" required error={errors.firstName?.message}>
              <Input
                placeholder="Adaeze"
                className="border-slate-200"
                {...register('firstName')}
              />
            </Field>

            <Field label="Last Name" required error={errors.lastName?.message}>
              <Input
                placeholder="Okafor"
                className="border-slate-200"
                {...register('lastName')}
              />
            </Field>

            <Field label="Date of Birth" required error={errors.dob?.message}>
              <Input
                type="date"
                className="border-slate-200"
                {...register('dob')}
              />
            </Field>

            <Field label="Gender" required error={errors.gender?.message}>
              <Select
                onValueChange={(v) =>
                  setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER', {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="border-slate-200 bg-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

          </CardContent>
        </Card>

        {/* ── Contact Information ── */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Contact Information
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Field label="Phone Number" error={errors.phoneNumber?.message}>
              <Input
                placeholder="+234 800 000 0000"
                className="border-slate-200"
                {...register('phoneNumber')}
              />
            </Field>

            <Field label="Email Address" error={errors.email?.message}>
              <Input
                type="email"
                placeholder="patient@email.com"
                className="border-slate-200"
                {...register('email')}
              />
            </Field>

          </CardContent>
        </Card>

        {/* ── Server error ── */}
        {mutation.isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Failed to register patient. Check the details and try again.
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/patients')}
            className="border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-slate-900 hover:bg-slate-700 text-white min-w-32"
          >
            {mutation.isPending ? 'Registering…' : 'Register Patient'}
          </Button>
        </div>

      </form>
    </div>
  )
}