import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Activity, Heart, Pill, Users } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ActiveEncounter {
  id: string
  type: string
  startTime: string
  stopTime?: string | null  // ← add this
  chiefComplaint: string | null
  patient: { id: string; firstName: string; lastName: string; dob: string }
}

interface ActiveMedication {
  id: string
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

export default function NurseDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: encounters, isLoading } = useQuery({
    queryKey: ['encounters', 'active-today'],
    queryFn: async () => {
      const res = await api.get('/encounters', { params: { limit: 50 } })
      return (res.data?.data ?? []) as ActiveEncounter[]
    },
  })

  const activeEncounters = (encounters ?? []).filter((e) => !e.stopTime)

  const { data: meds } = useQuery({
    queryKey: ['medications', 'active-count'],
    queryFn: async () => {
      const res = await api.get('/medications/active')
      return res.data as ActiveMedication[]
    },
  })

  const todayEncounters = (encounters ?? []).filter((e) => {
    const d = new Date(e.startTime)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Active Encounters" value={activeEncounters.length} color="text-[#5580F4]" bg="bg-[#F0F4FF]" />
        <StatCard icon={Heart} label="Vitals Due" value={activeEncounters.length} color="text-[#EF4444]" bg="bg-[#FEF2F2]" />
        <StatCard icon={Pill} label="Meds to Administer" value={meds?.length ?? 0} color="text-[#F59E0B]" bg="bg-[#FFFBEB]" />
        <StatCard icon={Activity} label="Today's Patients" value={todayEncounters.length} color="text-[#10B981]" bg="bg-[#ECFDF5]" />
      </div>

      <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
          <h3 className="text-sm font-bold text-[#0F172A]">Active Patients</h3>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 rounded-xl" />))}</div>
        ) : (
          <div className="divide-y divide-[#F8FAFF]">
            {activeEncounters.slice(0, 10).map((enc) => {
              const name = `${enc.patient.firstName} ${enc.patient.lastName}`
              return (
                <div key={enc.id} onClick={() => navigate(`/encounters/${enc.id}`)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFF] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{name}</p>
                      <p className="text-xs text-subtle">{enc.chiefComplaint ?? enc.type} · Started {fmtTime(enc.startTime)}</p>
                    </div>
                  </div>
                  <ButtonPill variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${enc.patient.id}/vitals`) }}>
                    Record Vitals
                  </ButtonPill>
                </div>
              )
            })}
            {activeEncounters.length === 0 && (
              <div className="p-8 text-center"><p className="text-sm text-subtle">No active patients</p></div>
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
