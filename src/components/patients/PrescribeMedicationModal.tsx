import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pill, Check } from 'lucide-react'
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
import { createMedication } from '@/services/medicationService'

const ROUTES = ['Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical', 'Inhalation', 'Rectal']
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'As needed (PRN)', 'Once']

const schema = z.object({
  name:         z.string().min(2, 'Medication name is required'),
  dosage:       z.string().min(1, 'Dosage is required'),
  route:        z.string().min(1, 'Select a route'),
  frequency:    z.string().min(1, 'Select a frequency'),
  instructions: z.string().optional(),
  startDate:    z.string().min(1, 'Start date is required'),
  endDate:      z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open:      boolean
  onClose:   () => void
  patientId: string
  recordId?: string
}

const todayStr = new Date().toISOString().slice(0, 10)

export default function PrescribeMedicationModal({
  open, onClose, patientId, recordId,
}: Props) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { startDate: todayStr },
    })

  const mutation = useMutation({
    mutationFn: createMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      reset({ startDate: todayStr })
      onClose()
    },
  })

  const onSubmit = (data: FormData) => {
    if (!recordId) return
    mutation.mutate({
      recordId,
      name:         data.name,
      dosage:       data.dosage,
      route:        data.route,
      frequency:    data.frequency,
      instructions: data.instructions,
      startDate:    data.startDate,
      endDate:      data.endDate || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFFBEB]">
              <Pill size={17} className="text-[#F59E0B]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              Prescribe Medication
            </DialogTitle>
          </div>
        </DialogHeader>

        {!recordId ? (
          <div className="py-6 text-center">
            <p className="text-sm text-[#64748B]">
              No patient record found. A clinical record must exist before
              prescribing medication.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">
                Medication Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Amoxicillin"
                className="border-[#EEF1F8]"
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">
                  Dosage <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="500mg"
                  className="border-[#EEF1F8]"
                  {...register('dosage')}
                />
                {errors.dosage && <p className="text-xs text-red-500">{errors.dosage.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">
                  Route <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(v) => setValue('route', v, { shouldValidate: true })}>
                  <SelectTrigger className="border-[#EEF1F8]">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.route && <p className="text-xs text-red-500">{errors.route.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">
                Frequency <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(v) => setValue('frequency', v, { shouldValidate: true })}>
                <SelectTrigger className="border-[#EEF1F8]">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequency && <p className="text-xs text-red-500">{errors.frequency.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input type="date" className="border-[#EEF1F8]" {...register('startDate')} />
                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">
                  End Date <span className="text-[#94A3B8] font-normal">(optional)</span>
                </Label>
                <Input type="date" className="border-[#EEF1F8]" {...register('endDate')} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">
                Instructions <span className="text-[#94A3B8] font-normal">(optional)</span>
              </Label>
              <textarea
                {...register('instructions')}
                rows={2}
                placeholder="e.g. Take with food, avoid alcohol"
                className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5
                           text-sm text-[#0F172A] placeholder:text-[#94A3B8]
                           focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30
                           resize-none"
              />
            </div>

            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
                Failed to save prescription. Please try again.
              </div>
            )}

            <DialogFooter className="gap-2">
              <ButtonPill type="button" variant="ghost" onClick={onClose}>
                Cancel
              </ButtonPill>
              <ButtonPill type="submit" variant="primary" loading={mutation.isPending} icon={Check}>
                Prescribe
              </ButtonPill>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}