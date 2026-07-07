import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { Stethoscope, Search, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input }      from '@/components/ui/input'
import { Label }      from '@/components/ui/label'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Toggle }     from '@/components/ui/atoms/Toggle'
import { createDiagnosis, searchIcdCodes } from '@/services/diagnosisService'
import { useDebounce } from '@/hooks/useDebounce'
import type { DiagnosisStatus } from '@/types/patient'
import { cn } from '@/lib/utils'

const schema = z.object({
  name:   z.string().min(2, 'Diagnosis name is required'),
  notes:  z.string().optional(),
})

type FormData = z.infer<typeof schema>

const STATUS_OPTIONS: { value: DiagnosisStatus; label: string }[] = [
  { value: 'ACTIVE',    label: 'Active'    },
  { value: 'SUSPECTED', label: 'Suspected' },
  { value: 'CHRONIC',   label: 'Chronic'   },
  { value: 'RESOLVED',  label: 'Resolved'  },
]

interface Props {
  open:             boolean
  onClose:          () => void
  patientId:        string
  activeEncounter?: { id: string }
}

export default function AddDiagnosisModal({
  open, onClose, patientId, activeEncounter,
}: Props) {
  const queryClient = useQueryClient()
  const [icdQuery, setIcdQuery]   = useState('')
  const [selectedIcd, setIcd]     = useState<{ code: string; description: string } | null>(null)
  const [status, setStatus]       = useState<DiagnosisStatus>('ACTIVE')
  const [isPrimary, setIsPrimary] = useState(false)
  const debouncedIcd = useDebounce(icdQuery, 250)

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: icdResults } = useQuery({
    queryKey: ['icd', debouncedIcd],
    queryFn:  () => searchIcdCodes(debouncedIcd),
    enabled:  debouncedIcd.length > 1,
  })

  const mutation = useMutation({
    mutationFn: createDiagnosis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      queryClient.invalidateQueries({ queryKey: ['diagnoses', 'encounter', activeEncounter?.id] })
      handleClose()
    },
  })

  const handleClose = () => {
    reset()
    setIcdQuery('')
    setIcd(null)
    setStatus('ACTIVE')
    setIsPrimary(false)
    onClose()
  }

  const onSubmit = (data: FormData) => {
    if (!activeEncounter) return
    mutation.mutate({
      patientId,
      encounterId:    activeEncounter.id,
      name:           data.name,
      icdCode:        selectedIcd?.code,
      icdDescription: selectedIcd?.description,
      status,
      isPrimary,
      notes:          data.notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#ECFDF5]">
              <Stethoscope size={17} className="text-[#10B981]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              Add Diagnosis
            </DialogTitle>
          </div>
        </DialogHeader>

        {!activeEncounter ? (
          <div className="py-6 text-center">
            <p className="text-sm text-[#64748B]">
              No active encounter found. Diagnoses must be recorded during
              an open encounter.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* ICD search */}
            <div className="flex flex-col gap-1.5 relative">
              <Label className="text-xs font-medium text-[#64748B]">
                ICD-10 Lookup <span className="text-[#94A3B8] font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  value={selectedIcd ? `${selectedIcd.code} — ${selectedIcd.description}` : icdQuery}
                  onChange={(e) => {
                    setIcdQuery(e.target.value)
                    setIcd(null)
                  }}
                  placeholder="Search condition or ICD code…"
                  className="pl-9 border-[#EEF1F8]"
                />
              </div>

              {!selectedIcd && icdResults && icdResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-20
                                bg-white rounded-xl shadow-lg border border-[#EEF1F8]
                                max-h-48 overflow-y-auto">
                  {icdResults.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => {
                        setIcd(r)
                        setValue('name', r.description, { shouldValidate: true })
                        setIcdQuery('')
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFF]
                                 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-[#0F172A]">{r.description}</span>
                      <span className="text-xs font-mono text-[#5580F4] shrink-0">{r.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnosis name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">
                Diagnosis Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Type 2 Diabetes Mellitus"
                className="border-[#EEF1F8]"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Status pills */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Status</Label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      status === opt.value
                        ? 'bg-[#5580F4] text-white border-[#5580F4]'
                        : 'bg-white text-[#64748B] border-[#EEF1F8] hover:border-[#5580F4]/30',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary toggle */}
            <div className="flex items-center justify-between bg-[#F8FAFF]
                            rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">
                  Primary diagnosis
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Mark as the leading diagnosis for this encounter
                </p>
              </div>
              <Toggle checked={isPrimary} onChange={setIsPrimary} />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">
                Clinical Notes <span className="text-[#94A3B8] font-normal">(optional)</span>
              </Label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Additional clinical context…"
                className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5
                           text-sm text-[#0F172A] placeholder:text-[#94A3B8]
                           focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30
                           resize-none"
              />
            </div>

            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
                Failed to save diagnosis. Please try again.
              </div>
            )}

            <DialogFooter className="gap-2">
              <ButtonPill type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </ButtonPill>
              <ButtonPill type="submit" variant="primary" loading={mutation.isPending} icon={Check}>
                Save Diagnosis
              </ButtonPill>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
