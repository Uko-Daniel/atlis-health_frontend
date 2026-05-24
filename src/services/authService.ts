import api from '@/lib/api'
import type { AuthUser } from '@/types/auth'

interface LoginPayload {
  email: string
  password: string
}

// What the backend actually returns
interface LoginApiResponse {
  staff: {
    id: string
    firstName: string
    lastName: string
    role: AuthUser['role']
    email: string
    phoneNumber: string
    department: AuthUser['department']
    isHOD: boolean
    canVerify: boolean
    createdAt: string
    updatedAt: string
  }
  token: string
}

// What the frontend works with
interface LoginResponse {
  token: string
  user: AuthUser
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<LoginApiResponse>('/auth/login', payload)

  const { staff, token } = res.data

  // Map backend shape → AuthUser shape
const user: AuthUser = {
  sub:        staff.id,
  firstName:  staff.firstName,
  lastName:   staff.lastName,
  role:       staff.role,
  department: staff.department,
  isHOD:      staff.isHOD,
  canVerify:  staff.canVerify,
  email:      staff.email,
}

  return { token, user }
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get<AuthUser>('/auth/me')
  return res.data
}

export async function changePassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  await api.patch('/auth/password', payload)
}