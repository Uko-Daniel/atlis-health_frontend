import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllEncounters } from '@/services/encounterService'
import { AppointmentTable } from '@/components/ui/compounds'

interface Props {
  onNewAppointment: () => void
}

export default function AppointmentListTab({ onNewAppointment }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['encounters', 'list', page],
    queryFn:  () => getAllEncounters({ page, limit: 20 }),
  })

  const encounters = data?.data ?? []

  const filtered = search.trim()
    ? encounters.filter((e) => {
        const name = `${e.patient?.firstName} ${e.patient?.lastName}`.toLowerCase()
        return name.includes(search.toLowerCase())
      })
    : encounters

  return (
    <AppointmentTable
      data       ={filtered}
      isLoading  ={isLoading}
      isError    ={isError}
      page       ={page}
      total      ={data?.total ?? 0}
      limit      ={20}
      onPage     ={setPage}
      onNew      ={onNewAppointment}
      search     ={{ value: search, onChange: setSearch }}
    />
  )
}