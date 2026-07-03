import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InfoPill } from '@/components/ui/atoms/InfoPill'
import { GraphRenderer, type GraphConfig } from '@/components/ui/molecules/GraphRenderer'
import { Skeleton } from '@/components/ui/skeleton'

type InfoCardSize   = 'sm' | 'md' | 'lg'
type InfoCardAccent = 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'violet' | 'slate'

export interface InfoCardProps {
  title:       string
  value:       string | number
  subtitle?:   string

  // Trend pill
  trend?:      number           // delta value for InfoPill
  trendUnit?:  string
  trendLabel?: string
  trendInvert?: boolean         // lower is better

  // Icon
  icon?:       LucideIcon
  iconAccent?: InfoCardAccent

  // Sparkline — optional mini graph
  graph?:      Omit<GraphConfig, 'height'> & { height?: number }

  // Interaction
  onClick?:    () => void

  // State
  isLoading?:  boolean

  size?:       InfoCardSize
  className?:  string
}

const ACCENT_CLASSES: Record<InfoCardAccent, { bg: string; text: string; ring: string }> = {
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  ring: 'ring-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'ring-amber-100'  },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     ring: 'ring-red-100'    },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-100'   },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  ring: 'ring-violet-100' },
  slate:   { bg: 'bg-slate-100',  text: 'text-slate-500',   ring: 'ring-slate-100'  },
}

const SIZE_CLASSES: Record<InfoCardSize, {
  card:     string
  title:    string
  value:    string
  icon:     string
  iconSize: number
}> = {
  sm: {
    card:     'p-4',
    title:    'text-xs',
    value:    'text-2xl',
    icon:     'size-8',
    iconSize: 15,
  },
  md: {
    card:     'p-5',
    title:    'text-xs',
    value:    'text-3xl',
    icon:     'size-10',
    iconSize: 18,
  },
  lg: {
    card:     'p-6',
    title:    'text-sm',
    value:    'text-4xl',
    icon:     'size-12',
    iconSize: 22,
  },
}

export function InfoCard({
  title,
  value,
  subtitle,
  trend,
  trendUnit = '%',
  trendLabel,
  trendInvert,
  icon: Icon,
  iconAccent = 'indigo',
  graph,
  onClick,
  isLoading = false,
  size = 'md',
  className,
}: InfoCardProps) {
  const s       = SIZE_CLASSES[size]
  const accent  = ACCENT_CLASSES[iconAccent]
  const isClickable = !!onClick

  if (isLoading) {
    return (
      <div className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm',
        s.card,
        className,
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="size-10 rounded-xl shrink-0" />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm',
        'flex flex-col gap-3',
        s.card,
        isClickable && 'cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200',
        className,
      )}
    >
      {/* Top row — title + icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn(
            'font-medium text-slate-500 uppercase tracking-wide',
            s.title,
          )}>
            {title}
          </p>

          <p className={cn(
            'font-bold text-slate-800 leading-none mt-1.5',
            s.value,
          )}>
            {value}
          </p>

          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}

          {trend !== undefined && (
            <div className="mt-2">
              <InfoPill
                value={trend}
                unit={trendUnit}
                label={trendLabel}
                invert={trendInvert}
              />
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            'ring-1',
            s.icon,
            accent.bg,
            accent.ring,
          )}>
            <Icon size={s.iconSize} className={accent.text} />
          </div>
        )}
      </div>

      {/* Optional sparkline */}
      {graph && (
        <GraphRenderer
          {...graph}
          height={graph.height ?? 64}
          showGrid={false}
          showTooltip={graph.showTooltip ?? true}
          showLegend={false}
          className="mt-1 -mx-1"
        />
      )}
    </div>
  )
}