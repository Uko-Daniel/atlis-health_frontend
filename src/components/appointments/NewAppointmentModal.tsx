import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { createEncounter } from '@/services/encounterService'
import { searchPatients } from '@/services/patientService'
import { useDebounce } from '@/hooks/useDebounce'
import { ENCOUNTER_TYPE_LABELS } from '@/types/encounter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  patientId:      z.string().min(1, 'Select a patient'),
  type:           z.enum([
    'OUTPATIENT','INPATIENT','EMERGENCY',
    'FOLLOW_UP','PROCEDURE','TELEMEDICINE',
  ]),
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
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const debouncedSearch = useDebounce(patientSearch, 300)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'OUTPATIENT' },
  })

  // Patient search
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
      reset()
      setPatientSearch('')
      setSelectedPatientName('')
      onClose()
    },
  })

  const onSubmit = (data: FormData) => {
    // Combine date + startTime into ISO string
    const startTime = new Date(`${data.date}T${data.startTime}`).toISOString()
    mutation.mutate({
      patientId:      data.patientId,
      type:           data.type,
      chiefComplaint: data.chiefComplaint,
      startTime,
    })
  }

  const handleClose = () => {
    reset()
    setPatientSearch('')
    setSelectedPatientName('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl
                      shadow-2xl p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            {/* Logo mark */}
            <img src="/atlis-icon.svg" alt='Atlis Health' className="h-7 w-auto" />
            <h2 className="text-2xl font-bold text-indigo-600">
              New Appointment
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Patient selector */}
          <div className="flex flex-col gap-1.5 relative">
            <Label className="text-xs text-slate-400 font-medium px-1">
              Patient
            </Label>
            <div className="relative">
              <input
                value={selectedPatientName || patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value)
                  setSelectedPatientName('')
                  setValue('patientId', '')
                  setShowPatientDropdown(true)
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Search patient name…"
                className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3.5
                           text-slate-800 placeholder:text-slate-400 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {/* Dropdown */}
              {showPatientDropdown && patients.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white
                               rounded-xl shadow-lg border border-slate-100 z-20
                               max-h-48 overflow-y-auto">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setValue('patientId', p.id, { shouldValidate: true })
                        setSelectedPatientName(`${p.firstName} ${p.lastName}`)
                        setPatientSearch('')
                        setShowPatientDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm
                                 text-slate-700 hover:bg-indigo-50 transition-colors"
                    >
                      {p.firstName} {p.lastName}
                      <span className="text-slate-400 text-xs ml-2">
                        {p.phoneNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.patientId && (
              <p className="text-xs text-red-500 px-1">{errors.patientId.message}</p>
            )}
          </div>

          {/* Appointment type */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-400 font-medium px-1">
              Appointment Type
            </Label>
            <select
              {...register('type')}
              className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3.5
                         text-slate-800 text-sm focus:outline-none
                         focus:ring-2 focus:ring-indigo-200 appearance-none"
            >
              {Object.entries(ENCOUNTER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Chief complaint / note */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-slate-400 font-medium px-1">
              Note
            </Label>
            <textarea
              {...register('chiefComplaint')}
              rows={4}
              placeholder="Chief complaint or reason for visit…"
              className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3.5
                         text-slate-800 placeholder:text-slate-400 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-200
                         resize-none"
            />
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-slate-400 font-medium px-1">
                Date
              </Label>
              <Input
                type="date"
                {...register('date')}
                className="bg-slate-50 border-0 rounded-2xl px-4 py-3.5
                           text-slate-800 text-sm focus:ring-2 focus:ring-indigo-200"
              />
              {errors.date && (
                <p className="text-xs text-red-500 px-1">{errors.date.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-slate-400 font-medium px-1">
                Time
              </Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  {...register('startTime')}
                  placeholder="Start"
                  className="bg-slate-50 border-0 rounded-2xl px-3 py-3.5
                             text-slate-800 text-sm focus:ring-2 focus:ring-indigo-200"
                />
                <Input
                  type="time"
                  {...register('stopTime')}
                  placeholder="End"
                  className="bg-slate-50 border-0 rounded-2xl px-3 py-3.5
                             text-slate-800 text-sm focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              {errors.startTime && (
                <p className="text-xs text-red-500 px-1">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          {/* Server error */}
          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-600
                            text-sm rounded-xl px-4 py-3">
              Failed to create appointment. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white
                         rounded-full py-3 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={mutation.isPending}
              className="flex-1 border-indigo-200 text-indigo-600
                         hover:bg-indigo-50 rounded-full py-3 font-medium"
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}