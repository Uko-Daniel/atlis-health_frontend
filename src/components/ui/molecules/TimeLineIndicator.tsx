import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepStatus = 'completed' | 'active' | 'upcoming' | 'error'

export interface TimelineStep {
  id:           string
  label:        string
  description?: string
  status:       StepStatus
  timestamp?:   string
}

interface TimelineIndicatorProps {
  steps:       TimelineStep[]
  orientation?: 'vertical' | 'horizontal'
  className?:  string
}

const STATUS_STYLES: Record<StepStatus, {
  dot:   string
  line:  string
  label: string
  desc:  string
}> = {
  completed: {
    dot:   'bg-indigo-600 border-indigo-600 text-white',
    line:  'bg-indigo-300',
    label: 'text-slate-800 font-medium',
    desc:  'text-slate-500',
  },
  active: {
    dot:   'bg-white border-2 border-indigo-600 text-indigo-600 ring-4 ring-indigo-100',
    line:  'bg-slate-200',
    label: 'text-indigo-700 font-semibold',
    desc:  'text-slate-500',
  },
  upcoming: {
    dot:   'bg-white border-2 border-slate-300 text-slate-400',
    line:  'bg-slate-200',
    label: 'text-slate-400 font-normal',
    desc:  'text-slate-400',
  },
  error: {
    dot:   'bg-red-600 border-red-600 text-white',
    line:  'bg-red-200',
    label: 'text-red-700 font-medium',
    desc:  'text-red-400',
  },
}

function StepDot({ status }: { status: StepStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full',
        'transition-all duration-200',
        s.dot,
      )}
    >
      {status === 'completed' && <Check size={13} strokeWidth={2.5} />}
      {status === 'active'    && <Circle size={8}  strokeWidth={3}   className="fill-indigo-600" />}
      {status === 'upcoming'  && <Circle size={8}  strokeWidth={2}   className="fill-slate-300"  />}
      {status === 'error'     && <span className="text-xs font-bold">!</span>}
    </span>
  )
}

// ── VERTICAL ─────────────────────────────────────────────────
function VerticalTimeline({ steps, className }: Omit<TimelineIndicatorProps, 'orientation'>) {
  return (
    <div className={cn('flex flex-col', className)}>
      {steps.map((step, i) => {
        const s        = STATUS_STYLES[step.status]
        const isLast   = i === steps.length - 1

        return (
          <div key={step.id} className="flex gap-4">
            {/* Dot + connector */}
            <div className="flex flex-col items-center">
              <StepDot status={step.status} />
              {!isLast && (
                <div
                  className={cn('w-0.5 flex-1 my-1 min-h-6', s.line)}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6 min-w-0 flex-1', isLast && 'pb-0')}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn('text-sm', s.label)}>
                  {step.label}
                </p>
                {step.timestamp && (
                  <span className="text-xs text-slate-400">
                    {step.timestamp}
                  </span>
                )}
              </div>
              {step.description && (
                <p className={cn('text-xs mt-0.5', s.desc)}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── HORIZONTAL ───────────────────────────────────────────────
function HorizontalTimeline({ steps, className }: Omit<TimelineIndicatorProps, 'orientation'>) {
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, i) => {
        const s      = STATUS_STYLES[step.status]
        const isLast = i === steps.length - 1

        return (
          <div key={step.id} className="flex items-start flex-1 min-w-0">
            {/* Step */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <StepDot status={step.status} />
              <p className={cn('text-xs mt-2 text-center truncate w-full px-1', s.label)}>
                {step.label}
              </p>
              {step.description && (
                <p className={cn('text-xs mt-0.5 text-center truncate w-full px-1', s.desc)}>
                  {step.description}
                </p>
              )}
              {step.timestamp && (
                <p className="text-xs text-slate-400 mt-0.5 text-center">
                  {step.timestamp}
                </p>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={cn('h-0.5 flex-1 mt-3.5 mx-1', s.line)} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function TimelineIndicator({
  steps,
  orientation = 'vertical',
  className,
}: TimelineIndicatorProps) {
  if (orientation === 'horizontal') {
    return <HorizontalTimeline steps={steps} className={className} />
  }
  return <VerticalTimeline steps={steps} className={className} />
}