import { useState } from 'react'
import type { JobApplication } from '../../types'
import StatusBadge from '../common/StatusBadge'
import ConfirmDialog from '../common/ConfirmDialog'

interface Props {
  app: JobApplication
  onEdit: (app: JobApplication) => void
  onDelete: (id: string) => void
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ApplicationCard({ app, onEdit, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const hasDetails = app.notes || app.contactPerson || app.salaryRange || app.jobUrl

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 truncate">{app.company}</span>
              {app.location && (
                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {app.location}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{app.jobTitle}</p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={app.status} />
            <span className="text-xs text-gray-400 hidden sm:block">{formatDate(app.dateApplied)}</span>

            <div className="flex items-center gap-1">
              {hasDetails && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title={expanded ? 'Collapse' : 'Expand details'}
                >
                  <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onEdit(app)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          <span className="text-xs text-gray-400">{formatDate(app.dateApplied)}</span>
        </div>

        {expanded && hasDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {app.salaryRange && (
              <div>
                <span className="text-xs font-medium text-gray-500">Salary</span>
                <p className="text-gray-700">{app.salaryRange}</p>
              </div>
            )}
            {app.contactPerson && (
              <div>
                <span className="text-xs font-medium text-gray-500">Contact</span>
                <p className="text-gray-700">{app.contactPerson}</p>
              </div>
            )}
            {app.jobUrl && (
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-gray-500">Job URL</span>
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline truncate"
                >
                  {app.jobUrl}
                </a>
              </div>
            )}
            {app.notes && (
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-gray-500">Notes</span>
                <p className="text-gray-700 whitespace-pre-wrap">{app.notes}</p>
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
