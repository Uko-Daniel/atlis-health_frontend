import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, Calendar, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface AppointmentRow {
  id: string
  type: string
  startTime: string
  stopTime?: string | null  // ← add this
  chiefComplaint: string | null
  patient: { id: string; firstName: string; lastName: string }
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

export default function ReceptionistDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: encounters, isLoading } = useQuery({
    queryKey: ['encounters', 'today-reception'],
    queryFn: async () => {
      const res = await api.get('/encounters', { params: { limit: 50 } })
      return (res.data?.data ?? []) as AppointmentRow[]
    },
  })

  const today = (encounters ?? []).filter((e) => {
    const d = new Date(e.startTime)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const checkedIn = today.filter((e) => !e.stopTime).length
  const upcoming = today.filter((e) => {
    return new Date(e.startTime) > new Date()
  }).length

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
        <StatCard icon={Calendar} label="Today's Appointments" value={today.length} color="text-[#5580F4]" bg="bg-[#F0F4FF]" />
        <StatCard icon={Clock} label="Checked In" value={checkedIn} color="text-[#10B981]" bg="bg-[#ECFDF5]" />
        <StatCard icon={Users} label="Upcoming" value={upcoming} color="text-[#F59E0B]" bg="bg-[#FFFBEB]" />
      </div>

      <div className="flex gap-3">
        <ButtonPill variant="primary" icon={UserPlus} onClick={() => navigate('/patients/new')}>Register Patient</ButtonPill>
        <ButtonPill variant="outline" icon={Calendar} onClick={() => navigate('/appointments')}>New Appointment</ButtonPill>
      </div>

      <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
          <h3 className="text-sm font-bold text-[#0F172A]">Today's Schedule</h3>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-14 rounded-xl" />))}</div>
        ) : (
          <div className="divide-y divide-[#F8FAFF] max-h-96 overflow-y-auto">
            {today.map((appt) => {
              const name = `${appt.patient.firstName} ${appt.patient.lastName}`
              const isPast = new Date(appt.startTime) < new Date()
              return (
                <div key={appt.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{name}</p>
                      <p className="text-xs text-subtle">{appt.chiefComplaint ?? appt.type} · {fmtTime(appt.startTime)}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                    isPast ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F0F4FF] text-[#5580F4]')}>
                    {isPast ? 'Arrived' : 'Upcoming'}
                  </span>
                </div>
              )
            })}
            {today.length === 0 && (
              <div className="p-8 text-center"><p className="text-sm text-subtle">No appointments today</p></div>
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