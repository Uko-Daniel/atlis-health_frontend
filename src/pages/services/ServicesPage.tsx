import { useState, useMemo, type ElementType } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import {
  Plus, Search, Edit2, Trash2, FlaskConical, Scan, FileText,
  Save, AlertTriangle, Check, LayoutTemplate, X,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ServiceItem {
  id: string
  name: string
  labCode: string | null
  category: string
  description: string | null
  price: number
  templateId: string | null
  template?: { id: string; name: string } | null
  createdAt: string
}

interface ServicePayload {
  name: string
  labCode: string | null
  category: string
  price: number
  description: string | null
  templateId: string | null
}

interface ApiErrorResponse {
  error?: string
}

type UpdateServiceVariables = { id: string; data: ServicePayload }

const CATEGORIES = [
  'Hematology', 'Parasitology', 'Chemistry', 'Microbiology',
  'Serology', 'Pathology', 'Imaging', 'Cardiology', 'Other',
]

const CATEGORY_ICONS: Record<string, ElementType> = {
  Hematology: FlaskConical, Parasitology: FlaskConical,
  Chemistry: FlaskConical, Microbiology: FlaskConical,
  Serology: FlaskConical, Pathology: FlaskConical,
  Imaging: Scan,
  Cardiology: FileText, Other: FileText,
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? fallback
  }
  return fallback
}

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canManage = ['IT_SUPPORT', 'ADMIN'].includes(user?.role ?? '')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [updateConfirmText, setUpdateConfirmText] = useState('')

  const [formName, setFormName] = useState('')
  const [formLabCode, setFormLabCode] = useState('')
  const [formCategory, setFormCategory] = useState('Hematology')
  const [formPrice, setFormPrice] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTemplateId, setFormTemplateId] = useState('')
  const [formTemplateName, setFormTemplateName] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get<ServiceItem[]>('/services')
      return res.data
    },
  })

  const { data: templates } = useQuery({
    queryKey: ['templates', 'active', 'list'],
    queryFn: async () => {
      const res = await api.get('/templates', { params: { activeOnly: true, limit: 50 } })
      const payload = res.data
      const list = Array.isArray(payload) ? payload : (payload?.data ?? [])
      return (list as any[]).map((t: any) => ({ id: String(t.id), name: String(t.name ?? 'Unnamed') }))
    },
    enabled: showCreate || !!editingService,
  })

  const filteredTemplates = useMemo(() => {
    const list = templates ?? []
    if (!templateSearch.trim()) return list
    const q = templateSearch.toLowerCase()
    return list.filter((t) => t.name.toLowerCase().includes(q))
  }, [templates, templateSearch])

  const selectedTemplateName = formTemplateId
    ? (templates ?? []).find((t) => t.id === formTemplateId)?.name ?? formTemplateName
    : ''

  const filtered = (services ?? []).filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.labCode?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const createMut = useMutation({
    mutationFn: (data: ServicePayload) => api.post('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service created')
      resetForm()
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to create service')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: UpdateServiceVariables) => api.put(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service updated')
      setEditingService(null)
      setUpdateConfirmText('')
      resetForm()
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to update')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service deleted')
      setDeleteTarget(null)
      setDeleteConfirmText('')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to delete')),
  })

  const resetForm = () => {
    setFormName('')
    setFormLabCode('')
    setFormCategory('Hematology')
    setFormPrice('')
    setFormDescription('')
    setFormTemplateId('')
    setFormTemplateName('')
    setTemplateSearch('')
    setShowCreate(false)
    setUpdateConfirmText('')
  }

  const openEdit = (service: ServiceItem) => {
    setFormName(service.name)
    setFormLabCode(service.labCode ?? '')
    setFormCategory(service.category)
    setFormPrice(String(service.price))
    setFormDescription(service.description ?? '')
    setFormTemplateId(service.templateId ?? '')
    setFormTemplateName(service.template?.name ?? '')
    setEditingService(service)
  }

  const handleSave = () => {
    const data: ServicePayload = {
      name: formName,
      labCode: formLabCode || null,
      category: formCategory,
      price: parseFloat(formPrice),
      description: formDescription || null,
      templateId: formTemplateId || null,
    }
    if (editingService) {
      updateMut.mutate({ id: editingService.id, data })
    } else {
      createMut.mutate(data)
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending
  const isModalOpen = showCreate || !!editingService

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Services</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Manage your facility's service catalog and pricing</p>
        </div>
        {canManage && (
          <ButtonPill variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>Add Service</ButtonPill>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or lab code…" className="pl-9 border-[#EEF1F8]" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 border-[#EEF1F8]"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-16 rounded-2xl" />))}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((service) => {
            const Icon = CATEGORY_ICONS[service.category] ?? FileText
            return (
              <div key={service.id} className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFF]"><Icon size={16} className="text-[#5580F4]" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{service.name}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {service.category}
                      {service.labCode && <span className="ml-2 font-mono">{service.labCode}</span>}
                      {service.template && <span className="ml-2">· {service.template.name}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-[#5580F4]">{naira(service.price)}</span>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <ButtonPill variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(service)} />
                      <ButtonPill variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(service)} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
              <FlaskConical size={24} className="text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">No services found</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal — wider, shorter, scrollable */}
      <Dialog open={isModalOpen} onOpenChange={(v) => { if (!v) { resetForm(); setEditingService(null) } }}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-bold text-[#0F172A]">{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Name + Lab Code row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="border-[#EEF1F8]" placeholder="e.g. Complete Blood Count" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">Lab Code</Label>
                <Input value={formLabCode} onChange={(e) => setFormLabCode(e.target.value)} className="border-[#EEF1F8]" placeholder="CBC" />
              </div>
            </div>

            {/* Price + Category row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">Price (₦) *</Label>
                <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="border-[#EEF1F8]" placeholder="5000" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-[#64748B]">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="border-[#EEF1F8]"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Template picker */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Template</Label>
              {formTemplateId ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-[#F0F4FF] rounded-xl px-3 py-2 border border-[#5580F4]/30">
                    <LayoutTemplate size={14} className="text-[#5580F4] shrink-0" />
                    <span className="text-sm font-medium text-[#5580F4] truncate">{selectedTemplateName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFormTemplateId(''); setFormTemplateName('') }}
                    className="text-[#94A3B8] hover:text-[#EF4444] transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border border-[#EEF1F8] rounded-xl overflow-hidden">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <Input
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      placeholder="Search templates by name…"
                      className="pl-8 border-0 rounded-b-none focus:ring-0"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-[#F8FAFF]">
                    <button
                      type="button"
                      onClick={() => { setFormTemplateId(''); setFormTemplateName(''); setTemplateSearch('') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#94A3B8] hover:bg-[#F8FAFF] transition-colors"
                    >
                      No template
                    </button>
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setFormTemplateId(t.id); setFormTemplateName(t.name); setTemplateSearch('') }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm hover:bg-[#F0F4FF] transition-colors flex items-center justify-between',
                          formTemplateId === t.id ? 'text-[#5580F4] font-medium' : 'text-[#0F172A]',
                        )}
                      >
                        {t.name}
                        {formTemplateId === t.id && <Check size={14} className="text-[#5580F4] shrink-0" />}
                      </button>
                    ))}
                    {templateSearch && filteredTemplates.length === 0 && (
                      <p className="px-4 py-3 text-sm text-[#94A3B8] text-center">No templates match "{templateSearch}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-[#64748B]">Description</Label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-[#EEF1F8] px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30"
                placeholder="Optional description…"
              />
            </div>

            {/* Update confirmation */}
            {editingService && (
              <div className="bg-[#FFFBEB] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#F59E0B]" />
                  <p className="text-xs font-medium text-[#92400E]">Type <strong>UPDATE</strong> to confirm changes</p>
                </div>
                <Input value={updateConfirmText} onChange={(e) => setUpdateConfirmText(e.target.value)} placeholder="Type UPDATE" className="border-[#FDE68A] text-sm" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 shrink-0 pt-2">
            <ButtonPill variant="ghost" onClick={() => { resetForm(); setEditingService(null) }}>Cancel</ButtonPill>
            <ButtonPill
              variant="primary"
              icon={Save}
              loading={isSaving}
              onClick={handleSave}
              disabled={!formName || !formPrice || (!!editingService && updateConfirmText !== 'UPDATE')}
            >
              {editingService ? 'Update' : 'Create'}
            </ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => { setDeleteTarget(null); setDeleteConfirmText('') }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#FEF2F2]"><AlertTriangle size={17} className="text-[#EF4444]" /></div>
              <DialogTitle className="text-base font-bold text-[#0F172A]">Delete Service</DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-[#64748B]">This will permanently delete <span className="font-medium text-[#0F172A]">{deleteTarget?.name}</span>. This action cannot be undone.</p>
          <div className="space-y-2"><p className="text-xs font-medium text-[#64748B]">Type <strong>DELETE</strong> to confirm</p><Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" className="border-[#FECACA]" /></div>
          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => { setDeleteTarget(null); setDeleteConfirmText('') }}>Cancel</ButtonPill>
            <ButtonPill variant="danger" loading={deleteMut.isPending} disabled={deleteConfirmText !== 'DELETE'} onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}>Delete</ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}