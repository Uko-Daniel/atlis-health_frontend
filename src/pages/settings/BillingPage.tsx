import { useQuery } from '@tanstack/react-query'
import { CreditCard, Download, TrendingUp, Users, Video, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// These will be wired to real API calls — stubbed for now
async function getBillingEstimate() {
  const api = (await import('@/lib/api')).default
  const res = await api.get('/billing/estimate')
  return res.data
}

async function getBillingHistory() {
  const api = (await import('@/lib/api')).default
  const res = await api.get('/billing/history')
  return res.data
}

interface BillingEstimate {
  planTier: string
  activeUserCount: number
  includedUsers: number
  overageUsers: number
  encounterCount: number
  encounterOverage: number
  videoMinutes: number
  baseAmount: number
  userOverageAmount: number
  encounterOverageAmount: number
  eveeAmount: number
  videoAmount: number
  totalAmount: number
  breakdown: string
  periodStart: string
  periodEnd: string
}

interface BillingPeriod {
  id: string
  periodStart: string
  periodEnd: string
  activeUserCount: number
  encounterCount: number
  calculatedAmount: number
  status: 'DRAFT' | 'FINALIZED' | 'PAID' | 'OVERDUE'
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-[#F8FAFF] text-[#64748B] border-[#EEF1F8]',
  FINALIZED: 'bg-[#F0F4FF] text-[#5580F4] border-[#5580F4]/30',
  PAID:      'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/30',
  OVERDUE:   'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/30',
}

export default function BillingPage() {
  const { data: estimate, isLoading: estLoading } = useQuery<BillingEstimate>({
    queryKey: ['billing', 'estimate'],
    queryFn: getBillingEstimate,
  })

  const { data: history, isLoading: histLoading } = useQuery<BillingPeriod[]>({
    queryKey: ['billing', 'history'],
    queryFn: getBillingHistory,
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">Billing</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Current usage and billing history for your facility
        </p>
      </div>

      {/* ── Current Period Estimate ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F4FF]">
            <TrendingUp size={16} className="text-[#5580F4]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Current Period</h3>
            <p className="text-xs text-[#94A3B8]">
              {estimate ? fmtMonth(estimate.periodStart) : 'Loading…'}
            </p>
          </div>
          {estimate && (
            <span className="ml-auto text-xs font-medium bg-[#F8FAFF] border border-[#EEF1F8] px-2.5 py-1 rounded-full">
              {estimate.planTier.replace('_', ' ')}
            </span>
          )}
        </div>

        {estLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : estimate ? (
          <>
            {/* Metric pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-[#F8FAFF] rounded-xl p-3 text-center">
                <Users size={14} className="text-[#5580F4] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#0F172A]">{estimate.activeUserCount}</p>
                <p className="text-xs text-[#94A3B8]">Active users</p>
              </div>
              <div className="bg-[#F8FAFF] rounded-xl p-3 text-center">
                <CreditCard size={14} className="text-[#5580F4] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#0F172A]">{estimate.encounterCount}</p>
                <p className="text-xs text-[#94A3B8]">Encounters</p>
              </div>
              <div className="bg-[#F8FAFF] rounded-xl p-3 text-center">
                <Video size={14} className="text-[#5580F4] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#0F172A]">{estimate.videoMinutes}</p>
                <p className="text-xs text-[#94A3B8]">Video mins</p>
              </div>
              <div className="bg-[#F8FAFF] rounded-xl p-3 text-center">
                <Zap size={14} className="text-[#5580F4] mx-auto mb-1" />
                <p className="text-lg font-bold text-[#0F172A]">
                  {estimate.eveeAmount > 0 ? 'Active' : 'Inactive'}
                </p>
                <p className="text-xs text-[#94A3B8]">EVEE</p>
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2 mb-4">
              <LineItem label="Base subscription" amount={estimate.baseAmount} />
              {estimate.userOverageAmount > 0 && (
                <LineItem
                  label={`User overage (${estimate.overageUsers} beyond ${estimate.includedUsers})`}
                  amount={estimate.userOverageAmount}
                />
              )}
              {estimate.encounterOverageAmount > 0 && (
                <LineItem
                  label={`Encounter overage (${estimate.encounterOverage} beyond threshold)`}
                  amount={estimate.encounterOverageAmount}
                />
              )}
              {estimate.eveeAmount > 0 && (
                <LineItem label="EVEE CDSS add-on" amount={estimate.eveeAmount} />
              )}
              {estimate.videoAmount > 0 && (
                <LineItem label="Video consultations" amount={estimate.videoAmount} />
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-[#EEF1F8] pt-4">
              <span className="text-sm font-bold text-[#0F172A]">Estimated total</span>
              <span className="text-lg font-bold text-[#5580F4]">
                {naira(estimate.totalAmount)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#94A3B8] text-center py-8">
            Unable to load estimate
          </p>
        )}
      </div>

      {/* ── Billing History ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EEF1F8] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A]">Billing History</h3>
          <button className="text-xs text-[#5580F4] font-medium hover:underline flex items-center gap-1">
            <Download size={12} /> Export
          </button>
        </div>

        {histLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="divide-y divide-[#F8FAFF]">
            {history.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {fmtMonth(period.periodStart)}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {period.activeUserCount} users · {period.encounterCount} encounters
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#0F172A]">
                    {naira(Number(period.calculatedAmount))}
                  </span>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full border',
                    STATUS_STYLES[period.status],
                  )}>
                    {period.status.charAt(0) + period.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[#94A3B8]">No billing history yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

function LineItem({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#64748B]">{label}</span>
      <span className="font-medium text-[#0F172A]">{naira(amount)}</span>
    </div>
  )
}