import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ResponsiveContainer,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

export type GraphType = 'bar' | 'line' | 'area' | 'pie' | 'donut'

export interface GraphSeries {
  key:    string         // dataKey in recharts
  label?: string         // display name
  color?: string         // hex color
}

export interface GraphConfig {
  type:        GraphType
  data:        Record<string, unknown>[]
  series:      GraphSeries[]
  xKey?:       string          // key for X axis labels
  showGrid?:   boolean
  showLegend?: boolean
  showTooltip?: boolean
  height?:     number          // default 200
  innerRadius?: number         // donut hole — default 60
  stacked?:    boolean         // stacked bar/area
  curved?:     boolean         // curved lines/areas
  className?:  string
}

// Atlis design palette — used when series has no color
const DEFAULT_COLORS = [
  '#6366F1', // indigo
  '#22C55E', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#EC4899', // pink
]

function resolveColor(series: GraphSeries, index: number): string {
  return series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#fff',
    border:          '1px solid #e2e8f0',
    borderRadius:    '12px',
    fontSize:        '12px',
    boxShadow:       '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  labelStyle: { color: '#475569', fontWeight: 600 },
  itemStyle:  { color: '#64748b' },
}

export function GraphRenderer({
  type,
  data,
  series,
  xKey = 'name',
  showGrid    = true,
  showLegend  = false,
  showTooltip = true,
  height      = 200,
  innerRadius = 60,
  stacked     = false,
  curved      = false,
  className,
}: GraphConfig) {

  // ── PIE / DONUT ───────────────────────────────────────
  if (type === 'pie' || type === 'donut') {
    const key = series[0]?.key ?? 'value'
    return (
      <div className={cn('w-full', className)}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            {showTooltip && <Tooltip {...TOOLTIP_STYLE} />}
            {showLegend  && <Legend  wrapperStyle={{ fontSize: 12 }} />}
            <Pie
              data={data}
              dataKey={key}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={height / 2 - 20}
              innerRadius={type === 'donut' ? innerRadius : 0}
              paddingAngle={type === 'donut' ? 3 : 0}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // ── SHARED AXES PROPS ─────────────────────────────────
  const axisProps = {
    axisLine:  false,
    tickLine:  false,
    tick:      { fontSize: 11, fill: '#94a3b8' },
  }

  const gridProps = showGrid
    ? { strokeDasharray: '3 3', stroke: '#f1f5f9', vertical: false }
    : undefined

  // ── BAR ───────────────────────────────────────────────
  if (type === 'bar') {
    return (
      <div className={cn('w-full', className)}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} width={32} />
            {showTooltip && <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />}
            {showLegend  && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label ?? s.key}
                fill={resolveColor(s, i)}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // ── LINE ──────────────────────────────────────────────
  if (type === 'line') {
    return (
      <div className={cn('w-full', className)}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} width={32} />
            {showTooltip && <Tooltip {...TOOLTIP_STYLE} />}
            {showLegend  && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type={curved ? 'monotone' : 'linear'}
                dataKey={s.key}
                name={s.label ?? s.key}
                stroke={resolveColor(s, i)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // ── AREA ──────────────────────────────────────────────
  if (type === 'area') {
    return (
      <div className={cn('w-full', className)}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            {gridProps && <CartesianGrid {...gridProps} />}
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} width={32} />
            {showTooltip && <Tooltip {...TOOLTIP_STYLE} />}
            {showLegend  && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {/* Gradient defs */}
            <defs>
              {series.map((s, i) => {
                const color = resolveColor(s, i)
                return (
                  <linearGradient
                    key={s.key}
                    id={`grad-${s.key}`}
                    x1="0" y1="0" x2="0" y2="1"
                  >
                    <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0}    />
                  </linearGradient>
                )
              })}
            </defs>
            {series.map((s, i) => {
              const color = resolveColor(s, i)
              return (
                <Area
                  key={s.key}
                  type={curved ? 'monotone' : 'linear'}
                  dataKey={s.key}
                  name={s.label ?? s.key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key})`}
                  stackId={stacked ? 'stack' : undefined}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}