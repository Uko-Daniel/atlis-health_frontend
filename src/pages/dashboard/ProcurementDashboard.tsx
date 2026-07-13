import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Package, AlertTriangle, Plus, Search,
  Truck, Building,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { StatusBadge } from '@/components/ui/atoms/StatusBadge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'


interface InventoryItem {
  id: string
  name: string
  category: string | null
  unit: string
  quantity: number
  flagLevel: number
  unitPrice: number | null
  expiryDate: string | null
  supplier: { id: string; name: string } | null
}

interface Supplier {
  id: string
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
}

interface PurchaseOrder {
  id: string
  supplier: { name: string }
  status: string
  totalAmount: number
  createdAt: string
}

function naira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CATEGORIES = ['Pharmacy', 'Lab', 'Imaging', 'General']

export default function ProcurementDashboard() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canManageInventory = usePermission('allowManageInventory')

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddSupplier, setShowAddSupplier] = useState(false)

  // Form state
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('Pharmacy')
  const [itemUnit, setItemUnit] = useState('boxes')
  const [itemQty, setItemQty] = useState('')
  const [itemFlag, setItemFlag] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemSupplierId, setItemSupplierId] = useState('')
  const [itemExpiry, setItemExpiry] = useState('')

  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/inventory')
      return res.data as InventoryItem[]
    },
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers')
      return res.data as Supplier[]
    },
  })

  const { data: purchaseOrders } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await api.get('/purchase-orders', { params: { limit: 10 } })
      return res.data?.data as PurchaseOrder[]
    },
  })

  const addItemMut = useMutation({
    mutationFn: (data: any) => api.post('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Item added')
      setShowAddItem(false)
      resetItemForm()
    },
    onError: () => toast.error('Failed to add item'),
  })

  const addSupplierMut = useMutation({
    mutationFn: (data: any) => api.post('/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier added')
      setShowAddSupplier(false)
      resetSupplierForm()
    },
    onError: () => toast.error('Failed to add supplier'),
  })

  const resetItemForm = () => {
    setItemName(''); setItemCategory('Pharmacy'); setItemUnit('boxes')
    setItemQty(''); setItemFlag(''); setItemPrice('')
    setItemSupplierId(''); setItemExpiry('')
  }

  const resetSupplierForm = () => {
    setSupplierName(''); setSupplierContact(''); setSupplierPhone(''); setSupplierEmail('')
  }

  const filtered = (inventory ?? []).filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCat = catFilter === 'all' || item.category === catFilter
    return matchesSearch && matchesCat
  })

  const lowStock = (inventory ?? []).filter((i) => i.quantity <= i.flagLevel)
  const inventoryValue = (inventory ?? []).reduce(
    (sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0,
  )
  const pendingPOs = (purchaseOrders ?? []).filter((po) => po.status === 'PENDING' || po.status === 'PROCESSING')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-medium text-subtle">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h2 className="text-2xl font-bold text-ink mt-0.5">{user?.firstName}</h2>
        <p className="text-xs text-subtle mt-1">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Total Items" value={inventory?.length ?? 0} color="text-[#5580F4]" bg="bg-[#F0F4FF]" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={lowStock.length} color="text-[#EF4444]" bg="bg-[#FEF2F2]" />
        <StatCard icon={Truck} label="Pending Orders" value={pendingPOs.length} color="text-[#F59E0B]" bg="bg-[#FFFBEB]" />
        <StatCard icon={Building} label="Suppliers" value={suppliers?.length ?? 0} color="text-[#10B981]" bg="bg-[#ECFDF5]" />
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-[#EF4444]" />
            <h3 className="text-sm font-bold text-[#991B1B]">Low Stock Alert</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 8).map((item) => (
              <span key={item.id} className="text-xs bg-white border border-[#FECACA] rounded-full px-3 py-1 text-[#991B1B] font-medium">
                {item.name}: {item.quantity} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Inventory</h3>
            <p className="text-xs text-subtle mt-0.5">Value: {naira(inventoryValue)}</p>
          </div>
          {canManageInventory && (
            <>
              <ButtonPill variant="ghost" size="sm" icon={Building} onClick={() => setShowAddSupplier(true)}>
                Supplier
              </ButtonPill>
              <ButtonPill variant="primary" size="sm" icon={Plus} onClick={() => setShowAddItem(true)}>
                Add Item
              </ButtonPill>
            </>
          )}
        </div>

        <div className="flex gap-3 px-5 py-3 border-b border-[#EEF1F8]">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory…" className="pl-8 border-[#EEF1F8] h-9 text-sm" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-36 h-9 border-[#EEF1F8] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {invLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-10 rounded-xl" />))}</div>
        ) : (
          <div className="divide-y divide-[#F8FAFF] max-h-96 overflow-y-auto">
            {filtered.map((item) => (
              <div key={item.id} className={cn(
                'flex items-center justify-between px-5 py-3',
                item.quantity <= item.flagLevel && 'bg-[#FFFBEB]',
              )}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0F172A] truncate">{item.name}</p>
                  <p className="text-xs text-subtle">
                    {item.category} · {item.unit} · {item.supplier?.name ?? 'No supplier'}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', item.quantity <= item.flagLevel ? 'text-[#EF4444]' : 'text-[#0F172A]')}>
                      {item.quantity}
                    </p>
                    {item.unitPrice && <p className="text-xs text-subtle">{naira(item.unitPrice)}/unit</p>}
                  </div>
                  {item.quantity <= item.flagLevel && (
                    <AlertTriangle size={14} className="text-[#EF4444]" />
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center"><p className="text-sm text-subtle">No items found</p></div>
            )}
          </div>
        )}
      </div>

      {/* Purchase Orders */}
      {pendingPOs.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF1F8]">
            <h3 className="text-sm font-bold text-[#0F172A]">Pending Purchase Orders</h3>
          </div>
          <div className="divide-y divide-[#F8FAFF]">
            {pendingPOs.map((po) => (
              <div key={po.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{po.supplier.name}</p>
                  <p className="text-xs text-subtle">{fmtDate(po.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#5580F4]">{naira(Number(po.totalAmount))}</span>
                  <StatusBadge value={po.status} label={po.status.charAt(0) + po.status.slice(1).toLowerCase()} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-base font-bold">Add Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Name *</Label><Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Quantity *</Label><Input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Unit</Label><Input value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} placeholder="boxes" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Flag Level</Label><Input type="number" value={itemFlag} onChange={(e) => setItemFlag(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Unit Price (₦)</Label><Input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Expiry Date</Label><Input type="date" value={itemExpiry} onChange={(e) => setItemExpiry(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Supplier</Label>
              <Select value={itemSupplierId} onValueChange={setItemSupplierId}>
                <SelectTrigger><SelectValue placeholder="No supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No supplier</SelectItem>
                  {(suppliers ?? []).map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => setShowAddItem(false)}>Cancel</ButtonPill>
            <ButtonPill variant="primary" loading={addItemMut.isPending} onClick={() => addItemMut.mutate({
              name: itemName, category: itemCategory, unit: itemUnit,
              quantity: parseFloat(itemQty), flagLevel: parseFloat(itemFlag) || 0,
              unitPrice: itemPrice ? parseFloat(itemPrice) : undefined,
              supplierId: itemSupplierId || undefined,
              expiryDate: itemExpiry || undefined,
            })} disabled={!itemName || !itemQty}>Add Item</ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Modal */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-base font-bold">Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5"><Label>Name *</Label><Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><Label>Contact Person</Label><Input value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Email</Label><Input value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <ButtonPill variant="ghost" onClick={() => setShowAddSupplier(false)}>Cancel</ButtonPill>
            <ButtonPill variant="primary" loading={addSupplierMut.isPending} onClick={() => addSupplierMut.mutate({
              name: supplierName, contactPerson: supplierContact || undefined,
              phone: supplierPhone || undefined, email: supplierEmail || undefined,
            })} disabled={!supplierName}>Add Supplier</ButtonPill>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className={cn('rounded-2xl border p-4', bg, 'border-transparent')}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/70"><Icon size={14} className={color} /></div>
        <span className="text-xs text-subtle">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </div>
  )
}