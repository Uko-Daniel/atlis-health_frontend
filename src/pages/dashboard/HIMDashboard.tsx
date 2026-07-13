import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Shield, FileText, Download, Search,
  Activity, Users, AlertTriangle, CheckCircle,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'

interface AuditLogEntry {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  ipAddress: string | null
  createdAt: string
}

interface RecordCompleteness {
  patientId: string
  patientName: string
  hasVitals: boolean
  hasDiagnosis: boolean
  hasAllergies: boolean
  lastEncounter: string | null
  missingItems: string[]
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

export default function HimDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canViewAuditLogs = usePermission('allowViewAuditLogs')

  const [logSearch, setLogSearch] = useState('')
  const [logAction, setLogAction] = useState('all')

  const { data: auditLogs, isLoading: logLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/audit-logs', { params: { limit: 50 } })
      return (res.data?.data ?? res.data ?? []) as AuditLogEntry[]
    },
  })

  const { data: completeness, isLoading: compLoading } = useQuery({
    queryKey: ['records', 'completeness'],
    queryFn: async () => {
      const res = await api.get('/records/completeness')
      return (res.data?.data ?? res.data ?? []) as RecordCompleteness[]
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['him', 'stats'],
    queryFn: async () => {
      const [patientsRes, encountersRes, resultsRes] = await Promise.all([
        api.get('/patients', { params: { limit: 1 } }),
        api.get('/encounters', { params: { limit: 1 } }),
        api.get('/results', { params: { limit: 1, status: 'FINALIZED' } }),
      ])
      return {
        totalPatients: patientsRes.data?.total ?? 0,
        totalEncounters: encountersRes.data?.total ?? 0,
        totalResults: resultsRes.data?.total ?? 0,
      }
    },
  })

  const filteredLogs = (auditLogs ?? []).filter((log) => {
    const matchesSearch = log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.entityType.toLowerCase().includes(logSearch.toLowerCase())
    const matchesAction = logAction === 'all' || log.action === logAction
    return matchesSearch && matchesAction
  })

  const uniqueActions = [...new Set((auditLogs ?? []).map((l) => l.action))].sort()

  const incompleteRecords = (completeness ?? []).filter((r) => r.missingItems.length > 0)
  const completeRecords = (completeness ?? []).filter((r) => r.missingItems.length === 0)

  const actionLabel = (action: string) => action.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
<div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-subtle">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h2 className="text-2xl font-bold text-ink mt-0.5">{user?.firstName}</h2>
        <p className="text-xs text-subtle mt-1">
          {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients ?? '—'} color="text-[#5580F4]" bg="bg-[#F0F4FF]" />
        <StatCard icon={Activity} label="Total Encounters" value={stats?.totalEncounters ?? '—'} color="text-[#10B981]" bg="bg-[#ECFDF5]" />
        <StatCard icon={FileText} label="Finalized Results" value={stats?.totalResults ?? '—'} color="text-[#9B6DFF]" bg="bg-[#F5F0FF]" />
        <StatCard icon={Shield} label="Audit Entries" value={auditLogs?.length ?? '—'} color="text-[#F59E0B]" bg="bg-[#FFFBEB]" />
      </div>

      {/* Record Completeness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Complete Records */}
        <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#ECFDF5]">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-[#10B981]" />
              <h3 className="text-sm font-bold text-[#0F172A]">
                Complete Records ({completeRecords.length})
              </h3>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-[#F8FAFF]">
            {compLoading ? (
              <div className="p-4"><Skeleton className="h-8 w-full" /></div>
            ) : completeRecords.length === 0 ? (
              <div className="p-6 text-center"><p className="text-sm text-subtle">No complete records found</p></div>
            ) : (
              completeRecords.slice(0, 8).map((r) => (
                <div key={r.patientId} className="flex items-center justify-between px-5 py-2.5">
                  <p className="text-sm text-[#0F172A]">{r.patientName}</p>
                  <CheckCircle size={13} className="text-[#10B981]" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incomplete Records */}
        <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FFFBEB]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-[#F59E0B]" />
              <h3 className="text-sm font-bold text-[#0F172A]">
                Incomplete Records ({incompleteRecords.length})
              </h3>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-[#F8FAFF]">
            {compLoading ? (
              <div className="p-4"><Skeleton className="h-8 w-full" /></div>
            ) : incompleteRecords.length === 0 ? (
              <div className="p-6 text-center"><p className="text-sm text-subtle">All records complete</p></div>
            ) : (
              incompleteRecords.slice(0, 8).map((r) => (
                <div key={r.patientId} className="px-5 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#0F172A]">{r.patientName}</p>
                    <span className="text-xs text-[#F59E0B]">{r.missingItems.length} missing</span>
                  </div>
                  <p className="text-xs text-subtle mt-0.5">{r.missingItems.join(' · ')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8] p-5">
        <h3 className="text-sm font-bold text-[#0F172A] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction icon={Download} label="Export Records" onClick={() => {}} />
          <QuickAction icon={FileText} label="Print Report" onClick={() => {}} />
          <QuickAction icon={Search} label="Search Patients" onClick={() => navigate('/patients')} />
          <QuickAction icon={Shield} label="View Audit Trail" onClick={() => {}} />
        </div>
      </div>

      {/* Audit Log */}
          {canViewAuditLogs && (
      <div className="bg-white rounded-2xl border border-[#EEF1F8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EEF1F8] bg-[#FAFBFF]">
              <h3 className="text-sm font-bold text-[#0F172A]">Audit Log</h3>
            </div>

            <div className="flex gap-3 px-5 py-3 border-b border-[#EEF1F8]">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <Input value={logSearch} onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search actions or entities…" className="pl-8 border-[#EEF1F8] h-9 text-sm" />
              </div>
              <Select value={logAction} onValueChange={setLogAction}>
                <SelectTrigger className="w-40 h-9 border-[#EEF1F8] text-sm"><SelectValue placeholder="All actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {uniqueActions.map((a) => (
                    <SelectItem key={a} value={a}>{actionLabel(a)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {logLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (<Skeleton key={i} className="h-10 rounded-xl" />))}
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-[#F8FAFF]">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#0F172A]">{actionLabel(log.action)}</p>
                        <span className="text-xs text-subtle">{log.entityType}</span>
                      </div>
                      <p className="text-xs text-subtle truncate mt-0.5">
                        ID: {log.entityId.slice(-8).toUpperCase()}
                        {log.ipAddress && ` · IP: ${log.ipAddress}`}
                      </p>
                    </div>
                    <span className="text-xs text-subtle shrink-0">{timeAgo(log.createdAt)}</span>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <div className="p-6 text-center"><p className="text-sm text-subtle">No audit entries found</p></div>
                )}
              </div>
            )}
          </div>
    )}
      
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bg: string;
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

function QuickAction({ icon: Icon, label, onClick }: {
  icon: React.ElementType; label: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#EEF1F8]
                 hover:bg-[#F8FAFF] hover:border-[#5580F4]/30 transition-all text-left">
      <Icon size={15} className="text-[#5580F4] shrink-0" />
      <span className="text-sm font-medium text-[#0F172A]">{label}</span>
    </button>
  )
}