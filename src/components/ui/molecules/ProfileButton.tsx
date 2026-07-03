import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, User, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface ProfileButtonProps {
  className?: string
}

export function ProfileButton({ className }: ProfileButtonProps) {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const fullName  = user
    ? `${user.firstName} ${user.lastName}`
    : 'Unknown User'

  const roleLabel = user?.role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ') ?? ''

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2.5 rounded-full',
            'border border-slate-200 bg-white',
            'pl-1 pr-3 py-1',
            'hover:bg-slate-50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-indigo-300',
            className,
          )}
        >
          <Avatar name={fullName} size="sm" />
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate max-w-24">
              {user?.firstName}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-24">
              {roleLabel}
            </p>
          </div>
          <ChevronDown size={13} className="text-slate-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 rounded-2xl border-slate-200 shadow-lg p-1.5"
      >
        {/* User info header */}
        <DropdownMenuLabel className="px-2 py-2">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {fullName}
          </p>
          <p className="text-xs text-slate-400 truncate font-normal">
            {user?.email}
          </p>
          <p className="text-xs text-indigo-500 mt-0.5 font-normal">
            {roleLabel}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-slate-100" />

        <DropdownMenuItem
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 rounded-xl px-2 py-2
                     text-sm text-slate-700 cursor-pointer"
        >
          <User size={14} className="text-slate-400" />
          My Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 rounded-xl px-2 py-2
                     text-sm text-slate-700 cursor-pointer"
        >
          <Settings size={14} className="text-slate-400" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-100" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-xl px-2 py-2
                     text-sm text-red-600 cursor-pointer
                     focus:bg-red-50 focus:text-red-600"
        >
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}