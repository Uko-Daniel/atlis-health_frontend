import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input }       from '@/components/ui/input'
import { Label }       from '@/components/ui/label'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { createVital } from '@/services/vitalsService'

const optionalNumber = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().optional(),
)

const schema = z.object({
  systolicBP:      optionalNumber,
  diastolicBP:     optionalNumber,
  heartRate:       optionalNumber,
  respiratoryRate: optionalNumber,
  spO2:            optionalNumber,
  temperature:     optionalNumber,
  weight:          optionalNumber,
  height:          optionalNumber,
  gcs:             optionalNumber,
  painScore:       optionalNumber,
})

type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

interface Props {
  open:              boolean
  onClose:           () => void
  patientId:         string
  activeEncounter?:  { id: string }
}

function Field({
  label, unit, error, children,
}: { label: string; unit?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-[#64748B]">
        {label} {unit && <span className="text-[#94A3B8]">({unit})</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function RecordVitalsModal({
  open, onClose, patientId, activeEncounter,
}: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, control, reset, formState: { errors } } =
    useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) })

  const weight = useWatch({ control, name: 'weight' })
  const height = useWatch({ control, name: 'height' })

  const computedBmi = useMemo(() => {
    const weightKg = toFiniteNumber(weight)
    const heightCm = toFiniteNumber(height)
    if (!weightKg || !heightCm) return null
    const m = heightCm / 100
    return +(weightKg / (m * m)).toFixed(1)
  }, [weight, height])

  const mutation = useMutation({
    mutationFn: createVital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      queryClient.invalidateQueries({ queryKey: ['vitals', 'trend', patientId] })
      queryClient.invalidateQueries({ queryKey: ['vitals', 'encounter', activeEncounter?.id] })
      reset()
      onClose()
    },
  })

  const onSubmit = (data: FormData) => {
    if (!activeEncounter) return
    mutation.mutate({
      encounterId: activeEncounter.id,
      patientId,
      ...data,
      bmi: computedBmi ?? undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F4FF]">
              <Activity size={17} className="text-[#5580F4]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              Record Vitals
            </DialogTitle>
          </div>
        </DialogHeader>

        {!activeEncounter ? (
          <div className="py-6 text-center">
            <p className="text-sm text-[#64748B]">
              No active encounter found. Vitals must be recorded during an
              open encounter.
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Start a new encounter first, then return here.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <Field label="Systolic BP" unit="mmHg" error={errors.systolicBP?.message}>
                <Input type="number" placeholder="120" className="border-[#EEF1F8]" {...register('systolicBP')} />
              </Field>
              <Field label="Diastolic BP" unit="mmHg" error={errors.diastolicBP?.message}>
                <Input type="number" placeholder="80" className="border-[#EEF1F8]" {...register('diastolicBP')} />
              </Field>
              <Field label="Heart Rate" unit="bpm" error={errors.heartRate?.message}>
                <Input type="number" placeholder="72" className="border-[#EEF1F8]" {...register('heartRate')} />
              </Field>
              <Field label="Resp. Rate" unit="/min" error={errors.respiratoryRate?.message}>
                <Input type="number" placeholder="16" className="border-[#EEF1F8]" {...register('respiratoryRate')} />
              </Field>
              <Field label="SpO2" unit="%" error={errors.spO2?.message}>
                <Input type="number" placeholder="98" className="border-[#EEF1F8]" {...register('spO2')} />
              </Field>
              <Field label="Temperature" unit="deg C" error={errors.temperature?.message}>
                <Input type="number" step="0.1" placeholder="36.8" className="border-[#EEF1F8]" {...register('temperature')} />
              </Field>
              <Field label="Weight" unit="kg" error={errors.weight?.message}>
                <Input type="number" step="0.1" placeholder="68" className="border-[#EEF1F8]" {...register('weight')} />
              </Field>
              <Field label="Height" unit="cm" error={errors.height?.message}>
                <Input type="number" placeholder="170" className="border-[#EEF1F8]" {...register('height')} />
              </Field>
              <Field label="GCS" unit="3-15" error={errors.gcs?.message}>
                <Input type="number" placeholder="15" className="border-[#EEF1F8]" {...register('gcs')} />
              </Field>
              <Field label="Pain Score" unit="0-10" error={errors.painScore?.message}>
                <Input type="number" placeholder="0" className="border-[#EEF1F8]" {...register('painScore')} />
              </Field>
            </div>

            {computedBmi && (
              <div className="bg-[#F0F4FF] rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-[#5580F4] font-medium">Calculated BMI</span>
                <span className="text-sm font-bold text-[#5580F4]">{computedBmi}</span>
              </div>
            )}

            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
                Failed to save vitals. Please try again.
              </div>
            )}

            <DialogFooter className="gap-2">
              <ButtonPill type="button" variant="ghost" onClick={onClose}>
                Cancel
              </ButtonPill>
              <ButtonPill type="submit" variant="primary" loading={mutation.isPending}>
                Save Vitals
              </ButtonPill>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
