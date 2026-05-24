import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { getPatients } from '@/services/patientService'
import { getPatientAge, getInitials } from '@/types/patient'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-100 last:border-0">
      <Skeleton className="size-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export default function RecentPatients() {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients', 1],
    queryFn:  () => getPatients({ page: 1, limit: 5 }),
  })

  const patients = data?.data ?? []

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Recent Patients
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 hover:text-blue-700 gap-1 h-auto py-1"
          onClick={() => navigate('/patients')}
        >
          View all <ArrowRight size={12} />
        </Button>
      </CardHeader>

      <CardContent className="p-0">

        {isLoading && Array.from({ length: 5 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}

        {isError && (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Could not load recent patients
          </p>
        )}

        {!isLoading && !isError && patients.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            No patients registered yet
          </p>
        )}

        {!isLoading && !isError && patients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-100
                       last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex size-9 shrink-0 items-center justify-center
                            rounded-full bg-blue-100 text-blue-700 text-xs
                            font-semibold select-none">
              {getInitials(patient)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {patient.phoneNumber}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-normal text-slate-500 border-slate-200 shrink-0"
            >
              {getPatientAge(patient.dob)}y · {patient.gender.charAt(0)}
            </Badge>
          </div>
        ))}

      </CardContent>
    </Card>
  )
}