import type { JobApplication, ApplicationStatus } from '../../types'
import { APPLICATION_STATUSES } from '../../types'
import { STATUS_CONFIG } from '../../utils/statusConfig'

interface Props {
  applications: JobApplication[]
  activeFilter: ApplicationStatus | 'All'
  onFilterChange: (status: ApplicationStatus | 'All') => void
}

export default function StatsBar({ applications, activeFilter, onFilterChange }: Props) {
  const total = applications.length

  const counts = APPLICATION_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length
    return acc
  }, {})

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onFilterChange('All')}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          activeFilter === 'All'
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        }`}
      >
        All ({total})
      </button>
      {APPLICATION_STATUSES.map((status) => {
        const count = counts[status] ?? 0
        if (count === 0) return null
        const { bg, text, border } = STATUS_CONFIG[status]
        const isActive = activeFilter === status
        return (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isActive
                ? `${bg} ${text} ${border} ring-2 ring-offset-1 ring-current`
                : `${bg} ${text} ${border} opacity-70 hover:opacity-100`
            }`}
          >
            {status} ({count})
          </button>
        )
      })}
    </div>
  )
}
