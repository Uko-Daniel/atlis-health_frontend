import api from '@/lib/api'
import type { VitalSummary } from '@/types/patient'

export interface CreateVitalPayload {
  encounterId:     string
  patientId:       string
  systolicBP?:     number
  diastolicBP?:    number
  heartRate?:      number
  respiratoryRate?: number
  spO2?:           number
  temperature?:    number
  weight?:         number
  height?:         number
  bmi?:            number
  gcs?:            number
  painScore?:      number
}

// POST /vitals
export async function createVital(payload: CreateVitalPayload): Promise<VitalSummary> {
  const res = await api.post<VitalSummary>('/vitals', payload)
  return res.data
}

// GET /vitals/patient/:patientId/trend?limit=
export async function getVitalTrend(
  patientId: string,
  limit = 20,
): Promise<VitalSummary[]> {
  const res = await api.get<VitalSummary[]>(
    `/vitals/patient/${patientId}/trend`,
    { params: { limit } },
  )
  return res.data
}

// GET /vitals/patient/:patientId/latest
export async function getLatestVitals(patientId: string): Promise<VitalSummary | null> {
  try {
    const res = await api.get<VitalSummary>(`/vitals/patient/${patientId}/latest`)
    return res.data
  } catch {
    return null
  }
}

// GET /vitals/encounter/:encounterId
export async function getVitalsByEncounter(encounterId: string): Promise<VitalSummary[]> {
  const res = await api.get<VitalSummary[]>(`/vitals/encounter/${encounterId}`)
  return res.data
}