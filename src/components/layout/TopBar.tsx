import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { NAV_ITEMS } from './navConfig'

function usePageTitle(): string {
  const { pathname } = useLocation()
  // Find the deepest nav item that matches the current path
  const match = [...NAV_ITEMS]
    .reverse()
    .find((item) => pathname === item.path || pathname.startsWith(item.path + '/'))
  return match?.label ?? 'Atlis Health'
}

export default function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const title = usePageTitle()

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">

      {/* Hamburger — mobile only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors rounded-md p-1 hover:bg-slate-100"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-sm font-semibold text-slate-800">
        {title}
      </h1>

      {/* Right-side actions */}
      <div className="flex items-center gap-1">
        <button
          className="relative rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Unread indicator — wire to real data later */}
          <span
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white"
            aria-hidden="true"
          />
        </button>
      </div>

    </header>
  )
}