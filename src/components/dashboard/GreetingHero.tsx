import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { CalendarPlus } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })
}

export default function GreetingHero() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          {getGreeting()},{' '}
          <span className="text-blue-600">{user?.firstName}!</span>
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">{getFormattedDate()}</p>
      </div>

      {/* Role-aware CTA */}
      {(user?.role === 'DOCTOR' || user?.role === 'NURSES') && (
        <Button className="bg-slate-900 hover:bg-slate-700 text-white gap-2">
          <CalendarPlus size={16} />
          New Encounter
        </Button>
      )}
      {user?.role === 'RECEPTIONIST' && (
        <Button className="bg-slate-900 hover:bg-slate-700 text-white gap-2">
          <CalendarPlus size={16} />
          Register Patient
        </Button>
      )}
    </div>
  )
}