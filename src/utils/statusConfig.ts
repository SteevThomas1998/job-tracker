import type { ApplicationStatus } from '../types'

interface StatusConfig {
  bg: string
  text: string
  border: string
}

export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  Saved: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  Applied: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'Phone Screen': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Interview Scheduled': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'Technical Assessment': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  'Offer Received': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  Withdrawn: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
}
