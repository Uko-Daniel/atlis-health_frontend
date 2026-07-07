import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft, Calendar, Phone,
  Activity, Stethoscope, Pill, ClipboardList,
  FileText, CheckCircle, Timer,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useEncounter } from '@/hooks/useEncounter'
import { usePatient } from '@/hooks/usePatient'
import { closeEncounter, updateEncounter } from '@/services/encounterService'
import { getVitalsByEncounter } from '@/services/vitalsService'
import { getDiagnosesByEncounter } from '@/services/diagnosisService'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import RecordVitalsModal from '@/components/patients/RecordVitalsModal'
import AddDiagnosisModal from '@/components/patients/AddDiagnosisModal'
import PrescribeMedicationModal from '@/components/patients/PrescribeMedicationModal'
import CreateOrderModal from '@/components/patients/CreateOrderModal'
import { ENCOUNTER_TYPE_LABELS } from '@/types/encounter'
import { getPatientAge } from '@/types/patient'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { Zap } from 'lucide-react'
import EveeInlinePanel from '@/components/patients/EveeInlinePanel'

// ── Tool definitions ──────────────────────────────────────────

const TOOLS = [
  { key: 'vitals',     icon: Activity,      label: 'Vitals',     color: '#5580F4', bg: '#F0F4FF' },
  { key: 'diagnosis',  icon: Stethoscope,   label: 'Diagnosis',  color: '#10B981', bg: '#ECFDF5' },
  { key: 'prescribe',  icon: Pill,          label: 'Prescribe',  color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'orders',     icon: ClipboardList, label: 'Orders',     color: '#5580F4', bg: '#F0F4FF' },
  { key: 'evee', icon: Zap, label: 'EVEE', color: '#9B6DFF', bg: '#F5F0FF' },
] as const

type ToolKey = typeof TOOLS[number]['key']

// ── Elapsed timer hook ────────────────────────────────────────

function useElapsed(startTime: string, stopped: boolean) {
  const [elapsed, setElapsed] = useState('0m')

  useEffect(() => {
    if (stopped) return

    const tick = () => {
      setElapsed(formatDuration(Date.now() - new Date(startTime).getTime()))
    }
    const timeout = setTimeout(tick, 0)
    const interval = setInterval(tick, 30000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [startTime, stopped])

  return elapsed
}

function formatDuration(ms: number) {
  const totalMin = Math.floor(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

// ── Main component ────────────────────────────────────────────

export default function EncounterWorkspace() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { encounter, isLoading: encLoading, isError } = useEncounter(id!)
  const { patient, isLoading: ptLoading } = usePatient(encounter?.patientId ?? '')
  const { data: vitals = [] } = useQuery({
    queryKey: ['vitals', 'encounter', id],
    queryFn: () => getVitalsByEncounter(id!),
    enabled: !!id && id !== 'undefined',
  })
  const { data: diagnoses = [] } = useQuery({
    queryKey: ['diagnoses', 'encounter', id],
    queryFn: () => getDiagnosesByEncounter(id!),
    enabled: !!id && id !== 'undefined',
  })

  // Tool modal state
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null)
  const [showComplete, setShowComplete] = useState(false)

  // Notes state
  const [notes, setNotes] = useState('')
  const debouncedNotes = useDebounce(notes, 2000)
  const notesInitialised = useRef(false)

  // Init notes from encounter
  useEffect(() => {
    if (encounter && !notesInitialised.current) {
      setNotes(encounter.notes ?? '')
      notesInitialised.current = true
    }
  }, [encounter])

  // Auto-save notes
  const saveNotes = useMutation({
    mutationFn: (content: string) =>
      updateEncounter(id!, { notes: content }),
  })

  useEffect(() => {
    if (notesInitialised.current && debouncedNotes !== (encounter?.notes ?? '')) {
      saveNotes.mutate(debouncedNotes)
    }
  }, [debouncedNotes])

  // Close encounter
  const closeMut = useMutation({
    mutationFn: () => closeEncounter(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounter', id] })
      queryClient.invalidateQueries({ queryKey: ['encounters'] })
      queryClient.invalidateQueries({ queryKey: ['patient', patient?.id] })
      toast.success('Encounter completed')
      navigate(`/patients/${encounter?.patientId}`)
    },
    onError: () => toast.error('Failed to complete encounter'),
  })

  const isLoading = encLoading || ptLoading
  const isClosed = !!encounter?.stopTime
  const elapsed = useElapsed(encounter?.startTime ?? new Date().toISOString(), isClosed)

  const fullName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : ''
  const age = patient ? getPatientAge(patient.dob) : null
  const gender = patient
    ? patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()
    : ''
  const shortId = encounter?.id.slice(-8).toUpperCase() ?? ''
  const recordId = patient?.records?.[0]?.id

  const canWork = ['DOCTOR', 'NURSES', 'ADMIN'].includes(user?.role ?? '') && !isClosed

  // ── Error ──────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-bold text-[#0F172A]">Encounter not found</p>
        <ButtonPill variant="ghost" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </ButtonPill>
      </div>
    )
  }

  return (
    <div className="-mx-6 -mt-6">

      {/* ── Sticky header ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#EEF1F8]">

        {/* Breadcrumb */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[#64748B]
                       hover:text-[#0F172A] transition-colors font-medium"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <span className="rounded-full border border-[#EEF1F8] bg-[#F8FAFF]
                           px-2.5 py-1 font-mono text-xs tracking-wider text-[#94A3B8]">
            #{shortId}
          </span>
        </div>

        {/* Patient + Encounter info */}
        <div className="px-6 pb-4">
          {isLoading ? (
            <Skeleton className="h-20 rounded-2xl" />
          ) : (
            <div className="flex flex-wrap items-start gap-4">
              <Avatar name={fullName} size="lg" className="ring-3 ring-[#F0F4FF] shrink-0" />

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-[#0F172A] leading-tight">
                  {fullName}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-[#64748B] flex-wrap">
                  {age !== null && <span>{age}y · {gender}</span>}
                  {patient?.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone size={11} className="text-[#5580F4]" />
                      {patient.phoneNumber}
                    </span>
                  )}
                  <StatusBadge
                    value={encounter?.type ?? 'OUTPATIENT'}
                    label={ENCOUNTER_TYPE_LABELS[encounter?.type ?? 'OUTPATIENT']}
                  />
                </div>
              </div>

              {/* Timer + Complete */}
              <div className="flex items-center gap-3 shrink-0">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium',
                  isClosed
                    ? 'bg-green-50 text-green-700'
                    : 'bg-[#F0F4FF] text-[#5580F4]',
                )}>
                  <Timer size={13} />
                  {isClosed ? 'Completed' : elapsed}
                </div>
                {canWork && (
                  <ButtonPill
                    variant="success"
                    icon={CheckCircle}
                    onClick={() => setShowComplete(true)}
                  >
                    Complete Encounter
                  </ButtonPill>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="px-6 py-6 space-y-6">

        {/* Toolbar */}
        {canWork && (
          <div className="flex gap-2 flex-wrap">
            {TOOLS.map((tool) => (
              <button
                key={tool.key}
                onClick={() => setActiveTool(tool.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
                  'border transition-all duration-150',
                )}
                style={{
                  backgroundColor: tool.bg,
                  borderColor: tool.color + '30',
                  color: tool.color,
                }}
              >
                <tool.icon size={16} />
                {tool.label}
              </button>
            ))}
          </div>
        )}

        {/* Chief complaint */}
        <div className="rounded-2xl border border-[#EEF1F8] bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-2">
            <Calendar size={15} className="text-[#94A3B8]" />
            Chief Complaint
          </h3>
          <p className="text-sm text-[#475569]">
            {encounter?.chiefComplaint ?? 'No chief complaint recorded.'}
          </p>
        </div>

        {/* Clinical Notes */}
        <div className="rounded-2xl border border-[#EEF1F8] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <FileText size={15} className="text-[#94A3B8]" />
              Clinical Notes
            </h3>
            {saveNotes.isPending && (
              <span className="text-xs text-[#94A3B8]">Saving…</span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isClosed}
            rows={6}
            placeholder="Enter clinical notes…"
            className={cn(
              'w-full rounded-xl border border-[#EEF1F8] px-4 py-3',
              'text-sm text-[#0F172A] placeholder:text-[#94A3B8]',
              'focus:outline-none focus:ring-2 focus:ring-[#5580F4]/30 resize-none',
              isClosed && 'bg-[#F8FAFF] text-[#94A3B8]',
            )}
          />
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-[#EEF1F8] bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#0F172A] mb-4">
            <Activity size={15} className="text-[#94A3B8]" />
            Encounter Activity
          </h3>

          <div className="space-y-3">
            {/* Vitals recorded */}
            {vitals.length > 0 ? (
              vitals.map((v) => (
                <div key={v.id} className="flex items-start gap-3 text-sm">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#F0F4FF] shrink-0 mt-0.5">
                    <Activity size={13} className="text-[#5580F4]" />
                  </div>
                  <div>
                    <p className="text-[#0F172A] font-medium">Vitals recorded</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      BP {v.systolicBP ?? '?'}/{v.diastolicBP ?? '?'} ·
                      HR {v.heartRate ?? '?'} ·
                      Temp {v.temperature ?? '?'}°C ·
                      SpO₂ {v.spO2 ?? '?'}%
                    </p>
                  </div>
                  <span className="ml-auto text-xs text-[#94A3B8] shrink-0">
                    {new Date(v.recordedAt).toLocaleTimeString('en-NG', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#94A3B8] italic">No vitals recorded yet</p>
            )}

            {/* Diagnoses made */}
            {diagnoses.length > 0 && (
              <div className="border-t border-[#F0F4FF] pt-3 mt-3 space-y-2">
                {diagnoses.map((d) => (
                  <div key={d.id} className="flex items-start gap-3 text-sm">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#ECFDF5] shrink-0 mt-0.5">
                      <Stethoscope size={13} className="text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-[#0F172A] font-medium">{d.name}</p>
                      {d.icdCode && (
                        <p className="text-xs text-[#94A3B8] font-mono">{d.icdCode}</p>
                      )}
                    </div>
                    <StatusBadge
                      variant="default"
                      label={d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                      className="ml-auto shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Modals ────────────────────────────────────────── */}
      {activeTool === 'vitals' && (
        <RecordVitalsModal
          open={true}
          onClose={() => setActiveTool(null)}
          patientId={encounter?.patientId ?? ''}
          activeEncounter={encounter ?? undefined}
        />
      )}

      {activeTool === 'diagnosis' && (
        <AddDiagnosisModal
          open={true}
          onClose={() => setActiveTool(null)}
          patientId={encounter?.patientId ?? ''}
          activeEncounter={encounter ?? undefined}
        />
      )}

      {activeTool === 'prescribe' && (
        <PrescribeMedicationModal
          open={true}
          onClose={() => setActiveTool(null)}
          patientId={encounter?.patientId ?? ''}
          recordId={recordId}
        />
      )}

      {activeTool === 'orders' && (
        <CreateOrderModal
          open={true}
          onClose={() => setActiveTool(null)}
          patientId={encounter?.patientId ?? ''}
        />
      )}

      {activeTool === 'evee' && (
        <EveeInlinePanel
          patientId={encounter?.patientId ?? ''}
          onClose={() => setActiveTool(null)}
        />
      )}

      {/* ── Complete confirmation dialog ──────────────────── */}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#ECFDF5] mb-3">
              <CheckCircle size={20} className="text-[#10B981]" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Complete Encounter?</h3>
            <p className="text-sm text-[#64748B] mt-1">
              This will close the encounter and record the end time.
              You can still view it from the patient's record.
            </p>
            <div className="flex gap-2 mt-5 justify-end">
              <ButtonPill variant="ghost" onClick={() => setShowComplete(false)}>
                Cancel
              </ButtonPill>
              <ButtonPill
                variant="success"
                loading={closeMut.isPending}
                onClick={() => closeMut.mutate()}
              >
                Complete
              </ButtonPill>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
