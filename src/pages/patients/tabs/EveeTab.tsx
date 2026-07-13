import { useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, ShieldCheck, AlertTriangle, Info, CheckCircle2, Loader2 } from 'lucide-react'
import type { PatientOutletContext } from '@/hooks/usePatient'
import { runEvaluation, getEvaluationsByPatient } from '@/services/eveeService'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { useAuthStore } from '@/stores/authStore'
import { SEVERITY_ORDER, type EveeAlert } from '@/types/evee'
import EveeAlertCard from '@/components/patients/EveeAlertCard'
import OverrideAlertModal from '@/components/patients/OverrideAlertModal'

const DOMAIN_DESCRIPTIONS = [
  { icon: AlertTriangle, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]', label: 'Allergy & Drug Interaction Checks' },
  { icon: ShieldCheck,   color: 'text-[#5580F4]', bg: 'bg-[#F0F4FF]', label: 'Vital Sign Deterioration Alerts' },
  { icon: Zap,           color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]', label: 'Lab Value Flagging & Interpretation' },
  { icon: Info,          color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', label: 'Clinical Guideline Recommendations' },
]

export default function EveeTab() {
  const { id } = useParams<{ id: string }>()
  const { patient } = useOutletContext<PatientOutletContext>()
  const user        = useAuthStore((s) => s.user)
  const canRun       = ['DOCTOR', 'PHARMACIST', 'NURSE'].includes(user?.role ?? '')
  const canOverride  = ['DOCTOR'].includes(user?.role ?? '')
  const queryClient  = useQueryClient()

  const [overrideTarget, setOverrideTarget] = useState<EveeAlert | null>(null)

  const allergyCount = patient?.allergies?.length ?? 0
  const dxCount      = patient?.encounters
    ?.flatMap((e) => e.diagnoses)
    .filter((d) => d.status === 'ACTIVE').length ?? 0

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['evee', 'evaluations', id],
    queryFn:  () => getEvaluationsByPatient(id!, 10),
    enabled:  !!id,
  })

  const evaluateMutation = useMutation({
    mutationFn: () => runEvaluation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evee', 'evaluations', id] })
    },
  })

  const latestEvaluation = history?.[0]
  const sortedAlerts = latestEvaluation
    ? [...latestEvaluation.alerts].sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
      )
    : []

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#5580F4] to-[#3D67F1]
                      rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 size-40 rounded-full
                        bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-24 rounded-full
                        bg-white/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative">
          <div className="flex size-12 items-center justify-center rounded-xl
                          bg-white/15 mb-4">
            <Zap size={24} className="text-white" />
          </div>

          <h3 className="text-lg font-bold">EVEE</h3>
          <p className="text-sm text-white/70 mt-1">
            Evidence-based Virtual Evaluation Engine
          </p>

          <div className="flex items-center gap-4 mt-4">
            <div className="bg-white/15 rounded-xl px-3 py-2">
              <p className="text-xs text-white/60">Known Allergies</p>
              <p className="text-xl font-bold">{allergyCount}</p>
            </div>
            <div className="bg-white/15 rounded-xl px-3 py-2">
              <p className="text-xs text-white/60">Active Diagnoses</p>
              <p className="text-xl font-bold">{dxCount}</p>
            </div>
            {latestEvaluation && (
              <div className="bg-white/15 rounded-xl px-3 py-2">
                <p className="text-xs text-white/60">Last Run</p>
                <p className="text-sm font-bold">
                  {new Date(latestEvaluation.createdAt).toLocaleDateString('en-NG', {
                    day: '2-digit', month: 'short',
                  })}
                </p>
              </div>
            )}
          </div>

          {canRun && (
            <ButtonPill
              variant="ghost"
              className="mt-5 bg-white text-[#5580F4] hover:bg-white/90
                         border-transparent shadow-md"
              icon={evaluateMutation.isPending ? Loader2 : Zap}
              loading={evaluateMutation.isPending}
              onClick={() => evaluateMutation.mutate()}
            >
              {evaluateMutation.isPending ? 'Evaluating…' : 'Run EVEE Evaluation'}
            </ButtonPill>
          )}

          {evaluateMutation.isError && (
            <p className="text-xs text-white/80 bg-white/10 rounded-lg px-3 py-2 mt-3">
              Evaluation failed — the EVEE engine may be unreachable. Try again shortly.
            </p>
          )}
        </div>
      </div>

      {/* Latest evaluation results */}
      {latestEvaluation && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0F172A]">
              Latest Evaluation
            </h4>
            <span className="text-xs text-[#94A3B8]">
              {new Date(latestEvaluation.createdAt).toLocaleString('en-NG', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {sortedAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EEF1F8]
                            shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl
                              bg-[#ECFDF5] mx-auto mb-3">
                <CheckCircle2 size={22} className="text-[#10B981]" />
              </div>
              <p className="text-sm font-bold text-[#0F172A]">No alerts raised</p>
              <p className="text-xs text-[#94A3B8] mt-1">
                EVEE found no clinical concerns in this evaluation
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedAlerts.map((alert) => (
                <EveeAlertCard
                  key={alert.id}
                  alert={alert}
                  canOverride={canOverride}
                  onOverride={setOverrideTarget}
                />
              ))}
            </div>
          )}

          {latestEvaluation.mlScore !== undefined && (
            <div className="bg-[#F5F0FF] rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#9B6DFF]">ML Risk Score</p>
                <p className="text-xs text-[#9B6DFF]/70 mt-0.5">Beta — for reference only</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#9B6DFF]">{latestEvaluation.mlScore}</p>
                {latestEvaluation.mlLabel && (
                  <p className="text-xs text-[#9B6DFF]">{latestEvaluation.mlLabel}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* What EVEE checks — only show if no evaluations yet */}
      {!latestEvaluation && !historyLoading && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <h4 className="text-sm font-bold text-[#0F172A] mb-4">
            What EVEE evaluates
          </h4>
          <div className="space-y-3">
            {DOMAIN_DESCRIPTIONS.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.label} className="flex items-center gap-3">
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${d.bg}`}>
                    <Icon size={15} className={d.color} />
                  </div>
                  <p className="text-sm text-[#64748B]">{d.label}</p>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-[#94A3B8] mt-4 leading-relaxed">
            Evaluations are logged with full audit trail. CRITICAL and HIGH severity
            alerts require documented clinical override before dismissal.
            ML risk scoring is in beta.
          </p>
        </div>
      )}

      {/* Evaluation history */}
      {history && history.length > 1 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F8FAFF] bg-[#FAFBFF]">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
              Previous Evaluations
            </h4>
          </div>
          <div className="divide-y divide-[#F8FAFF]">
            {history.slice(1).map((ev) => (
              <div key={ev.evaluationId} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[#64748B]">
                  {new Date(ev.createdAt).toLocaleDateString('en-NG', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#94A3B8]">
                    {ev.alertCount} alert{ev.alertCount !== 1 ? 's' : ''}
                  </span>
                  {ev.criticalCount > 0 && (
                    <span className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2]
                                     px-2 py-0.5 rounded-full">
                      {ev.criticalCount} critical
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <OverrideAlertModal
        alert={overrideTarget}
        patientId={id!}
        onClose={() => setOverrideTarget(null)}
      />
    </div>
  )
}