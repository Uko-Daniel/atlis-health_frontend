import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface Notification {
  id:        string
  title:     string
  body:      string
  type:      string
  read:      boolean
  link?:     string
  createdAt: string
}

interface NotificationButtonProps {
  notifications:  Notification[]
  onMarkRead:     (id: string) => void
  onMarkAllRead:  () => void
  className?:     string
}

const TYPE_COLORS: Record<string, string> = {
  RESULT_READY:    'bg-blue-100 text-blue-600',
  CRITICAL_ALERT:  'bg-red-100 text-red-600',
  TASK:            'bg-violet-100 text-violet-600',
  APPOINTMENT:     'bg-emerald-100 text-emerald-600',
  DEFAULT:         'bg-slate-100 text-slate-500',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationButton({
  notifications,
  onMarkRead,
  onMarkAllRead,
  className,
}: NotificationButtonProps) {
  const navigate  = useNavigate()
  const unread    = notifications.filter((n) => !n.read).length

  const handleClick = (n: Notification) => {
    if (!n.read) onMarkRead(n.id)
    if (n.link)  navigate(n.link)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          className={cn(
            'relative flex size-9 items-center justify-center rounded-full',
            'bg-white border border-slate-200',
            'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
            'transition-colors focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-indigo-300',
            className,
          )}
        >
          <Bell size={17} />
          {unread > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'rounded-full bg-red-500 text-white text-xs font-bold leading-none',
                unread > 9 ? 'size-5 text-xs' : 'size-4 text-xs',
              )}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 rounded-2xl shadow-lg border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3
                        border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">
            Notifications
            {unread > 0 && (
              <span className="ml-1.5 text-xs text-indigo-600 font-normal">
                {unread} new
              </span>
            )}
          </h3>
          {unread > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs text-indigo-600
                         hover:text-indigo-800 transition-colors font-medium"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center
                            py-10 text-center">
              <Bell size={24} className="text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No notifications</p>
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                'flex items-start gap-3 px-4 py-3.5 cursor-pointer',
                'transition-colors hover:bg-slate-50',
                !n.read && 'bg-indigo-50/40',
              )}
            >
              {/* Type dot */}
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center',
                  'rounded-full text-xs mt-0.5',
                  TYPE_COLORS[n.type] ?? TYPE_COLORS.DEFAULT,
                )}
              >
                <Bell size={13} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn(
                    'text-sm leading-snug truncate',
                    n.read ? 'text-slate-600 font-normal' : 'text-slate-800 font-medium',
                  )}>
                    {n.title}
                  </p>
                  {n.link && (
                    <ExternalLink size={12} className="text-slate-300 shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                  {n.body}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {timeAgo(n.createdAt)}
                </p>
              </div>

              {/* Unread indicator */}
              {!n.read && (
                <span className="size-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs text-indigo-600 hover:text-indigo-800
                         font-medium transition-colors"
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}