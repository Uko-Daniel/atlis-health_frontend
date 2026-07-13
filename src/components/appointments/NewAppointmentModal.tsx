import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { CalendarPlus, Search, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { createEncounter } from '@/services/encounterService'
import { searchPatients } from '@/services/patientService'
import { useDebounce } from '@/hooks/useDebounce'
import { ENCOUNTER_TYPE_LABELS } from '@/types/encounter'

const schema = z.object({
  patientId:      z.string().min(1, 'Select a patient'),
  type:           z.enum(['OUTPATIENT','INPATIENT','EMERGENCY','FOLLOW_UP','PROCEDURE','TELEMEDICINE']),
  chiefComplaint: z.string().optional(),
  date:           z.string().min(1, 'Date is required'),
  startTime:      z.string().min(1, 'Start time is required'),
  stopTime:       z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open:    boolean
  onClose: () => void
}

export default function NewAppointmentModal({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [patientSearch, setPatientSearch]   = useState('')
  const [selectedName, setSelectedName]     = useState('')
  const [showDropdown, setShowDropdown]     = useState(false)
  const debouncedSearch = useDebounce(patientSearch, 300)

  const { register, handleSubmit, setValue, reset, control, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type: 'OUTPATIENT' } })
  const appointmentType = useWatch({ control, name: 'type' })

  const { data: searchData } = useQuery({
    queryKey: ['patients', 'search', debouncedSearch],
    queryFn:  () => searchPatients({ name: debouncedSearch }),
    enabled:  debouncedSearch.length > 1,
  })
  const patients = searchData?.data ?? []

  const mutation = useMutation({
    mutationFn: createEncounter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    setPatientSearch('')
    setSelectedName('')
    onClose()
  }

  const onSubmit = (data: FormData) => {
    const startTime = new Date(`${data.date}T${data.startTime}`).toISOString()
    mutation.mutate({
      patientId: data.patientId,
      type: data.type,
      chiefComplaint: data.chiefComplaint,
      startTime,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F4FF]">
              <CalendarPlus size={17} className="text-[#5580F4]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              New Appointment
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Patient search */}
          <div className="flex flex-col gap-1.5 relative">
            <Label className="text-xs font-medium text-[#64748B]">
              Patient <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                value={selectedName || patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value)
                  setSelectedName('')
                  setValue('patientId', '')
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search patient name…"
                className="pl-9 border-[#EEF1F8]"
              />
            </div>
            {showDropdown && patients.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white
                              rounded-xl shadow-lg border border-[#EEF1F8]
                              max-h-48 overflow-y-auto">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setValue('patientId', p.id, { shouldValidate: true })
                      setSelectedName(`${p.firstName} ${p.lastName}`)
                      setPatientSearch('')
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#0F172A]
                               hover:bg-[#F8FAFF] transition-colors"
                  >
                    {p.firstName} {p.lastName}
                    <span className="text-[#94A3B8] text-xs ml-2">{p.phoneNumber}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.patientId && <p className="text-xs text-red-500">{errors.patientId.message}</p>}
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Appointment Type</Label>
            <Select
              value={appointmentType}
              onValueChange={(value) =>
                setValue('type', value as FormData['type'], { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full rounded-xl border-[#EEF1F8] bg-white text-[#0F172A]">
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENCOUNTER_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Complaint */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-[#64748B]">Note</Label>
            <textarea
              {...register('chiefComplaint')}
              rows={3}
              placeholder="Chief complaint or reason for visit…"
              className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5
                         text-sm text-[#0F172A] placeholder:text-[#94A3B8]
                         focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30 resize-none"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Date</Label>
              <Input type="date" className="border-[#EEF1F8]" {...register('date')} />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Start</Label>
              <Input type="time" className="border-[#EEF1F8]" {...register('startTime')} />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">End</Label>
              <Input type="time" className="border-[#EEF1F8]" {...register('stopTime')} />
            </div>
          </div>

          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
              Failed to create appointment. Please try again.
            </div>
          )}

          <DialogFooter className="gap-2">
            <ButtonPill type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </ButtonPill>
            <ButtonPill type="submit" variant="primary" icon={Check} loading={mutation.isPending}>
              Save Appointment
            </ButtonPill>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
