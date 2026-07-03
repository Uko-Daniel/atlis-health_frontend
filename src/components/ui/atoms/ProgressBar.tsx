import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type ProgressColor = 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'violet' | 'slate' | 'auto'

const COLOR_CLASSES: Record<Exclude<ProgressColor, 'auto'>, string> = {
  indigo:  '[&>div]:bg-indigo-500',
  emerald: '[&>div]:bg-emerald-500',
  amber:   '[&>div]:bg-amber-500',
  red:     '[&>div]:bg-red-500',
  blue:    '[&>div]:bg-blue-500',
  violet:  '[&>div]:bg-violet-500',
  slate:   '[&>div]:bg-slate-400',
}

const SIZE_CLASSES = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

function autoColor(value: number): string {
  if (value >= 80) return '[&>div]:bg-emerald-500'
  if (value >= 50) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

interface ProgressBarProps {
  value:       number
  color?:      ProgressColor
  size?:       'xs' | 'sm' | 'md' | 'lg'
  showLabel?:  boolean
  label?:      string
  className?:  string
}

export function ProgressBar({
  value,
  color = 'indigo',
  size = 'md',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const clamped    = Math.min(100, Math.max(0, value))
  const colorClass = color === 'auto'
    ? autoColor(clamped)
    : COLOR_CLASSES[color]

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {label ?? `${clamped}%`}
          </span>
        </div>
      )}
      <Progress
        value={clamped}
        className={cn(SIZE_CLASSES[size], colorClass)}
      />
    </div>
  )
}