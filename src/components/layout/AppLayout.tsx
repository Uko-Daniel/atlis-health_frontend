import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { useTenantStore } from '@/hooks/useTenant'

export default function AppLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const subscriptionStatus = useTenantStore((s) => s.subscriptionStatus)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <div className={cn(
        'flex flex-1 flex-col min-w-0 transition-all duration-200',
        sidebarCollapsed ? 'lg:pl-18' : 'lg:pl-55',
      )}>
        <TopBar />
        

        {subscriptionStatus === 'GRACE_PERIOD' && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 py-2 text-center text-sm text-[#92400E]">
            Your subscription is in a grace period. Data entry is restricted.{' '}
            <a href="/settings/billing" className="underline font-medium">Update payment</a> to restore full access.
          </div>
        )}
        {subscriptionStatus === 'SUSPENDED' && (
          <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2 text-center text-sm text-[#991B1B]">
            Your account has been suspended. Please contact billing to reactivate.
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}