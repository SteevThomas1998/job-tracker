import { useState, useRef, useEffect } from 'react'
import type { JobApplication, ApplicationStatus } from '../../types'
import { APPLICATION_STATUSES } from '../../types'
import { STATUS_CONFIG } from '../../utils/statusConfig'
import { formatDate } from '../../utils/dateUtils'
import StatusBadge from '../common/StatusBadge'

interface Props {
  app: JobApplication
  onEdit: (app: JobApplication) => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
}

export default function KanbanCard({ app, onEdit, onStatusChange }: Props) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statusOpen) return
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setStatusOpen(false)
      }
    }
    function handleScroll() { setStatusOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [statusOpen])

  function openDropdown() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
    setStatusOpen((v) => !v)
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('applicationId', app.id)
        e.dataTransfer.effectAllowed = 'move'
        setIsDragging(true)
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 ${
        isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{app.company}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{app.jobTitle}</p>
        </div>
        <button
          onClick={() => onEdit(app)}
          className="p-1 rounded-md text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors flex-shrink-0"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          ref={triggerRef}
          onClick={openDropdown}
          className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
          title="Change status"
        >
          <StatusBadge status={app.status} size="sm" />
          <svg className={`w-2.5 h-2.5 text-gray-400 transition-transform duration-150 ${statusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(app.dateApplied, false)}</span>
      </div>

      {/* Fixed-position dropdown to escape overflow-x:auto scroll container */}
      {statusOpen && dropdownPos && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className="fixed z-50 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden py-1"
        >
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
                  <svg className="ml-auto w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
