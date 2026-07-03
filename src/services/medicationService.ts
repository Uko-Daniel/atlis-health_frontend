import api from '@/lib/api'
import type { MedicationSummary } from '@/types/patient'

export interface CreateMedicationPayload {
  recordId:      string
  name:          string
  dosage:        string
  route:         string
  frequency:     string
  instructions?: string
  startDate:     string
  endDate?:      string
}

// POST /medications
export async function createMedication(
  payload: CreateMedicationPayload,
): Promise<MedicationSummary> {
  const res = await api.post<MedicationSummary>('/medications', payload)
  return res.data
}

// PATCH /medications/:id/status
export async function updateMedicationStatus(
  id: string,
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED',
): Promise<MedicationSummary> {
  const res = await api.patch<MedicationSummary>(`/medications/${id}/status`, { status })
  return res.data
}

// PATCH /medications/:id/discontinue
export async function discontinueMedication(
  id: string,
  reason: string,
): Promise<MedicationSummary> {
  const res = await api.patch<MedicationSummary>(`/medications/${id}/discontinue`, { reason })
  return res.data
}