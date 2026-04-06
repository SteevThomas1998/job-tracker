import { useState, useEffect } from 'react'
import type { JobApplication, ApplicationFormData, ApplicationStatus } from '../../types'
import { useApplications } from '../../hooks/useApplications'
import { useFilters } from '../../hooks/useFilters'
import StatsBar from './StatsBar'
import FilterBar from './FilterBar'
import ApplicationList from './ApplicationList'
import Modal from '../modal/Modal'
import ApplicationForm from '../modal/ApplicationForm'

interface Props {
  externalAddOpen?: boolean
  onExternalAddClose?: () => void
}

export default function Dashboard({ externalAddOpen = false, onExternalAddClose }: Props) {
  const { applications, addApplication, updateApplication, deleteApplication } = useApplications()
  const { filters, setFilters, filtered } = useFilters(applications)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (externalAddOpen) {
      setIsAdding(true)
      onExternalAddClose?.()
    }
  }, [externalAddOpen, onExternalAddClose])

  function handleAddClose() { setIsAdding(false) }
  function handleAddSubmit(data: ApplicationFormData) {
    addApplication(data)
    setIsAdding(false)
  }

  function handleEditClose() { setEditingApp(null) }
  function handleEditSubmit(data: ApplicationFormData) {
    if (editingApp) updateApplication(editingApp.id, data)
    setEditingApp(null)
  }

  const hasFilters =
    filters.statusFilter !== 'All' || filters.searchQuery.trim() !== ''

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <StatsBar
          applications={applications}
          activeFilter={filters.statusFilter}
          onFilterChange={(status: ApplicationStatus | 'All') =>
            setFilters({ ...filters, statusFilter: status })
          }
        />
        <FilterBar filters={filters} onChange={setFilters} />
        <div className="text-xs text-gray-400">
          {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
        <ApplicationList
          applications={filtered}
          hasFilters={hasFilters}
          onAdd={() => setIsAdding(true)}
          onEdit={setEditingApp}
          onDelete={deleteApplication}
        />
      </div>

      <Modal isOpen={isAdding} onClose={handleAddClose} title="Add Application">
        <ApplicationForm onSubmit={handleAddSubmit} onCancel={handleAddClose} />
      </Modal>

      <Modal isOpen={editingApp !== null} onClose={handleEditClose} title="Edit Application">
        {editingApp && (
          <ApplicationForm
            initialData={{
              company: editingApp.company,
              jobTitle: editingApp.jobTitle,
              location: editingApp.location,
              jobUrl: editingApp.jobUrl,
              status: editingApp.status,
              dateApplied: editingApp.dateApplied,
              salaryRange: editingApp.salaryRange,
              notes: editingApp.notes,
              contactPerson: editingApp.contactPerson,
            }}
            onSubmit={handleEditSubmit}
            onCancel={handleEditClose}
          />
        )}
      </Modal>
    </>
  )
}
