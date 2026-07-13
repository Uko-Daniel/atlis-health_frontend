import { useNavigate } from 'react-router-dom'
import { Shield, Palette, Bell, Database, CreditCard, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const SETTINGS_CARDS = [
  {
    key: 'permissions',
    label: 'Permissions',
    description: 'Configure which roles can perform specific actions',
    icon: Shield,
    path: '/settings/permissions',
    color: 'text-[#5580F4]',
    bg: 'bg-[#F0F4FF]',
  },
  {
    key: 'appearance',
    label: 'Appearance',
    description: 'Customize your facility branding and theme',
    icon: Palette,
    path: '/settings/appearance',
    color: 'text-[#9B6DFF]',
    bg: 'bg-[#F5F0FF]',
    disabled: true,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Manage alert preferences and email settings',
    icon: Bell,
    path: '/settings/notifications',
    color: 'text-[#F59E0B]',
    bg: 'bg-[#FFFBEB]',
    disabled: true,
  },
  {
    key: 'data',
    label: 'Data & Privacy',
    description: 'Export, retention, and compliance settings',
    icon: Database,
    path: '/settings/data',
    color: 'text-[#10B981]',
    bg: 'bg-[#ECFDF5]',
    disabled: true,
  },
  {
    key: 'billing',
    label: 'Billing',
    description: 'View subscription usage and billing history',
    icon: CreditCard,
    path: '/settings/billing',
    color: 'text-[#10B981]',
    bg: 'bg-[#ECFDF5]',
  },
  {
    key: 'google',
    label: 'Google Integration',
    description: 'Connect Calendar, Meet, and Drive',
    icon: Link2,
    path: '/settings/google',
    color: 'text-[#5580F4]',
    bg: 'bg-[#F0F4FF]',
  },
]

export default function SettingsIndex() {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">Settings</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Manage your facility configuration
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.key}
              onClick={() => !card.disabled && navigate(card.path)}
              disabled={card.disabled}
              className={cn(
                'flex items-start gap-4 rounded-2xl border border-[#EEF1F8]',
                'bg-white p-5 text-left transition-all',
                'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
                card.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-[#5580F4]/30 hover:shadow-md',
              )}
            >
              <div className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                card.bg,
              )}>
                <Icon size={18} className={card.color} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {card.label}
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {card.description}
                </p>
                {card.disabled && (
                  <span className="inline-block mt-2 text-xs text-[#94A3B8] bg-[#F8FAFF] px-2 py-0.5 rounded-full">
                    Coming soon
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}