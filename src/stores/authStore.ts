import { create } from 'zustand'
import type { AuthUser } from '@/types/auth'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => set({ user, token }),

  clearAuth: () => set({ user: null, token: null }),
}))