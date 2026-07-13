import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Plus, ChevronRight } from 'lucide-react'
import { getOrdersByPatient } from '@/services/orderService'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/order'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { Skeleton }    from '@/components/ui/skeleton'
import CreateOrderModal from '@/components/patients/CreateOrderModal'
import { usePermission } from '@/hooks/usePermission'

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_BORDER: Record<OrderStatus, string> = {
  PENDING:    'border-l-[#F59E0B]',
  PROCESSING: 'border-l-[#5580F4]',
  COMPLETED:  'border-l-[#10B981]',
  CANCELLED:  'border-l-[#94A3B8]',
}

export default function OrdersTab() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canOrderTests = usePermission('allowOrderTest')
  const [modalOpen, setModalOpen] = useState(false)

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders', 'patient', id],
    queryFn:  () => getOrdersByPatient(id!),
    enabled:  !!id,
  })

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Orders</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {orders?.length ?? 0} order{orders?.length !== 1 ? 's' : ''} placed
          </p>
        </div>
        {canOrderTests && (
          <ButtonPill
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            New Order
          </ButtonPill>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8] p-8 text-center">
          <p className="text-sm text-red-500 font-medium">Failed to load orders</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (orders?.length ?? 0) === 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8]
                        shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl
                          bg-[#F0F4FF] mx-auto mb-4">
            <ClipboardList size={24} className="text-[#5580F4]" />
          </div>
          <p className="text-sm font-bold text-[#0F172A]">No orders yet</p>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-xs mx-auto">
            Lab, imaging, and procedure orders for this patient will appear here
          </p>
          {canOrderTests && (
            <ButtonPill
              variant="subtle"
              size="sm"
              icon={Plus}
              className="mt-4 mx-auto"
              onClick={() => setModalOpen(true)}
            >
              Create First Order
            </ButtonPill>
          )}
        </div>
      )}

      {/* Order cards */}
      {!isLoading && !isError && orders && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const total = order.services.reduce((sum, os) => sum + os.service.price, 0)
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className={`bg-white rounded-2xl border border-[#EEF1F8] border-l-4
                           ${STATUS_BORDER[order.status]}
                           shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 cursor-pointer
                           hover:shadow-md transition-all group`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-[#94A3B8]">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge value={order.status} label={ORDER_STATUS_LABELS[order.status]} size="sm" />
                    </div>
                    <p className="text-sm text-[#64748B] mt-1.5">
                      {order.services.length} service{order.services.length !== 1 ? 's' : ''}:{' '}
                      <span className="text-[#0F172A] font-medium">
                        {order.services.map((os) => os.service.name).join(', ')}
                      </span>
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-1.5">
                      Placed {fmtDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-sm font-bold text-[#0F172A]">
                      {naira(total)}
                    </span>
                    <ChevronRight
                      size={15}
                      className="text-[#94A3B8] opacity-0 group-hover:opacity-100
                                 transition-opacity"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patientId={id!}
      />
    </div>
  )
}