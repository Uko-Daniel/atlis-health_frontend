export type EncounterType =
  | 'OUTPATIENT'
  | 'INPATIENT'
  | 'EMERGENCY'
  | 'FOLLOW_UP'
  | 'PROCEDURE'
  | 'TELEMEDICINE'

export interface Encounter {
  id:             string
  patientId:      string
  recordId:       string
  attendingStaff: string
  type:           EncounterType
  chiefComplaint: string | null
  notes:          string | null
  startTime:      string
  stopTime:       string | null
  encounteredAt:  string
  createdAt:      string
  updatedAt:      string
  patient?: {
    id:        string
    firstName: string
    lastName:  string
    gender:    string
    dob:       string
  }
}

export interface PaginatedEncounters {
  data:  Encounter[]
  total: number
  page:  number
  limit: number
}

export const ENCOUNTER_TYPE_LABELS: Record<EncounterType, string> = {
  OUTPATIENT:   'Outpatient',
  INPATIENT:    'Inpatient',
  EMERGENCY:    'Emergency',
  FOLLOW_UP:    'Follow-up',
  PROCEDURE:    'Procedure',
  TELEMEDICINE: 'Telemedicine',
}

export const ENCOUNTER_TYPE_COLORS: Record<EncounterType, string> = {
  OUTPATIENT:   'bg-blue-50 text-blue-700 border-blue-200',
  INPATIENT:    'bg-violet-50 text-violet-700 border-violet-200',
  EMERGENCY:    'bg-red-50 text-red-700 border-red-200',
  FOLLOW_UP:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROCEDURE:    'bg-amber-50 text-amber-700 border-amber-200',
  TELEMEDICINE: 'bg-slate-50 text-slate-700 border-slate-200',
}