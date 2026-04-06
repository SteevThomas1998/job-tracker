import { useState } from 'react'
import type { JobApplication, ApplicationStatus } from '../../types'
import { STATUS_CONFIG } from '../../utils/statusConfig'
import KanbanCard from './KanbanCard'

interface Props {
  status: ApplicationStatus
  applications: JobApplication[]
  onDrop: (applicationId: string, newStatus: ApplicationStatus) => void
  onEdit: (app: JobApplication) => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
}

export default function KanbanColumn({ status, applications, onDrop, onEdit, onStatusChange }: Props) {
  const [isDragOver, setIsDragOver] = useState(false)
  const { bg, text, border, darkBg, darkText, darkBorder } = STATUS_CONFIG[status]

  return (
    <div className="flex-shrink-0 min-w-[240px] max-w-[280px] flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border} ${darkBg} ${darkText} ${darkBorder}`}>
          {status}
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          const id = e.dataTransfer.getData('applicationId')
          if (id) onDrop(id, status)
        }}
        className={`flex-1 min-h-[120px] rounded-xl p-2 space-y-2 transition-all duration-150 ${
          isDragOver
            ? 'bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400 dark:ring-blue-500'
            : 'bg-gray-50 dark:bg-gray-800/50'
        }`}
      >
        {applications.map((app) => (
          <KanbanCard key={app.id} app={app} onEdit={onEdit} onStatusChange={onStatusChange} />
        ))}
        {applications.length === 0 && (
          <div className={`h-20 flex items-center justify-center rounded-lg border-2 border-dashed transition-colors duration-150 ${
            isDragOver
              ? 'border-blue-400 dark:border-blue-500'
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <span className="text-xs text-gray-400 dark:text-gray-600">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}
