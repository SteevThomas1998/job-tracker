import type { FilterState, ApplicationStatus } from '../../types'
import { APPLICATION_STATUSES } from '../../types'

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const selectClass = 'px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 cursor-pointer'

export default function FilterBar({ filters, onChange }: Props) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search company, title, location..."
          value={filters.searchQuery}
          onChange={(e) => set('searchQuery', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>

      <select
        value={filters.statusFilter}
        onChange={(e) => set('statusFilter', e.target.value as ApplicationStatus | 'All')}
        className={selectClass}
      >
        <option value="All">All Statuses</option>
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={`${filters.sortField}:${filters.sortDirection}`}
        onChange={(e) => {
          const [field, dir] = e.target.value.split(':')
          onChange({ ...filters, sortField: field as FilterState['sortField'], sortDirection: dir as FilterState['sortDirection'] })
        }}
        className={selectClass}
      >
        <option value="dateApplied:desc">Date Applied (newest)</option>
        <option value="dateApplied:asc">Date Applied (oldest)</option>
        <option value="company:asc">Company (A–Z)</option>
        <option value="company:desc">Company (Z–A)</option>
        <option value="createdAt:desc">Recently Added</option>
      </select>
    </div>
  )
}
