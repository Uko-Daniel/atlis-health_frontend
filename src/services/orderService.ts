import api from '@/lib/api'
import type { Order, OrderStatus, OrderWithPatient } from '@/types/order'

export interface CreateOrderPayload {
  patientId:  string
  serviceIds: string[]
}

// POST /orders
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await api.post<Order>('/orders', payload)
  return res.data
}

// GET /orders/patient/:id
export async function getOrdersByPatient(patientId: string): Promise<Order[]> {
  const res = await api.get<Order[]>(`/orders/patient/${patientId}`)
  return res.data
}

// GET /orders/:id
export async function getOrderById(id: string): Promise<Order> {
  const res = await api.get<Order>(`/orders/${id}`)
  return res.data
}

// PUT /orders/:id/status
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const res = await api.put<Order>(`/orders/${id}/status`, { status })
  return res.data
}

export interface PaginatedOrders {
  data:  OrderWithPatient[]
  total: number
  page:  number
  limit: number
}

// GET /orders/status/:status?page=&limit=
export async function getOrdersByStatus(
  status: OrderStatus,
  page = 1,
  limit = 50,
): Promise<PaginatedOrders> {
  const res = await api.get<PaginatedOrders>(`/orders/status/${status}`, { params: { page, limit } })
  return res.data
}