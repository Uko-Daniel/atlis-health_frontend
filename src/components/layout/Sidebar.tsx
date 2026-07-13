import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore }  from '@/stores/authStore'
import { useUIStore }    from '@/stores/uiStore'
import { useTenantStore } from '@/hooks/useTenant'
import { NAV_ITEMS }     from './navConfig'
import { Avatar }        from '@/components/ui/atoms/Avatar'
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'

export default function Sidebar() {
  const user             = useAuthStore((s) => s.user)
  const clearAuth        = useAuthStore((s) => s.clearAuth)
  const sidebarOpen      = useUIStore((s) => s.sidebarOpen)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const setSidebarOpen   = useUIStore((s) => s.setSidebarOpen)
  const toggleCollapsed  = useUIStore((s) => s.toggleSidebarCollapsed)
  const navigate         = useNavigate()

  const themeColor = useTenantStore((s) => s.themePrimaryColor) ?? '#5580F4'
  const logoUrl = useTenantStore((s) => s.logoUrl)
  const facilityName = useTenantStore((s) => s.facilityName) ?? 'Atlis Health'

  const handleLogout = () => { clearAuth(); navigate('/login', { replace: true }) }

  const visible = NAV_ITEMS.filter(
    (item) => user && item.allowedRoles.includes(user.role),
  )

  const fullName  = user ? `${user.firstName} ${user.lastName}` : ''
  const roleLabel = user?.role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ') ?? ''

  return (
    <TooltipProvider delayDuration={0}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-white',
        'border-r border-[#EEF1F8]',
        'transition-all duration-200 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-18' : 'lg:w-55',
        'w-55',
      )}>
        {/* ── Logo ── */}
        <div className={cn(
          'flex h-16 shrink-0 items-center border-b border-[#EEF1F8]',
          sidebarCollapsed ? 'justify-center' : 'px-5 gap-3',
        )}>
          <img src={logoUrl ?? '/atlis-icon.svg'} className="h-7 w-auto" />
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-ink truncate">
              {facilityName}
            </span>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
          {visible.map((item) => {
            const Icon = item.icon

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => cn(
                        'flex items-center justify-center rounded-xl p-2.5 transition-all',
                        isActive
                          ? 'text-white'
                          : 'text-subtle hover:bg-bg hover:text-[#64748B]',
                      )}
                      style={({ isActive }) =>
                        isActive ? { backgroundColor: themeColor } : {}
                      }
                    >
                      {({ isActive }) => (
                        <Icon size={18} className={cn(
                          'shrink-0',
                          isActive ? 'text-white' : 'text-subtle',
                        )} />
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5',
                  'text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'text-[#64748B] hover:bg-bg hover:text-ink',
                )}
                style={({ isActive }) =>
                  isActive ? { backgroundColor: themeColor } : {}
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} className={cn(
                      'shrink-0',
                      isActive ? 'text-white' : 'text-subtle',
                    )} />
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-[#EEF1F8] p-2.5 space-y-1">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl
                            hover:bg-bg transition-colors group">
              <Avatar name={fullName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink truncate">
                  {fullName}
                </p>
                <p className="text-xs text-subtle truncate">{roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="text-subtle hover:text-critical transition-colors
                           opacity-0 group-hover:opacity-100 shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          <button
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:flex w-full items-center gap-2 rounded-xl px-3 py-2',
              'text-xs text-subtle hover:bg-bg hover:text-[#64748B]',
              'transition-colors',
              sidebarCollapsed && 'justify-center',
            )}
          >
            {sidebarCollapsed
              ? <ChevronRight size={14} />
              : <><ChevronLeft size={14} /> <span>Collapse</span></>
            }
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}