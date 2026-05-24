import { useQuery } from '@tanstack/react-query'
import { getPatients } from '@/services/patientService'
import { Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function sameDay(a: Date, b: Date) {
  return (
    a.getDate()     === b.getDate()     &&
    a.getMonth()    === b.getMonth()    &&
    a.getFullYear() === b.getFullYear()
  )
}

function sameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export default function PeriodTiles() {
  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'period'],
    queryFn:  () => getPatients({ page: 1, limit: 200 }),
  })

  const patients = data?.data ?? []
  const now      = new Date()
  const yday     = new Date(now); yday.setDate(now.getDate() - 1)

  const todayCount = patients.filter(p =>
    sameDay(new Date(p.createdAt), now)
  ).length

  const ydayCount = patients.filter(p =>
    sameDay(new Date(p.createdAt), yday)
  ).length

  const monthCount = patients.filter(p =>
    sameMonth(new Date(p.createdAt), now)
  ).length

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-32 h-52.5 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-3">

      {/* Today — dark */}
      <div className="bg-[#252660] rounded-2xl p-5 flex flex-col
                      justify-between w-32 min-h-52.5 shadow-sm">
        <p className="text-white font-semibold">Today</p>

        {/* Dot grid decorative */}
        <div className="grid grid-cols-5 gap-1 my-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="size-1.5 rounded-full bg-white/25"
            />
          ))}
        </div>

        <div>
          <p className="text-white text-4xl font-bold">{todayCount}</p>
          <p className="text-white/50 text-xs mt-0.5">Patients</p>
        </div>
      </div>

      {/* Yesterday */}
      <div className="bg-white rounded-2xl p-5 flex flex-col
                      justify-between w-32 min-h-52.5 shadow-sm">
        <p className="text-slate-600 font-semibold text-sm leading-tight">
          Yester<br />day
        </p>
        <div>
          <p className="text-indigo-500 text-4xl font-bold">{ydayCount}</p>
          <p className="text-slate-400 text-xs mt-0.5">Patients</p>
        </div>
      </div>

      {/* This Month */}
      <div className="bg-white rounded-2xl p-5 flex flex-col
                      justify-between w-32 min-h-52.5 shadow-sm">
        <p className="text-slate-600 font-semibold text-sm leading-tight">
          This<br />Month
        </p>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-indigo-500 text-4xl font-bold">{monthCount}</p>
            <Check size={18} className="text-indigo-500 self-end mb-1" />
          </div>
          <p className="text-slate-400 text-xs mt-0.5">Patients</p>
        </div>
      </div>

    </div>
  )
}