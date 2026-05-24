import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getPatients } from '@/services/patientService'
import { getInitials, getPatientAge } from '@/types/patient'
import { Skeleton } from '@/components/ui/skeleton'

const CARD_GRADIENTS = [
  'from-indigo-500 to-indigo-800',
  'from-violet-500 to-violet-800',
  'from-blue-500 to-blue-800',
  'from-indigo-600 to-purple-800',
]

export default function CurrentPatientsGrid() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'grid'],
    queryFn:  () => getPatients({ page: 1, limit: 4 }),
  })

  const patients = data?.data ?? []

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-800">Current Patients</h3>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}

          {!isLoading && patients.length === 0 && (
            <div className="col-span-4 flex items-center justify-center
                            py-10 text-slate-400 text-sm">
              No patients registered yet
            </div>
          )}

          {!isLoading && patients.map((patient, i) => (
            <div
              key={patient.id}
              onClick={() => navigate(`/patients/${patient.id}`)}
              className={`rounded-xl p-4 cursor-pointer
                         bg-gradient-to-b ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
                         hover:brightness-110 transition-all select-none`}
            >
              <p className="text-white font-semibold truncate text-sm">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-white/60 text-xs mt-0.5">
                {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}
                {' · '}{getPatientAge(patient.dob)}y
              </p>

              {/* Avatar */}
              <div className="flex size-16 items-center justify-center
                             rounded-full bg-white/20 text-white text-xl
                             font-bold mx-auto my-4 select-none">
                {getInitials(patient)}
              </div>

              {/* Status chip */}
              <div className="bg-white/15 rounded-lg px-2.5 py-1.5">
                <p className="text-white/60 text-xs">Registered</p>
                <p className="text-white text-xs font-medium mt-0.5">
                  {new Date(patient.createdAt).toLocaleDateString('en-NG', {
                    day:   '2-digit',
                    month: 'short',
                    year:  'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}