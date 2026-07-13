import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Activity, Plus, Heart, Thermometer, Droplets, Weight } from 'lucide-react'
import type { PatientOutletContext } from '@/hooks/usePatient'
import { getVitalTrend } from '@/services/vitalsService'
import { ButtonPill }   from '@/components/ui/atoms/ButtonPill'
import { GraphRenderer } from '@/components/ui/molecules/GraphRenderer'
import { TableCard, type TableColumn } from '@/components/ui/compounds/TableCard'
import { Skeleton } from '@/components/ui/skeleton'
import RecordVitalsModal from '@/components/patients/RecordVitalsModal'
import type { VitalSummary } from '@/types/patient'
import { cn } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'


type MetricKey = 'bp' | 'hr' | 'temp' | 'spo2' | 'weight'

const METRICS: {
  key:    MetricKey
  label:  string
  icon:   React.ElementType
  color:  string
  bg:     string
  series: { key: string; label: string; color: string }[]
}[] = [
  {
    key: 'bp', label: 'Blood Pressure', icon: Heart,
    color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]',
    series: [
      { key: 'systolicBP',  label: 'Systolic',  color: '#EF4444' },
      { key: 'diastolicBP', label: 'Diastolic', color: '#F59E0B' },
    ],
  },
  {
    key: 'hr', label: 'Heart Rate', icon: Activity,
    color: 'text-[#5580F4]', bg: 'bg-[#F0F4FF]',
    series: [{ key: 'heartRate', label: 'Heart Rate', color: '#5580F4' }],
  },
  {
    key: 'temp', label: 'Temperature', icon: Thermometer,
    color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]',
    series: [{ key: 'temperature', label: 'Temperature', color: '#F59E0B' }],
  },
  {
    key: 'spo2', label: 'SpO₂', icon: Droplets,
    color: 'text-[#0ACDBA]', bg: 'bg-[#ECFDFD]',
    series: [{ key: 'spO2', label: 'SpO₂', color: '#0ACDBA' }],
  },
  {
    key: 'weight', label: 'Weight', icon: Weight,
    color: 'text-[#9B6DFF]', bg: 'bg-[#F5F0FF]',
    series: [{ key: 'weight', label: 'Weight', color: '#9B6DFF' }],
  },
]

function shortDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })
}

function fullDateTime(d: string) {
  return new Date(d).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function VitalsTab() {
  const { id } = useParams<{ id: string }>()
  const { patient } = useOutletContext<PatientOutletContext>()
  const canRecord = usePermission('allowRecordVitalsWithoutActiveEncounter')
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('bp')
  const [modalOpen, setModalOpen] = useState(false)

  const { data: trend, isLoading } = useQuery({
    queryKey: ['vitals', 'trend', id],
    queryFn:  () => getVitalTrend(id!, 20),
    enabled:  !!id,
  })

  const vitals = (trend ?? []).slice().reverse() // oldest → newest for chart

  // Active (open) encounter — required to attach new vitals
  const activeEncounter = patient?.encounters?.find((e) => !e.stopTime)

  const activeMetric = METRICS.find((m) => m.key === selectedMetric)!

  // Build chart data shape
  const chartData = vitals.map((v) => {
    const row: Record<string, unknown> = { name: shortDate(v.recordedAt) }
    activeMetric.series.forEach((s) => {
      row[s.key] = v[s.key as keyof VitalSummary] ?? null
    })
    return row
  })

  const hasData = vitals.some((v) =>
    activeMetric.series.some((s) => v[s.key as keyof VitalSummary] != null),
  )

  // ── History table columns ──
  const columns: TableColumn<VitalSummary>[] = [
    {
      key: 'recordedAt', label: 'Date & Time',
      render: (_, row) => (
        <span className="text-sm text-[#0F172A] font-medium">
          {fullDateTime(row.recordedAt)}
        </span>
      ),
    },
    {
      key: 'systolicBP', label: 'BP', align: 'center', hide: 'sm',
      render: (_, row) => (
        <span className="text-sm text-[#64748B]">
          {row.systolicBP && row.diastolicBP
            ? `${row.systolicBP}/${row.diastolicBP}`
            : <span className="text-[#CBD5E1]">—</span>}
        </span>
      ),
    },
    {
      key: 'heartRate', label: 'HR', align: 'center', hide: 'sm',
      render: (_, row) => (
        <span className="text-sm text-[#64748B]">{row.heartRate ?? '—'}</span>
      ),
    },
    {
      key: 'temperature', label: 'Temp', align: 'center', hide: 'md',
      render: (_, row) => (
        <span className="text-sm text-[#64748B]">{row.temperature ?? '—'}</span>
      ),
    },
    {
      key: 'spO2', label: 'SpO₂', align: 'center', hide: 'md',
      render: (_, row) => (
        <span className="text-sm text-[#64748B]">{row.spO2 ?? '—'}</span>
      ),
    },
    {
      key: 'recordedBy', label: 'Recorded By', align: 'right', hide: 'lg',
      render: (_, row) => (
        <span className="text-xs text-[#94A3B8]">{row.recordedBy}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Vitals</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {vitals.length} reading{vitals.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {canRecord && (
          <ButtonPill
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Record Vitals
          </ButtonPill>
        )}
      </div>

      {/* Metric switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {METRICS.map((m) => {
          const Icon = m.icon
          const active = m.key === selectedMetric
          return (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={cn(
                'flex items-center gap-2 shrink-0 rounded-full px-3.5 py-2',
                'text-xs font-semibold transition-all border',
                active
                  ? 'bg-[#5580F4] text-white border-[#5580F4] shadow-sm shadow-[#5580F4]/25'
                  : 'bg-white text-[#64748B] border-[#EEF1F8] hover:border-[#5580F4]/30',
              )}
            >
              <Icon size={13} className={active ? 'text-white' : m.color} />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Chart card */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        {isLoading ? (
          <Skeleton className="h-52 w-full rounded-xl" />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className={cn('flex size-12 items-center justify-center rounded-2xl mb-3', activeMetric.bg)}>
              <activeMetric.icon size={22} className={activeMetric.color} />
            </div>
            <p className="text-sm font-bold text-[#0F172A]">No data yet</p>
            <p className="text-xs text-[#94A3B8] mt-1">
              {activeMetric.label} readings will chart here once recorded
            </p>
          </div>
        ) : (
          <GraphRenderer
            type="line"
            data={chartData}
            series={activeMetric.series}
            xKey="name"
            curved
            showGrid
            showLegend={activeMetric.series.length > 1}
            height={220}
          />
        )}
      </div>

      {/* History table */}
      <TableCard
        columns={columns}
        data={vitals.slice().reverse()} // newest first for table
        isLoading={isLoading}
        keyField="id"
        emptyState={{
          icon: Activity,
          title: 'No vitals recorded',
          body: 'Vitals history will appear here',
        }}
        header={{ title: 'History' }}
      />

      {/* Record modal */}
      <RecordVitalsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patientId={id!}
        activeEncounter={activeEncounter}
      />
    </div>
  )
}