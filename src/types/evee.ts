export type EveeSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO'

export type EveeDomain =
  | 'ALLERGY' | 'DRUG_INTERACTION' | 'DOSAGE' | 'VITALS'
  | 'LAB' | 'HISTORY' | 'COMORBIDITY' | 'PREVENTIVE'
  | 'PREGNANCY' | 'PAEDIATRIC'

export interface EveeAlert {
  id:              string
  evaluationId:    string
  ruleId:          string
  domain:          EveeDomain
  severity:        EveeSeverity
  message:         string
  recommendation:  string
  overridden:      boolean
  overriddenBy?:   string | null
  overrideReason?: string | null
  overriddenAt?:   string | null
  createdAt:       string
}

export interface EveeEvaluationResult {
  evaluationId:   string
  patientId:      string
  triggeredBy:    string
  alerts:         EveeAlert[]
  alertCount:     number
  criticalCount:  number
  mlScore?:       number
  mlLabel?:       string
  ruleSetVersion: number
  evaluatedAt:    string
  createdAt:      string 
}

export const SEVERITY_ORDER: EveeSeverity[] = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'INFO']

export const SEVERITY_STYLES: Record<EveeSeverity, {
  bg: string; text: string; border: string; dot: string
}> = {
  CRITICAL: { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', border: 'border-l-[#EF4444]', dot: 'bg-[#EF4444]' },
  HIGH:     { bg: 'bg-[#FFF7ED]', text: 'text-[#F97316]', border: 'border-l-[#F97316]', dot: 'bg-[#F97316]' },
  MODERATE: { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]', border: 'border-l-[#F59E0B]', dot: 'bg-[#F59E0B]' },
  LOW:      { bg: 'bg-[#ECFDF5]', text: 'text-[#10B981]', border: 'border-l-[#10B981]', dot: 'bg-[#10B981]' },
  INFO:     { bg: 'bg-[#F0F4FF]', text: 'text-[#5580F4]', border: 'border-l-[#5580F4]', dot: 'bg-[#5580F4]' },
}

export const DOMAIN_LABELS: Record<EveeDomain, string> = {
  ALLERGY:          'Allergy',
  DRUG_INTERACTION: 'Drug Interaction',
  DOSAGE:           'Dosage',
  VITALS:           'Vital Signs',
  LAB:              'Lab Values',
  HISTORY:          'Medical History',
  COMORBIDITY:      'Comorbidity',
  PREVENTIVE:       'Preventive Care',
  PREGNANCY:        'Pregnancy',
  PAEDIATRIC:       'Paediatric',
}