import { useOutletContext, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Pill, Plus } from 'lucide-react'
import type { PatientOutletContext } from '@/hooks/usePatient'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { useAuthStore } from '@/stores/authStore'
import PrescribeMedicationModal from '@/components/patients/PrescribeMedicationModal'

export default function MedicationsTab() {
  const { id } = useParams<{ id: string }>()
  const { patient } = useOutletContext<PatientOutletContext>()
  const user         = useAuthStore((s) => s.user)
  const canPrescribe = ['DOCTOR', 'ADMIN'].includes(user?.role ?? '')
  const [modalOpen, setModalOpen] = useState(false)

  const allMeds  = patient?.records?.flatMap((r) => r.medications) ?? []
  const active   = allMeds.filter((m) => m.status === 'ACTIVE')
  const past     = allMeds.filter((m) => m.status !== 'ACTIVE')
  const recordId = patient?.records?.[0]?.id

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Medications</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {active.length} active · {past.length} historical
          </p>
        </div>
        {canPrescribe && (
          <ButtonPill
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Prescribe
          </ButtonPill>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F8FAFF] bg-[#FAFBFF]">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
            Active
          </h4>
        </div>

        {active.length === 0 ? (
          <div className="py-10 text-center">
            <Pill size={22} className="text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-xs text-[#94A3B8]">No active medications</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8FAFF]">
            {active.map((med) => (
              <div key={med.id} className="flex items-start justify-between
                                           gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#0F172A]">{med.name}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {med.dosage} · {med.route} · {med.frequency}
                  </p>
                  {med.instructions && (
                    <p className="text-xs text-[#94A3B8] mt-0.5 italic">
                      {med.instructions}
                    </p>
                  )}
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Started {new Date(med.startDate).toLocaleDateString('en-NG', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <StatusBadge value="ACTIVE" size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F8FAFF] bg-[#FAFBFF]">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wide">
              Historical
            </h4>
          </div>
          <div className="divide-y divide-[#F8FAFF]">
            {past.map((med) => (
              <div key={med.id} className="flex items-start justify-between
                                           gap-3 px-5 py-4 opacity-60">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0F172A]">{med.name}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {med.dosage} · {med.route}
                  </p>
                </div>
                <StatusBadge value={med.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      <PrescribeMedicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patientId={id!}
        recordId={recordId}
      />
    </div>
  )
}