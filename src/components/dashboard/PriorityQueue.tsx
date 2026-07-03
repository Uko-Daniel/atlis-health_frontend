import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, FileText, Clock,
  CheckCircle, ArrowRight,
} from 'lucide-react'
import { getResultsByDepartment } from '@/services/resultService'
import { useAuthStore } from '@/stores/authStore'
import { Skeleton } from '@/components/ui/skeleton'
import type { Result } from '@/types/result'

type Priority = 'critical' | 'warning' | 'info'

interface QueueItem {
  id:       string
  priority: Priority
  patient:  string
  action:   string
  sub:      string
  time:     string
  link:     string
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

const CONFIG: Record<Priority, {
  bar:       string
  iconEl:    React.ElementType
  iconColor: string
  iconBg:    string
  tag:       string
  tagStyle:  string
}> = {
  critical: {
    bar:       'bg-[#EF4444]',
    iconEl:    AlertTriangle,
    iconColor: 'text-[#EF4444]',
    iconBg:    'bg-[#FEF2F2]',
    tag:       'Critical',
    tagStyle:  'bg-[#FEF2F2] text-[#EF4444]',
  },
  warning: {
    bar:       'bg-[#F59E0B]',
    iconEl:    FileText,
    iconColor: 'text-[#F59E0B]',
    iconBg:    'bg-[#FFFBEB]',
    tag:       'Review',
    tagStyle:  'bg-[#FFFBEB] text-[#F59E0B]',
  },
  info: {
    bar:       'bg-[#5580F4]',
    iconEl:    Clock,
    iconColor: 'text-[#5580F4]',
    iconBg:    'bg-[#F0F4FF]',
    tag:       'Pending',
    tagStyle:  'bg-[#F0F4FF] text-[#5580F4]',
  },
}

function QueueRow({ item }: { item: QueueItem }) {
  const navigate = useNavigate()
  const cfg      = CONFIG[item.priority]
  const Icon     = cfg.iconEl

  return (
    <div
      onClick={() => navigate(item.link)}
      className="flex items-start gap-3 px-4 py-3.5 hover:bg-bg
                 cursor-pointer transition-colors group"
    >
      {/* Priority bar */}
      <div className={`w-0.5 self-stretch rounded-full shrink-0 ${cfg.bar}`} />

      {/* Icon */}
      <div className={`flex size-8 shrink-0 items-center justify-center
                       rounded-lg ${cfg.iconBg} mt-0.5`}>
        <Icon size={14} className={cfg.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-ink truncate">
                {item.patient}
              </p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${cfg.tagStyle}`}>
                {cfg.tag}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 truncate">
              {item.action}
            </p>
            {item.sub && (
              <p className="text-xs text-subtle truncate mt-0.5">
                {item.sub}
              </p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="text-xs text-subtle whitespace-nowrap">
              {item.time}
            </span>
            <ArrowRight
              size={13}
              className="text-subtle opacity-0 group-hover:opacity-100
                         transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PriorityQueue() {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const canSeeResults = user &&
    ['DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'ADMIN'].includes(user.role)

  const { data, isLoading } = useQuery({
    queryKey: ['results', 'queue'],
    queryFn:  () => getResultsByDepartment({ status: 'VERIFIED', limit: 10 }),
    enabled:  !!canSeeResults,
  })

  const items: QueueItem[] = (data?.data ?? []).map((r: Result) => ({
    id:       r.id,
    priority: 'warning' as Priority,
    patient:  r.patient
      ? `${r.patient.firstName} ${r.patient.lastName}`
      : 'Unknown Patient',
    action:   `${r.template?.name ?? 'Result'} ready for review`,
    sub:      r.department
      ? r.department.charAt(0) + r.department.slice(1).toLowerCase()
      : '',
    time:     timeAgo(r.updatedAt),
    link:     `/results/${r.id}`,
  }))

  return (
    <div className="bg-white rounded-2xl border border-[#EEF1F8]
                    shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(85,128,244,0.05)]
                    flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4
                      border-b border-bg">
        <div>
          <h3 className="text-sm font-bold text-ink">Priority Queue</h3>
          <p className="text-xs text-subtle mt-0.5">
            Actions requiring your attention
          </p>
        </div>
        {items.length > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full
                           bg-critical text-white text-xs font-bold">
            {items.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-bg">

        {isLoading && (
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-0.5 h-16 rounded-full bg-slate-100" />
                <Skeleton className="size-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-52" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center
                          py-12 text-center px-6">
            <div className="flex size-12 items-center justify-center
                            rounded-2xl bg-success-50 mb-3">
              <CheckCircle size={22} className="text-success" />
            </div>
            <p className="text-sm font-bold text-ink">All clear</p>
            <p className="text-xs text-subtle mt-1">
              No pending actions right now
            </p>
          </div>
        )}

        {!isLoading && items.map((item) => (
          <QueueRow key={item.id} item={item} />
        ))}
      </div>

      {items.length > 0 && (
        <div className="border-t border-bg px-4 py-3">
          <button
            onClick={() => navigate('/results')}
            className="text-xs text-[#5580F4] font-medium
                       hover:underline transition-colors"
          >
            View all results →
          </button>
        </div>
      )}
    </div>
  )
}