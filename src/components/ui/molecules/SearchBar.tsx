import { useRef, useEffect, useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value:        string
  onChange:     (value: string) => void
  placeholder?: string
  loading?:     boolean
  debounce?:    number       // ms — 0 to disable
  onClear?:     () => void
  autoFocus?:   boolean
  size?:        'sm' | 'md' | 'lg'
  className?:   string
}

const SIZE_CLASSES = {
  sm: { wrap: 'h-8',  icon: 12, input: 'pl-8 pr-8 text-xs h-8'  },
  md: { wrap: 'h-9',  icon: 14, input: 'pl-9 pr-9 text-sm h-9'  },
  lg: { wrap: 'h-11', icon: 16, input: 'pl-10 pr-10 text-sm h-11' },
}

const ICON_POS = {
  sm: 'left-2.5',
  md: 'left-3',
  lg: 'left-3.5',
}

const CLEAR_POS = {
  sm: 'right-2',
  md: 'right-2.5',
  lg: 'right-3',
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  loading = false,
  debounce = 0,
  onClear,
  autoFocus = false,
  size = 'md',
  className,
}: SearchBarProps) {
  const [internal, setInternal] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const s = SIZE_CLASSES[size]

  if (value !== prevValue) {
    setPrevValue(value)
    setInternal(value)
  }

  // Auto-focus
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInternal(v)

    if (debounce > 0) {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onChange(v), debounce)
    } else {
      onChange(v)
    }
  }

  const handleClear = () => {
    setInternal('')
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div className={cn('relative flex items-center', s.wrap, className)}>
      {/* Search / loading icon */}
      <span
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
          ICON_POS[size],
        )}
      >
        {loading
          ? <Loader2 size={s.icon} className="animate-spin" />
          : <Search size={s.icon} />
        }
      </span>

      <Input
        ref={inputRef}
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'bg-white border-slate-200 rounded-full',
          'placeholder:text-slate-400 text-slate-800',
          'focus-visible:ring-indigo-300 focus-visible:border-indigo-300',
          s.input,
        )}
      />

      {/* Clear button */}
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute top-1/2 -translate-y-1/2',
            'text-slate-400 hover:text-slate-600 transition-colors',
            CLEAR_POS[size],
          )}
          aria-label="Clear search"
        >
          <X size={s.icon} />
        </button>
      )}
    </div>
  )
}
