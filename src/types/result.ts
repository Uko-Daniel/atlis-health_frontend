export type ResultStatus = 'PENDING' | 'VERIFIED' | 'FINALIZED'

export type Department =
  | 'LABORATORY' | 'RADIOLOGY' | 'CARDIOLOGY'
  | 'PHARMACY'   | 'GENERAL'   | 'EMERGENCY'
  | 'PAEDIATRICS'| 'OBSTETRICS'| 'SURGERY'
  | 'ADMINISTRATION'

export interface Result {
  id:          string
  patientId:   string
  orderId:     string
  recordId:    string
  templateId:  string
  department:  Department
  status:      ResultStatus
  data:        Record<string, unknown>
  imageUrl:    string | null

  verifiedBy:   string | null
  verifiedAt:   string | null
  verifierRole: string | null

  releasedAt:   string | null
  releasedBy:   string | null

  createdAt:    string
  updatedAt:    string

  // Joined relations — included by backend
  patient?: {
    id:        string
    firstName: string
    lastName:  string
    dob:       string
    gender:    string
  }
  template?: {
    id:         string
    name:       string
    type:       string
    dataSchema: Record<string, unknown>
  }
  order?: {
    id:     string
    status: string
  }
}

export interface PaginatedResults {
  data:  Result[]
  total: number
  page:  number
  limit: number
}

export const STATUS_STYLES: Record<ResultStatus, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED:  'bg-blue-50 text-blue-700 border-blue-200',
  FINALIZED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export const STATUS_LABELS: Record<ResultStatus, string> = {
  PENDING:   'Pending',
  VERIFIED:  'Verified',
  FINALIZED: 'Finalized',
}