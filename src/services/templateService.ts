import api from '@/lib/api'

export interface TemplateField {
  id: string
  key: string
  label: string
  type: 'numeric' | 'text' | 'select' | 'multiselect' | 'richtext' | 'calculated' | 'boolean'
  unit?: string
  required: boolean
  referenceRange?: {
    male?: { min: number; max: number }
    female?: { min: number; max: number }
    child?: { min: number; max: number }
    general?: { min: number; max: number }
  }
  criticalRange?: { low?: number; high?: number }
  precision?: number
  flagLogic?: 'auto' | 'manual'
  options?: string[]
  formula?: string
  formulaInputs?: string[]
  hint?: string
}

export interface TemplateGroup {
  id: string
  label: string
  collapsible: boolean
  fields: TemplateField[]
}

export interface TemplateItem {
  id: string
  name: string
  description: string | null
  type: 'LAB' | 'IMAGING' | 'OTHER'
  department: string
  dataSchema: {
    version: number
    layout: 'table' | 'sections' | 'freeform'
    groups: TemplateGroup[]
    interpretation: { enabled: boolean; prompt?: string }
    signature: { required: boolean; roles: string[] }
  }
  isActive: boolean
  version: number
  createdBy: string | null
  createdAt: string
  services?: Array<{ id: string; name: string }>
}

export type TemplateDataSchema = TemplateItem['dataSchema']

export interface PaginatedTemplates {
  data: TemplateItem[]
  total: number
  page: number
  limit: number
}

// GET /templates
export async function getTemplates(params?: {
  page?: number
  limit?: number
  department?: string
  activeOnly?: boolean
}): Promise<PaginatedTemplates> {
  const res = await api.get('/templates', { params })
  return res.data
}

// GET /templates/:id
export async function getTemplateById(id: string): Promise<TemplateItem> {
  const res = await api.get(`/templates/${id}`)
  return res.data
}

// GET /templates/department/:department
export async function getTemplatesByDepartment(department: string): Promise<TemplateItem[]> {
  const res = await api.get(`/templates/department/${department}`)
  return res.data
}

// GET /templates/search?q=
export async function searchTemplates(query: string): Promise<TemplateItem[]> {
  const res = await api.get('/templates/search', { params: { q: query } })
  return res.data
}

// POST /templates
export async function createTemplate(data: {
  name: string
  description?: string
  department: string
  dataSchema: TemplateDataSchema
}): Promise<TemplateItem> {
  const res = await api.post('/templates', data)
  return res.data
}

// PATCH /templates/:id
export async function updateTemplate(id: string, data: {
  name?: string
  description?: string
  dataSchema?: TemplateDataSchema
}): Promise<TemplateItem> {
  const res = await api.patch(`/templates/${id}`, data)
  return res.data
}

// POST /templates/:id/clone
export async function cloneTemplate(id: string, newName: string): Promise<TemplateItem> {
  const res = await api.post(`/templates/${id}/clone`, { newName })
  return res.data
}

// PATCH /templates/:id/deactivate
export async function deactivateTemplate(id: string): Promise<TemplateItem> {
  const res = await api.patch(`/templates/${id}/deactivate`)
  return res.data
}

// PATCH /templates/:id/activate
export async function activateTemplate(id: string): Promise<TemplateItem> {
  const res = await api.patch(`/templates/${id}/activate`)
  return res.data
}
