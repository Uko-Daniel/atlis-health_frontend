import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pill, CheckCircle, AlertTriangle, Search } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'

interface ActiveMedication {
  id: string
  name: string
  dosage: string
  route: string
  frequency: string
  instructions: string | null
  startDate: string
  prescribedBy: string
  status: string
  record: {
    patient: {
      id: string
      firstName: string
      lastName: string
      dob: string
    }
  }
}

function getPatientAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function PharmacistDashboard() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')

  const { data: medications, isLoading } = useQuery({
    queryKey: ['medications', 'active'],
    queryFn: async () => {
      const res = await api.get<ActiveMedication[]>('/medications/active')
      return res.data
    },
  })

  const dispenseMut = useMutation({
    mutationFn: (id: string) => api.patch(`/medications/${id}/dispense`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', 'active'] })
      toast.success('Medication dispensed')
    },
    onError: () => toast.error('Failed to dispense'),
  })

  const filtered = (medications ?? []).filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const patientName = `${m.record.patient.firstName} ${m.record.patient.lastName}`.toLowerCase()
    return patientName.includes(q) || m.name.toLowerCase().includes(q)
  })

  const dispensedToday = (medications ?? []).filter(
    (m) => m.status === 'COMPLETED',
  ).length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-subtle">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h2 className="text-2xl font-bold text-ink mt-0.5">
          {user?.firstName}
        </h2>
        <p className="text-xs text-subtle mt-1">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#F0F4FF]">
              <Pill size={14} className="text-[#5580F4]" />
            </div>
            <span className="text-xs text-subtle">Pending</span>
          </div>
          <p className="text-2xl font-bold text-ink">{(medications ?? []).length}</p>
          <p className="text-xs text-subtle mt-0.5">prescriptions to dispense</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ECFDF5]">
              <CheckCircle size={14} className="text-[#10B981]" />
            </div>
            <span className="text-xs text-subtle">Today</span>
          </div>
          <p className="text-2xl font-bold text-ink">{dispensedToday}</p>
          <p className="text-xs text-subtle mt-0.5">dispensed</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#FFFBEB]">
              <AlertTriangle size={14} className="text-[#F59E0B]" />
            </div>
            <span className="text-xs text-subtle">Alerts</span>
          </div>
          <p className="text-2xl font-bold text-ink">0</p>
          <p className="text-xs text-subtle mt-0.5">drug interactions flagged</p>
        </div>
      </div>

      {/* Prescription Queue */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Prescription Queue</h3>
            <p className="text-xs text-subtle mt-0.5">Active prescriptions requiring dispensing</p>
          </div>
          <div className="relative w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or drug…"
              className="pl-8 border-[#EEF1F8] h-9 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#F8FAFF]">
            {filtered.map((med) => {
              const patientName = `${med.record.patient.firstName} ${med.record.patient.lastName}`
              const age = getPatientAge(med.record.patient.dob)

              return (
                <div
                  key={med.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFF] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={patientName} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#0F172A] truncate">
                          {patientName}
                        </p>
                        <span className="text-xs text-subtle">{age}y</span>
                      </div>
                      <p className="text-sm font-semibold text-[#5580F4] mt-0.5">
                        {med.name} {med.dosage}
                      </p>
                      <p className="text-xs text-subtle mt-0.5">
                        {med.route} · {med.frequency}
                        {med.instructions && ` · ${med.instructions}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-subtle">Prescribed</p>
                      <p className="text-xs font-medium text-[#0F172A]">{fmtDate(med.startDate)}</p>
                    </div>
                    <ButtonPill
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      loading={dispenseMut.isPending}
                      onClick={() => dispenseMut.mutate(med.id)}
                    >
                      Dispense
                    </ButtonPill>
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ECFDF5] mb-3">
                  <CheckCircle size={22} className="text-[#10B981]" />
                </div>
                <p className="text-sm font-bold text-[#0F172A]">All clear</p>
                <p className="text-xs text-subtle mt-1">
                  {search ? 'No prescriptions match your search' : 'No pending prescriptions'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}