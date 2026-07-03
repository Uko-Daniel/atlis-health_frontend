import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

// Single date mode
interface SingleProps {
  mode:      'single'
  value:     Date | undefined
  onChange:  (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?:  boolean
}

// Range mode
interface RangeProps {
  mode:      'range'
  value:     DateRange | undefined
  onChange:  (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
  disabled?:  boolean
}

type CalendarPillProps = SingleProps | RangeProps

function formatLabel(
  mode: 'single' | 'range',
  value: Date | DateRange | undefined,
  placeholder: string,
): string {
  if (!value) return placeholder

  if (mode === 'single') {
    const d = value as Date
    return format(d, 'dd MMM yyyy')
  }

  const r = value as DateRange
  if (!r.from) return placeholder
  if (!r.to) return format(r.from, 'dd MMM yyyy')
  return `${format(r.from, 'dd MMM')} – ${format(r.to, 'dd MMM yyyy')}`
}

export function CalendarPill(props: CalendarPillProps) {
  const [open, setOpen] = useState(false)

  const { mode, value, onChange, className, disabled } = props
  const placeholder = props.placeholder ?? (mode === 'range' ? 'Select date range' : 'Select date')

  const hasValue = mode === 'single'
    ? !!value
    : !!(value as DateRange | undefined)?.from

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mode === 'single') {
      (onChange as SingleProps['onChange'])(undefined)
    } else {
      (onChange as RangeProps['onChange'])(undefined)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-slate-200',
            'bg-white px-3.5 py-2 text-sm text-slate-700',
            'hover:bg-slate-50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-indigo-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasValue && 'border-indigo-300 bg-indigo-50 text-indigo-700',
            className,
          )}
        >
          <CalendarIcon size={14} className="shrink-0 text-slate-400" />
          <span className="whitespace-nowrap">
            {formatLabel(mode, value, placeholder)}
          </span>
          {hasValue && (
            <span
              onClick={handleClear}
              className="ml-0.5 text-indigo-400 hover:text-indigo-600 cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 rounded-2xl shadow-lg border-slate-200"
      >
        {mode === 'single' ? (
          <Calendar
            mode="single"
            selected={value as Date | undefined}
            onSelect={(d) => {
              (onChange as SingleProps['onChange'])(d)
              setOpen(false)
            }}
            className="rounded-2xl"
          />
        ) : (
          <Calendar
            mode="range"
            selected={value as DateRange | undefined}
            onSelect={(onChange as RangeProps['onChange'])}
            numberOfMonths={2}
            className="rounded-2xl"
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
