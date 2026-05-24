export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface Patient {
  id:          string
  firstName:   string
  lastName:    string
  dob:         string        // ISO string — backend stores as DateTime
  gender:      Gender
  phoneNumber: string | null
  email:       string | null
  createdAt:   string
  updatedAt:   string
}

// Same shape — backend returns flat patient objects in lists
export type PatientListItem = Patient

export interface PaginatedPatients {
  data:  Patient[]
  total: number
  page:  number
  limit: number
}

// ── Helpers ──────────────────────────────────────────────────

export function getPatientFullName(
  p: Pick<Patient, 'firstName' | 'lastName'>
): string {
  return `${p.firstName} ${p.lastName}`
}

export function getPatientAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function getInitials(p: Pick<Patient, 'firstName' | 'lastName'>): string {
  return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase()
}