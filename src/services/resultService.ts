import api from '@/lib/api'
import type { Result, PaginatedResults, ResultStatus } from '@/types/result'

export interface GetDepartmentResultsParams {
  status?: ResultStatus
  page?:   number
  limit?:  number
  department?: string  // ADMIN only
}

export interface GetPatientResultsParams {
  department?:  string
  releasedOnly?: boolean
  page?:         number
  limit?:        number
}

// GET /results/department
export async function getResultsByDepartment(
  params: GetDepartmentResultsParams = {}
): Promise<PaginatedResults> {
  const res = await api.get<PaginatedResults>('/results/department', { params })
  return res.data
}

// GET /results/department/critical
export async function getCriticalResults(): Promise<Result[]> {
  const res = await api.get<Result[]>('/results/department/critical')
  return res.data
}

// GET /results/patient/:patientId
export async function getResultsByPatient(
  patientId: string,
  params: GetPatientResultsParams = {}
): Promise<PaginatedResults> {
  const res = await api.get<PaginatedResults>(
    `/results/patient/${patientId}`, { params }
  )
  return res.data
}

// GET /results/order/:orderId
export async function getResultsByOrder(orderId: string): Promise<Result[]> {
  const res = await api.get<Result[]>(`/results/order/${orderId}`)
  return res.data
}

// GET /results/:id
export async function getResultById(id: string): Promise<Result> {
  const res = await api.get<Result>(`/results/${id}`)
  return res.data
}

// PATCH /results/:id/status
export async function updateResultStatus(
  id: string,
  status: ResultStatus
): Promise<Result> {
  const res = await api.patch<Result>(`/results/${id}/status`, { status })
  return res.data
}

// PATCH /results/:id/verify
export async function verifyResult(id: string): Promise<Result> {
  const res = await api.patch<Result>(`/results/${id}/verify`)
  return res.data
}

// PATCH /results/:id/finalize
export async function finalizeResult(id: string): Promise<Result> {
  const res = await api.patch<Result>(`/results/${id}/finalize`)
  return res.data
}

// PATCH /results/:id/release
export async function releaseToPatient(id: string): Promise<Result> {
  const res = await api.patch<Result>(`/results/${id}/release`)
  return res.data
}

// GET /results/:id/integrity
export async function checkIntegrity(
  id: string
): Promise<{ valid: boolean; message: string }> {
  const res = await api.get(`/results/${id}/integrity`)
  return res.data
}

export interface CreateResultPayload {
  patientId:  string
  orderId:    string
  recordId:   string
  templateId: string
  department: string
}

// POST /results
export async function createResult(payload: CreateResultPayload): Promise<Result> {
  const res = await api.post<Result>('/results', { ...payload, data: {} })
  return res.data
}