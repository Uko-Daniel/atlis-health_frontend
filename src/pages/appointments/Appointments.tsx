import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import NewAppointmentModal from '@/components/appointments/NewAppointmentModal'
import AppointmentListTab  from '@/components/appointments/AppointmentListTab'
import PastConsultationsTab from '@/components/appointments/PastConsultationsTab'
import CalendarView        from '@/components/appointments/CalendarView'
import { cn } from '@/lib/utils'

type Tab = 'appointments' | 'past' | 'calendar'

const TABS: { key: Tab; label: string }[] = [
  { key: 'appointments', label: 'Appointments'       },
  { key: 'past',         label: 'Past Consultations' },
  { key: 'calendar',     label: 'Calendar View'      },
]

// Roles that can create new encounters
const CAN_CREATE = ['ADMIN', 'DOCTOR', 'NURSES']

export default function Appointments() {
  const user        = useAuthStore((s) => s.user)
  const canCreate   = user && CAN_CREATE.includes(user.role)
  const [tab, setTab]       = useState<Tab>('appointments')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="-m-6 min-h-full bg-[#EBEBFF] p-6 space-y-6">

      {/* ── Header ── */}
      <h2 className="text-3xl font-bold text-[#252660]">Appointments</h2>

      {/* ── Tabs + CTA ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-white rounded-2xl p-1 shadow-sm">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-5 py-2 rounded-xl text-sm font-medium transition-colors',
                tab === key
                  ? 'bg-white shadow text-slate-800 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                       text-white text-sm font-medium px-5 py-2.5 rounded-full
                       transition-colors shadow"
          >
            New Consultation
          </button>
        )}
      </div>

      {/* ── Tab content ── */}
      {tab === 'appointments' && <AppointmentListTab />}
      {tab === 'past'         && <PastConsultationsTab />}
      {tab === 'calendar'     && <CalendarView />}

      {/* ── Modal ── */}
      <NewAppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}