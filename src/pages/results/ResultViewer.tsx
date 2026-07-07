import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft, ShieldCheck, CheckCircle, Send,
  AlertTriangle, Edit2, Printer, Zap,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  getResultById, verifyResult, finalizeResult, releaseToPatient, checkIntegrity,
} from '@/services/resultService'
import { runEvaluation } from '@/services/eveeService'
import { STATUS_LABELS } from '@/types/result'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { Avatar }      from '@/components/ui/atoms/Avatar'
import { Skeleton }    from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function ResultViewer() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const user         = useAuthStore((s) => s.user)

  const canVerify   = user?.canVerify || user?.role === 'ADMIN'
  const canFinalize = user?.canVerify || user?.isHOD || user?.role === 'ADMIN'
  const canRelease  = ['DOCTOR', 'ADMIN', 'HIM_OFFICER'].includes(user?.role ?? '')
  const canEdit     = ['LAB_TECH', 'RADIOLOGIST', 'ADMIN'].includes(user?.role ?? '')
  const canRunEvee  = ['DOCTOR', 'ADMIN'].includes(user?.role ?? '')

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['results', id],
    queryFn:  () => getResultById(id!),
    enabled:  !!id,
  })

  const { data: integrity } = useQuery({
    queryKey: ['results', id, 'integrity'],
    queryFn:  () => checkIntegrity(id!),
    enabled:  !!id && result?.status === 'FINALIZED',
  })

  const verifyMut   = useMutation({
    mutationFn: () => verifyResult(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', id] })
      toast.success('Result verified')
    },
  })
  const finalizeMut = useMutation({
    mutationFn: () => finalizeResult(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', id] })
      toast.success('Result finalized')
    },
  })
  const releaseMut  = useMutation({
    mutationFn: () => releaseToPatient(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', id] })
      toast.success('Result released to patient')
    },
  })
  const eveeMut = useMutation({
    mutationFn: () => {
      if (!result?.patientId) throw new Error('Patient unavailable')
      return runEvaluation(result.patientId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evee', 'evaluations', result?.patientId] })
      toast.success('EVEE evaluation complete')
    },
  })

  // ── Print styles ─────────────────────────────────────────

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
        .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const fmtDate = (d?: string | null) => d
    ? new Date(d).toLocaleDateString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

  // ── Structured data renderer ─────────────────────────────

  function renderData(data: Record<string, unknown>) {
    // Structured format from Result Editor: { groups: [...], interpretation }
    if (data.groups && Array.isArray(data.groups)) {
      const groups = data.groups as Array<{
        groupId?: string
        label?: string
        fields?: Array<{
          key?: string
          label?: string
          value?: unknown
          flag?: string
          unit?: string
          referenceRange?: string
        }>
      }>

      return (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={group.groupId ?? gi}>
              {group.label && groups.length > 1 && (
                <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-2">
                  {group.label}
                </h4>
              )}
              <div className="space-y-1.5">
                {(group.fields ?? []).map((field, fi) => {
                  const flag = field.flag
                  return (
                    <div
                      key={field.key ?? fi}
                      className={cn(
                        'flex items-center justify-between py-3 px-4 rounded-xl gap-4 border',
                        flag === 'C' && 'border-l-4 border-l-[#EF4444] bg-[#FEF2F2]',
                        flag === 'H' && 'border-l-4 border-l-[#EF4444] bg-[#FEF2F2]',
                        flag === 'L' && 'border-l-4 border-l-[#F59E0B] bg-[#FFFBEB]',
                        flag === 'N' && 'border-l-4 border-l-[#10B981] bg-white',
                        !flag && 'border-transparent',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F172A]">
                          {field.label ?? field.key?.replace(/_/g, ' ')}
                        </p>
                        {field.referenceRange && (
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            Ref: {field.referenceRange} {field.unit ?? ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          'text-sm font-semibold',
                          flag === 'C' && 'text-[#EF4444]',
                        )}>
                          {field.value == null
                            ? <span className="text-[#CBD5E1]">—</span>
                            : typeof field.value === 'boolean'
                              ? (field.value ? 'Positive' : 'Negative')
                              : String(field.value)}
                          {field.unit && (
                            <span className="text-[#94A3B8] text-xs ml-1">{field.unit}</span>
                          )}
                        </span>
                        {flag && flag !== 'N' && (
                          <span className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded-full border',
                            flag === 'C' && 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444] animate-pulse',
                            flag === 'H' && 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]',
                            flag === 'L' && 'bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]',
                          )}>
                            {flag === 'C' ? 'CRITICAL' : flag === 'H' ? 'HIGH' : 'LOW'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Interpretation */}
          {data.interpretation != null && data.interpretation !== '' && (
            <div className="bg-[#F8FAFF] rounded-xl px-4 py-3 mt-4">
              <p className="text-xs font-bold text-[#64748B] mb-1">Interpretation</p>
              <p className="text-sm text-[#475569] whitespace-pre-wrap">
                {String(data.interpretation)}
              </p>
            </div>
          )}
        </div>
      )
    }

    // Fallback: flat key-value format (old results or simple templates)
    const entries = Object.entries(data)
    if (entries.length === 0) {
      return <p className="text-sm text-[#94A3B8] italic">No result data recorded</p>
    }
    return (
      <div className="divide-y divide-[#F8FAFF]">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between py-3 gap-4">
            <span className="text-sm text-[#64748B] capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-sm font-medium text-[#0F172A] text-right">
              {value == null
                ? <span className="text-[#CBD5E1]">—</span>
                : typeof value === 'object'
                  ? JSON.stringify(value)
                  : String(value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="print-area space-y-5 max-w-3xl mx-auto">

      <button onClick={() => navigate(-1)}
        className="no-print flex items-center gap-1.5 text-sm text-[#64748B]
                   hover:text-[#0F172A] transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
          <p className="text-red-500 font-medium">Result not found</p>
          <p className="text-[#94A3B8] text-sm mt-1">
            You may not have access to this result
          </p>
        </div>
      )}

      {result && (
        <>
          {/* ── Header card ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#EEF1F8]
                          shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <Avatar
                  name={result.patient
                    ? `${result.patient.firstName} ${result.patient.lastName}`
                    : '?'}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-lg font-bold text-[#0F172A]">
                      {result.template?.name ?? 'Result'}
                    </h2>
                    <StatusBadge
                      value={result.status}
                      label={STATUS_LABELS[result.status] ?? result.status}
                    />
                  </div>
                  <p className="text-sm text-[#64748B]">
                    {result.patient?.firstName} {result.patient?.lastName}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {result.department} · {fmtDate(result.createdAt)}
                  </p>
                </div>
              </div>

              {result.status === 'FINALIZED' && integrity && (
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  integrity.valid
                    ? 'bg-[#ECFDF5] text-[#10B981]'
                    : 'bg-[#FEF2F2] text-[#EF4444]',
                )}>
                  {integrity.valid
                    ? <><ShieldCheck size={13} /> Signature valid</>
                    : <><AlertTriangle size={13} /> Signature mismatch</>
                  }
                </div>
              )}
            </div>

            {/* ── Actions ─────────────────────────────────── */}
            <div className="no-print flex items-center gap-2 mt-5 flex-wrap">
              {result.status === 'PENDING' && canEdit && (
                <ButtonPill
                  variant="ghost"
                  icon={Edit2}
                  onClick={() => navigate(`/editor/${result.id}`)}
                >
                  Open Editor
                </ButtonPill>
              )}
              {result.status === 'PENDING' && canVerify && (
                <ButtonPill
                  variant="primary"
                  icon={ShieldCheck}
                  loading={verifyMut.isPending}
                  onClick={() => verifyMut.mutate()}
                >
                  Verify Result
                </ButtonPill>
              )}
              {result.status === 'VERIFIED' && canFinalize && (
                <ButtonPill
                  variant="success"
                  icon={CheckCircle}
                  loading={finalizeMut.isPending}
                  onClick={() => finalizeMut.mutate()}
                >
                  Finalize Result
                </ButtonPill>
              )}
              {result.status === 'FINALIZED' && !result.releasedAt && canRelease && (
                <ButtonPill
                  variant="primary"
                  icon={Send}
                  loading={releaseMut.isPending}
                  onClick={() => releaseMut.mutate()}
                >
                  Release to Patient
                </ButtonPill>
              )}
              {result.releasedAt && (
                <div className="flex items-center gap-1.5 text-xs text-[#10B981]
                                bg-[#ECFDF5] px-3 py-1.5 rounded-full">
                  <CheckCircle size={13} /> Released {fmtDate(result.releasedAt)}
                </div>
              )}
              {result.status === 'FINALIZED' && (canFinalize || user?.role === 'DOCTOR') && (
                <ButtonPill
                  variant="outline"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print
                </ButtonPill>
              )}
              {canRunEvee && (
                <ButtonPill
                  variant="subtle"
                  icon={Zap}
                  loading={eveeMut.isPending}
                  onClick={() => eveeMut.mutate()}
                >
                  Run EVEE
                </ButtonPill>
              )}
            </div>

            {(verifyMut.isError || finalizeMut.isError || releaseMut.isError) && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                Action failed — check permissions or result state.
              </div>
            )}
          </div>

          {/* ── Result Data ────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#EEF1F8]
                          shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Result Data</h3>
            {renderData(result.data as Record<string, unknown>)}
          </div>

          {/* ── Audit Trail ────────────────────────────────── */}
          {(result.verifiedAt || result.releasedAt) && (
            <div className="bg-white rounded-2xl border border-[#EEF1F8]
                            shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 no-print">
              <h3 className="text-sm font-bold text-[#0F172A] mb-4">Audit Trail</h3>
              <div className="space-y-3">
                {result.verifiedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B] flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#5580F4]" /> Verified
                    </span>
                    <span className="text-[#0F172A] font-medium">
                      {fmtDate(result.verifiedAt)}
                    </span>
                  </div>
                )}
                {result.releasedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B] flex items-center gap-2">
                      <Send size={14} className="text-[#9B6DFF]" /> Released to patient
                    </span>
                    <span className="text-[#0F172A] font-medium">
                      {fmtDate(result.releasedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Print-only footer ──────────────────────────── */}
          <div className="hidden print:block text-center text-xs text-[#94A3B8] mt-8 pt-4 border-t border-[#EEF1F8]">
            <p className="font-bold text-[#0F172A] text-sm">Atlis Health</p>
            <p className="mt-1">Result ID: {result.id}</p>
            <p>Printed: {new Date().toLocaleDateString('en-NG', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}</p>
            {result.verifiedAt && <p>Verified by authorized staff</p>}
          </div>
        </>
      )}
    </div>
  )
}
