import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, FlaskConical, Scan, FileText, Edit2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { getTemplateById, deactivateTemplate, activateTemplate, type TemplateField, type TemplateGroup } from '@/services/templateService'
import { useAuthStore } from '@/stores/authStore'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

const TYPE_ICONS: Record<string, React.ElementType> = {
  LAB: FlaskConical,
  IMAGING: Scan,
  OTHER: FileText,
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  numeric: 'Number',
  text: 'Text',
  select: 'Dropdown',
  multiselect: 'Multi-select',
  richtext: 'Rich text',
  calculated: 'Calculated',
  boolean: 'Yes/No',
}

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canManage = ['IT_SUPPORT', 'ADMIN'].includes(user?.role ?? '')
  const [showDeactivate, setShowDeactivate] = useState(false)

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplateById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-bold text-[#0F172A]">Template not found</p>
        <ButtonPill variant="ghost" icon={ArrowLeft} onClick={() => navigate('/templates')}>
          Back to Templates
        </ButtonPill>
      </div>
    )
  }

  const Icon = TYPE_ICONS[template.type] ?? FileText
  const groups = template.dataSchema?.groups ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => navigate('/templates')}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft size={15} /> Templates
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFF]">
            <Icon size={22} className="text-[#5580F4]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-bold text-[#0F172A]">{template.name}</h2>
              <StatusBadge
                variant={template.isActive ? 'success' : 'default'}
                label={template.isActive ? 'Active' : 'Inactive'}
              />
            </div>
            {template.description && (
              <p className="text-sm text-[#64748B] mb-2">{template.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
              <span>{template.department.charAt(0) + template.department.slice(1).toLowerCase()}</span>
              <span>·</span>
              <span>v{template.version}</span>
            </div>

            {/* ── Actions ─────────────────────────────────── */}
            {canManage && (
              <div className="flex items-center gap-2 mt-4">
                {!template.isActive && (
                  <ButtonPill
                    variant="success"
                    size="sm"
                    icon={CheckCircle}
                    onClick={async () => {
                      try {
                        await activateTemplate(template.id)
                        toast.success('Template reactivated')
                        queryClient.invalidateQueries({ queryKey: ['template', id] })
                      } catch {
                        toast.error('Failed to reactivate')
                      }
                    }}
                  >
                    Reactivate
                  </ButtonPill>
                )}
                {template.isActive && (
                  <>
                    <ButtonPill
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                    >
                      Edit
                    </ButtonPill>
                    <ButtonPill
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setShowDeactivate(true)}
                    >
                      Deactivate
                    </ButtonPill>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Groups */}
      {groups.map((group: TemplateGroup) => (
        <div key={group.id} className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
            <h3 className="text-sm font-bold text-[#0F172A]">{group.label}</h3>
            {group.collapsible && (
              <p className="text-xs text-[#94A3B8] mt-0.5">Collapsible group</p>
            )}
          </div>

          <div className="divide-y divide-[#F8FAFF]">
            {group.fields.map((field: TemplateField) => (
              <div key={field.id} className="flex items-start justify-between px-5 py-3.5 gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#0F172A]">{field.label}</p>
                    {field.required && (
                      <span className="text-xs text-red-500">Required</span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    <code className="font-mono text-[#5580F4] bg-[#F0F4FF] px-1 rounded">{field.key}</code>
                    {' · '}{FIELD_TYPE_LABELS[field.type] ?? field.type}
                    {field.unit && ` · ${field.unit}`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {field.referenceRange?.general && (
                    <p className="text-xs text-[#64748B]">
                      Ref: {field.referenceRange.general.min}–{field.referenceRange.general.max}
                      {field.unit ? ` ${field.unit}` : ''}
                    </p>
                  )}
                  {field.criticalRange && (
                    <p className="text-xs text-[#EF4444]">
                      Critical: &lt;{field.criticalRange.low ?? '—'} or &gt;{field.criticalRange.high ?? '—'}
                    </p>
                  )}
                  {field.formula && (
                    <p className="text-xs text-[#9B6DFF] font-mono">
                      = {field.formula}({field.formulaInputs?.join(', ')})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Services using this template */}
      {template.services && template.services.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Linked Services ({template.services.length})
            </h3>
          </div>
          <div className="divide-y divide-[#F8FAFF]">
            {template.services.map((s) => (
              <div key={s.id} className="px-5 py-3">
                <p className="text-sm text-[#0F172A]">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      <Dialog open={showDeactivate} onOpenChange={setShowDeactivate}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#FEF2F2]">
                <AlertTriangle size={17} className="text-[#EF4444]" />
              </div>
              <DialogTitle className="text-base font-bold text-[#0F172A]">Deactivate Template</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-[#64748B]">
            Deactivate <span className="font-medium">{template.name}</span>? It can be reactivated by an administrator.
          </p>
          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => setShowDeactivate(false)}>Cancel</ButtonPill>
            <ButtonPill
              variant="danger"
              onClick={async () => {
                try {
                  await deactivateTemplate(template.id)
                  toast.success('Template deactivated')
                  queryClient.invalidateQueries({ queryKey: ['template', id] })
                  setShowDeactivate(false)
                } catch {
                  toast.error('Failed to deactivate')
                }
              }}
            >Deactivate</ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}