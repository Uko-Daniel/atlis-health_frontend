import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'pending' | 'verified' | 'finalized'
  | 'critical' | 'high' | 'moderate' | 'low' | 'info'
  | 'processing' | 'completed' | 'cancelled'
  | 'active' | 'resolved' | 'chronic' | 'suspected'
  | 'discontinued' | 'mild' | 'life_threatening'
  | 'default' | 'success' | 'warning' | 'danger'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  // Result status
  pending:          'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  verified:         'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
  finalized:        'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  // EVEE severity
  critical:         'bg-red-100 text-red-800 border-red-300 hover:bg-red-100',
  high:             'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
  moderate:         'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  low:              'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  info:             'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50',
  // Order status
  processing:       'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-50',
  completed:        'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  cancelled:        'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100',
  // Diagnosis
  active:           'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
  resolved:         'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-100',
  chronic:          'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
  suspected:        'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  // Medication
  discontinued:     'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-100',
  // Allergy
  mild:             'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
  life_threatening: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100',
  // Generic
  default:          'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100',
  success:          'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  warning:          'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  danger:           'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
}

const DOT_COLORS: Partial<Record<BadgeVariant, string>> = {
  critical:   'bg-red-500',
  high:       'bg-orange-500',
  moderate:   'bg-amber-500',
  low:        'bg-emerald-500',
  info:       'bg-blue-500',
  pending:    'bg-amber-400',
  verified:   'bg-blue-500',
  finalized:  'bg-emerald-500',
  active:     'bg-blue-500',
  resolved:   'bg-slate-400',
}

const AUTO_MAP: Record<string, BadgeVariant> = {
  PENDING: 'pending', VERIFIED: 'verified', FINALIZED: 'finalized',
  PROCESSING: 'processing', COMPLETED: 'completed', CANCELLED: 'cancelled',
  CRITICAL: 'critical', HIGH: 'high', MODERATE: 'moderate', LOW: 'low', INFO: 'info',
  ACTIVE: 'active', RESOLVED: 'resolved', CHRONIC: 'chronic', SUSPECTED: 'suspected',
  DISCONTINUED: 'discontinued', MILD: 'mild', LIFE_THREATENING: 'life_threatening',
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
}

interface StatusBadgeProps {
  variant?:   BadgeVariant
  value?:     string
  label?:     string
  size?:      'sm' | 'md' | 'lg'
  dot?:       boolean
  className?: string
}

export function StatusBadge({
  variant,
  value,
  label,
  size = 'md',
  dot = false,
  className,
}: StatusBadgeProps) {
  const resolved: BadgeVariant =
    variant ??
    (value ? AUTO_MAP[value.toUpperCase()] ?? 'default' : 'default')

  const display =
    label ??
    (value
      ? value.charAt(0).toUpperCase() +
        value.slice(1).toLowerCase().replace(/_/g, ' ')
      : resolved.charAt(0).toUpperCase() +
        resolved.slice(1).replace(/_/g, ' '))

  return (
    <Badge
      variant="outline"
      className={cn(
        VARIANT_CLASSES[resolved],
        SIZE_CLASSES[size],
        'inline-flex items-center gap-1.5 font-medium select-none',
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'inline-block size-1.5 rounded-full shrink-0',
            DOT_COLORS[resolved] ?? 'bg-slate-400',
          )}
        />
      )}
      {display}
    </Badge>
  )
}