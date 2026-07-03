import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavigationPillProps {
  label:      string
  path:       string
  icon:       LucideIcon
  collapsed?: boolean
  badge?:     number
  onClick?:   () => void
}

export function NavigationPill({
  label,
  path,
  icon: Icon,
  collapsed = false,
  badge,
  onClick,
}: NavigationPillProps) {
  const link = (
    <NavLink
      to={path}
      onClick={onClick}
      className="block w-full"
    >
      {({ isActive }) => (
        <span
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5',
            'text-sm font-medium transition-all duration-150 relative',
            collapsed && 'justify-center px-2.5',
            isActive
                ? 'bg-p-100 text-p-500'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
          )}
        >
          <Icon
            size={18}
            className={cn(
              'shrink-0',
              isActive ? 'text-p-500' : 'text-slate-400',
            )}
          />

          {!collapsed && (
            <span className="truncate flex-1">{label}</span>
          )}

          {badge !== undefined && badge > 0 && (
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full',
                'bg-red-500 text-white text-xs font-bold leading-none',
                'min-w-4.5 h-4.5 px-1',
                collapsed
                  ? 'absolute -top-0.5 -right-0.5'
                  : 'ml-auto',
              )}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
      )}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="ml-1.5 text-red-400">({badge})</span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}