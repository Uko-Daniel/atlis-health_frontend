// hooks/useEncounter.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEncounterById } from '@/services/encounterService'

export function useEncounter(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['encounter', id],
    queryFn: () => getEncounterById(id),
    enabled: !!id && id !== 'undefined',
    staleTime: 1000 * 60 * 2,
  })

  return {
    encounter: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: ['encounter', id],
      }),
  }
}