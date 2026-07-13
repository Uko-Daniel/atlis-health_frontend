import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical,
} from 'lucide-react'
import {
  getTemplateById, createTemplate, updateTemplate,
  type TemplateGroup, type TemplateField, type TemplateItem,
} from '@/services/templateService'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Toggle } from '@/components/ui/atoms/Toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const DEPARTMENTS = ['LABORATORY', 'RADIOLOGY', 'CARDIOLOGY', 'PHARMACY']
type TemplateFieldType = TemplateField['type']
type TemplateSavePayload = Parameters<typeof createTemplate>[0]

interface TemplateErrorResponse {
  error?: string
}

interface TemplateEditorFormProps {
  id?: string
  isEdit: boolean
  existingTemplate?: TemplateItem
}

const FIELD_TYPES: TemplateFieldType[] = [
  'numeric',
  'text',
  'select',
  'multiselect',
  'richtext',
  'boolean',
  'calculated',
]

function getTemplateErrorMessage(error: unknown) {
  if (isAxiosError<TemplateErrorResponse>(error)) {
    return error.response?.data?.error ?? 'Failed to save'
  }

  return 'Failed to save'
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
  const isEdit = !!id

  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplateById(id!),
    enabled: isEdit,
  })

  if (isEdit && isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <TemplateEditorForm
      key={existingTemplate?.id ?? 'new'}
      id={id}
      isEdit={isEdit}
      existingTemplate={existingTemplate}
    />
  )
}

function TemplateEditorForm({ id, isEdit, existingTemplate }: TemplateEditorFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState(existingTemplate?.name ?? '')
  const [description, setDescription] = useState(existingTemplate?.description ?? '')
  const [department, setDepartment] = useState(existingTemplate?.department ?? 'LABORATORY')
  const [groups, setGroups] = useState<TemplateGroup[]>(existingTemplate?.dataSchema?.groups ?? [emptyGroup()])
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const saveMut = useMutation({
    mutationFn: (data: TemplateSavePayload) => isEdit ? updateTemplate(id!, data) : createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(isEdit ? 'Template updated' : 'Template created')
      navigate('/templates')
    },
    onError: (err: unknown) => toast.error(getTemplateErrorMessage(err)),
  })

  const handleSave = () => {
    saveMut.mutate({
      name,
      description: description || undefined,
      department,
      dataSchema: {
        version: existingTemplate?.dataSchema?.version ?? 1,
        layout: 'sections',
        groups: groups.filter((g) => g.label.trim()),
        interpretation: { enabled: true },
        signature: { required: true, roles: ['HOD', 'DOCTOR'] },
      },
    })
  }

  const addGroup = () => setGroups([...groups, emptyGroup()])
  const removeGroup = (gi: number) => setGroups(groups.filter((_, i) => i !== gi))
  const updateGroup = (gi: number, data: Partial<TemplateGroup>) => {
    setGroups(groups.map((g, i) => (i === gi ? { ...g, ...data } : g)))
  }

  const addField = (gi: number) => {
    setGroups(groups.map((g, i) => (i === gi ? { ...g, fields: [...g.fields, emptyField()] } : g)))
  }
  const removeField = (gi: number, fi: number) => {
    setGroups(groups.map((g, i) =>
      i === gi ? { ...g, fields: g.fields.filter((_, j) => j !== fi) } : g,
    ))
  }
  const updateField = (gi: number, fi: number, data: Partial<TemplateField>) => {
    setGroups(groups.map((g, i) =>
      i === gi ? { ...g, fields: g.fields.map((f, j) => (j === fi ? { ...f, ...data } : f)) } : g,
    ))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A]"
        >
          <ArrowLeft size={15} /> Templates
        </button>
        <ButtonPill variant="primary" icon={Save} loading={saveMut.isPending} onClick={handleSave}>
          {isEdit ? 'Update Template' : 'Create Template'}
        </ButtonPill>
      </div>

      {/* Template Info */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8] p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Template Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full Blood Count" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Department *</Label>
            <Select value={department} onValueChange={setDepartment}>
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
            onChange={(e) => setDescription(e.target.value)}
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
            <Toggle
              checked={!collapsedGroups[group.id]}
              onChange={() => setCollapsedGroups((p) => ({ ...p, [group.id]: !p[group.id] }))}
            />
            <ButtonPill variant="ghost" size="sm" icon={Trash2} onClick={() => removeGroup(gi)} />
          </div>

          {!collapsedGroups[group.id] && (
            <div className="p-4 space-y-3">
              {group.fields.map((field, fi) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-[#F8FAFF]">
                  <div className="col-span-4">
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(gi, fi, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="Field label"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(gi, fi, { type: v as TemplateFieldType })}
                    >
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={field.unit ?? ''}
                      onChange={(e) => updateField(gi, fi, { unit: e.target.value || undefined })}
                      placeholder="Unit"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Toggle
                      checked={field.required}
                      onChange={(v) => updateField(gi, fi, { required: v })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={
                        field.referenceRange?.general
                          ? `${field.referenceRange.general.min}-${field.referenceRange.general.max}`
                          : ''
                      }
                      onChange={(e) => {
                        const parts = e.target.value.split('-')
                        const min = parseFloat(parts[0])
                        const max = parseFloat(parts[1])
                        if (!isNaN(min) && !isNaN(max)) {
                          updateField(gi, fi, { referenceRange: { general: { min, max } } })
                        } else if (!e.target.value) {
                          updateField(gi, fi, { referenceRange: undefined })
                        }
                      }}
                      placeholder="Ref range (e.g. 12-16)"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <ButtonPill variant="ghost" size="sm" icon={Trash2} onClick={() => removeField(gi, fi)} />
                  </div>
                </div>
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
  )
}
