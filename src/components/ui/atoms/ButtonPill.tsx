import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type ButtonPillVariant =
  | 'primary' | 'secondary' | 'ghost'
  | 'danger' | 'warning' | 'success' | 'outline' | 'subtle'

type ButtonPillSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const VARIANT_CLASSES: Record<ButtonPillVariant, string> = {
  primary:   'bg-[#5580F4] text-white hover:bg-[#3B65E8] border-transparent',
  secondary: 'bg-[#5580F4]/90 text-white hover:bg-[#3B65E8] border-transparent',
  ghost:     'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
  danger:    'bg-red-600 text-white hover:bg-red-700 border-transparent',
  warning:   'bg-amber-500 text-white hover:bg-amber-600 border-transparent',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
  outline:   'bg-transparent text-[#5580F4] border-[#5580F4]/30 hover:bg-[#EEF2FF]',
  subtle:    'bg-[#EEF2FF] text-[#5580F4] border-transparent hover:bg-[#5580F4]/10',
}

const SIZE_CLASSES: Record<ButtonPillSize, string> = {
  xs: 'h-7 px-3 text-xs gap-1',
  sm: 'h-8 px-4 text-xs gap-1.5',
  md: 'h-9 px-5 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  xl: 'h-12 px-8 text-base gap-2',
}

const ICON_SIZE: Record<ButtonPillSize, number> = {
  xs: 12, sm: 13, md: 15, lg: 16, xl: 18,
}

interface ButtonPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonPillVariant
  size?:      ButtonPillSize
  fullWidth?: boolean
  loading?:   boolean
  icon?:      LucideIcon
  iconRight?: LucideIcon
}

export function ButtonPill({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  children,
  className,
  disabled,
  ...props
}: ButtonPillProps) {
  const iSize = ICON_SIZE[size]

  return (
    <Button
      variant="outline"
      className={cn(
        'rounded-full font-medium transition-all border',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <Loader2 size={iSize} className="animate-spin shrink-0" />
        : Icon && <Icon size={iSize} className="shrink-0" />
      }
      {children}
      {!loading && IconRight && (
        <IconRight size={iSize} className="shrink-0" />
      )}
    </Button>
  )
}