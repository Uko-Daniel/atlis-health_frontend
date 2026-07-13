import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  LayoutTemplate, Search, FlaskConical, Scan, FileText,
  ChevronRight, Edit2, Trash2, AlertTriangle, CheckCircle,
} from 'lucide-react'
import { getTemplates, deactivateTemplate, activateTemplate } from '@/services/templateService'
import { useAuthStore } from '@/stores/authStore'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

const DEPARTMENTS = ['ALL', 'LABORATORY', 'RADIOLOGY', 'CARDIOLOGY', 'PHARMACY']

const TYPE_ICONS: Record<string, React.ElementType> = {
  LAB: FlaskConical,
  IMAGING: Scan,
  OTHER: FileText,
}

export default function TemplatesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canManage = ['IT_SUPPORT', 'ADMIN'].includes(user?.role ?? '')

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['templates', deptFilter],
    queryFn: () => getTemplates({
      department: deptFilter === 'ALL' ? undefined : deptFilter,
      activeOnly: false,
      limit: 50,
    }),
  })

  const templates = data?.data ?? []
  const filtered = templates
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => {
      if (statusFilter === 'active') return t.isActive
      if (statusFilter === 'inactive') return !t.isActive
      return true
    })

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">Templates</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Result templates for lab and imaging services
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="pl-9 border-[#EEF1F8]"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44 border-[#EEF1F8]">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d === 'ALL' ? 'All departments' : d.charAt(0) + d.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-32 border-[#EEF1F8]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((template) => {
            const Icon = TYPE_ICONS[template.type] ?? FileText
            const fieldCount = template.dataSchema?.groups?.reduce(
              (sum, g) => sum + (g.fields?.length ?? 0), 0,
            ) ?? 0

            return (
              <div
                key={template.id}
                onClick={() => navigate(`/templates/${template.id}`)}
                className="bg-white rounded-2xl border border-[#EEF1F8]
                           shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4
                           flex items-center justify-between gap-4
                           cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFF]">
                    <Icon size={16} className="text-[#5580F4]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {template.name}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {template.department.charAt(0) + template.department.slice(1).toLowerCase()}
                      {' · v'}{template.version}
                      {fieldCount > 0 && ` · ${fieldCount} field${fieldCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {canManage && (
                    <>
                      {!template.isActive && (
                        <ButtonPill
                          variant="ghost"
                          size="sm"
                          icon={CheckCircle}
                          onClick={async () => {
                            try {
                              await activateTemplate(template.id)
                              toast.success('Template reactivated')
                              queryClient.invalidateQueries({ queryKey: ['templates'] })
                            } catch {
                              toast.error('Failed to reactivate')
                            }
                          }}
                        />
                      )}
                      {template.isActive && (
                        <>
                          <ButtonPill
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => navigate(`/templates/${template.id}/edit`)}
                          />
                          <ButtonPill
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeactivateTarget({ id: template.id, name: template.name })}
                          />
                        </>
                      )}
                    </>
                  )}
                  <StatusBadge
                    variant={template.isActive ? 'success' : 'default'}
                    label={template.isActive ? 'Active' : 'Inactive'}
                  />
                  <ChevronRight size={16} className="text-[#CBD5E1]" />
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
              <LayoutTemplate size={24} className="text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">No templates found</p>
            </div>
          )}
        </div>
      )}

      {/* Deactivate Modal */}
      <Dialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
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
            Deactivate <span className="font-medium">{deactivateTarget?.name}</span>? It can be reactivated by an administrator.
          </p>
          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => setDeactivateTarget(null)}>Cancel</ButtonPill>
            <ButtonPill
              variant="danger"
              onClick={async () => {
                if (!deactivateTarget) return
                try {
                  await deactivateTemplate(deactivateTarget.id)
                  toast.success('Template deactivated')
                  queryClient.invalidateQueries({ queryKey: ['templates'] })
                  setDeactivateTarget(null)
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