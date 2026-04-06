import { useMemo } from 'react'
import type { JobApplication, ApplicationStatus } from '../../types'
import { APPLICATION_STATUSES } from '../../types'
import KanbanColumn from './KanbanColumn'

interface Props {
  applications: JobApplication[]
  onStatusChange: (id: string, status: ApplicationStatus) => void
  onEdit: (app: JobApplication) => void
  onDelete: (id: string) => void
}

export default function KanbanBoard({ applications, onStatusChange, onEdit }: Props) {
  const grouped = useMemo(
    () =>
      APPLICATION_STATUSES.reduce<Record<ApplicationStatus, JobApplication[]>>((acc, s) => {
        acc[s] = applications.filter((a) => a.status === s)
        return acc
      }, {} as Record<ApplicationStatus, JobApplication[]>),
    [applications],
  )

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
      {APPLICATION_STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          applications={grouped[status]}
          onDrop={(id, newStatus) => onStatusChange(id, newStatus)}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  )
}
