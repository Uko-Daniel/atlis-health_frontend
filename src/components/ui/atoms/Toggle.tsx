import { Switch } from '@/components/ui/switch'
import { Label }  from '@/components/ui/label'
import { cn }     from '@/lib/utils'
import { useId }  from 'react'

interface ToggleProps {
  checked:      boolean
  onChange:     (checked: boolean) => void
  label?:       string
  description?: string
  disabled?:    boolean
  size?:        'sm' | 'md' | 'lg'
  className?:   string
}

// shadcn Switch size overrides via className
const SWITCH_SIZE = {
  sm: 'h-4 w-7 [&>span]:size-3 [&>span]:data-[state=checked]:translate-x-3',
  md: '',   // shadcn default
  lg: 'h-6 w-11 [&>span]:size-5 [&>span]:data-[state=checked]:translate-x-5',
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}: ToggleProps) {
  const id = useId()

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={SWITCH_SIZE[size]}
      />
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <Label
              htmlFor={id}
              className="text-sm font-medium text-slate-700 leading-none cursor-pointer"
            >
              {label}
            </Label>
          )}
          {description && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}