import api from '@/lib/api'
import type { Patient, PaginatedPatients } from '@/types/patient'

export interface GetPatientsParams {
  page?:  number
  limit?: number
}

export interface SearchPatientsParams {
  name?:   string
  gender?: string
  dob?:    string
  page?:   number
  limit?:  number
}

export interface CreatePatientPayload {
  firstName:   string
  lastName:    string
  dob:         string       // ISO date string e.g. "1990-05-12"
  gender:      'MALE' | 'FEMALE' | 'OTHER'
  phoneNumber?: string
  email?:       string
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>

// GET /patients?page=&limit=
export async function getPatients(
  params: GetPatientsParams = {}
): Promise<PaginatedPatients> {
  const res = await api.get<PaginatedPatients>('/patients', { params })
  return res.data
}

// GET /patients/search?name=&gender=&dob=&page=&limit=
export async function searchPatients(
  params: SearchPatientsParams
): Promise<PaginatedPatients> {
  const res = await api.get<PaginatedPatients>('/patients/search', { params })
  return res.data
}

// GET /patients/:id  (includes encounters, allergies, medications)
export async function getPatientById(id: string): Promise<Patient> {
  const res = await api.get<Patient>(`/patients/${id}`)
  return res.data
}

// POST /patients
export async function createPatient(
  payload: CreatePatientPayload
): Promise<Patient> {
  const res = await api.post<Patient>('/patients', payload)
  return res.data
}

// PUT /patients/:id  (backend uses PUT)
export async function updatePatient(
  id: string,
  payload: UpdatePatientPayload
): Promise<Patient> {
  const res = await api.put<Patient>(`/patients/${id}`, payload)
  return res.data
}

// DELETE /patients/:id
export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patients/${id}`)
}