import type { JobApplication, ApplicationStatus } from '../../types'
import ApplicationCard from '../cards/ApplicationCard'
import EmptyState from '../common/EmptyState'

interface Props {
  applications: JobApplication[]
  hasFilters: boolean
  onAdd: () => void
  onEdit: (app: JobApplication) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
}

export default function ApplicationList({ applications, hasFilters, onAdd, onEdit, onDelete, onStatusChange }: Props) {
  if (applications.length === 0) {
    return <EmptyState hasFilters={hasFilters} onAdd={onAdd} />
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <ApplicationCard key={app.id} app={app} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
      ))}
    </div>
  )
}
