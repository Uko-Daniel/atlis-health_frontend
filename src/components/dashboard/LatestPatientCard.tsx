import { useQuery } from '@tanstack/react-query'
import { getPatients } from '@/services/patientService'
import { getPatientAge, getInitials } from '@/types/patient'
import { useNavigate } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { UserRound } from 'lucide-react'

export default function LatestPatientCard() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'latest'],
    queryFn:  () => getPatients({ page: 1, limit: 1 }),
  })

  const patient = data?.data?.[0]

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col justify-between min-h-52.5 shadow-sm">
      <div>
        <p className="text-xs text-slate-400 font-medium">Latest Patient</p>

        {isLoading && (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        )}

        {!isLoading && patient && (
          <>
            <p
              className="text-lg font-bold text-slate-800 mt-1 cursor-pointer
                         hover:text-indigo-600 transition-colors"
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              {patient.firstName} {patient.lastName}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}
              {' · '}{getPatientAge(patient.dob)} yrs
            </p>
          </>
        )}

        {!isLoading && !patient && (
          <p className="text-sm text-slate-400 mt-2">No patients yet</p>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex size-14 items-center justify-center rounded-full
                        bg-indigo-100 text-indigo-600 text-lg font-bold select-none">
          {patient ? getInitials(patient) : <UserRound size={24} />}
        </div>

        {patient && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Registered</p>
            <p className="text-sm font-semibold text-slate-700">
              {new Date(patient.createdAt).toLocaleDateString('en-NG', {
                day: '2-digit', month: 'short',
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}