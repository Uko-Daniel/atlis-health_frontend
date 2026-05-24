import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, ResponsiveContainer, Cell,
} from 'recharts'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPatients } from '@/services/patientService'

const BAR_DATA = [
  { v: 22 }, { v: 38 }, { v: 28 }, { v: 50 },
  { v: 35 }, { v: 60 }, { v: 45 }, { v: 32 },
]

function CircularScore({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle
        cx={45} cy={45} r={r}
        fill="none" stroke="#E5E7EB" strokeWidth={8}
      />
      <circle
        cx={45} cy={45} r={r}
        fill="none" stroke="#22C55E" strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
      />
      <text
        x={45} y={45}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 20, fontWeight: 700, fill: '#1e293b' }}
      >
        {score}
      </text>
    </svg>
  )
}

export default function StatsCard() {
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['patients', 'stats'],
    queryFn:  () => getPatients({ page: 1, limit: 1 }),
  })

  const total = data?.total ?? 0
  const score = Math.min(99, Math.max(10, Math.round((total / 500) * 100))) || 65

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col justify-between min-h-52.5 shadow-sm">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Statistics
        </p>
        <p className="text-sm text-slate-400 mt-0.5">Overall Performance</p>
      </div>

      <div className="flex items-end gap-3 mt-3">
        {/* Bar chart */}
        <div className="flex-1 h-20">
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={BAR_DATA} barSize={9} barGap={3}>
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                {BAR_DATA.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === BAR_DATA.length - 3 ? '#6366F1' : '#C7D2FE'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 shrink-0">
          <CircularScore score={score} />
          <ChevronRight size={18} className="text-slate-300" />
        </div>
      </div>

      <button
        onClick={() => navigate('/patients')}
        className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white
                   text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        View All Patients
      </button>
    </div>
  )
}