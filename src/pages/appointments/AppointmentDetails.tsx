import {
  ArrowLeft,
  Calendar,
  Clock3,
  ClipboardList,
  FileText,
  Phone,
  Mail,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Avatar } from '@/components/ui/atoms/Avatar'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton } from '@/components/ui/skeleton'

import { useEncounter } from '@/hooks/useEncounter'
import { usePatient } from '@/hooks/usePatient'

import { ENCOUNTER_TYPE_LABELS } from '@/types/encounter'
import { getPatientAge } from '@/types/patient'
import { cn } from '@/lib/utils'

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    encounter,
    isLoading: encounterLoading,
    isError,
  } = useEncounter(id!)

  const {
    patient,
    isLoading: patientLoading,
  } = usePatient(encounter?.patientId ?? '')

  const isLoading = encounterLoading || patientLoading

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-bold">Appointment not found.</p>

        <ButtonPill
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/appointments')}
        >
          Back
        </ButtonPill>
      </div>
    )
  }

  const fullName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : ''

  const age = patient
    ? getPatientAge(patient.dob)
    : ''

  const gender = patient
    ? patient.gender.charAt(0) +
      patient.gender.slice(1).toLowerCase()
    : ''

  const dob = patient
    ? new Date(patient.dob).toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''

  const shortId = encounter?.id.slice(-8).toUpperCase()

  return (
    <div className="-mx-6 -mt-6">

      {/* Header */}

      <div className="border-b border-[#EEF1F8] bg-white">

        <div className="flex items-center justify-between px-6 pt-5 pb-4">

          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-1.5 text-sm
                       text-[#64748B] hover:text-[#0F172A]
                       transition-colors font-medium"
          >
            <ArrowLeft size={15} />
            Appointments
          </button>

          {!isLoading && (
            <span
              className="rounded-full border border-[#EEF1F8]
                         bg-[#F8FAFF] px-2.5 py-1
                         font-mono text-xs tracking-wider
                         text-[#94A3B8]"
            >
              #{shortId}
            </span>
          )}

        </div>

        <div className="px-6 pb-5">

          {isLoading ? (

            <Skeleton className="h-40 rounded-2xl" />

          ) : (

            <div className="flex flex-wrap items-start gap-5">

              <Avatar
                name={fullName}
                size="xl"
                className="ring-4 ring-[#F0F4FF]"
              />

              <div className="min-w-0 flex-1">

                <h2 className="text-[22px] font-bold text-[#0F172A]">
                  {fullName}
                </h2>

                <div
                  className="mt-1.5 flex flex-wrap items-center
                             gap-3 text-sm text-[#64748B]"
                >
                  <span>
                    {age}y • {gender}
                  </span>

                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {dob}
                  </span>
                </div>

                {(patient?.phoneNumber || patient?.email) && (
                  <div className="mt-2 flex flex-wrap gap-4">

                    {patient.phoneNumber && (
                      <span
                        className="flex items-center
                                   gap-1.5 text-xs text-[#64748B]"
                      >
                        <Phone size={12} className="text-[#5580F4]" />
                        {patient.phoneNumber}
                      </span>
                    )}

                    {patient.email && (
                      <span
                        className="flex items-center
                                   gap-1.5 text-xs text-[#64748B]"
                      >
                        <Mail size={12} className="text-[#5580F4]" />
                        {patient.email}
                      </span>
                    )}

                  </div>
                )}

              </div>

              <div className="flex flex-col gap-2">

                <ButtonPill
                  variant="primary"
                  onClick={() => navigate(`/encounters/${encounter?.id}`)}
                >
                  Start Encounter
                </ButtonPill>

                <ButtonPill
                  variant="outline"
                  icon={ArrowLeft}
                  onClick={() => navigate('/appointments')}
                >
                  Back
                </ButtonPill>

              </div>

            </div>

          )}

        </div>

      </div>

      {/* Body */}

      <div className="space-y-6 px-6 py-6">

        {/* Appointment */}

        <div className="rounded-2xl border border-[#EEF1F8] bg-white p-6">

          <h3 className="mb-5 text-lg font-bold">
            Appointment Information
          </h3>

          <div className="grid gap-5 md:grid-cols-2">

            <Info
              icon={<ClipboardList size={16} />}
              label="Appointment Type"
              value={
                encounter
                  ? ENCOUNTER_TYPE_LABELS[encounter.type]
                  : '-'
              }
            />

            <Info
              icon={<Clock3 size={16} />}
              label="Start Time"
              value={
                encounter
                  ? new Date(encounter.startTime).toLocaleString('en-NG')
                  : '-'
              }
            />

            <Info
              icon={<Clock3 size={16} />}
              label="End Time"
              value={
                encounter?.stopTime
                  ? new Date(encounter.stopTime).toLocaleString('en-NG')
                  : 'Not completed'
              }
            />

            <div>

              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Status
              </p>

              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  encounter?.stopTime
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                )}
              >
                {encounter?.stopTime
                  ? "Completed"
                  : "Scheduled"}
              </span>

            </div>

          </div>

        </div>

        {/* Complaint */}

        <div className="rounded-2xl border border-[#EEF1F8] bg-white p-6">

          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <FileText size={18} />
            Chief Complaint
          </h3>

          <p className="text-sm text-[#475569]">
            {encounter?.chiefComplaint ??
              'No chief complaint recorded.'}
          </p>

        </div>

        {/* Notes */}

        <div className="rounded-2xl border border-[#EEF1F8] bg-white p-6">

          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <ClipboardList size={18} />
            Clinical Notes
          </h3>

          <p className="whitespace-pre-wrap text-sm text-[#475569]">
            {encounter?.notes ??
              'No clinical notes available.'}
          </p>

        </div>

      </div>

    </div>
  )
}

interface InfoProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

function Info({
  icon,
  label,
  value,
}: InfoProps) {
  return (
    <div>

      <p className="mb-2 flex items-center gap-2
                    text-xs font-bold uppercase
                    tracking-wider text-[#94A3B8]">
        {icon}
        {label}
      </p>

      <p className="text-sm font-medium text-[#0F172A]">
        {value}
      </p>

    </div>
  )
}