import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoPillProps {
  value:      number
  unit?:      string
  label?:     string
  invert?:    boolean
  className?: string
}

export function InfoPill({
  value,
  unit = '%',
  label,
  invert = false,
  className,
}: InfoPillProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral  = value === 0

  const isGood = invert ? isNegative : isPositive
  const isBad  = invert ? isPositive : isNegative

  const colorClass = isNeutral
    ? 'bg-slate-100 text-slate-500'
    : isGood
    ? 'bg-emerald-50 text-emerald-700'
    : isBad
    ? 'bg-red-50 text-red-600'
    : 'bg-slate-100 text-slate-500'

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'text-xs font-semibold select-none',
        colorClass,
        className,
      )}
    >
      <Icon size={11} className="shrink-0" />
      {isPositive ? '+' : ''}{value}{unit}
      {label && (
        <span className="font-normal opacity-70 ml-0.5">{label}</span>
      )}
    </span>
  )
}