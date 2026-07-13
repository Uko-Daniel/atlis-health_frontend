import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, FileText, FlaskConical, Scan, Clock,
  CheckCircle, XCircle, AlertTriangle, ExternalLink,
} from 'lucide-react'
import api from '@/lib/api'
import { Avatar } from '@/components/ui/atoms/Avatar'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface OrderServiceItem {
  id: string
  service: {
    id: string
    name: string
    category: string
    price: number
    labCode: string | null
  }
}

interface OrderResult {
  id: string
  status: string
  template: { name: string } | null
  createdAt: string
}

interface OrderDetail {
  id: string
  patientId: string
  status: string
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    firstName: string
    lastName: string
    dob: string
  }
  services: OrderServiceItem[]
  results: OrderResult[]
}

async function getOrderById(id: string): Promise<OrderDetail> {
  const res = await api.get(`/orders/${id}`)
  return res.data
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock,
  PROCESSING: AlertTriangle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-[#F59E0B] bg-[#FFFBEB] border-[#FDE68A]',
  PROCESSING: 'text-[#5580F4] bg-[#F0F4FF] border-[#5580F4]/30',
  COMPLETED: 'text-[#10B981] bg-[#ECFDF5] border-[#10B981]/30',
  CANCELLED: 'text-[#EF4444] bg-[#FEF2F2] border-[#FECACA]',
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Hematology: FlaskConical,
  Parasitology: FlaskConical,
  Chemistry: FlaskConical,
  Microbiology: FlaskConical,
  Imaging: Scan,
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertTriangle size={32} className="text-[#EF4444]" />
        <p className="text-lg font-bold text-[#0F172A]">Order not found</p>
        <ButtonPill variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go Back
        </ButtonPill>
      </div>
    )
  }

  const totalPrice = order.services.reduce((sum, s) => sum + s.service.price, 0)
  const StatusIcon = STATUS_ICONS[order.status] ?? Clock
  const patientName = `${order.patient.firstName} ${order.patient.lastName}`

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Avatar name={patientName} size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  <Link
                    to={`/patients/${order.patientId}`}
                    className="hover:text-[#5580F4] transition-colors"
                  >
                    {patientName}
                  </Link>
                </h2>
              </div>
              <p className="text-sm text-[#64748B]">
                Order #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">{fmtDate(order.createdAt)}</p>
            </div>
          </div>

          <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium',
            STATUS_COLORS[order.status],
          )}>
            <StatusIcon size={15} />
            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
          <h3 className="text-sm font-bold text-[#0F172A]">
            Services ({order.services.length})
          </h3>
        </div>

        <div className="divide-y divide-[#F8FAFF]">
          {order.services.map((os) => {
            const Icon = CATEGORY_ICONS[os.service.category] ?? FileText
            return (
              <div key={os.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F8FAFF]">
                    <Icon size={14} className="text-[#94A3B8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {os.service.name}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {os.service.category}
                      {os.service.labCode && (
                        <span className="ml-2 font-mono">{os.service.labCode}</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#5580F4] shrink-0">
                  {naira(os.service.price)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-4 bg-[#FAFBFF] flex items-center justify-between">
          <span className="text-sm font-bold text-[#0F172A]">Total</span>
          <span className="text-lg font-bold text-[#5580F4]">{naira(totalPrice)}</span>
        </div>
      </div>

      {/* Linked Results */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
          <h3 className="text-sm font-bold text-[#0F172A]">
            Results ({order.results.length})
          </h3>
        </div>

        {order.results.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={24} className="text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-sm text-[#94A3B8]">No results yet</p>
            <p className="text-xs text-[#CBD5E1] mt-1">
              Results will appear here once lab work is completed
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8FAFF]">
            {order.results.map((result) => (
              <div key={result.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">
                    {result.template?.name ?? 'Result'}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{fmtDate(result.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={result.status} label={result.status} />
                  <Link
                    to={`/results/${result.id}`}
                    className="text-[#5580F4] hover:text-[#3D67F1] transition-colors"
                  >
                    <ExternalLink size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}