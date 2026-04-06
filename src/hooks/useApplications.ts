import { useState } from 'react'
import type { JobApplication, ApplicationFormData } from '../types'
import { loadApplications, saveApplications } from '../utils/storage'

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>(() => loadApplications())

  function addApplication(data: ApplicationFormData) {
    const now = new Date().toISOString()
    const newApp: JobApplication = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    const updated = [newApp, ...applications]
    setApplications(updated)
    saveApplications(updated)
  }

  function updateApplication(id: string, data: ApplicationFormData) {
    const updated = applications.map((app) =>
      app.id === id ? { ...app, ...data, updatedAt: new Date().toISOString() } : app,
    )
    setApplications(updated)
    saveApplications(updated)
  }

  function deleteApplication(id: string) {
    const updated = applications.filter((app) => app.id !== id)
    setApplications(updated)
    saveApplications(updated)
  }

  return { applications, addApplication, updateApplication, deleteApplication }
}
