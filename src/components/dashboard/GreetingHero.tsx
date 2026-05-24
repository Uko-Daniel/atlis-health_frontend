import { useAuthStore } from '@/stores/authStore'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function GreetingHero() {
  const user = useAuthStore((s) => s.user)
  const name = user ? `${user.firstName} ${user.lastName}`.toUpperCase() : ''

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800">
        {getGreeting()},{' '}
        <span className="font-bold">{name}</span>
      </h2>
    </div>
  )
}