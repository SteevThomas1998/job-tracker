export const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'Phone Screen',
  'Interview Scheduled',
  'Technical Assessment',
  'Offer Received',
  'Rejected',
  'Withdrawn',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export interface JobApplication {
  id: string
  company: string
  jobTitle: string
  location: string
  jobUrl: string
  status: ApplicationStatus
  dateApplied: string
  salaryRange: string
  notes: string
  contactPerson: string
  followUpDate: string   // ISO date string, empty string = not set
  statusHistory: StatusHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export type ApplicationFormData = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>

export interface StatusHistoryEntry {
  id: string
  status: ApplicationStatus
  changedAt: string  // ISO timestamp
}

export type SortField = 'dateApplied' | 'company' | 'createdAt'
export type SortDirection = 'asc' | 'desc'

export interface FilterState {
  statusFilter: ApplicationStatus | 'All'
  sortField: SortField
  sortDirection: SortDirection
  searchQuery: string
}
