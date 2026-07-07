import api from '@/lib/api'

export interface RecordSummary {
  recordId: string
  medicationCount: number
  encounterCount: number
  resultCount: number
  reportCount: number
  createdAt: string
}

export interface PatientRecord {
  id: string
  patientId: string
  medications: any[]
  encounters: any[]
  results: any[]
  report: any[]
  createdAt: string
}

/**
 * Resolve or create a record for a patient.
 * If a record exists, returns it. If not, creates one.
 * POST /api/records/resolve/:patientId
 */
export async function resolveRecord(patientId: string): Promise<{ id: string }> {
  const res = await api.post(`/records/resolve/${patientId}`)
  return res.data
}

/**
 * Get all records for a patient.
 * GET /api/records/patient/:patientId
 */
export async function getRecordsByPatient(patientId: string): Promise<PatientRecord[]> {
  const res = await api.get(`/records/patient/${patientId}`)
  return res.data
}