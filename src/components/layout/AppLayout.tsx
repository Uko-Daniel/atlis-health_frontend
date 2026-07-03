import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export default function AppLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <div className={cn(
        'flex flex-1 flex-col min-w-0 transition-all duration-200',
        sidebarCollapsed ? 'lg:pl-18' : 'lg:pl-55',
      )}>
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}