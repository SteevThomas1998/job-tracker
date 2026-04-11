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
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
          activeFilter === 'All'
            ? 'bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500 shadow-sm shadow-violet-200 dark:shadow-violet-900'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
        }`}
      >
        All ({total})
      </button>
      {APPLICATION_STATUSES.map((status) => {
        const count = counts[status] ?? 0
        if (count === 0) return null
        const { bg, text, border, darkBg, darkText, darkBorder } = STATUS_CONFIG[status]
        const isActive = activeFilter === status
        return (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              isActive
                ? `${bg} ${text} ${border} ${darkBg} ${darkText} ${darkBorder} ring-2 ring-offset-1 ring-current shadow-sm`
                : `${bg} ${text} ${border} ${darkBg} ${darkText} ${darkBorder} opacity-70 hover:opacity-100 hover:scale-105`
            }`}
          >
            {status} ({count})
          </button>
        )
      })}
    </div>
  )
}
