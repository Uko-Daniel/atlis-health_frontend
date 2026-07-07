import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, CheckCircle2, Loader2, X } from 'lucide-react'
import { runEvaluation, getEvaluationsByPatient } from '@/services/eveeService'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { SEVERITY_ORDER, type EveeAlert } from '@/types/evee'
import EveeAlertCard from '@/components/patients/EveeAlertCard'
import OverrideAlertModal from '@/components/patients/OverrideAlertModal'

interface Props {
  patientId: string
  onClose: () => void
}

export default function EveeInlinePanel({ patientId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [overrideTarget, setOverrideTarget] = useState<EveeAlert | null>(null)

  const { data: history, isLoading } = useQuery({
    queryKey: ['evee', 'evaluations', patientId],
    queryFn: () => getEvaluationsByPatient(patientId, 5),
    enabled: !!patientId,
  })

  const evaluateMutation = useMutation({
    mutationFn: () => runEvaluation(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evee', 'evaluations', patientId] })
    },
  })

  const latestEvaluation = history?.[0]
  const sortedAlerts = latestEvaluation
    ? [...latestEvaluation.alerts].sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
      )
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20"
         onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F8]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#F5F0FF]">
              <Zap size={15} className="text-[#9B6DFF]" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">EVEE Evaluation</h3>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!latestEvaluation && !isLoading && (
            <p className="text-sm text-[#64748B] text-center py-4">
              Run an evaluation to check for clinical alerts.
            </p>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-[#5580F4]" />
            </div>
          )}

          {sortedAlerts.length === 0 && latestEvaluation && (
            <div className="text-center py-4">
              <CheckCircle2 size={28} className="text-[#10B981] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#0F172A]">No alerts raised</p>
            </div>
          )}

          {sortedAlerts.map((alert) => (
            <EveeAlertCard
              key={alert.id}
              alert={alert}
              canOverride={true}
              onOverride={setOverrideTarget}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#EEF1F8]">
          <ButtonPill
            variant="primary"
            className="w-full"
            icon={evaluateMutation.isPending ? Loader2 : Zap}
            loading={evaluateMutation.isPending}
            onClick={() => evaluateMutation.mutate()}
          >
            {evaluateMutation.isPending ? 'Evaluating…' : 'Run EVEE Evaluation'}
          </ButtonPill>
        </div>
      </div>

      <OverrideAlertModal
        alert={overrideTarget}
        patientId={patientId}
        onClose={() => setOverrideTarget(null)}
      />
    </div>
  )
}