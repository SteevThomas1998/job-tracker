import type { JobApplication } from '../../types'

interface Props {
  applications: JobApplication[]
  onEdit: (app: JobApplication) => void
}

export default function FollowUpBanner({ applications, onEdit }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const due = applications.filter((app) => {
    if (!app.followUpDate) return false
    const d = new Date(app.followUpDate + 'T00:00:00')
    return d <= today
  }).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))

  if (due.length === 0) return null

  const overdue = due.filter((a) => new Date(a.followUpDate + 'T00:00:00') < today)
  const dueToday = due.filter((a) => {
    const d = new Date(a.followUpDate + 'T00:00:00')
    return d.getTime() === today.getTime()
  })

  const label = overdue.length > 0
    ? `${overdue.length} overdue follow-up${overdue.length !== 1 ? 's' : ''}${dueToday.length > 0 ? ` · ${dueToday.length} due today` : ''}`
    : `${dueToday.length} follow-up${dueToday.length !== 1 ? 's' : ''} due today`

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center mt-0.5">
        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">{label}</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {due.slice(0, 4).map((app) => (
            <button
              key={app.id}
              onClick={() => onEdit(app)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <span className="truncate max-w-[120px]">{app.company}</span>
              <span className="text-red-400 dark:text-red-500 flex-shrink-0">→</span>
            </button>
          ))}
          {due.length > 4 && (
            <span className="inline-flex items-center px-2.5 py-1 text-xs text-red-500 dark:text-red-400">
              +{due.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
