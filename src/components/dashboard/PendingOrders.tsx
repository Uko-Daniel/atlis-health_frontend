import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

// Mock data — replace with useQuery(() => getOrders()) later
const MOCK_ORDERS = [
  { id: 'o1', patient: 'Adaeze Okafor',    type: 'Full Blood Count',       dept: 'LABORATORY',  status: 'PENDING'     as OrderStatus, time: '09:20 AM' },
  { id: 'o2', patient: 'Emeka Nwosu',      type: 'Lipid Profile',          dept: 'LABORATORY',  status: 'IN_PROGRESS' as OrderStatus, time: '09:45 AM' },
  { id: 'o3', patient: 'Fatima Al-Hassan', type: 'Obstetric Ultrasound',   dept: 'RADIOLOGY',   status: 'PENDING'     as OrderStatus, time: '10:10 AM' },
  { id: 'o4', patient: 'Chukwudi Eze',     type: 'Chest X-Ray',            dept: 'RADIOLOGY',   status: 'IN_PROGRESS' as OrderStatus, time: '10:35 AM' },
  { id: 'o5', patient: 'Ngozi Adeleke',    type: 'Widal Test',             dept: 'LABORATORY',  status: 'PENDING'     as OrderStatus, time: '11:05 AM' },
]

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:     'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED:   'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
}

export default function PendingOrders() {
  const navigate = useNavigate()

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Pending Orders
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 hover:text-blue-700 gap-1 h-auto py-1"
          onClick={() => navigate('/orders')}
        >
          View all <ArrowRight size={12} />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {MOCK_ORDERS.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50
                         transition-colors cursor-pointer"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {order.type}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {order.patient} · {order.dept.charAt(0) + order.dept.slice(1).toLowerCase()}
                </p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn('text-xs font-normal', STATUS_STYLES[order.status])}
                >
                  {STATUS_LABELS[order.status]}
                </Badge>
                <span className="text-xs text-slate-400">{order.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}