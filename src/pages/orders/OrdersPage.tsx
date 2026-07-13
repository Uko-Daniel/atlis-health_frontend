import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Search, Filter, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface OrderListItem {
  id: string
  patientId: string
  status: string
  createdAt: string
  patient: {
    id: string
    firstName: string
    lastName: string
  }
  services: Array<{
    service: { name: string; category: string; price: number }
  }>
  _count: { results: number }
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'border-l-[#F59E0B]',
  PROCESSING: 'border-l-[#5580F4]',
  COMPLETED: 'border-l-[#10B981]',
  CANCELLED: 'border-l-[#EF4444]',
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'all', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await api.get('/orders', { params })
      return res.data.data as OrderListItem[]
    },
  })

  const filtered = (orders ?? []).filter((o) => {
    if (!search.trim()) return true
    const name = `${o.patient.firstName} ${o.patient.lastName}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const totalValue = filtered.reduce((sum, o) => {
    return sum + o.services.reduce((s, os) => s + os.service.price, 0)
  }, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Orders</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Facility-wide order management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#64748B]">
            {filtered.length} orders
          </span>
          <span className="text-sm font-bold text-[#5580F4]">
            {naira(totalValue)}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name…"
            className="pl-9 border-[#EEF1F8]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-[#EEF1F8]">
            <Filter size={13} className="mr-1" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const patientName = `${order.patient.firstName} ${order.patient.lastName}`
            const serviceNames = order.services.map((s) => s.service.name).join(', ')
            const orderTotal = order.services.reduce((sum, s) => sum + s.service.price, 0)

            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className={cn(
                  'bg-white rounded-2xl border border-[#EEF1F8] border-l-4',
                  'shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 cursor-pointer',
                  'hover:shadow-md transition-all',
                  STATUS_COLORS[order.status] ?? 'border-l-[#EEF1F8]',
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={patientName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {patientName}
                      </p>
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">
                        {serviceNames}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-[#5580F4]">
                      {naira(orderTotal)}
                    </span>
                    <StatusBadge
                      value={order.status}
                      label={order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    />
                    {order._count.results > 0 && (
                      <span className="text-xs text-[#64748B]">
                        {order._count.results} result{order._count.results > 1 ? 's' : ''}
                      </span>
                    )}
                    <ExternalLink size={14} className="text-[#CBD5E1]" />
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
              <ClipboardList size={24} className="text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">No orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}