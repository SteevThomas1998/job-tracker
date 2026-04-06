import { useState, useMemo } from 'react'
import type { JobApplication, FilterState } from '../types'

const DEFAULT_FILTERS: FilterState = {
  statusFilter: 'All',
  sortField: 'dateApplied',
  sortDirection: 'desc',
  searchQuery: '',
}

export function useFilters(applications: JobApplication[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    let result = [...applications]

    if (filters.statusFilter !== 'All') {
      result = result.filter((app) => app.status === filters.statusFilter)
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      result = result.filter(
        (app) =>
          app.company.toLowerCase().includes(q) ||
          app.jobTitle.toLowerCase().includes(q) ||
          app.location.toLowerCase().includes(q),
      )
    }

    result.sort((a, b) => {
      const av = a[filters.sortField]
      const bv = b[filters.sortField]
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return filters.sortDirection === 'asc' ? cmp : -cmp
    })

    return result
  }, [applications, filters])

  return { filters, setFilters, filtered }
}
