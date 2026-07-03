import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react'

interface Props {
  templateName:  string
  patientName:   string
  saveStatus:    'idle' | 'saving' | 'saved' | 'error'
  isSubmitting:  boolean
  onSave:        () => void
  onSubmit:      () => void
  onClose:       () => void
}

const SAVE_LABELS = {
  idle:   '',
  saving: 'Saving…',
  saved:  'Draft saved',
  error:  'Save failed',
}

const SAVE_COLORS = {
  idle:   'text-slate-400',
  saving: 'text-slate-400',
  saved:  'text-emerald-600',
  error:  'text-red-500',
}

export default function EditorHeader({
  templateName,
  patientName,
  saveStatus,
  isSubmitting,
  onSave,
  onSubmit,
  onClose,
}: Props) {

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap
                    sticky top-0 z-10 bg-white border-b border-slate-200
                    px-6 py-4 shadow-sm">

      {/* Left — back + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-slate-500
                     hover:text-slate-800 text-sm transition-colors shrink-0"
        >
          <ArrowLeft size={15} />
          Close
        </button>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {templateName}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {patientName}
          </p>
        </div>
      </div>

      {/* Right — save status + actions */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Auto-save status */}
        {saveStatus !== 'idle' && (
          <span className={`text-xs ${SAVE_COLORS[saveStatus]} flex items-center gap-1`}>
            {saveStatus === 'saving' && (
              <Loader2 size={12} className="animate-spin" />
            )}
            {SAVE_LABELS[saveStatus]}
          </span>
        )}

        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                     border border-slate-200 text-slate-600 text-sm
                     hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          Save Draft
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg
                     bg-indigo-600 hover:bg-indigo-700 text-white text-sm
                     font-medium transition-colors disabled:opacity-50"
        >
          {isSubmitting
            ? <Loader2 size={14} className="animate-spin" />
            : <Send size={14} />
          }
          {isSubmitting ? 'Submitting…' : 'Submit Result'}
        </button>
      </div>
    </div>
  )
}