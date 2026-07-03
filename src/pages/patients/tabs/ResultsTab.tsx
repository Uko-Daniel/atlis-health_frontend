import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, ExternalLink, ChevronRight } from 'lucide-react'
import { getResultsByPatient } from '@/services/resultService'
import { STATUS_LABELS, type ResultStatus } from '@/types/result'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { Skeleton }    from '@/components/ui/skeleton'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_BORDER: Record<ResultStatus, string> = {
  PENDING:   'border-l-[#F59E0B]',
  VERIFIED:  'border-l-[#5580F4]',
  FINALIZED: 'border-l-[#10B981]',
}

export default function ResultsTab() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['results', 'patient', id],
    queryFn:  () => getResultsByPatient(id!, { limit: 50 }),
    enabled:  !!id,
  })

  const results = data?.data ?? []

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Results</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {results.length} result{results.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <ButtonPill
          variant="ghost"
          size="sm"
          icon={ExternalLink}
          onClick={() => navigate('/results')}
        >
          Worklist
        </ButtonPill>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
          <p className="text-sm text-red-500 font-medium">Failed to load results</p>
        </div>
      )}

      {!isLoading && !isError && results.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl
                          bg-[#ECFDF5] mx-auto mb-4">
            <FileText size={24} className="text-[#10B981]" />
          </div>
          <p className="text-sm font-bold text-[#0F172A]">No results yet</p>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-xs mx-auto">
            Lab and imaging results for this patient will appear here once
            they are processed and entered
          </p>
        </div>
      )}

      {!isLoading && !isError && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/results/${r.id}`)}
              className={`bg-white rounded-2xl border border-[#EEF1F8] border-l-4
                         ${STATUS_BORDER[r.status]}
                         shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 cursor-pointer
                         hover:shadow-md transition-all group`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#0F172A]">
                      {r.template?.name ?? 'Result'}
                    </p>
                    <StatusBadge value={r.status} label={STATUS_LABELS[r.status]} size="sm" />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1.5">
                    {r.department.charAt(0) + r.department.slice(1).toLowerCase()} ·{' '}
                    {fmtDate(r.createdAt)}
                  </p>
                  {r.releasedAt && (
                    <p className="text-xs text-[#10B981] font-medium mt-1">
                      Released to patient {fmtDate(r.releasedAt)}
                    </p>
                  )}
                </div>
                <ChevronRight
                  size={15}
                  className="text-[#94A3B8] shrink-0 opacity-0 group-hover:opacity-100
                             transition-opacity mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}