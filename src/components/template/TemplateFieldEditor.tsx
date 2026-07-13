import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Toggle } from '@/components/ui/atoms/Toggle'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Trash2, Image } from 'lucide-react'
import type { TemplateField } from '@/services/templateService'
import FormulaBuilder from './FormulaBuilder'

const FIELD_TYPES = [
  { value: 'numeric', label: 'Number' },
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Single-select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'richtext', label: 'Rich text' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'calculated', label: 'Calculated' },
  { value: 'image', label: 'Image Upload' },
]

interface Props {
  field: TemplateField
  allFields: TemplateField[]
  rangeValue: string
  onChange: (data: Partial<TemplateField>) => void
  onRangeChange: (value: string) => void
  onRemove: () => void
}

export default function TemplateFieldEditor({
  field, allFields, rangeValue, onChange, onRangeChange, onRemove,
}: Props) {
  const showUnit = ['numeric', 'calculated'].includes(field.type)
  const showRange = field.type === 'numeric'
  const showOptions = field.type === 'select' || field.type === 'multiselect'
  const showFormula = field.type === 'calculated'
  const showImage = field.type === 'image'

  // Local raw text for options (decoupled from field.options array)
  const [optionsText, setOptionsText] = useState('')
  const optionsSynced = useRef(false)

  // Initialize local options text from field options
  useEffect(() => {
    if (!optionsSynced.current && field.options && field.options.length > 0) {
      setOptionsText(field.options.join(', '))
      optionsSynced.current = true
    }
  }, [field.options])

  // When type changes away from select/multiselect, clear options
  useEffect(() => {
    if (!showOptions) {
      setOptionsText('')
      optionsSynced.current = false
    }
  }, [showOptions])

  const handleOptionsBlur = () => {
    const opts = optionsText.split(',').map((o) => o.trim()).filter(Boolean)
    onChange({ options: opts.length > 0 ? opts : undefined })
  }

  return (
    <div className="p-3 rounded-xl bg-[#F8FAFF] space-y-2">
      {/* Main row */}
      <div className="grid grid-cols-12 gap-2 items-start">
        {/* Label */}
        <div className={showImage ? 'col-span-8' : 'col-span-4'}>
          <Input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            placeholder="Field label"
            className="text-sm"
          />
        </div>

        {/* Type (hidden for image — always 'image') */}
        {!showImage && (
          <div className="col-span-2">
            <Select
              value={field.type}
              onValueChange={(v) => {
                const updates: Partial<TemplateField> = { type: v as any }
                if (v === 'calculated') {
                  updates.unit = ''
                  updates.referenceRange = undefined
                }
                if (v === 'boolean') {
                  updates.unit = ''
                  updates.referenceRange = undefined
                }
                if (v === 'text' || v === 'richtext') {
                  updates.referenceRange = undefined
                }
                onChange(updates)
              }}
            >
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Unit (numeric + calculated only) */}
        <div className="col-span-2">
          {showUnit ? (
            <Input
              value={field.unit ?? ''}
              onChange={(e) => onChange({ unit: e.target.value || undefined })}
              placeholder="Unit"
              className="text-sm"
              disabled={field.type === 'calculated'}
            />
          ) : showImage ? null : <div />}
        </div>

        {/* Range (numeric only) */}
        <div className="col-span-2">
          {showRange ? (
            <Input
              value={rangeValue}
              onChange={(e) => onRangeChange(e.target.value)}
              placeholder="Ref range (e.g. 12-16)"
              className="text-sm"
            />
          ) : showImage ? null : <div />}
        </div>

        {/* Required toggle + Delete */}
        <div className={showImage ? 'col-span-4' : 'col-span-2'}>
          <div className="flex items-center justify-end gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Toggle
                      checked={field.required}
                      onChange={(v) => onChange({ required: v })}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Required field</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ButtonPill variant="ghost" size="sm" icon={Trash2} onClick={onRemove} />
          </div>
        </div>
      </div>

      {/* Image indicator */}
      {showImage && (
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Image size={13} className="text-[#5580F4]" />
          Images are uploaded during result entry. Accepts JPEG, PNG, WebP, and DICOM.
        </div>
      )}

      {/* Options (select + multiselect only) */}
      {showOptions && (
        <div>
          <Label className="text-xs text-[#94A3B8] mb-1 block">Options (comma-separated)</Label>
          <Input
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            onBlur={handleOptionsBlur}
            placeholder="Negative, Positive, Inconclusive"
            className="text-sm"
          />
        </div>
      )}

      {/* Formula (calculated only) */}
      {showFormula && (
        <div>
          <Label className="text-xs font-medium text-[#9B6DFF] mb-2 block">Formula Builder</Label>
          <FormulaBuilder
            fields={allFields}
            value={field.formula ?? ''}
            onChange={(expression) => onChange({ formula: expression })}
            onCommit={() => {}}
          />
          {field.formulaInputs && (
            <p className="text-xs text-[#94A3B8] mt-2">
              Required inputs: {field.formulaInputs.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}