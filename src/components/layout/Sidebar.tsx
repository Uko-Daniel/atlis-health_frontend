import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { NAV_ITEMS } from './navConfig'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function Sidebar() {
  const user               = useAuthStore((s) => s.user)
  const clearAuth          = useAuthStore((s) => s.clearAuth)
  const sidebarOpen        = useUIStore((s) => s.sidebarOpen)
  const sidebarCollapsed   = useUIStore((s) => s.sidebarCollapsed)
  const setSidebarOpen     = useUIStore((s) => s.setSidebarOpen)
  const toggleCollapsed    = useUIStore((s) => s.toggleSidebarCollapsed)
  const navigate           = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  )

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '??'

  const fullName = user ? `${user.firstName} ${user.lastName}` : ''

  const roleLabel = user?.role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ') ?? ''

  return (
    <TooltipProvider delayDuration={0}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-200',
          'transition-all duration-200 ease-in-out',
          // Mobile: slide in/out
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          // Desktop: full or collapsed
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-60',
          // Mobile always full width when open
          'w-60',
        )}
      >

        {/* ── Logo + collapse toggle ── */}
        <div className={cn(
          'flex h-16 shrink-0 items-center border-b border-slate-200',
          sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4',
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              {/* Logo placeholder */}
             <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-5">
                <img src="/logo.svg" className="h-7 w-auto" />
             </div>
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:flex items-center justify-center rounded-md p-1.5',
              'text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors',
              sidebarCollapsed && 'mx-auto',
            )}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed
              ? <ChevronRight size={16} />
              : <ChevronLeft size={16} />
            }
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {visibleItems.map((item) => (
            sidebarCollapsed
              ? (
                // Icon-only with tooltip
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-center rounded-md p-2.5 transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <item.icon
                          size={18}
                          className={cn(
                            'shrink-0',
                            isActive ? 'text-blue-600' : 'text-slate-400',
                          )}
                        />
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
              : (
                // Full label
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={17}
                        className={cn(
                          'shrink-0',
                          isActive ? 'text-blue-600' : 'text-slate-400',
                        )}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              )
          ))}
        </nav>

        {/* ── User block + logout ── */}
        <div className="shrink-0 border-t border-slate-200 p-2 space-y-0.5">
          {sidebarCollapsed
            ? (
              // Collapsed — avatar + logout icons only
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center rounded-md p-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold select-none">
                        {initials}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{fullName}</p>
                    <p className="text-xs text-slate-400">{roleLabel}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center rounded-md p-2.5
                                 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <LogOut size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign out</TooltipContent>
                </Tooltip>
              </>
            )
            : (
              // Expanded — full user row + logout label
              <>
                <div className="flex items-center gap-3 rounded-md px-3 py-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold select-none">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm
                             text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={16} className="shrink-0" />
                  Sign out
                </button>
              </>
            )
          }
        </div>

      </aside>
    </TooltipProvider>
  )
}