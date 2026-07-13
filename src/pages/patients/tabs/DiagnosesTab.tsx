import { useOutletContext, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Stethoscope, Plus } from 'lucide-react'
import type { PatientOutletContext } from '@/hooks/usePatient'
import type { DiagnosisSummary } from '@/types/patient'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { useAuthStore } from '@/stores/authStore'
import AddDiagnosisModal from '@/components/patients/AddDiagnosisModal'
import { cn } from '@/lib/utils'

const STATUS_ORDER = ['ACTIVE', 'CHRONIC', 'SUSPECTED', 'RESOLVED']

const STATUS_DOT: Record<string, string> = {
  ACTIVE:    'bg-[#5580F4]',
  CHRONIC:   'bg-[#F59E0B]',
  SUSPECTED: 'bg-[#94A3B8]',
  RESOLVED:  'bg-[#10B981]',
}

export default function DiagnosesTab() {
  const { id } = useParams<{ id: string }>()
  const { patient } = useOutletContext<PatientOutletContext>()
  const user      = useAuthStore((s) => s.user)
  const canRecord = ['DOCTOR'].includes(user?.role ?? '')
  const [modalOpen, setModalOpen] = useState(false)

  const activeEncounter = patient?.encounters?.find((e) => !e.stopTime)

  const seen   = new Set<string>()
  const allDx: DiagnosisSummary[] = []

  patient?.encounters?.forEach((enc) => {
    enc.diagnoses.forEach((dx) => {
      const key = dx.icdCode ?? dx.name
      if (!seen.has(key)) {
        seen.add(key)
        allDx.push(dx)
      }
    })
  })

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: allDx.filter((d) => d.status === status),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Problem List</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {allDx.filter((d) => d.status === 'ACTIVE').length} active ·{' '}
            {allDx.length} total
          </p>
        </div>
        {canRecord && (
          <ButtonPill
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Add Diagnosis
          </ButtonPill>
        )}
      </div>

      {allDx.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl
                          bg-[#F0F4FF] mx-auto mb-3">
            <Stethoscope size={22} className="text-[#5580F4]" />
          </div>
          <p className="text-sm font-bold text-[#0F172A]">No diagnoses recorded</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Diagnoses are added during an encounter
          </p>
        </div>
      ) : (
        grouped.map(({ status, items }) => (
          <div
            key={status}
            className="bg-white rounded-2xl border border-[#EEF1F8]
                       shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-5 py-3.5
                            border-b border-[#F8FAFF] bg-[#FAFBFF]">
              <span className={cn('size-2 rounded-full', STATUS_DOT[status])} />
              <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </h4>
              <span className="ml-auto text-xs font-bold text-[#5580F4]
                               bg-[#F0F4FF] px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            <div className="divide-y divide-[#F8FAFF]">
              {items.map((dx) => (
                <div key={dx.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {dx.name}
                      </p>
                      {dx.isPrimary && (
                        <span className="text-xs text-[#5580F4] font-medium
                                         bg-[#F0F4FF] px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    {dx.icdCode && (
                      <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                        ICD-10: {dx.icdCode}
                        {dx.icdDescription && ` — ${dx.icdDescription}`}
                      </p>
                    )}
                    {dx.notes && (
                      <p className="text-xs text-[#64748B] mt-1 italic">
                        {dx.notes}
                      </p>
                    )}
                  </div>
                  <StatusBadge value={dx.status} size="sm" />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <AddDiagnosisModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patientId={id!}
        activeEncounter={activeEncounter}
      />
    </div>
  )
}