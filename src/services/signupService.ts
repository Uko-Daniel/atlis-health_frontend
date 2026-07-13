import api from '@/lib/api'

export interface SignupRequestInput {
  firstName:     string
  lastName:      string
  email:         string
  phone:         string
  profession:    string
  role:          string
  department:    string
  facility?:     string
  licenseNumber?: string
  message?:      string
}

export interface SignupRequestItem {
  id:            string
  firstName:     string
  lastName:      string
  email:         string
  phone:         string
  profession:    string
  role:          string
  department:    string
  facility:      string | null
  licenseNumber: string | null
  message:       string | null
  status:        'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy:    string | null
  reviewedAt:    string | null
  reviewNotes:   string | null
  createdStaffId?: string
  createdAt:     string
}

export interface SignupRequestListResponse {
  data:  SignupRequestItem[]
  total: number
  page:  number
  limit: number
}

export async function submitSignupRequest(data: SignupRequestInput) {
  const res = await api.post('/signup', data)
  return res.data as { message: string; id: string }
}

export async function getSignupRequests(params?: {
  status?: string
  page?:   number
  limit?:  number
}) {
  const res = await api.get('/admin/signup-requests', { params })
  return res.data as SignupRequestListResponse
}

export async function reviewSignupRequest(
  id:     string,
  action: 'APPROVE' | 'REJECT',
  reviewNotes?: string,
) {
  const res = await api.patch(`/admin/signup-requests/${id}`, {
    action,
    reviewNotes,
  })
  return res.data
}