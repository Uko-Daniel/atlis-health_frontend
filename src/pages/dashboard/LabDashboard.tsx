import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, CheckCircle, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface WorklistItem {
  id: string
  status: string
  createdAt: string
  patient: { id: string; firstName: string; lastName: string }
  template: { name: string } | null
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export default function LabDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: results, isLoading } = useQuery({
    queryKey: ['results', 'department'],
    queryFn: async () => {
      const res = await api.get('/results/department', { params: { limit: 20 } })
      return (res.data?.data ?? []) as WorklistItem[]
    },
  })

  const pending = (results ?? []).filter((r) => r.status === 'PENDING')
  const verified = (results ?? []).filter((r) => r.status === 'VERIFIED')
  const finalized = (results ?? []).filter((r) => r.status === 'FINALIZED')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-medium text-subtle">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h2 className="text-2xl font-bold text-ink mt-0.5">{user?.firstName}</h2>
        <p className="text-xs text-subtle mt-1">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Clock} label="Pending" value={pending.length} color="text-[#F59E0B]" bg="bg-[#FFFBEB]" />
        <StatCard icon={CheckCircle} label="Verified" value={verified.length} color="text-[#5580F4]" bg="bg-[#F0F4FF]" />
        <StatCard icon={FlaskConical} label="Finalized" value={finalized.length} color="text-[#10B981]" bg="bg-[#ECFDF5]" />
      </div>

      <ButtonPill variant="primary" icon={FlaskConical} onClick={() => navigate('/worklist')}>Open Worklist</ButtonPill>

      <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
          <h3 className="text-sm font-bold text-[#0F172A]">Recent Results</h3>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 rounded-xl" />))}</div>
        ) : (
          <div className="divide-y divide-[#F8FAFF]">
            {(results ?? []).slice(0, 10).map((r) => {
              const name = `${r.patient.firstName} ${r.patient.lastName}`
              return (
                <div key={r.id} onClick={() => navigate(`/results/${r.id}`)}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#F8FAFF] cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{name}</p>
                      <p className="text-xs text-subtle">{r.template?.name ?? 'Result'} · {fmtDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <StatusBadge value={r.status} label={r.status.charAt(0) + r.status.slice(1).toLowerCase()} />
                </div>
              )
            })}
            {(results ?? []).length === 0 && (
              <div className="p-8 text-center"><p className="text-sm text-subtle">No results yet</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className={cn('rounded-2xl border p-4', bg, 'border-transparent')}>
      <div className="flex items-center gap-2 mb-2"><div className="flex size-8 items-center justify-center rounded-lg bg-white/70"><Icon size={14} className={color} /></div><span className="text-xs text-subtle">{label}</span></div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </div>
  )
}