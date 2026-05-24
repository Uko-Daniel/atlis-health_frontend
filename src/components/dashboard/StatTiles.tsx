import { Users, ClipboardList, FileText, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label:     string
  value:     string | number
  icon:      React.ReactNode
  iconBg:    string
  iconColor: string
  sub?:      string
}

function StatTile({ label, value, icon, iconBg, iconColor, sub }: StatTileProps) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            {sub && (
              <p className="text-xs text-slate-400">{sub}</p>
            )}
          </div>
          <div className={cn('flex size-10 items-center justify-center rounded-lg', iconBg)}>
            <span className={iconColor}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Role-aware tile sets — mock values, wired to real API later
function useTiles() {
  const user = useAuthStore((s) => s.user)

  if (!user) return []

  const role = user.role

  if (role === 'DOCTOR' || role === 'NURSES') {
    return [
      {
        label:      "Today's Patients",
        value:      24,
        sub:        '3 waiting',
        icon:       <Users size={18} />,
        iconBg:     'bg-blue-50',
        iconColor:  'text-blue-600',
      },
      {
        label:      'Pending Orders',
        value:      8,
        sub:        '2 urgent',
        icon:       <ClipboardList size={18} />,
        iconBg:     'bg-amber-50',
        iconColor:  'text-amber-600',
      },
      {
        label:      'Results Ready',
        value:      5,
        sub:        'Awaiting review',
        icon:       <FileText size={18} />,
        iconBg:     'bg-emerald-50',
        iconColor:  'text-emerald-600',
      },
      {
        label:      'Critical Alerts',
        value:      1,
        sub:        'Requires action',
        icon:       <ShieldAlert size={18} />,
        iconBg:     'bg-red-50',
        iconColor:  'text-red-600',
      },
    ]
  }

  if (role === 'LAB_TECH' || role === 'RADIOLOGIST') {
    return [
      {
        label:      'Pending Orders',
        value:      12,
        sub:        'In your queue',
        icon:       <ClipboardList size={18} />,
        iconBg:     'bg-blue-50',
        iconColor:  'text-blue-600',
      },
      {
        label:      'In Progress',
        value:      3,
        sub:        'Being processed',
        icon:       <FileText size={18} />,
        iconBg:     'bg-amber-50',
        iconColor:  'text-amber-600',
      },
      {
        label:      'Completed Today',
        value:      18,
        sub:        'Results released',
        icon:       <FileText size={18} />,
        iconBg:     'bg-emerald-50',
        iconColor:  'text-emerald-600',
      },
      {
        label:      'Awaiting Verify',
        value:      4,
        sub:        'Pending sign-off',
        icon:       <ShieldAlert size={18} />,
        iconBg:     'bg-violet-50',
        iconColor:  'text-violet-600',
      },
    ]
  }

  if (role === 'RECEPTIONIST') {
    return [
      {
        label:      "Today's Patients",
        value:      31,
        sub:        'Registered today',
        icon:       <Users size={18} />,
        iconBg:     'bg-blue-50',
        iconColor:  'text-blue-600',
      },
      {
        label:      'Pending Orders',
        value:      14,
        sub:        'Awaiting processing',
        icon:       <ClipboardList size={18} />,
        iconBg:     'bg-amber-50',
        iconColor:  'text-amber-600',
      },
    ]
  }

  // ADMIN / MANAGER / default — system overview
  return [
    {
      label:      'Total Patients',
      value:      '1,204',
      sub:        'Registered in system',
      icon:       <Users size={18} />,
      iconBg:     'bg-blue-50',
      iconColor:  'text-blue-600',
    },
    {
      label:      'Orders Today',
      value:      47,
      sub:        '12 pending',
      icon:       <ClipboardList size={18} />,
      iconBg:     'bg-amber-50',
      iconColor:  'text-amber-600',
    },
    {
      label:      'Results Today',
      value:      39,
      sub:        '5 awaiting verify',
      icon:       <FileText size={18} />,
      iconBg:     'bg-emerald-50',
      iconColor:  'text-emerald-600',
    },
    {
      label:      'Critical Alerts',
      value:      2,
      sub:        'Across all patients',
      icon:       <ShieldAlert size={18} />,
      iconBg:     'bg-red-50',
      iconColor:  'text-red-600',
    },
  ]
}

export default function StatTiles() {
  const tiles = useTiles()

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </div>
  )
}