import { useState, useEffect } from 'react'
import type { JobApplication, ApplicationFormData, ApplicationStatus } from '../../types'
import { useApplications } from '../../hooks/useApplications'
import { useFilters } from '../../hooks/useFilters'
import StatsBar from './StatsBar'
import FollowUpBanner from './FollowUpBanner'
import FilterBar from './FilterBar'
import ApplicationList from './ApplicationList'
import KanbanBoard from '../kanban/KanbanBoard'
import Modal from '../modal/Modal'
import ApplicationForm from '../modal/ApplicationForm'

type ViewMode = 'list' | 'kanban'

interface Props {
  externalAddOpen?: boolean
  onExternalAddClose?: () => void
  onMounted?: () => void
}

export default function Dashboard({ externalAddOpen = false, onExternalAddClose, onMounted }: Props) {
  const { applications, addApplication, updateApplication, patchStatus, deleteApplication } = useApplications()
  const { filters, setFilters, filtered } = useFilters(applications)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    onMounted?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const hasFilters = filters.statusFilter !== 'All' || filters.searchQuery.trim() !== ''

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
        <FollowUpBanner applications={applications} onEdit={setEditingApp} />
        <FilterBar filters={filters} onChange={setFilters} />

        {/* View toggle + count */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500">
            {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="Board view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <ApplicationList
            applications={filtered}
            hasFilters={hasFilters}
            onAdd={() => setIsAdding(true)}
            onEdit={setEditingApp}
            onDelete={deleteApplication}
            onStatusChange={patchStatus}
          />
        ) : (
          <KanbanBoard
            applications={filtered}
            onStatusChange={patchStatus}
            onEdit={setEditingApp}
          />
        )}
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
              followUpDate: editingApp.followUpDate,
            }}
            onSubmit={handleEditSubmit}
            onCancel={handleEditClose}
          />
        )}
      </Modal>
    </>
  )
}
