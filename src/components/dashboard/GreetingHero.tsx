import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getAllEncounters } from '@/services/encounterService'
import { Skeleton } from '@/components/ui/skeleton'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function isToday(d: string): boolean {
  const now  = new Date()
  const date = new Date(d)
  return (
    date.getDate()     === now.getDate()     &&
    date.getMonth()    === now.getMonth()    &&
    date.getFullYear() === now.getFullYear()
  )
}

interface MetricCardProps {
  icon:      React.ElementType
  value:     string | number
  label:     string
  color:     string
  bg:        string
  border:    string
  onClick:   () => void
  loading?:  boolean
}

function MetricCard({
  icon: Icon, value, label,
  color, bg, border, onClick, loading,
}: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border
                  transition-all duration-150 hover:scale-[1.02]
                  hover:shadow-md group ${bg} ${border}`}
    >
      <div className={`flex size-9 shrink-0 items-center justify-center
                       rounded-xl bg-white/70 shadow-sm`}>
        <Icon size={17} className={color} />
      </div>
      <div className="text-left">
        {loading
          ? <Skeleton className="h-7 w-8 mb-0.5" />
          : <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
        }
        <p className={`text-xs font-medium mt-1 opacity-70 ${color}`}>{label}</p>
      </div>
    </button>
  )
}

export default function GreetingHero() {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['encounters', 'hero'],
    queryFn:  () => getAllEncounters({ limit: 100 }),
  })

  const todayCount = (data?.data ?? []).filter((e) => isToday(e.startTime)).length

  const doctorTitle = user?.role === 'DOCTOR'
    ? `Dr. ${user.firstName}`
    : user?.firstName ?? ''

  const dateLabel = new Date().toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="flex items-center justify-between gap-6 flex-wrap">

      {/* Greeting */}
      <div>
        <p className="text-sm font-medium text-subtle">
          {getGreeting()},
        </p>
        <h2 className="text-2xl font-bold text-ink mt-0.5 leading-tight">
          {doctorTitle}
        </h2>
        <p className="text-xs text-subtle mt-1">{dateLabel}</p>
      </div>

      {/* Hero metrics */}
      <div className="flex items-center gap-3 flex-wrap">
        <MetricCard
          icon    ={Users}
          value   ={isLoading ? '—' : todayCount}
          label   ="Today's Patients"
          color   ="text-[#5580F4]"
          bg      ="bg-[#F0F4FF]"
          border  ="border-[#5580F4]/15"
          onClick ={() => navigate('/appointments')}
          loading ={isLoading}
        />
        <MetricCard
          icon    ={FileText}
          value   ="—"
          label   ="Pending Results"
          color   ="text-[#F59E0B]"
          bg      ="bg-[#FFFBEB]"
          border  ="border-[#F59E0B]/20"
          onClick ={() => navigate('/results')}
        />
        <MetricCard
          icon    ={AlertTriangle}
          value   ="0"
          label   ="Critical Alerts"
          color   ="text-[#EF4444]"
          bg      ="bg-[#FEF2F2]"
          border  ="border-[#EF4444]/15"
          onClick ={() => navigate('/patients')}
        />
      </div>
    </div>
  )
}