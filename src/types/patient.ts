export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface Patient {
  id:          string
  firstName:   string
  lastName:    string
  dob:         string
  gender:      Gender
  phoneNumber: string | null
  email:       string | null
  createdAt:   string
  updatedAt:   string
}

export type PatientListItem = Patient

export interface PaginatedPatients {
  data:  Patient[]
  total: number
  page:  number
  limit: number
}

// ── Extended types returned by GET /patients/:id ──────────────

export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'
export type AllergyStatus   = 'ACTIVE' | 'INACTIVE' | 'UNCONFIRMED'

export interface AllergySummary {
  id:         string
  substance:  string
  reaction:   string
  severity:   AllergySeverity
  status:     AllergyStatus
  drugClass?: string | null
  confirmed:  boolean
  notes?:     string | null
  createdAt:  string
}

export interface VitalSummary {
  id:               string
  systolicBP?:      number | null
  diastolicBP?:     number | null
  heartRate?:       number | null
  respiratoryRate?: number | null
  temperature?:     number | null
  spO2?:            number | null
  weight?:          number | null
  height?:          number | null
  bmi?:             number | null
  gcs?:             number | null
  painScore?:       number | null
  recordedAt:       string
  recordedBy:       string
}

export type DiagnosisStatus = 'ACTIVE' | 'RESOLVED' | 'CHRONIC' | 'SUSPECTED'

export interface DiagnosisSummary {
  id:              string
  name:            string
  icdCode?:        string | null
  icdDescription?: string | null
  status:          DiagnosisStatus
  isPrimary:       boolean
  notes?:          string | null
  diagnosedAt:     string
}

export interface EncounterWithDetails {
  id:              string
  type:            string
  chiefComplaint?: string | null
  notes?:          string | null
  startTime:       string
  stopTime?:       string | null
  encounteredAt:   string
  vitals:          VitalSummary[]
  diagnoses:       DiagnosisSummary[]
}

export type MedStatus = 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED'

export interface MedicationSummary {
  id:            string
  name:          string
  dosage:        string
  route:         string
  frequency:     string
  instructions?: string | null
  startDate:     string
  endDate?:      string | null
  status:        MedStatus
  prescribedBy:  string
}

export interface RecordWithMeds {
  id:          string
  medications: MedicationSummary[]
  createdAt:   string
}

// Full patient shape returned by GET /patients/:id
export interface PatientFull extends Patient {
  allergies:  AllergySummary[]
  encounters: EncounterWithDetails[]
  records:    RecordWithMeds[]
}

// ── Helpers ───────────────────────────────────────────────────

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