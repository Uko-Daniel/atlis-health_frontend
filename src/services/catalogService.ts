import api from '@/lib/api'
import type { ServiceCatalogItem } from '@/types/order'

// GET /services
export async function getAllServices(): Promise<ServiceCatalogItem[]> {
  const res = await api.get<ServiceCatalogItem[]>('/services')
  return res.data
}

// GET /services/search?name=
export async function searchServices(name: string): Promise<ServiceCatalogItem[]> {
  const res = await api.get<ServiceCatalogItem[]>('/services/search', { params: { name } })
  return res.data
}