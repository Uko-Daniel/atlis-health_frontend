import {
  Avatar as ShadAvatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type AvatarSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type AvatarColor = 'indigo' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs:  'size-6 text-xs',
  sm:  'size-8 text-xs',
  md:  'size-10 text-sm',
  lg:  'size-12 text-base',
  xl:  'size-16 text-xl',
  '2xl': 'size-20 text-2xl',
}

const COLOR_CLASSES: Record<AvatarColor, string> = {
  indigo:  'bg-indigo-100 text-indigo-700',
  blue:    'bg-blue-100 text-blue-700',
  violet:  'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  rose:    'bg-rose-100 text-rose-700',
  slate:   'bg-slate-100 text-slate-600',
}

const COLORS: AvatarColor[] = [
  'indigo', 'blue', 'violet', 'emerald', 'amber', 'rose',
]

function colorFromString(str: string): AvatarColor {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase()
}

interface AvatarProps {
  name:       string
  src?:       string
  size?:      AvatarSize
  color?:     AvatarColor
  className?: string
}

export function Avatar({
  name,
  src,
  size = 'md',
  color,
  className,
}: AvatarProps) {
  const resolvedColor = color ?? colorFromString(name)
  const initials      = getInitials(name)

  return (
    <ShadAvatar
      className={cn(SIZE_CLASSES[size], 'shrink-0', className)}
    >
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback
        className={cn(
          COLOR_CLASSES[resolvedColor],
          'font-semibold',
          SIZE_CLASSES[size],
        )}
      >
        {initials}
      </AvatarFallback>
    </ShadAvatar>
  )
}