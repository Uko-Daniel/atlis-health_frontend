import { useState, useCallback, useEffect } from 'react'
import { Search, ArrowLeft, ArrowRight, Delete, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { TemplateField } from '@/services/templateService'

interface Props {
  fields: TemplateField[]
  value: string
  onChange: (expression: string) => void
  onCommit: () => void
}

const OPERANDS = [
  { label: '+', value: '+' },
  { label: '−', value: '-' },
  { label: '×', value: '*' },
  { label: '÷', value: '/' },
  { label: '^', value: '^' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: '.', value: '.' },
]

const NUMBERS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '00'],
]

export default function FormulaBuilder({ fields, value, onChange, onCommit }: Props) {
  const [display, setDisplay] = useState(value || '')
  const [cursor, setCursor] = useState(0)
  const [search, setSearch] = useState('')
  const [showFields, setShowFields] = useState(false)

  // Sync external value changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplay(value || '')
  }, [value])

  const filteredFields = fields.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase()) ||
    f.key.toLowerCase().includes(search.toLowerCase())
  )

  const insertText = useCallback((text: string) => {
    const newDisplay = display.slice(0, cursor) + text + display.slice(cursor)
    setDisplay(newDisplay)
    setCursor((c) => c + text.length)
    onChange(newDisplay)
  }, [display, cursor, onChange])

  const moveCursor = useCallback((dir: 'left' | 'right') => {
    if (dir === 'left') setCursor((c) => Math.max(0, c - 1))
    else setCursor((c) => Math.min(display.length, c + 1))
  }, [display.length])

  const deleteChar = useCallback(() => {
    if (cursor === 0) return
    const newDisplay = display.slice(0, cursor - 1) + display.slice(cursor)
    setDisplay(newDisplay)
    setCursor((c) => c - 1)
    onChange(newDisplay)
  }, [display, cursor, onChange])

  const insertField = useCallback((field: TemplateField) => {
    // Insert field reference as {field_key}
    const ref = `{${field.key}}`
    const newDisplay = display.slice(0, cursor) + ref + display.slice(cursor)
    setDisplay(newDisplay)
    setCursor((c) => c + ref.length)
    onChange(newDisplay)
    setShowFields(false)
    setSearch('')
  }, [display, cursor, onChange])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        insertText(e.key)
      } else if (['+', '-', '*', '/', '^', '(', ')', '.'].includes(e.key)) {
        insertText(e.key)
      } else if (e.key === 'Backspace') {
        deleteChar()
      } else if (e.key === 'ArrowLeft') {
        moveCursor('left')
      } else if (e.key === 'ArrowRight') {
        moveCursor('right')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onCommit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [insertText, deleteChar, moveCursor, onCommit])

  return (
    <div className="bg-[#F5F0FF] rounded-xl p-4 space-y-3">
      {/* Search bar with cursor controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowFields(true) }}
            onFocus={() => setShowFields(true)}
            placeholder="Search fields or type formula..."
            className="pl-8 text-sm border-[#9B6DFF]/30"
          />
        </div>
        <button
          type="button"
          onClick={() => moveCursor('left')}
          className="flex size-8 items-center justify-center rounded-lg border border-[#EEF1F8] bg-white hover:bg-[#F8FAFF] transition-colors"
        >
          <ArrowLeft size={14} className="text-[#64748B]" />
        </button>
        <button
          type="button"
          onClick={() => moveCursor('right')}
          className="flex size-8 items-center justify-center rounded-lg border border-[#EEF1F8] bg-white hover:bg-[#F8FAFF] transition-colors"
        >
          <ArrowRight size={14} className="text-[#64748B]" />
        </button>
      </div>

      {/* Field search results */}
      {showFields && search && (
        <div className="max-h-32 overflow-y-auto border border-[#EEF1F8] rounded-lg bg-white divide-y divide-[#F8FAFF]">
          {filteredFields.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[#94A3B8]">No fields match</p>
          ) : (
            filteredFields.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => insertField(f)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#F0F4FF] transition-colors flex items-center justify-between"
              >
                <span className="text-[#0F172A]">{f.label}</span>
                <span className="text-xs text-[#9B6DFF] font-mono">{`{${f.key}}`}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Formula display */}
      <div className="bg-white border border-[#9B6DFF]/30 rounded-lg px-3 py-2.5 min-h-[40px]">
        <p className="text-sm font-mono text-[#0F172A] break-all">
          {display.split('').map((char, i) => (
            <span
              key={i}
              className={cn(
                i === cursor && 'border-r-2 border-[#9B6DFF] animate-pulse',
              )}
            >
              {char}
            </span>
          ))}
          {cursor === display.length && (
            <span className="border-r-2 border-[#9B6DFF] animate-pulse">&nbsp;</span>
          )}
          {display.length === 0 && cursor === 0 && (
            <span className="text-[#CBD5E1]">Formula expression...</span>
          )}
        </p>
      </div>

      {/* Keypad + Operands */}
      <div className="grid grid-cols-2 gap-3">
        {/* Number pad */}
        <div className="space-y-1.5">
          {NUMBERS.map((row, ri) => (
            <div key={ri} className="grid grid-cols-2 gap-1.5">
              {row.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => insertText(num)}
                  className={cn(
                    'py-2.5 rounded-lg text-sm font-medium transition-all',
                    'bg-white border border-[#EEF1F8] hover:bg-[#F0F4FF] hover:border-[#5580F4]/30',
                    'active:scale-95',
                    num === '0' && 'col-span-2',
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Operands + Enter */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {OPERANDS.map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => insertText(op.value)}
                className="py-2.5 rounded-lg text-sm font-medium transition-all
                           bg-white border border-[#EEF1F8] hover:bg-[#F0F4FF]
                           hover:border-[#5580F4]/30 active:scale-95
                           text-[#9B6DFF]"
              >
                {op.label}
              </button>
            ))}
          </div>

          {/* Delete + Enter */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={deleteChar}
              className="py-2.5 rounded-lg text-sm font-medium transition-all
                         bg-white border border-[#FECACA] hover:bg-[#FEF2F2]
                         active:scale-95 text-[#EF4444] flex items-center justify-center"
            >
              <Delete size={15} />
            </button>
            <button
              type="button"
              onClick={onCommit}
              className="py-2.5 rounded-lg text-sm font-bold transition-all
                         bg-[#9B6DFF] text-white hover:bg-[#8B5CF6]
                         active:scale-95 flex items-center justify-center gap-1"
            >
              <Check size={15} />
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
