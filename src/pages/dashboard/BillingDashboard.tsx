import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, CreditCard, Package,
  FileText, ArrowRight, DollarSign,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface BillingEstimate {
  totalAmount: number
  baseAmount: number
  userOverageAmount: number
  encounterOverageAmount: number
  eveeAmount: number
  videoAmount: number
  activeUserCount: number
  encounterCount: number
  breakdown: string
}

interface MonthlyStats {
  revenue: number
  expenses: number
  pendingClaims: number
  orderCount: number
}

interface CompletedOrder {
  services?: Array<{ service?: { price?: number | string | null } | null }>
}

interface ExpenseItem {
  amount?: number | string | null
}

interface BillingRequest {
  id: string
  title: string
  type?: string | null
  amount?: number | null
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

export default function BillingDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: estimate, isLoading: estLoading } = useQuery({
    queryKey: ['billing', 'estimate'],
    queryFn: async () => {
      const res = await api.get('/billing/estimate')
      return res.data as BillingEstimate
    },
  })

  const { data: stats, isLoading: statsLoading } = useQuery<MonthlyStats>({
    queryKey: ['billing', 'monthly-stats'],
    queryFn: async () => {
      // Aggregate from orders + expenses
      const [ordersRes, expensesRes, claimsRes] = await Promise.all([
        api.get('/orders', { params: { status: 'COMPLETED', limit: 100 } }),
        api.get('/expenses', { params: { limit: 100 } }),
        api.get('/claims', { params: { status: 'PENDING' } }),
      ])

      const orders = (ordersRes.data?.data ?? []) as CompletedOrder[]
      const expenses = (expensesRes.data?.data ?? []) as ExpenseItem[]
      const claims = (claimsRes.data?.data ?? []) as unknown[]

      const revenue = orders.reduce((sum, order) =>
        sum + (order.services ?? []).reduce((serviceSum, orderService) =>
          serviceSum + Number(orderService.service?.price ?? 0), 0), 0)
      const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0)

      return {
        revenue,
        expenses: totalExpenses,
        pendingClaims: claims.length,
        orderCount: orders.length,
      }
    },
  })

  const { data: recentRequests } = useQuery({
    queryKey: ['requests', 'pending'],
    queryFn: async () => {
      const res = await api.get('/requests', { params: { status: 'PENDING', limit: 5 } })
      return (res.data?.data ?? []) as BillingRequest[]
    },
  })

  const netIncome = (stats?.revenue ?? 0) - (stats?.expenses ?? 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-subtle">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h2 className="text-2xl font-bold text-ink mt-0.5">{user?.firstName}</h2>
        <p className="text-xs text-subtle mt-1">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={statsLoading ? '—' : naira(stats?.revenue ?? 0)}
          color="text-[#10B981]" bg="bg-[#ECFDF5]" border="border-[#10B981]/20"
        />
        <MetricCard
          icon={TrendingDown}
          label="Monthly Expenses"
          value={statsLoading ? '—' : naira(stats?.expenses ?? 0)}
          color="text-[#EF4444]" bg="bg-[#FEF2F2]" border="border-[#EF4444]/20"
        />
        <MetricCard
          icon={DollarSign}
          label="Net Income"
          value={statsLoading ? '—' : naira(netIncome)}
          color={netIncome >= 0 ? 'text-[#5580F4]' : 'text-[#EF4444]'}
          bg={netIncome >= 0 ? 'bg-[#F0F4FF]' : 'bg-[#FEF2F2]'}
          border={netIncome >= 0 ? 'border-[#5580F4]/20' : 'border-[#EF4444]/20'}
        />
        <MetricCard
          icon={FileText}
          label="Pending Claims"
          value={statsLoading ? '—' : stats?.pendingClaims ?? 0}
          color="text-[#F59E0B]" bg="bg-[#FFFBEB]" border="border-[#F59E0B]/20"
        />
      </div>

      {/* Subscription Status + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Billing Estimate */}
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Current Period</h3>
            <button onClick={() => navigate('/settings/billing')}
              className="text-xs text-[#5580F4] font-medium hover:underline flex items-center gap-1">
              Details <ArrowRight size={12} />
            </button>
          </div>

          {estLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : estimate ? (
            <>
              <p className="text-3xl font-bold text-[#5580F4]">{naira(estimate.totalAmount)}</p>
              <p className="text-xs text-subtle mt-1 mb-4">{estimate.breakdown}</p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-subtle">Users: </span>
                  <span className="font-semibold text-ink">{estimate.activeUserCount}</span>
                </div>
                <div>
                  <span className="text-subtle">Encounters: </span>
                  <span className="font-semibold text-ink">{estimate.encounterCount}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-subtle">No estimate available</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction icon={FileText} label="View All Orders" onClick={() => navigate('/orders')} />
            <QuickAction icon={CreditCard} label="Billing History" onClick={() => navigate('/settings/billing')} />
            <QuickAction icon={Package} label="Request Portal" onClick={() => navigate('/requests')} />
            <QuickAction icon={TrendingUp} label="Services Catalog" onClick={() => navigate('/services')} />
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {recentRequests && recentRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F8]">
            <h3 className="text-sm font-bold text-[#0F172A]">Pending Requests</h3>
            <button onClick={() => navigate('/requests')}
              className="text-xs text-[#5580F4] font-medium hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-[#F8FAFF]">
            {recentRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{req.title}</p>
                  <p className="text-xs text-subtle">{req.type?.replace(/_/g, ' ')}</p>
                </div>
                {req.amount && (
                  <span className="text-sm font-semibold text-[#5580F4]">{naira(req.amount)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  icon: Icon, label, value, color, bg, border,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  bg: string
  border: string
}) {
  return (
    <div className={cn('rounded-2xl border p-4', bg, border)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/70">
          <Icon size={14} className={color} />
        </div>
        <span className="text-xs text-subtle">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                 border border-[#EEF1F8] hover:bg-[#F8FAFF] hover:border-[#5580F4]/30
                 transition-all text-left"
    >
      <Icon size={15} className="text-[#5580F4] shrink-0" />
      <span className="text-sm font-medium text-[#0F172A]">{label}</span>
      <ArrowRight size={13} className="text-[#CBD5E1] ml-auto" />
    </button>
  )
}
