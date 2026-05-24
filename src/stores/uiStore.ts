import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean       // mobile drawer
  sidebarCollapsed: boolean  // desktop icon-only mode
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapsed: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapsed: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))