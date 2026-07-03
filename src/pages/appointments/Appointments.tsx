import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { CalendarPlus } from 'lucide-react'
import NewAppointmentModal from '@/components/appointments/NewAppointmentModal'
import AppointmentListTab  from '@/components/appointments/AppointmentListTab'
import PastConsultationsTab from '@/components/appointments/PastConsultationsTab'
import CalendarView        from '@/components/appointments/CalendarView'
import { cn } from '@/lib/utils'

type Tab = 'appointments' | 'past' | 'calendar'

const TABS: { key: Tab; label: string }[] = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'past',         label: 'Past Consultations' },
  { key: 'calendar',     label: 'Calendar' },
]

const CAN_CREATE = ['ADMIN', 'DOCTOR', 'NURSES']

export default function Appointments() {
  const user      = useAuthStore((s) => s.user)
  const canCreate = user && CAN_CREATE.includes(user.role)
  const [tab, setTab]       = useState<Tab>('appointments')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-[#0F172A]">Appointments</h2>
        {canCreate && (
          <ButtonPill variant="primary" icon={CalendarPlus} onClick={() => setModalOpen(true)}>
            New Appointment
          </ButtonPill>
        )}
      </div>

      {/* Tab pills */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-1 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-medium transition-all',
              tab === key
                ? 'bg-[#5580F4] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && <AppointmentListTab onNewAppointment={() => setModalOpen(true)} />}
      {tab === 'past'         && <PastConsultationsTab />}
      {tab === 'calendar'     && <CalendarView />}

      <NewAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}