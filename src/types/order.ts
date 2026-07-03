export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'

export interface ServiceCatalogItem {
  id:          string
  name:        string
  labCode:     string | null
  category:    string | null
  description: string | null
  price:       number
  templateId:  string | null
}

export interface OrderService {
  id:        string
  serviceId: string
  service:   ServiceCatalogItem
  createdAt: string
}

export interface Order {
  id:        string
  patientId: string
  status:    OrderStatus
  createdAt: string
  updatedAt: string
  services:  OrderService[]
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:    'Pending',
  PROCESSING: 'Processing',
  COMPLETED:  'Completed',
  CANCELLED:  'Cancelled',
}

import type { Patient } from './patient'

export interface OrderWithPatient extends Order {
  patient?: Patient
}

// Flattened row — one per service within an order, for worklist display
export interface WorklistRow {
  orderId:    string
  orderDate:  string
  patientId:  string
  patientName: string
  serviceId:  string
  serviceName: string
  templateId: string | null
  category:   string | null
}

export function flattenToWorklistRows(orders: OrderWithPatient[]): WorklistRow[] {
  const rows: WorklistRow[] = []
  orders.forEach((order) => {
    if (!order.patient) return
    order.services.forEach((os) => {
      rows.push({
        orderId:     order.id,
        orderDate:   order.createdAt,
        patientId:   order.patientId,
        patientName: `${order.patient!.firstName} ${order.patient!.lastName}`,
        serviceId:   os.service.id,
        serviceName: os.service.name,
        templateId:  os.service.templateId,
        category:    os.service.category,
      })
    })
  })
  return rows
}