import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, Calendar,
  UserPlus, ClipboardList, AlertTriangle,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usePatient, type PatientOutletContext } from '@/hooks/usePatient'
import { Avatar }     from '@/components/ui/atoms/Avatar'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton }   from '@/components/ui/skeleton'
import { getPatientAge } from '@/types/patient'
import { cn } from '@/lib/utils'
import type { StaffRole } from '@/types/auth'
import type { AllergySummary } from '@/types/patient'
import { printRecord } from '@/utils/exportRecord'
import { useTenantStore } from '@/hooks/useTenant'
import { usePermission } from '@/hooks/usePermission'


// ── Tab config ────────────────────────────────────────────────

const TABS = [
  {
    key:   'overview',
    label: 'Overview',
  },
  {
    key:   'vitals',
    label: 'Vitals',
    roles: ['DOCTOR', 'NURSES'] as StaffRole[],
  },
  {
    key:   'diagnoses',
    label: 'Diagnoses',
    roles: ['DOCTOR', 'NURSES'] as StaffRole[],
  },
  {
    key:   'medications',
    label: 'Medications',
    roles: ['DOCTOR', 'NURSES', 'PHARMACIST'] as StaffRole[],
  },
  {
    key:   'orders',
    label: 'Orders',
    roles: [
      'ADMIN', 'DOCTOR', 'NURSES', 'LAB_SCIENTIST',
      'IMAGING_TECH', 'RECEPTIONIST', 'BILLING_OFFICER',
    ] as StaffRole[],
  },
  {
    key:   'results',
    label: 'Results',
    roles: ['DOCTOR', 'NURSES', 'LAB_SCIENTIST', 'IMAGING_TECH'] as StaffRole[],
  },
  {
    key:   'evee',
    label: 'EVEE',
    roles: ['DOCTOR', 'NURSES', 'PHARMACIST'] as StaffRole[],
  },
] as const

// ── Allergy severity ──────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  MILD:             'bg-green-50 text-green-700 border-green-200',
  MODERATE:         'bg-amber-50 text-amber-700 border-amber-200',
  SEVERE:           'bg-orange-50 text-orange-700 border-orange-200',
  LIFE_THREATENING: 'bg-red-100 text-red-800 border-red-300',
}

function AllergyChip({ allergy }: { allergy: AllergySummary }) {
  const style = SEVERITY_STYLES[allergy.severity] ?? SEVERITY_STYLES.MILD
  const isLifeThreatening = allergy.severity === 'LIFE_THREATENING'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full',
        'text-xs font-semibold border',
        style,
        isLifeThreatening && 'animate-pulse',
      )}
    >
      <AlertTriangle size={10} className="shrink-0" />
      {allergy.substance}
    </span>
  )
}

// ── Header skeleton ───────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="flex items-start gap-5 flex-wrap pb-5">
      <Skeleton className="size-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2.5 min-w-0">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 shrink-0">
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function PatientDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const tenantName = useTenantStore((s) => s.facilityName) ?? 'Atlis Health'
  const canExport = usePermission('allowExportRecords')

  const { patient, isLoading, isError, invalidate } = usePatient(id!)

  const canCreateEncounter = ['DOCTOR', 'NURSES', 'ADMIN'].includes(user?.role ?? '')
  const canOrderTests      = ['DOCTOR', 'ADMIN'].includes(user?.role ?? '')

  const visibleTabs = TABS.filter((tab) => {
    if (!('roles' in tab)) return true
    return tab.roles.includes(user?.role as StaffRole)
  })

  // ── Error ────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FEF2F2]">
          <AlertTriangle size={26} className="text-[#EF4444]" />
        </div>
        <div>
          <p className="text-base font-bold text-[#0F172A]">Patient not found</p>
          <p className="text-sm text-[#64748B] mt-1 max-w-xs">
            This record may have been removed or you don't have access.
          </p>
        </div>
        <ButtonPill variant="ghost" icon={ArrowLeft} onClick={() => navigate('/patients')}>
          Back to Patients
        </ButtonPill>
      </div>
    )
  }

  // ── Derived display values ────────────────────────────────────
  const fullName = patient ? `${patient.firstName} ${patient.lastName}` : ''
  const age      = patient ? getPatientAge(patient.dob) : null
  const gender   = patient
    ? patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()
    : ''
  const dob      = patient
    ? new Date(patient.dob).toLocaleDateString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : ''
  const regDate  = patient
    ? new Date(patient.createdAt).toLocaleDateString('en-NG', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : ''
  const shortId  = id?.slice(-8).toUpperCase() ?? ''
  const allergies = patient?.allergies ?? []

  // Context passed to all tab children via Outlet
  const outletContext: PatientOutletContext = {
    patient, isLoading, invalidate,
  }

  return (
    <div className="-mt-6 -mx-6" key={id}>

      {/* ── Patient header card ─────────────────────────── */}
      <div className="bg-white border-b border-[#EEF1F8]">

        {/* Breadcrumb + ID row */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-1.5 text-sm text-[#64748B]
                       hover:text-[#0F172A] transition-colors font-medium"
          >
            <ArrowLeft size={15} />
            Patients
          </button>
          {!isLoading && (
            <span className="text-xs font-mono text-[#94A3B8]
                             bg-[#F8FAFF] border border-[#EEF1F8]
                             px-2.5 py-1 rounded-full tracking-wider">
              #{shortId}
            </span>
          )}
        </div>

        {/* Main info */}
        <div className="px-6 pb-1">
          {isLoading ? (
            <HeaderSkeleton />
          ) : (
            <div className="flex items-start gap-5 flex-wrap pb-5">

              {/* Avatar */}
              <Avatar name={fullName} size="xl" className="shrink-0 ring-4 ring-[#F0F4FF]" />

              {/* Text block */}
              <div className="flex-1 min-w-0">

                {/* Name */}
                <h2 className="text-[22px] font-bold text-[#0F172A] leading-tight">
                  {fullName}
                </h2>

                {/* Demographics */}
                <div className="flex items-center gap-3 mt-1.5 text-sm
                                text-[#64748B] flex-wrap">
                  <span className="font-medium">{age}y · {gender}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-[#94A3B8]" />
                    {dob}
                  </span>
                  <span className="text-[#94A3B8] text-xs">
                    Registered {regDate}
                  </span>
                </div>

                {/* Contact */}
                {(patient?.phoneNumber || patient?.email) && (
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {patient?.phoneNumber && (
                      <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <Phone size={12} className="text-[#5580F4] shrink-0" />
                        {patient.phoneNumber}
                      </span>
                    )}
                    {patient?.email && (
                      <span className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <Mail size={12} className="text-[#5580F4] shrink-0" />
                        {patient.email}
                      </span>
                    )}
                  </div>
                )}

                {/* Allergy chips — signature element */}
                <div className="mt-3">
                  {allergies.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#94A3B8]
                                       uppercase tracking-widest">
                        Allergies
                      </span>
                      {allergies.map((a) => (
                        <AllergyChip key={a.id} allergy={a} />
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5
                                     text-xs text-[#10B981] font-medium">
                      <span className="size-1.5 rounded-full bg-[#10B981] inline-block" />
                      No known allergies
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                {canCreateEncounter && (
                  <ButtonPill
                    variant="primary"
                    size="sm"
                    icon={UserPlus}
                    onClick={() =>
                      navigate(`/patients/${id}/encounters/new`)
                    }
                  >
                    New Encounter
                  </ButtonPill>
                )}
                {canOrderTests && (
                  <ButtonPill
                    variant="outline"
                    size="sm"
                    icon={ClipboardList}
                    onClick={() => navigate(`/patients/${id}/orders`)}
                  >
                    Order Tests
                  </ButtonPill>
                )}
                {canExport && (
                  <ButtonPill
                    variant="outline"
                    size="sm"
                    icon={FileText}
                    onClick={() => printRecord(patient!, tenantName)}
                  >
                    Export Record
                  </ButtonPill>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Tab bar ──────────────────────────────────── */}
        <div
          className="flex overflow-x-auto border-t border-[#F0F4FF] px-6"
          style={{ scrollbarWidth: 'none' }}
        >
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.key}
              to={`/patients/${id}/${tab.key}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center whitespace-nowrap shrink-0',
                  'px-4 py-3.5 text-sm font-medium',
                  'border-b-2 transition-all duration-150',
                  isActive
                    ? 'text-[#5580F4] border-[#5580F4]'
                    : 'text-[#64748B] border-transparent hover:text-[#0F172A] hover:border-[#CBD5E1]',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────── */}
      <div className="px-6 py-6">
        <Outlet context={outletContext} />
      </div>

    </div>
  )
}
