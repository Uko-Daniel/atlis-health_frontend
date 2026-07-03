import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

import { getResultById } from '@/services/resultService'
import {
  openSession,
  closeSession,
  saveDraft,
  sendHeartbeat,
  flagField,
  calculateFields,
  submitResult,
} from '@/services/editorService'

import type { DataSchema, DraftData, FlagMap, SchemaGroup } from '@/types/editor'
import EditorHeader from '@/components/editor/EditorHeader'
import EditorField  from '@/components/editor/EditorField'
import { Skeleton } from '@/components/ui/skeleton'
import { cn }       from '@/lib/utils'

const AUTOSAVE_INTERVAL  = 30_000
const HEARTBEAT_INTERVAL = 300_000
const FLAG_DEBOUNCE      = 800

export default function ResultEditor() {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate     = useNavigate()

  const [sessionOpen,    setSessionOpen]    = useState(false)
  const [sessionError,   setSessionError]   = useState<string | null>(null)
  const [draft,          setDraft]          = useState<DraftData>({})
  const [flags,          setFlags]          = useState<FlagMap>({})
  const [collapsed,      setCollapsed]      = useState<Record<string, boolean>>({})
  const [interpretation, setInterpretation] = useState('')
  const [saveStatus,     setSaveStatus]     = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [isSubmitting,   setIsSubmitting]   = useState(false)
  const [submitError,    setSubmitError]    = useState<string | null>(null)
  const [missingFields,  setMissingFields]  = useState<string[]>([])

  // ── Refs ─────────────────────────────────────────────────
  // Fix 1: useRef requires an initial value
  const autoSaveRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const flagTimers   = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Fix 2: hoist draft/patientId into refs so intervals always
  // see the latest value without needing them in dependency arrays
  const draftRef     = useRef<DraftData>({})
  const patientIdRef = useRef<string>('')
  const sessionRef   = useRef<boolean>(false)
  const resultIdRef  = useRef<string | undefined>(resultId)

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['results', resultId],
    queryFn:  () => getResultById(resultId!),
    enabled:  !!resultId,
  })

  const schema      = result?.template?.dataSchema as DataSchema | undefined
  const patientName = result?.patient
    ? `${result.patient.firstName} ${result.patient.lastName}`
    : '—'

  // Keep refs in sync with state
  useEffect(() => { draftRef.current     = draft },      [draft])
  useEffect(() => { sessionRef.current   = sessionOpen }, [sessionOpen])
  useEffect(() => {
    patientIdRef.current = result?.patientId ?? ''
  }, [result?.patientId])

  // ── Save function — uses refs, safe to call from intervals ──
  const doSave = async () => {
    const rid = resultIdRef.current
    const pid = patientIdRef.current
    if (!rid || !pid || !sessionRef.current) return
    setSaveStatus('saving')
    try {
      await saveDraft(rid, draftRef.current, pid)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    }
  }

  // ── Open session on mount ────────────────────────────────
  useEffect(() => {
    if (!resultId || !result) return

    resultIdRef.current = resultId

    openSession(resultId)
      .then((session) => {
        setSessionOpen(true)
        sessionRef.current = true
        if (session.draftData) {
          setDraft(session.draftData as DraftData)
          draftRef.current = session.draftData as DraftData
        }
      })
      .catch((err: { response?: { data?: { error?: string } }; message: string }) => {
        setSessionError(err.response?.data?.error ?? err.message)
      })

    return () => {
      closeSession(resultId).catch(() => {})
      clearInterval(autoSaveRef.current)
      clearInterval(heartbeatRef.current)
      // Fix 3: capture ref value at cleanup time
      const timers = flagTimers.current
      Object.values(timers).forEach(clearTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId, result?.id])

  // ── Auto-save interval — uses doSave via ref, no deps needed ──
  useEffect(() => {
    if (!sessionOpen || !resultId) return
    autoSaveRef.current = setInterval(doSave, AUTOSAVE_INTERVAL)
    return () => clearInterval(autoSaveRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionOpen, resultId])

  // ── Heartbeat interval ───────────────────────────────────
  useEffect(() => {
    if (!sessionOpen || !resultId) return
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(resultId).catch(() => {})
    }, HEARTBEAT_INTERVAL)
    return () => clearInterval(heartbeatRef.current)
  }, [sessionOpen, resultId])

  // ── beforeunload ─────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (resultIdRef.current) closeSession(resultIdRef.current).catch(() => {})
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── Field change handler ──────────────────────────────────
  const handleFieldChange = (key: string, value: unknown) => {
    const newDraft = { ...draftRef.current, [key]: value }
    setDraft(newDraft)
    draftRef.current = newDraft

    if (typeof value === 'number' || value === null) {
      clearTimeout(flagTimers.current[key])
      flagTimers.current[key] = setTimeout(async () => {
        const rid = resultIdRef.current
        const pid = patientIdRef.current
        if (!rid || !pid) return
        try {
          const res = await flagField(rid, key, value, pid)
          setFlags((prev) => ({ ...prev, [key]: res.flag }))
        } catch {
          // silently ignore
        }
      }, FLAG_DEBOUNCE)
    }

    const isFormulaInput = schema?.groups
      .flatMap((g) => g.fields)
      .some((f) => f.type === 'calculated' && f.formulaInputs?.includes(key))

    if (isFormulaInput) {
      const rid = resultIdRef.current
      const pid = patientIdRef.current
      if (!rid || !pid) return
      calculateFields(rid, newDraft, pid)
        .then((recalculated) => {
          setDraft((prev) => ({ ...prev, ...recalculated }))
          draftRef.current = { ...draftRef.current, ...recalculated }
        })
        .catch(() => {})
    }
  }

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    const rid = resultIdRef.current
    const pid = patientIdRef.current
    if (!rid || !pid) return

    setIsSubmitting(true)
    setSubmitError(null)
    setMissingFields([])

    try {
      const res = await submitResult(
        rid,
        draftRef.current,
        pid,
        interpretation || undefined,
      )

      if (!res.success) {
        setMissingFields(res.missingFields ?? [])
        setSubmitError('Some required fields are missing.')
        setIsSubmitting(false)
        return
      }

      navigate(`/results/${rid}`, { replace: true })
    } catch (err: unknown) {
      // Fix 4: typed catch instead of any
      const message = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { error?: string } } })
            ?.response?.data?.error ?? 'Submission failed.'
      setSubmitError(message)
      setIsSubmitting(false)
    }
  }

  const handleClose = async () => {
    const rid = resultIdRef.current
    if (rid) await closeSession(rid).catch(() => {})
    navigate(-1)
  }

  const toggleGroup = (groupId: string) => {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  // ── Render guards ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !result) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-500 font-medium">Result not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 text-sm text-slate-500 underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="-m-6 min-h-full bg-[#EBEBFF] p-6">
        <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl p-8
                        shadow-sm text-center space-y-3">
          <div className="flex size-14 items-center justify-center
                          rounded-full bg-amber-100 mx-auto">
            <AlertTriangle size={24} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Cannot open editor
          </h3>
          <p className="text-sm text-slate-500">{sessionError}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl
                       text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 min-h-full bg-[#EBEBFF]">

      <EditorHeader
        templateName ={result.template?.name ?? 'Result Editor'}
        patientName  ={patientName}
        saveStatus   ={saveStatus}
        isSubmitting ={isSubmitting}
        onSave       ={doSave}
        onSubmit     ={handleSubmit}
        onClose      ={handleClose}
      />

      <div className="p-6 space-y-4 max-w-3xl mx-auto">

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl
                          px-4 py-3 text-sm text-red-600">
            <p className="font-medium">{submitError}</p>
            {missingFields.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {missingFields.map((f) => (
                  <li key={f} className="text-xs">· {f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {schema?.groups.map((group: SchemaGroup) => (
          <div key={group.id}
               className="bg-white rounded-2xl shadow-sm overflow-hidden">

            <button
              type="button"
              onClick={() => group.collapsible && toggleGroup(group.id)}
              className={cn(
                'w-full flex items-center justify-between px-6 py-4',
                'border-b border-slate-100',
                group.collapsible && 'hover:bg-slate-50 transition-colors',
              )}
            >
              <h3 className="text-sm font-semibold text-slate-700">
                {group.label}
              </h3>
              {group.collapsible && (
                collapsed[group.id]
                  ? <ChevronDown size={16} className="text-slate-400" />
                  : <ChevronUp   size={16} className="text-slate-400" />
              )}
            </button>

            {!collapsed[group.id] && (
              <div className={cn(
                'p-5',
                schema.layout === 'table'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4',
              )}>
                {group.fields.map((field) => (
                  <EditorField
                    key     ={field.id}
                    field   ={field}
                    value   ={draft[field.key]}
                    flag    ={flags[field.key] ?? null}
                    onChange={handleFieldChange}
                    disabled={!sessionOpen}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {schema?.interpretation?.enabled && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Interpretation
            </h3>
            {schema.interpretation.prompt && (
              <p className="text-xs text-slate-400 italic">
                {schema.interpretation.prompt}
              </p>
            )}
            <textarea
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              rows={4}
              placeholder="Enter clinical interpretation…"
              disabled={!sessionOpen}
              className="w-full rounded-xl border border-slate-200 px-4 py-3
                         text-sm text-slate-800 placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-300
                         resize-none disabled:bg-slate-50"
            />
          </div>
        )}

        <div className="flex justify-end pb-8">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !sessionOpen}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700
                       text-white text-sm font-medium rounded-full
                       transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Result'}
          </button>
        </div>

      </div>
    </div>
  )
}