import { useQuery } from '@tanstack/react-query'
import { getAllEncounters } from '@/services/encounterService'
import { AppointmentTable } from '@/components/ui/compounds'

export default function PastConsultationsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['encounters', 'past'],
    queryFn:  () => getAllEncounters({ limit: 50 }),
  })

  const past = (data?.data ?? []).filter((e) => e.stopTime !== null)

  return (
    <AppointmentTable
      data      ={past}
      isLoading ={isLoading}
      isError   ={isError}
    />
  )
}