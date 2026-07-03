import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Search, Check, FlaskConical, Scan } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input }       from '@/components/ui/input'
import { ButtonPill }  from '@/components/ui/atoms/ButtonPill'
import { getAllServices } from '@/services/catalogService'
import { createOrder }    from '@/services/orderService'
import type { ServiceCatalogItem } from '@/types/order'
import { cn } from '@/lib/utils'

interface Props {
  open:      boolean
  onClose:   () => void
  patientId: string
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LABORATORY: FlaskConical,
  RADIOLOGY:  Scan,
  DEFAULT:    ClipboardList,
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
}

export default function CreateOrderModal({ open, onClose, patientId }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', 'catalog'],
    queryFn:  getAllServices,
    enabled:  open,
  })

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'patient', patientId] })
      handleClose()
    },
  })

  const handleClose = () => {
    setSelected(new Set())
    setSearch('')
    onClose()
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter + group by category
  const grouped = useMemo(() => {
    const list = services ?? []
    const filtered = search.trim()
      ? list.filter((s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.category?.toLowerCase().includes(search.toLowerCase()),
        )
      : list

    const groups: Record<string, ServiceCatalogItem[]> = {}
    filtered.forEach((s) => {
      const key = s.category ?? 'Other'
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    })
    return Object.entries(groups)
  }, [services, search])

  const selectedServices = (services ?? []).filter((s) => selected.has(s.id))
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  const handleSubmit = () => {
    if (selected.size === 0) return
    mutation.mutate({ patientId, serviceIds: Array.from(selected) })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#F0F4FF]">
              <ClipboardList size={17} className="text-[#5580F4]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#0F172A]">
              Create Order
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services or category…"
            className="pl-9 border-[#EEF1F8]"
          />
        </div>

        {/* Service list — scrollable */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4">
          {isLoading && (
            <p className="text-sm text-[#94A3B8] text-center py-8">Loading services…</p>
          )}

          {!isLoading && grouped.length === 0 && (
            <p className="text-sm text-[#94A3B8] text-center py-8">No services found</p>
          )}

          {!isLoading && grouped.map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.DEFAULT
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className="text-[#94A3B8]" />
                  <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide">
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {items.map((service) => {
                    const isSelected = selected.has(service.id)
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggle(service.id)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3',
                          'border text-left transition-all',
                          isSelected
                            ? 'bg-[#F0F4FF] border-[#5580F4]'
                            : 'bg-white border-[#EEF1F8] hover:border-[#5580F4]/30',
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-md border-2',
                            isSelected
                              ? 'bg-[#5580F4] border-[#5580F4]'
                              : 'border-[#CBD5E1]',
                          )}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0F172A] truncate">
                              {service.name}
                            </p>
                            {service.labCode && (
                              <p className="text-xs text-[#94A3B8] font-mono">
                                {service.labCode}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#5580F4] shrink-0">
                          {naira(service.price)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected summary */}
        {selected.size > 0 && (
          <div className="shrink-0 bg-[#F0F4FF] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-[#5580F4]">
              {selected.size} service{selected.size !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm font-bold text-[#5580F4]">
              Total: {naira(totalPrice)}
            </span>
          </div>
        )}

        {mutation.isError && (
          <div className="shrink-0 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600">
            Failed to create order. Please try again.
          </div>
        )}

        <DialogFooter className="gap-2 shrink-0">
          <ButtonPill variant="ghost" onClick={handleClose}>
            Cancel
          </ButtonPill>
          <ButtonPill
            variant="primary"
            icon={Check}
            disabled={selected.size === 0}
            loading={mutation.isPending}
            onClick={handleSubmit}
          >
            Create Order ({selected.size})
          </ButtonPill>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
