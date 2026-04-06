import type { ApplicationStatus } from '../types'

interface StatusConfig {
  bg: string
  text: string
  border: string
  darkBg: string
  darkText: string
  darkBorder: string
  accentBorder: string
  dot: string
}

export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  Saved: {
    bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200',
    darkBg: 'dark:bg-gray-800', darkText: 'dark:text-gray-300', darkBorder: 'dark:border-gray-700',
    accentBorder: 'border-l-gray-400', dot: 'bg-gray-400',
  },
  Applied: {
    bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200',
    darkBg: 'dark:bg-blue-900/50', darkText: 'dark:text-blue-300', darkBorder: 'dark:border-blue-800',
    accentBorder: 'border-l-blue-400', dot: 'bg-blue-400',
  },
  'Phone Screen': {
    bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200',
    darkBg: 'dark:bg-yellow-900/50', darkText: 'dark:text-yellow-300', darkBorder: 'dark:border-yellow-800',
    accentBorder: 'border-l-yellow-400', dot: 'bg-yellow-400',
  },
  'Interview Scheduled': {
    bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200',
    darkBg: 'dark:bg-purple-900/50', darkText: 'dark:text-purple-300', darkBorder: 'dark:border-purple-800',
    accentBorder: 'border-l-purple-400', dot: 'bg-purple-400',
  },
  'Technical Assessment': {
    bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200',
    darkBg: 'dark:bg-orange-900/50', darkText: 'dark:text-orange-300', darkBorder: 'dark:border-orange-800',
    accentBorder: 'border-l-orange-400', dot: 'bg-orange-400',
  },
  'Offer Received': {
    bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200',
    darkBg: 'dark:bg-green-900/50', darkText: 'dark:text-green-300', darkBorder: 'dark:border-green-800',
    accentBorder: 'border-l-green-400', dot: 'bg-green-400',
  },
  Rejected: {
    bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200',
    darkBg: 'dark:bg-red-900/50', darkText: 'dark:text-red-300', darkBorder: 'dark:border-red-800',
    accentBorder: 'border-l-red-400', dot: 'bg-red-400',
  },
  Withdrawn: {
    bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200',
    darkBg: 'dark:bg-slate-800', darkText: 'dark:text-slate-400', darkBorder: 'dark:border-slate-700',
    accentBorder: 'border-l-slate-400', dot: 'bg-slate-400',
  },
}
