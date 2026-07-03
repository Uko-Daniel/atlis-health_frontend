import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton }   from '@/components/ui/skeleton'
import type { Notification } from '@/components/ui/molecules/NotificationButton'

interface NotifTableProps {
  data:          Notification[]
  isLoading?:    boolean
  onMarkRead:    (id: string) => void
  onMarkAllRead: () => void
  className?:    string
}

const TYPE_COLORS: Record<string, string> = {
  RESULT_READY:   'bg-blue-100 text-blue-600',
  CRITICAL_ALERT: 'bg-red-100 text-red-600',
  TASK:           'bg-violet-100 text-violet-600',
  APPOINTMENT:    'bg-emerald-100 text-emerald-600',
  DEFAULT:        'bg-slate-100 text-slate-500',
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Group by date label
function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
  const groups: Record<string, Notification[]> = {}
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  items.forEach((n) => {
    const d     = new Date(n.createdAt)
    const ds    = d.toDateString()
    const label = ds === today
      ? 'Today'
      : ds === yesterday
      ? 'Yesterday'
      : d.toLocaleDateString('en-NG', { weekday: 'long', day: '2-digit', month: 'short' })

    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  })

  return Object.entries(groups).map(([label, items]) => ({ label, items }))
}

export function NotifTable({
  data,
  isLoading,
  onMarkRead,
  onMarkAllRead,
  className,
}: NotifTableProps) {
  const navigate  = useNavigate()
  const unread    = data.filter((n) => !n.read).length
  const grouped   = groupByDate(data)

  return (
    <div className={cn(
      'flex flex-col bg-white rounded-2xl border border-slate-200',
      'shadow-sm overflow-hidden',
      className,
    )}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Notifications
          </h3>
          {unread > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {unread} unread
            </p>
          )}
        </div>
        {unread > 0 && (
          <ButtonPill
            variant="subtle"
            size="xs"
            icon={CheckCheck}
            onClick={onMarkAllRead}
          >
            Mark all read
          </ButtonPill>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading */}
        {isLoading && (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <Skeleton className="size-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center
                            rounded-full bg-slate-100 mb-3">
              <Inbox size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              All caught up
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              No notifications to show
            </p>
          </div>
        )}

        {/* Grouped rows */}
        {!isLoading && grouped.map(({ label, items }) => (
          <div key={label}>
            {/* Date group header */}
            <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm
                            px-5 py-2 border-y border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
              </p>
            </div>

            {/* Group items */}
            <div className="divide-y divide-slate-50">
              {items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) onMarkRead(n.id)
                    if (n.link) navigate(n.link)
                  }}
                  className={cn(
                    'flex items-start gap-3.5 px-5 py-4 cursor-pointer',
                    'transition-colors hover:bg-slate-50',
                    !n.read && 'bg-indigo-50/30',
                  )}
                >
                  {/* Icon */}
                  <span className={cn(
                    'flex size-9 shrink-0 items-center justify-center',
                    'rounded-full text-xs',
                    TYPE_COLORS[n.type] ?? TYPE_COLORS.DEFAULT,
                  )}>
                    <Bell size={15} />
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm leading-snug',
                      n.read
                        ? 'text-slate-600 font-normal'
                        : 'text-slate-800 font-semibold',
                    )}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span className="size-2 rounded-full bg-indigo-500
                                     shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}