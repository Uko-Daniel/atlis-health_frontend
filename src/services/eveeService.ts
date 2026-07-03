import api from '@/lib/api'
import type { EveeEvaluationResult, EveeAlert } from '@/types/evee'

// POST /evee/evaluate/:patientId
export async function runEvaluation(patientId: string): Promise<EveeEvaluationResult> {
  const res = await api.post<EveeEvaluationResult>(`/evee/evaluate/${patientId}`)
  return res.data
}

// GET /evee/evaluations/patient/:patientId?limit=
export async function getEvaluationsByPatient(
  patientId: string,
  limit = 10,
): Promise<EveeEvaluationResult[]> {
  const res = await api.get<EveeEvaluationResult[]>(
    `/evee/evaluations/patient/${patientId}`,
    { params: { limit } },
  )
  return res.data
}

// GET /evee/evaluations/:id
export async function getEvaluationById(id: string): Promise<EveeEvaluationResult> {
  const res = await api.get<EveeEvaluationResult>(`/evee/evaluations/${id}`)
  return res.data
}

// PATCH /evee/alerts/:id/override
export async function overrideAlert(
  alertId: string,
  overrideReason: string,
): Promise<EveeAlert> {
  const res = await api.patch<EveeAlert>(`/evee/alerts/${alertId}/override`, { overrideReason })
  return res.data
}

// GET /evee/alerts/critical/:patientId
export async function getOpenCriticalAlerts(patientId: string): Promise<EveeAlert[]> {
  const res = await api.get<EveeAlert[]>(`/evee/alerts/critical/${patientId}`)
  return res.data
}