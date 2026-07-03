import { useState } from 'react'
import { ChevronDown, ShieldOff, ShieldCheck } from 'lucide-react'
import { SEVERITY_STYLES, DOMAIN_LABELS, type EveeAlert } from '@/types/evee'
import { cn } from '@/lib/utils'

interface Props {
  alert:        EveeAlert
  onOverride:   (alert: EveeAlert) => void
  canOverride:  boolean
}

export default function EveeAlertCard({ alert, onOverride, canOverride }: Props) {
  const [expanded, setExpanded] = useState(alert.severity === 'CRITICAL')
  const style = SEVERITY_STYLES[alert.severity]
  const requiresOverride = ['CRITICAL', 'HIGH'].includes(alert.severity)

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#EEF1F8] border-l-4 overflow-hidden',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        style.border,
        alert.overridden && 'opacity-60',
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left
                   hover:bg-[#FAFBFF] transition-colors"
      >
        <span className={cn('size-2 rounded-full shrink-0 mt-1.5', style.dot)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-bold uppercase tracking-wide', style.text)}>
              {alert.severity}
            </span>
            <span className="text-xs text-[#94A3B8]">
              {DOMAIN_LABELS[alert.domain]}
            </span>
            {alert.overridden && (
              <span className="flex items-center gap-1 text-xs text-[#10B981] font-medium">
                <ShieldCheck size={11} /> Overridden
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#0F172A] mt-1">
            {alert.message}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={cn(
            'text-[#94A3B8] shrink-0 mt-1 transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-9 space-y-3">
          <div>
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide mb-1">
              Recommendation
            </p>
            <p className="text-sm text-[#64748B] leading-relaxed">
              {alert.recommendation}
            </p>
          </div>

          {alert.overridden ? (
            <div className="bg-[#F8FAFF] rounded-xl px-3.5 py-3 space-y-1">
              <p className="text-xs font-bold text-[#64748B]">Override reason</p>
              <p className="text-xs text-[#64748B] italic">"{alert.overrideReason}"</p>
              {alert.overriddenAt && (
                <p className="text-xs text-[#94A3B8] mt-1">
                  {new Date(alert.overriddenAt).toLocaleString('en-NG', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          ) : requiresOverride && canOverride ? (
            <button
              onClick={() => onOverride(alert)}
              className="flex items-center gap-1.5 text-xs font-medium
                         text-[#EF4444] hover:underline"
            >
              <ShieldOff size={12} />
              Override this alert
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}