import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPatientById } from '@/services/patientService'
import type { PatientFull } from '@/types/patient'

export interface PatientOutletContext {
  patient:    PatientFull | undefined
  isLoading:  boolean
  invalidate: () => void
}

export function usePatient(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey:  ['patient', id],
    queryFn:   () => getPatientById(id),
    enabled:   !!id && id !== 'undefined',
    staleTime: 30_000, // 1 min
  })

  return {
    patient:    query.data,
    isLoading:  query.isLoading,
    isError:    query.isError,
    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: ['patient', id] }),
  }
}