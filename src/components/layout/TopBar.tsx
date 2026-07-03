import { useState } from 'react'
import { Menu, MessageSquare } from 'lucide-react'
import { useUIStore }         from '@/stores/uiStore'
import { SearchBar }          from '@/components/ui/molecules/SearchBar'
import { NotificationButton } from '@/components/ui/molecules/NotificationButton'
import { ProfileButton }      from '@/components/ui/molecules/ProfileButton'


export default function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const [search, setSearch] = useState('')

  return (
    <header className="flex h-16 shrink-0 items-center gap-4
                       border-b border-[#EEF1F8] bg-white px-4 sm:px-6
                       shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

      {/* Hamburger — mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden text-subtle hover:text-ink
                   transition-colors rounded-xl p-2 hover:bg-bg shrink-0"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-auto">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search patients, results…"
          debounce={400}
          size="sm"
          className="w-full"
        />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <button
          className="flex size-9 items-center justify-center rounded-xl
                     text-subtle hover:text-[#5580F4] hover:bg-primary-50
                     transition-all"
          aria-label="Messages"
        >
          <MessageSquare size={17} />
        </button>

        <NotificationButton
          notifications={[]}
          onMarkRead={() => {}}
          onMarkAllRead={() => {}}
        />

        <div className="w-px h-5 bg-[#EEF1F8] mx-1" />

        <ProfileButton />
      </div>
    </header>
  )}