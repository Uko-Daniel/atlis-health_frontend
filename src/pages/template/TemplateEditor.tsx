import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical,
  ChevronDown, ChevronUp, Clock,
} from 'lucide-react'
import {
  getTemplateById, createTemplate, updateTemplate,
  type TemplateGroup, type TemplateField,
} from '@/services/templateService'
import TemplateFieldEditor from '@/components/template/TemplateFieldEditor'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

const DEPARTMENTS = ['LABORATORY', 'RADIOLOGY', 'CARDIOLOGY', 'PHARMACY']

interface TemplateEditorDraft {
  name?: string
  description?: string
  department?: string
  groups?: TemplateGroup[]
  rangeInputs?: Record<string, string>
}

interface TemplateSavePayload {
  name: string
  description?: string
  department: string
  dataSchema: {
    version: number
    layout: 'sections'
    groups: TemplateGroup[]
    interpretation: { enabled: boolean }
    signature: { required: boolean; roles: string[] }
  }
}

interface ApiErrorResponse {
  error?: string
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? fallback
  }
  return fallback
}

function emptyField(): TemplateField {
  return {
    id: crypto.randomUUID(),
    key: '',
    label: '',
    type: 'numeric',
    unit: '',
    required: false,
    precision: 1,
    flagLogic: 'auto',
  }
}

function emptyGroup(): TemplateGroup {
  return {
    id: crypto.randomUUID(),
    label: '',
    collapsible: false,
    fields: [emptyField()],
  }
}

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState('LABORATORY')
  const [groups, setGroups] = useState<TemplateGroup[]>([emptyGroup()])
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [rangeInputs, setRangeInputs] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplateById(id!),
    enabled: isEdit,
  })

  // Populate from existing template
  useEffect(() => {
    if (existingTemplate) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(existingTemplate.name)
      setDescription(existingTemplate.description ?? '')
      setDepartment(existingTemplate.department)
      setGroups(existingTemplate.dataSchema?.groups ?? [emptyGroup()])

      const ranges: Record<string, string> = {}
      existingTemplate.dataSchema?.groups?.forEach((g: TemplateGroup) => {
        g.fields?.forEach((f: TemplateField) => {
          if (f.referenceRange?.general) {
            ranges[f.id] = `${f.referenceRange.general.min}-${f.referenceRange.general.max}`
          }
        })
      })
      setRangeInputs(ranges)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [existingTemplate])

  // Load draft from localStorage on mount (new templates only)
  useEffect(() => {
    if (isEdit) return
    const saved = localStorage.getItem('template-editor-draft')
    if (!saved) return
    try {
      const draft = JSON.parse(saved) as TemplateEditorDraft
      /* eslint-disable react-hooks/set-state-in-effect */
      if (draft.name) setName(draft.name)
      if (draft.description) setDescription(draft.description)
      if (draft.department) setDepartment(draft.department)
      if (draft.groups && Array.isArray(draft.groups)) setGroups(draft.groups)
      if (draft.rangeInputs) setRangeInputs(draft.rangeInputs)
      setIsDirty(true)
      /* eslint-enable react-hooks/set-state-in-effect */
      toast.info('Draft restored')
    } catch { /* ignore corrupt draft */ }
  }, [isEdit])

  // Auto-save draft every 10s
  useEffect(() => {
    if (!isDirty) return
    const interval = setInterval(() => {
      const draft = { name, description, department, groups, rangeInputs }
      localStorage.setItem('template-editor-draft', JSON.stringify(draft))
      setLastSaved(new Date())
    }, 10_000)
    return () => clearInterval(interval)
  }, [isDirty, name, description, department, groups, rangeInputs])

  // Mark dirty on any change
  const markDirty = () => { if (!isDirty) setIsDirty(true) }

  const saveMut = useMutation({
    mutationFn: (data: TemplateSavePayload) => isEdit ? updateTemplate(id!, data) : createTemplate(data),
    onSuccess: () => {
      localStorage.removeItem('template-editor-draft')
      setIsDirty(false)
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(isEdit ? 'Template updated' : 'Template created')
      navigate('/templates')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to save')),
  })

  const handleSave = () => {
    const validGroups = groups.filter((g) => g.label.trim() && g.fields.length > 0)
    if (validGroups.length === 0) {
      toast.error('Add at least one group with a label and field')
      return
    }

    saveMut.mutate({
      name,
      description: description || undefined,
      department,
      dataSchema: {
        version: existingTemplate?.dataSchema?.version ?? 1,
        layout: 'sections',
        groups: validGroups,
        interpretation: { enabled: true },
        signature: { required: true, roles: ['HOD', 'DOCTOR'] },
      },
    })
  }

  const handleCancel = () => {
    if (isDirty && !confirm('Discard unsaved changes?')) return
    localStorage.removeItem('template-editor-draft')
    navigate('/templates')
  }

  const addGroup = () => { setGroups([...groups, emptyGroup()]); markDirty() }
  const removeGroup = (gi: number) => { setGroups(groups.filter((_, i) => i !== gi)); markDirty() }
  const updateGroup = (gi: number, data: Partial<TemplateGroup>) => {
    setGroups(groups.map((g, i) => (i === gi ? { ...g, ...data } : g)))
    markDirty()
  }

  const addField = (gi: number) => {
    setGroups(groups.map((g, i) => (i === gi ? { ...g, fields: [...g.fields, emptyField()] } : g)))
    markDirty()
  }
  const removeField = (gi: number, fi: number) => {
    setGroups(groups.map((g, i) =>
      i === gi ? { ...g, fields: g.fields.filter((_, j) => j !== fi) } : g,
    ))
    markDirty()
  }
  const updateField = (gi: number, fi: number, data: Partial<TemplateField>) => {
    setGroups(groups.map((g, i) =>
      i === gi ? { ...g, fields: g.fields.map((f, j) => (j === fi ? { ...f, ...data } : f)) } : g,
    ))
    markDirty()
  }

  const getRangeValue = (fieldId: string): string => rangeInputs[fieldId] ?? ''

  const setRangeValue = (gi: number, fi: number, fieldId: string, value: string) => {
    setRangeInputs((prev) => ({ ...prev, [fieldId]: value }))
    markDirty()

    if (!value.trim()) {
      updateField(gi, fi, { referenceRange: undefined })
      return
    }

    const parts = value.split('-')
    const min = parseFloat(parts[0])
    const max = parseFloat(parts[1])
    if (!isNaN(min) && !isNaN(max) && parts.length === 2) {
      updateField(gi, fi, { referenceRange: { general: { min, max } } })
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A]"
          >
            <ArrowLeft size={15} /> Templates
          </button>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-[#10B981] flex items-center gap-1">
                <Clock size={11} />
                Draft saved {lastSaved.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <ButtonPill variant="ghost" onClick={handleCancel}>
              Cancel
            </ButtonPill>
            <ButtonPill variant="primary" icon={Save} loading={saveMut.isPending} onClick={handleSave}>
              {isEdit ? 'Commit Changes' : 'Create Template'}
            </ButtonPill>
          </div>
        </div>

        {/* Template Info */}
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Template Name *</Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); markDirty() }}
                placeholder="e.g. Full Blood Count"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Department *</Label>
              <Select value={department} onValueChange={(v) => { setDepartment(v); markDirty() }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty() }}
              rows={2}
              className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30"
            />
          </div>
        </div>

        {/* Groups */}
        {groups.map((group, gi) => (
          <div key={group.id} className="bg-white rounded-2xl border border-[#EEF1F8] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 bg-[#FAFBFF] border-b border-[#EEF1F8]">
              <GripVertical size={14} className="text-[#CBD5E1]" />
              <Input
                value={group.label}
                onChange={(e) => updateGroup(gi, { label: e.target.value })}
                placeholder="Group name (e.g. Red Cell Indices)"
                className="flex-1 border-0 bg-transparent text-sm font-medium p-0 h-auto focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCollapsedGroups((p) => ({ ...p, [group.id]: !p[group.id] }))}
                className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
                title={collapsedGroups[group.id] ? 'Expand group' : 'Collapse group'}
              >
                {collapsedGroups[group.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              <ButtonPill variant="ghost" size="sm" icon={Trash2} onClick={() => removeGroup(gi)} />
            </div>

            {!collapsedGroups[group.id] && (
              <div className="p-4 space-y-3">
                {group.fields.map((field, fi) => (
                  <TemplateFieldEditor
                    key={field.id}
                    field={field}
                    allFields={group.fields}
                    rangeValue={getRangeValue(field.id)}
                    onChange={(data) => updateField(gi, fi, data)}
                    onRangeChange={(value) => setRangeValue(gi, fi, field.id, value)}
                    onRemove={() => removeField(gi, fi)}
                  />
                ))}

                <ButtonPill variant="ghost" size="sm" icon={Plus} onClick={() => addField(gi)}>
                  Add Field
                </ButtonPill>
              </div>
            )}
          </div>
        ))}

        <ButtonPill variant="outline" icon={Plus} onClick={addGroup}>
          Add Group
        </ButtonPill>
      </div>
    </TooltipProvider>
  )
}
