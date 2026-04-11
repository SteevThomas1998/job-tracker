import { useState, useRef, useEffect } from 'react'
import type { JobApplication, ApplicationStatus } from '../../types'
import { APPLICATION_STATUSES } from '../../types'
import { STATUS_CONFIG } from '../../utils/statusConfig'
import { formatDate } from '../../utils/dateUtils'
import StatusBadge from '../common/StatusBadge'
import ConfirmDialog from '../common/ConfirmDialog'

interface Props {
  app: JobApplication
  onEdit: (app: JobApplication) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
}

export default function ApplicationCard({ app, onEdit, onDelete, onStatusChange }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusOpen) return
    function handle(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [statusOpen])

  const hasDetails = app.notes || app.contactPerson || app.salaryRange || app.jobUrl || app.statusHistory.length > 0
  const { accentBorder } = STATUS_CONFIG[app.status]

  // Follow-up state
  const followUp = app.followUpDate
    ? (() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const due = new Date(app.followUpDate + 'T00:00:00')
        const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
        if (diff < 0) return { label: `Overdue by ${Math.abs(diff)}d`, style: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' }
        if (diff === 0) return { label: 'Follow up today', style: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
        if (diff <= 3) return { label: `Follow up in ${diff}d`, style: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
        return { label: `Follow up ${formatDate(app.followUpDate)}`, style: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' }
      })()
    : null

  return (
    <>
      <div className={`relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-4 ${accentBorder} rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${statusOpen ? 'z-10' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 dark:text-gray-100 truncate">{app.company}</span>
              {app.location && (
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {app.location}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{app.jobTitle}</p>
            {followUp && (
              <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${followUp.style}`}>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {followUp.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Inline status dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full transition-all duration-150 hover:opacity-80"
                title="Change status"
              >
                <StatusBadge status={app.status} />
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${statusOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`absolute right-0 top-full mt-1 z-20 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden py-1 transition-all duration-150 origin-top-right ${statusOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                {APPLICATION_STATUSES.map((s) => {
                  const { dot } = STATUS_CONFIG[s]
                  return (
                    <button
                      key={s}
                      onClick={() => { onStatusChange(app.id, s); setStatusOpen(false) }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <span className={s === app.status ? 'font-semibold' : ''}>{s}</span>
                      {s === app.status && (
                        <svg className="ml-auto w-3 h-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">{formatDate(app.dateApplied)}</span>

            <div className="flex items-center gap-1">
              {hasDetails && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
                  title={expanded ? 'Collapse' : 'Expand details'}
                >
                  <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onEdit(app)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors duration-150"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-150"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="sm:hidden mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(app.dateApplied)}</span>
        </div>

        {expanded && hasDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {app.salaryRange && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Salary</span>
                <p className="text-gray-700 dark:text-gray-300">{app.salaryRange}</p>
              </div>
            )}
            {app.contactPerson && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Contact</span>
                <p className="text-gray-700 dark:text-gray-300">{app.contactPerson}</p>
              </div>
            )}
            {app.jobUrl && (
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Job URL</span>
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-violet-600 dark:text-violet-400 hover:underline truncate"
                >
                  {app.jobUrl}
                </a>
              </div>
            )}
            {app.notes && (
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</span>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{app.notes}</p>
              </div>
            )}
            {app.statusHistory.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Timeline</span>
                <div className="flex items-start gap-0">
                  {app.statusHistory.map((entry, i) => {
                    const { bg, text, border, darkBg, darkText, darkBorder, dot } = STATUS_CONFIG[entry.status]
                    const isLast = i === app.statusHistory.length - 1
                    const d = new Date(entry.changedAt)
                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    return (
                      <div key={entry.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${bg} ${text} ${border} ${darkBg} ${darkText} ${darkBorder}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                            {entry.status}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</span>
                        </div>
                        {!isLast && (
                          <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mx-1 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete application?"
          message={`Remove "${app.jobTitle}" at ${app.company}? This cannot be undone.`}
          onConfirm={() => { onDelete(app.id); setShowConfirm(false) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
