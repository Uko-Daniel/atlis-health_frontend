import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users, Activity, DollarSign, FileText,
  UserCog, ArrowRight, Package,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface EncounterSummary {
  startTime: string
}

function naira(n: number | undefined | null) {
  if (n == null) return '₦0'
  return `₦${n.toLocaleString('en-NG')}`
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: staffCount } = useQuery({
    queryKey: ['staff', 'count'],
    queryFn: async () => {
      const res = await api.get('/staff')
      return (res.data ?? []).length
    },
  })

  const { data: patientCount } = useQuery({
    queryKey: ['patients', 'count'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 1 } })
      return res.data?.total ?? 0
    },
  })

  const { data: todayEncounters } = useQuery({
    queryKey: ['encounters', 'count-today'],
    queryFn: async () => {
      const res = await api.get('/encounters', { params: { limit: 100 } })
      const encounters = (res.data?.data ?? []) as EncounterSummary[]
      const today = encounters.filter((e) => {
        const d = new Date(e.startTime)
        const now = new Date()
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      return today.length
    },
  })

  const { data: revenue } = useQuery({
    queryKey: ['billing', 'estimate'],
    queryFn: async () => {
      try {
        const res = await api.get('/billing/estimate')
        return res.data?.totalAmount ?? 0
      } catch {
        return 0
      }
    },
  })

  const { data: lowStock } = useQuery({
    queryKey: ['inventory', 'low-stock-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/inventory/low-stock')
        return (res.data ?? []).length
      } catch { return 0 }
    },
  })

  const { data: pendingRequests } = useQuery({
    queryKey: ['requests', 'pending-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/requests', { params: { status: 'PENDING', limit: 1 } })
        return res.data?.total ?? 0
      } catch { return 0 }
    },
  })

  return (
    
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-medium text-subtle">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h2 className="text-2xl font-bold text-ink mt-0.5">{user?.firstName}</h2>
        <p className="text-xs text-subtle mt-1">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard icon={Users} label="Staff" value={staffCount ?? '—'} color="text-[#5580F4]" bg="bg-[#F0F4FF]" onClick={() => navigate('/staff')} />
        <KpiCard icon={Activity} label="Patients" value={patientCount ?? '—'} color="text-[#10B981]" bg="bg-[#ECFDF5]" onClick={() => navigate('/patients')} />
        <KpiCard icon={FileText} label="Today's Encounters" value={todayEncounters ?? '—'} color="text-[#9B6DFF]" bg="bg-[#F5F0FF]" onClick={() => navigate('/appointments')} />
        <KpiCard icon={DollarSign} label="Monthly Estimate" value={naira(revenue)} color="text-[#F59E0B]" bg="bg-[#FFFBEB]" onClick={() => navigate('/settings/billing')} />
        <KpiCard icon={Package} label="Low Stock Items" value={lowStock ?? 0} color="text-[#EF4444]" bg="bg-[#FEF2F2]" onClick={() => {}} />
        <KpiCard icon={UserCog} label="Pending Requests" value={pendingRequests ?? 0} color="text-[#0ACDBA]" bg="bg-[#ECFDFD]" onClick={() => navigate('/requests-portal')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <QuickLink label="Manage Staff" icon={Users} onClick={() => navigate('/staff')} />
        <QuickLink label="Services & Templates" icon={FileText} onClick={() => navigate('/services')} />
        <QuickLink label="Billing History" icon={DollarSign} onClick={() => navigate('/settings/billing')} />
        <QuickLink label="Request Portal" icon={UserCog} onClick={() => navigate('/requests-portal')} />
        <QuickLink label="Orders" icon={Package} onClick={() => navigate('/orders')} />
        <QuickLink label="Staff Permissions" icon={Activity} onClick={() => navigate('/settings/permissions')} />
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, bg, onClick }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bg: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={cn('rounded-2xl border p-4 text-left hover:shadow-md transition-all', bg, 'border-transparent')}>
      <div className="flex items-center gap-2 mb-2"><div className="flex size-8 items-center justify-center rounded-lg bg-white/70"><Icon size={14} className={color} /></div><span className="text-xs text-subtle">{label}</span></div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </button>
  )
}

function QuickLink({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-[#EEF1F8] bg-white
                 hover:bg-[#F8FAFF] hover:border-[#5580F4]/30 transition-all text-left shadow-sm">
      <Icon size={16} className="text-[#5580F4] shrink-0" />
      <span className="text-sm font-medium text-[#0F172A]">{label}</span>
      <ArrowRight size={14} className="text-[#CBD5E1] ml-auto" />
    </button>
  )
}
