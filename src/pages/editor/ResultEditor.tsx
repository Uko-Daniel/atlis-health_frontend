import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'

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

import type {
  DataSchema, DraftData, FlagMap,
  DraftGroup, SchemaField,
} from '@/types/editor'
import EditorHeader from '@/components/editor/EditorHeader'
import EditorField  from '@/components/editor/EditorField'
import { Skeleton } from '@/components/ui/skeleton'
import { cn }       from '@/lib/utils'

const AUTOSAVE_INTERVAL  = 30_000
const HEARTBEAT_INTERVAL = 300_000
const FLAG_DEBOUNCE      = 800

// ── Helpers: convert between flat DraftData and nested groups ─

function flatToGroups(
  flat: DraftData,
  schema: DataSchema,
): { groups: DraftGroup[]; interpretation: string } {
  return {
    groups: schema.groups.map((g) => ({
      groupId: g.id,
      fields: g.fields.map((f) => ({
        fieldId: f.id,
        key: f.key,
        value: flat[f.key] ?? null,
      })),
    })),
    interpretation: (flat._interpretation as string) ?? '',
  }
}

function groupsToFlat(groups: DraftGroup[], interpretation?: string): DraftData {
  const flat: DraftData = {}
  for (const group of groups) {
    for (const field of group.fields) {
      flat[field.key] = field.value
    }
  }
  if (interpretation) flat._interpretation = interpretation
  return flat
}

// ── Normalize template schema for simple { fields: [] } format ─

interface NormalizedGroup {
  id: string
  label: string
  collapsible: boolean
  fields: SchemaField[]
}

interface SimpleTemplateField {
  name?:  string
  type?:  string
  unit?:  string
  range?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeSchema(raw: unknown): NormalizedGroup[] | null {
  if (!raw) return null
  if (!isRecord(raw)) return null

  // Proper groups format
  if (raw.groups && Array.isArray(raw.groups)) {
    return raw.groups as NormalizedGroup[]
  }

  // Simple fields format — wrap in a single group
  if (raw.fields && Array.isArray(raw.fields)) {
    return [{
      id: 'default-group',
      label: 'Results',
      collapsible: false,
      fields: raw.fields.map((field, i): SchemaField => {
        const f = isRecord(field) ? field as SimpleTemplateField : {}
        const name = f.name ?? `field-${i}`

        return {
          id: name,
          key: name,
          label: f.name
            ?.replace(/_/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? `Field ${i + 1}`,
          type: f.type === 'text' ? 'text' : f.type === 'boolean' ? 'boolean' : 'numeric',
          unit: f.unit ?? undefined,
          required: false,
          referenceRange: f.range ? { default: parseRange(f.range) } : undefined,
        }
      }),
    }]
  }

  return null
}

function parseRange(rangeStr: string): { min: number; max: number } | undefined {
  const parts = rangeStr.split('-')
  if (parts.length === 2) {
    const min = parseFloat(parts[0])
    const max = parseFloat(parts[1])
    if (!isNaN(min) && !isNaN(max)) return { min, max }
  }
  return undefined
}

// ── Main component ──────────────────────────────────────────

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

  const autoSaveRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const flagTimers   = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const draftRef     = useRef<DraftData>({})
  const patientIdRef = useRef<string>('')
  const sessionRef   = useRef<boolean>(false)
  const resultIdRef  = useRef<string | undefined>(resultId)
  const schemaRef    = useRef<NormalizedGroup[] | null>(null)

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['results', resultId],
    queryFn:  () => getResultById(resultId!),
    enabled:  !!resultId,
  })

  // Normalize the raw dataSchema from the template
  const rawSchema = result?.template?.dataSchema as Record<string, unknown> | undefined
  const schema = rawSchema ? normalizeSchema(rawSchema) : null

  const patientName = result?.patient
    ? `${result.patient.firstName} ${result.patient.lastName}`
    : '—'

  // Keep refs in sync
  useEffect(() => { draftRef.current     = draft },      [draft])
  useEffect(() => { sessionRef.current   = sessionOpen }, [sessionOpen])
  useEffect(() => { patientIdRef.current = result?.patientId ?? '' }, [result?.patientId])
  useEffect(() => { schemaRef.current    = schema },      [schema])

  // ── Build DataSchema for flatToGroups conversion ──────────
  const dataSchema: DataSchema | null = schema
    ? {
        version: 1,
        layout: 'sections',
        groups: schema.map((g) => ({
          id: g.id,
          label: g.label,
          collapsible: g.collapsible,
          fields: g.fields.map((f) => ({
            id: f.id,
            key: f.key,
            label: f.label,
            type: f.type,
            unit: f.unit,
            required: f.required,
            referenceRange: f.referenceRange,
            criticalRange: f.criticalRange,
            precision: f.precision,
            flagLogic: f.flagLogic,
            options: f.options,
            formula: f.formula,
            formulaInputs: f.formulaInputs,
            hint: f.hint,
            placeholder: f.placeholder,
          })),
        })),
        interpretation: { enabled: true },
        signature: { required: false, roles: [] },
      }
    : null

  // ── Save function — converts flat draft to groups for backend ──
  const doSave = useCallback(async () => {
    const rid = resultIdRef.current
    const pid = patientIdRef.current
    const sch = schemaRef.current
    const d   = draftRef.current
    if (!rid || !pid || !sessionRef.current || !sch || !dataSchema) return

    setSaveStatus('saving')
    try {
      const { groups } = flatToGroups(d, dataSchema)
      await saveDraft(rid, { schemaVersion: 1, groups, interpretation: d._interpretation as string }, pid)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    }
  }, [dataSchema])

  // ── Open session on mount ──────────────────────────────────
  useEffect(() => {
    if (!resultId || !result || !schema) return

    resultIdRef.current = resultId
    let cancelled = false

    openSession(resultId)
      .then((session) => {
        if (cancelled) return
        setSessionOpen(true)
        sessionRef.current = true

        if (session.draftData && schema) {
          // Backend returns groups format — convert to flat for UI
          const draftData = session.draftData as { groups?: DraftGroup[]; interpretation?: string }
          if (draftData.groups) {
            const flat = groupsToFlat(draftData.groups, draftData.interpretation)
            setDraft(flat)
            draftRef.current = flat
            if (draftData.interpretation) setInterpretation(draftData.interpretation)
          }
        }
      })
      .catch((err: { response?: { data?: { error?: string } }; message: string }) => {
        if (!cancelled) setSessionError(err.response?.data?.error ?? err.message)
      })

    return () => {
      cancelled = true
      if (resultId) closeSession(resultId).catch(() => {})
      clearInterval(autoSaveRef.current)
      clearInterval(heartbeatRef.current)
      const timers = flagTimers.current
      Object.values(timers).forEach(clearTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId, result?.id, !!schema])

  // ── Auto-save interval ────────────────────────────────────
  useEffect(() => {
    if (!sessionOpen || !resultId) return
    autoSaveRef.current = setInterval(doSave, AUTOSAVE_INTERVAL)
    return () => clearInterval(autoSaveRef.current)
  }, [sessionOpen, resultId, doSave])

  // ── Heartbeat interval ────────────────────────────────────
  useEffect(() => {
    if (!sessionOpen || !resultId) return
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(resultId).catch(() => {})
    }, HEARTBEAT_INTERVAL)
    return () => clearInterval(heartbeatRef.current)
  }, [sessionOpen, resultId])

  // ── beforeunload ──────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (resultIdRef.current) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_BASE_URL}/editor/${resultIdRef.current}/session`,
          new Blob([], { type: 'application/json' }),
        )
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── Field change handler ──────────────────────────────────
  const handleFieldChange = (key: string, value: unknown) => {
    const newDraft = { ...draftRef.current, [key]: value }
    setDraft(newDraft)
    draftRef.current = newDraft

    // Debounced flag call
    if (typeof value === 'number' || value === null) {
      clearTimeout(flagTimers.current[key])
      flagTimers.current[key] = setTimeout(async () => {
        const rid = resultIdRef.current
        const pid = patientIdRef.current
        if (!rid || !pid) return

        // Find the fieldId for this key
        const sch = schemaRef.current
        const field = sch?.flatMap((g) => g.fields).find((f) => f.key === key)
        if (!field) return

        try {
          const res = await flagField(rid, field.id, value, pid)
          setFlags((prev) => ({ ...prev, [key]: res.flag }))
        } catch {
          // silently ignore
        }
      }, FLAG_DEBOUNCE)
    }

    // Formula recalculation
    const sch = schemaRef.current
    const isFormulaInput = sch
      ?.flatMap((g) => g.fields)
      .some((f) => f.type === 'calculated' && f.formulaInputs?.includes(key))

    if (isFormulaInput && dataSchema) {
      const rid = resultIdRef.current
      const pid = patientIdRef.current
      if (!rid || !pid) return

      const { groups } = flatToGroups(newDraft, dataSchema)
      calculateFields(rid, { schemaVersion: 1, groups }, pid)
        .then((recalculated) => {
          if (recalculated.groups) {
            const flat = groupsToFlat(recalculated.groups as unknown as DraftGroup[])
            setDraft((prev) => ({ ...prev, ...flat }))
            draftRef.current = { ...draftRef.current, ...flat }
          }
        })
        .catch(() => {})
    }
  }

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    const rid = resultIdRef.current
    const pid = patientIdRef.current
    const sch = schemaRef.current
    if (!rid || !pid || !sch || !dataSchema) return

    setIsSubmitting(true)
    setSubmitError(null)
    setMissingFields([])

    try {
      const { groups } = flatToGroups(draftRef.current, dataSchema)
      const res = await submitResult(
        rid,
        { schemaVersion: 1, groups, interpretation },
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
          <button onClick={() => navigate(-1)}
            className="mt-2 text-sm text-slate-500 underline">
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
          <button onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl
                       text-sm font-medium hover:bg-slate-700 transition-colors">
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (!schema || schema.length === 0) {
    return (
      <div className="-m-6 min-h-full bg-[#EBEBFF] p-6">
        <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl p-8
                        shadow-sm text-center space-y-3">
          <AlertTriangle size={24} className="text-amber-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-800">
            No template configured
          </h3>
          <p className="text-sm text-slate-500">
            This service doesn't have a result template yet.
            Ask an administrator to create one.
          </p>
          <button onClick={() => navigate(-1)}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl
                       text-sm font-medium hover:bg-slate-700 transition-colors">
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

        {schema.map((group) => (
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
                  ? <span className="text-slate-400 text-xs">Show</span>
                  : <span className="text-slate-400 text-xs">Hide</span>
              )}
            </button>

            {!collapsed[group.id] && (
              <div className={cn(
                'p-5',
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
              )}>
                {group.fields.map((field) => (
                  <EditorField
                    key      ={field.id}
                    field    ={field}
                    value    ={draft[field.key]}
                    flag     ={flags[field.key] ?? null}
                    onChange ={handleFieldChange}
                    disabled ={!sessionOpen}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Interpretation
          </h3>
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

      </div>
    </div>
  )
}
