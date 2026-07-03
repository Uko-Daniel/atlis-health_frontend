import { useOutletContext } from 'react-router-dom'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Activity, Pill, Clock, ChevronRight,
  Stethoscope, AlertTriangle,
} from 'lucide-react'
import type { PatientOutletContext } from '@/hooks/usePatient'
import type { EncounterWithDetails, MedicationSummary } from '@/types/patient'
import { StatusBadge }  from '@/components/ui/atoms/StatusBadge'
import { Skeleton }     from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Latest vitals from most recent encounter
function LatestVitalsCard({ encounter }: { encounter?: EncounterWithDetails }) {
  const vital = encounter?.vitals?.[0]

  const metrics = [
    {
      label: 'Blood Pressure',
      value: vital?.systolicBP && vital?.diastolicBP
        ? `${vital.systolicBP}/${vital.diastolicBP}`
        : null,
      unit: 'mmHg',
    },
    {
      label: 'Heart Rate',
      value: vital?.heartRate ?? null,
      unit: 'bpm',
    },
    {
      label: 'Temperature',
      value: vital?.temperature ?? null,
      unit: '°C',
    },
    {
      label: 'SpO₂',
      value: vital?.spO2 ?? null,
      unit: '%',
    },
    {
      label: 'Weight',
      value: vital?.weight ?? null,
      unit: 'kg',
    },
    {
      label: 'BMI',
      value: vital?.bmi ?? null,
      unit: '',
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-[#F8FAFF]">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#F0F4FF]">
            <Activity size={14} className="text-[#5580F4]" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Latest Vitals</h3>
        </div>
        {vital && (
          <span className="text-xs text-[#94A3B8]">
            {new Date(vital.recordedAt).toLocaleDateString('en-NG', {
              day: '2-digit', month: 'short',
            })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-xs text-[#94A3B8] font-medium">{m.label}</p>
            <p className={cn(
              'text-lg font-bold mt-0.5',
              m.value !== null ? 'text-[#0F172A]' : 'text-[#CBD5E1]',
            )}>
              {m.value !== null ? `${m.value}` : '—'}
              {m.value !== null && m.unit && (
                <span className="text-xs font-normal text-[#94A3B8] ml-1">
                  {m.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {!vital && (
        <p className="px-5 pb-5 text-xs text-[#94A3B8] text-center">
          No vitals recorded yet
        </p>
      )}
    </div>
  )
}

// Active medications
function ActiveMedsCard({ meds }: { meds: MedicationSummary[] }) {
  const active = meds.filter((m) => m.status === 'ACTIVE')

  return (
    <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-[#F8FAFF]">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFFBEB]">
            <Pill size={14} className="text-[#F59E0B]" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">
            Active Medications
          </h3>
        </div>
        <span className="text-xs font-bold text-[#5580F4] bg-[#F0F4FF]
                         px-2 py-0.5 rounded-full">
          {active.length}
        </span>
      </div>

      <div className="divide-y divide-[#F8FAFF]">
        {active.length === 0 ? (
          <p className="px-5 py-6 text-xs text-[#94A3B8] text-center">
            No active medications
          </p>
        ) : (
          active.slice(0, 5).map((med) => (
            <div key={med.id} className="flex items-start justify-between
                                         gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {med.name}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {med.dosage} · {med.route} · {med.frequency}
                </p>
              </div>
              <StatusBadge value="ACTIVE" size="sm" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Recent encounters timeline
function RecentEncounters({ encounters }: { encounters: EncounterWithDetails[] }) {
  const navigate  = useNavigate()
  const { id }    = useParams()

  const TYPE_LABELS: Record<string, string> = {
    OUTPATIENT:   'Outpatient',
    INPATIENT:    'Inpatient',
    EMERGENCY:    'Emergency',
    FOLLOW_UP:    'Follow-up',
    PROCEDURE:    'Procedure',
    TELEMEDICINE: 'Telemedicine',
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-[#F8FAFF]">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#ECFDF5]">
            <Stethoscope size={14} className="text-[#10B981]" />
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">
            Recent Encounters
          </h3>
        </div>
        <button
          onClick={() => navigate(`/patients/${id}/vitals`)}
          className="text-xs text-[#5580F4] font-medium hover:underline"
        >
          View vitals
        </button>
      </div>

      <div className="divide-y divide-[#F8FAFF]">
        {encounters.length === 0 ? (
          <p className="px-5 py-6 text-xs text-[#94A3B8] text-center">
            No encounters recorded yet
          </p>
        ) : (
          encounters.slice(0, 4).map((enc) => {
            const primaryDx = enc.diagnoses.find((d) => d.isPrimary)
            const date      = new Date(enc.startTime).toLocaleDateString('en-NG', {
              day: '2-digit', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={enc.id}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#F8FAFF]
                           transition-colors cursor-pointer group"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1">
                  <div className="size-2 rounded-full bg-[#5580F4] shrink-0" />
                  <div className="w-px flex-1 bg-[#EEF1F8] mt-1 min-h-[20px]" />
                </div>

                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-[#0F172A] truncate">
                        {enc.chiefComplaint ?? TYPE_LABELS[enc.type] ?? enc.type}
                      </span>
                      <StatusBadge
                        value={enc.stopTime ? 'completed' : 'active'}
                        label={enc.stopTime ? 'Closed' : 'Open'}
                        size="sm"
                      />
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-[#94A3B8] shrink-0 opacity-0
                                 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  {primaryDx && (
                    <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1">
                      <AlertTriangle size={10} className="text-[#F59E0B]" />
                      {primaryDx.name}
                      {primaryDx.icdCode && (
                        <span className="text-[#94A3B8]">({primaryDx.icdCode})</span>
                      )}
                    </p>
                  )}

                  <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {date} · {TYPE_LABELS[enc.type] ?? enc.type}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────

export default function OverviewTab() {
  const { patient, isLoading } = useOutletContext<PatientOutletContext>()

  const allMeds = patient?.records?.flatMap((r) => r.medications) ?? []
  const encounters = patient?.encounters ?? []
  const latestEnc  = encounters[0]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LatestVitalsCard encounter={latestEnc} />
      <ActiveMedsCard meds={allMeds} />
      <div className="lg:col-span-2">
        <RecentEncounters encounters={encounters} />
      </div>
    </div>
  )
}