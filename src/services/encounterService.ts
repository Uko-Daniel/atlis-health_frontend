import api from '@/lib/api'
import type { Encounter, EncounterType, PaginatedEncounters } from '@/types/encounter'

export interface CreateEncounterPayload {
  patientId:      string
  type:           EncounterType
  chiefComplaint?: string
  notes?:          string
  startTime?:      string   // ISO string — defaults to now() on backend
}

export interface UpdateEncounterPayload {
  type?:           EncounterType
  chiefComplaint?: string
  notes?:          string
}

export interface GetEncountersParams {
  type?:  EncounterType
  limit?: number
  page?:  number
}

// GET /encounters?type=&page=&limit=
export async function getAllEncounters(
  params: GetEncountersParams = {}
): Promise<PaginatedEncounters> {
  const res = await api.get<PaginatedEncounters>('/encounters', { params })
  return res.data
}

// GET /encounters/patient/:patientId
export async function getEncountersByPatient(
  patientId: string,
  params: { limit?: number; type?: EncounterType } = {}
): Promise<Encounter[]> {
  const res = await api.get<Encounter[]>(`/encounters/patient/${patientId}`, { params })
  return res.data
}

// GET /encounters/patient/:patientId/latest
export async function getLatestEncounter(patientId: string): Promise<Encounter> {
  const res = await api.get<Encounter>(`/encounters/patient/${patientId}/latest`)
  return res.data
}

// GET /encounters/:id
export async function getEncounterById(id: string): Promise<Encounter> {
  const res = await api.get<Encounter>(`/encounters/${id}`)
  return res.data
}

// POST /encounters
export async function createEncounter(
  payload: CreateEncounterPayload
): Promise<Encounter> {
  const res = await api.post<Encounter>('/encounters', payload)
  return res.data
}

// PATCH /encounters/:id
export async function updateEncounter(
  id: string,
  payload: UpdateEncounterPayload
): Promise<Encounter> {
  const res = await api.patch<Encounter>(`/encounters/${id}`, payload)
  return res.data
}

// PATCH /encounters/:id/close
export async function closeEncounter(
  id: string,
  stopTime?: string
): Promise<Encounter> {
  const res = await api.patch<Encounter>(`/encounters/${id}/close`, { stopTime })
  return res.data
}