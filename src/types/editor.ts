export type FieldType =
  | 'numeric'
  | 'text'
  | 'select'
  | 'multiselect'
  | 'richtext'
  | 'calculated'
  | 'image'
  | 'boolean'

export type FieldFlag = 'H' | 'L' | 'C' | 'N' | null

export interface ReferenceRange {
  male?:    { min: number; max: number }
  female?:  { min: number; max: number }
  child?:   { min: number; max: number }
  default?: { min: number; max: number }
}

export interface SchemaField {
  id:              string
  key:             string
  label:           string
  type:            FieldType
  unit?:           string
  required:        boolean
  referenceRange?: ReferenceRange
  criticalRange?:  { low?: number; high?: number }
  precision?:      number
  flagLogic?:      'auto' | 'manual'
  options?:        string[]
  formula?:        string
  formulaInputs?:  string[]
  hint?:           string
  placeholder?:    string
}

export interface SchemaGroup {
  id:          string
  label:       string
  collapsible: boolean
  fields:      SchemaField[]
}

export interface DataSchema {
  version:        number
  layout:         'table' | 'sections' | 'freeform'
  groups:         SchemaGroup[]
  interpretation: { enabled: boolean; prompt?: string }
  signature:      { required: boolean; roles: string[] }
}

// Draft — keyed by field.key
export type DraftData = Record<string, unknown>

export interface EnteredField {
  fieldId:   string
  key:       string
  value:     unknown
  flag?:     FieldFlag
  critical?: boolean
}

export interface DraftGroup {
  groupId: string
  fields:  EnteredField[]
}

// Flag map — keyed by field.key
export type FlagMap = Record<string, FieldFlag>

export interface EditorSession {
  id:          string
  resultId:    string
  staffId:     string
  draftData:   DraftData | null
  startedAt:   string
  lastSavedAt: string | null
  expiresAt:   string
}

export interface FlagResponse {
  fieldId:  string
  flag:     FieldFlag
  alert?:   {
    severity: string
    message:  string
  }
}

export interface SubmitResponse {
  success:        boolean
  missingFields?: string[]
  criticalAlerts?: unknown[]
  result?:        unknown
}
