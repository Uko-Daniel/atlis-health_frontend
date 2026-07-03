import api from '@/lib/api'
import type { DiagnosisSummary, DiagnosisStatus } from '@/types/patient'

export interface CreateDiagnosisPayload {
  patientId:       string
  encounterId:     string
  name:            string
  icdCode?:        string
  icdDescription?: string
  status?:         DiagnosisStatus
  isPrimary?:      boolean
  notes?:          string
}

export interface UpdateDiagnosisPayload {
  status?: DiagnosisStatus
  notes?:  string
}

// POST /diagnoses
export async function createDiagnosis(
  payload: CreateDiagnosisPayload,
): Promise<DiagnosisSummary> {
  const res = await api.post<DiagnosisSummary>('/diagnoses', payload)
  return res.data
}

// PATCH /diagnoses/:id
export async function updateDiagnosis(
  id: string,
  payload: UpdateDiagnosisPayload,
): Promise<DiagnosisSummary> {
  const res = await api.patch<DiagnosisSummary>(`/diagnoses/${id}`, payload)
  return res.data
}

// GET /diagnoses/patient/:patientId/icd?code=
export interface IcdResult {
  code:        string
  description: string
}

export async function searchIcdCodes(query: string): Promise<IcdResult[]> {
  // Lightweight client-side common-codes lookup until a real ICD-10 API is wired.
  // Filters from a small curated set covering frequent Nigerian clinical presentations.
  const COMMON_CODES: IcdResult[] = [
    { code: 'A09',   description: 'Diarrhoea and gastroenteritis, infectious' },
    { code: 'B50',   description: 'Plasmodium falciparum malaria' },
    { code: 'B54',   description: 'Unspecified malaria' },
    { code: 'A01.0', description: 'Typhoid fever' },
    { code: 'E11',   description: 'Type 2 diabetes mellitus' },
    { code: 'E10',   description: 'Type 1 diabetes mellitus' },
    { code: 'I10',   description: 'Essential (primary) hypertension' },
    { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
    { code: 'J45',   description: 'Asthma' },
    { code: 'N18',   description: 'Chronic kidney disease' },
    { code: 'O80',   description: 'Single spontaneous delivery' },
    { code: 'D50',   description: 'Iron deficiency anaemia' },
    { code: 'D57',   description: 'Sickle-cell disorders' },
    { code: 'K29',   description: 'Gastritis and duodenitis' },
    { code: 'R50.9', description: 'Fever, unspecified' },
    { code: 'R10',   description: 'Abdominal and pelvic pain' },
    { code: 'M54',   description: 'Dorsalgia (back pain)' },
    { code: 'B20',   description: 'HIV disease' },
    { code: 'A15',   description: 'Respiratory tuberculosis' },
    { code: 'L23',   description: 'Allergic contact dermatitis' },
  ]

  const q = query.trim().toLowerCase()
  if (!q) return []
  return COMMON_CODES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q),
  ).slice(0, 8)
}