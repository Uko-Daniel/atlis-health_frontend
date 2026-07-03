import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShieldCheck, CheckCircle, Send, AlertTriangle, Edit2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  getResultById, verifyResult, finalizeResult, releaseToPatient, checkIntegrity,
} from '@/services/resultService'
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

  const verifyMut   = useMutation({ mutationFn: () => verifyResult(id!),     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['results', id] }) })
  const finalizeMut = useMutation({ mutationFn: () => finalizeResult(id!),   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['results', id] }) })
  const releaseMut  = useMutation({ mutationFn: () => releaseToPatient(id!), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['results', id] }) })

  const fmtDate = (d?: string | null) => d
    ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  function renderData(data: Record<string, unknown>) {
    const entries = Object.entries(data)
    if (entries.length === 0) return <p className="text-sm text-[#94A3B8] italic">No result data recorded</p>
    return (
      <div className="divide-y divide-[#F8FAFF]">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between py-3 gap-4">
            <span className="text-sm text-[#64748B] capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-sm font-medium text-[#0F172A] text-right">
              {value == null ? <span className="text-[#CBD5E1]">—</span>
                : typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
          <p className="text-red-500 font-medium">Result not found</p>
          <p className="text-[#94A3B8] text-sm mt-1">You may not have access to this result</p>
        </div>
      )}

      {result && (
        <>
          <div className="bg-white rounded-2xl border border-[#EEF1F8]
                          shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <Avatar name={result.patient ? `${result.patient.firstName} ${result.patient.lastName}` : '?'} size="lg" />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-lg font-bold text-[#0F172A]">{result.template?.name ?? 'Result'}</h2>
                    <StatusBadge value={result.status} label={STATUS_LABELS[result.status]} />
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
                  integrity.valid ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FEF2F2] text-[#EF4444]',
                )}>
                  {integrity.valid ? <><ShieldCheck size={13} /> Signature valid</> : <><AlertTriangle size={13} /> Signature mismatch</>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-5 flex-wrap">
              {result.status === 'PENDING' && canEdit && (
                <ButtonPill variant="ghost" icon={Edit2} onClick={() => navigate(`/editor/${result.id}`)}>
                  Open Editor
                </ButtonPill>
              )}
              {result.status === 'PENDING' && canVerify && (
                <ButtonPill variant="primary" icon={ShieldCheck} loading={verifyMut.isPending} onClick={() => verifyMut.mutate()}>
                  Verify Result
                </ButtonPill>
              )}
              {result.status === 'VERIFIED' && canFinalize && (
                <ButtonPill variant="success" icon={CheckCircle} loading={finalizeMut.isPending} onClick={() => finalizeMut.mutate()}>
                  Finalize Result
                </ButtonPill>
              )}
              {result.status === 'FINALIZED' && !result.releasedAt && canRelease && (
                <ButtonPill variant="primary" icon={Send} loading={releaseMut.isPending} onClick={() => releaseMut.mutate()}>
                  Release to Patient
                </ButtonPill>
              )}
              {result.releasedAt && (
                <div className="flex items-center gap-1.5 text-xs text-[#10B981]
                                bg-[#ECFDF5] px-3 py-1.5 rounded-full">
                  <CheckCircle size={13} /> Released {fmtDate(result.releasedAt)}
                </div>
              )}
            </div>

            {(verifyMut.isError || finalizeMut.isError || releaseMut.isError) && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                Action failed — check permissions or result state.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#EEF1F8]
                          shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Result Data</h3>
            {renderData(result.data as Record<string, unknown>)}
          </div>

          {(result.verifiedAt || result.releasedAt) && (
            <div className="bg-white rounded-2xl border border-[#EEF1F8]
                            shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <h3 className="text-sm font-bold text-[#0F172A] mb-4">Audit Trail</h3>
              <div className="space-y-3">
                {result.verifiedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B] flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#5580F4]" /> Verified
                    </span>
                    <span className="text-[#0F172A] font-medium">{fmtDate(result.verifiedAt)}</span>
                  </div>
                )}
                {result.releasedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B] flex items-center gap-2">
                      <Send size={14} className="text-[#9B6DFF]" /> Released to patient
                    </span>
                    <span className="text-[#0F172A] font-medium">{fmtDate(result.releasedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}