import { useState, useEffect } from 'react'
import type { JobApplication, ApplicationFormData, ApplicationStatus } from '../types'
import { supabase } from '../lib/supabase'

type Row = {
  id: string
  company: string
  job_title: string
  location: string | null
  job_url: string | null
  status: string
  date_applied: string | null
  salary_range: string | null
  notes: string | null
  contact_person: string | null
  created_at: string
  updated_at: string
}

function fromRow(row: Row): JobApplication {
  return {
    id: row.id,
    company: row.company,
    jobTitle: row.job_title,
    location: row.location ?? '',
    jobUrl: row.job_url ?? '',
    status: row.status as ApplicationStatus,
    dateApplied: row.date_applied ?? '',
    salaryRange: row.salary_range ?? '',
    notes: row.notes ?? '',
    contactPerson: row.contact_person ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setApplications((data as Row[]).map(fromRow))
        setLoading(false)
      })
  }, [])

  async function addApplication(data: ApplicationFormData) {
    const { data: row } = await supabase
      .from('job_applications')
      .insert({
        company: data.company,
        job_title: data.jobTitle,
        location: data.location || null,
        job_url: data.jobUrl || null,
        status: data.status,
        date_applied: data.dateApplied || null,
        salary_range: data.salaryRange || null,
        notes: data.notes || null,
        contact_person: data.contactPerson || null,
      })
      .select()
      .single()
    if (row) setApplications((prev) => [fromRow(row as Row), ...prev])
  }

  async function updateApplication(id: string, data: ApplicationFormData) {
    const { data: row } = await supabase
      .from('job_applications')
      .update({
        company: data.company,
        job_title: data.jobTitle,
        location: data.location || null,
        job_url: data.jobUrl || null,
        status: data.status,
        date_applied: data.dateApplied || null,
        salary_range: data.salaryRange || null,
        notes: data.notes || null,
        contact_person: data.contactPerson || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (row) setApplications((prev) => prev.map((a) => (a.id === id ? fromRow(row as Row) : a)))
  }

  async function patchStatus(id: string, status: ApplicationStatus) {
    const { data: row } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (row) setApplications((prev) => prev.map((a) => (a.id === id ? fromRow(row as Row) : a)))
  }

  async function deleteApplication(id: string) {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (!error) setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  return { applications, loading, addApplication, updateApplication, patchStatus, deleteApplication }
}
