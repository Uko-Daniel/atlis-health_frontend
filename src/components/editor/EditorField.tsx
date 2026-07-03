import type { SchemaField, FieldFlag } from '@/types/editor'
import { cn } from '@/lib/utils'

interface Props {
  field:    SchemaField
  value:    unknown
  flag:     FieldFlag
  onChange: (key: string, value: unknown) => void
  disabled?: boolean
}

const FLAG_STYLES: Record<NonNullable<FieldFlag>, string> = {
  H: 'bg-amber-50 border-amber-300 text-amber-800',
  L: 'bg-blue-50 border-blue-300 text-blue-800',
  C: 'bg-red-50 border-red-400 text-red-800 ring-1 ring-red-400',
  N: '',
}

const FLAG_LABELS: Record<NonNullable<FieldFlag>, string> = {
  H: 'H',
  L: 'L',
  C: 'CRITICAL',
  N: '',
}

export default function EditorField({ field, value, flag, onChange, disabled }: Props) {
  const inputClass = cn(
    'w-full rounded-lg border px-3 py-2 text-sm text-slate-800',
    'focus:outline-none focus:ring-2 focus:ring-indigo-300',
    'disabled:bg-slate-50 disabled:text-slate-400',
    flag && flag !== 'N'
      ? FLAG_STYLES[flag]
      : 'border-slate-200 bg-white',
  )

  const renderInput = () => {
    switch (field.type) {

      case 'numeric':
      case 'calculated':
        return (
          <div className="relative">
            <input
              type="number"
              step={field.precision ? Math.pow(10, -field.precision) : 'any'}
              value={value as number ?? ''}
              onChange={(e) => onChange(field.key, e.target.value === '' ? null : Number(e.target.value))}
              placeholder={field.placeholder ?? '—'}
              disabled={disabled || field.type === 'calculated'}
              className={cn(inputClass, field.unit && 'pr-14')}
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2
                               text-xs text-slate-400 pointer-events-none">
                {field.unit}
              </span>
            )}
          </div>
        )

      case 'text':
      case 'richtext':
        return (
          <input
            type="text"
            value={value as string ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder ?? '—'}
            disabled={disabled}
            className={inputClass}
          />
        )

      case 'select':
        return (
          <select
            value={value as string ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={disabled}
            className={cn(inputClass, 'appearance-none')}
          >
            <option value="">Select…</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <select
            multiple
            value={Array.isArray(value) ? value as string[] : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value)
              onChange(field.key, selected)
            }}
            disabled={disabled}
            className={cn(inputClass, 'h-24')}
          >
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-4">
            {['Yes', 'No'].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.key}
                  value={opt}
                  checked={
                    opt === 'Yes' ? value === true : value === false
                  }
                  onChange={() => onChange(field.key, opt === 'Yes')}
                  disabled={disabled}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">
          {field.label}
          {field.required && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </label>

        {/* Flag badge */}
        {flag && flag !== 'N' && (
          <span className={cn(
            'text-xs font-bold px-1.5 py-0.5 rounded',
            FLAG_STYLES[flag],
          )}>
            {FLAG_LABELS[flag]}
          </span>
        )}
      </div>

      {renderInput()}

      {/* Reference range hint */}
      {field.referenceRange?.default && (
        <p className="text-xs text-slate-400">
          Ref: {field.referenceRange.default.min} –{' '}
          {field.referenceRange.default.max}
          {field.unit && ` ${field.unit}`}
        </p>
      )}

      {field.hint && (
        <p className="text-xs text-slate-400 italic">{field.hint}</p>
      )}
    </div>
  )
}