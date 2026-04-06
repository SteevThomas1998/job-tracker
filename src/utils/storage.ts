import type { JobApplication } from '../types'

const STORAGE_KEY = 'job_tracker_applications'

export function loadApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as JobApplication[]
  } catch {
    return []
  }
}

export function saveApplications(apps: JobApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}
