import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { overrideAlert } from '@/services/eveeService'
import type { EveeAlert } from '@/types/evee'
import { SEVERITY_STYLES } from '@/types/evee'

interface Props {
  alert:     EveeAlert | null
  patientId: string
  onClose:   () => void
}

export default function OverrideAlertModal({ alert, patientId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')

  const mutation = useMutation({
    mutationFn: () => overrideAlert(alert!.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evee', 'evaluations', patientId] })
      setReason('')
      onClose()
    },
  })

  if (!alert) return null
  const style = SEVERITY_STYLES[alert.severity]

  return (
    <Dialog open={!!alert} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className={`flex size-9 items-center justify-center rounded-xl ${style.bg}`}>
              <ShieldAlert size={17} className={style.text} />
            </div>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              Override Alert
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Alert summary */}
        <div className={`rounded-xl ${style.bg} border-l-4 ${style.border} p-3.5`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
            {alert.severity}
          </p>
          <p className="text-sm text-[#0F172A] font-medium mt-1">{alert.message}</p>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 bg-[#FFFBEB] rounded-xl px-3.5 py-3">
          <AlertTriangle size={14} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <p className="text-xs text-[#92400E]">
            This override is a permanent medico-legal record. Document your
            clinical reasoning clearly.
          </p>
        </div>

        {/* Reason input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#64748B]">
            Clinical reason for override <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Patient counselled on risk, benefit outweighs concern given..."
            className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5
                       text-sm text-[#0F172A] placeholder:text-[#94A3B8]
                       focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30
                       resize-none"
          />
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
            Failed to record override. Please try again.
          </div>
        )}

        <DialogFooter className="gap-2">
          <ButtonPill variant="ghost" onClick={onClose}>
            Cancel
          </ButtonPill>
          <ButtonPill
            variant="danger"
            disabled={reason.trim().length < 5}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Confirm Override
          </ButtonPill>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}