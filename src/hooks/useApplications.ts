import { useState, useEffect } from 'react'
import type { JobApplication, ApplicationFormData, ApplicationStatus, StatusHistoryEntry } from '../types'
import { supabase } from '../lib/supabase'

type HistoryRow = {
  id: string
  application_id: string
  status: string
  changed_at: string
}

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
  follow_up_date: string | null
  created_at: string
  updated_at: string
  application_status_history: HistoryRow[]
}

function fromRow(row: Row): JobApplication {
  const history: StatusHistoryEntry[] = (row.application_status_history ?? [])
    .slice()
    .sort((a, b) => a.changed_at.localeCompare(b.changed_at))
    .map((h) => ({ id: h.id, status: h.status as ApplicationStatus, changedAt: h.changed_at }))

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
    followUpDate: row.follow_up_date ?? '',
    statusHistory: history,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function writeHistory(applicationId: string, status: ApplicationStatus) {
  const userId = await getUserId()
  if (!userId) return
  await supabase.from('application_status_history').insert({
    application_id: applicationId,
    user_id: userId,
    status,
  })
}

const SELECT = '*, application_status_history(id, status, changed_at)'

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('job_applications')
      .select(SELECT)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setApplications((data as Row[]).map(fromRow))
        setLoading(false)
      })

    // Live updates: new rows inserted by the email webhook appear instantly
    const channel = supabase
      .channel('job_applications_inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_applications' },
        async (payload) => {
          // Fetch full row with history for newly inserted apps
          const { data } = await supabase
            .from('job_applications')
            .select(SELECT)
            .eq('id', (payload.new as { id: string }).id)
            .single()
          if (data) setApplications((prev) => [fromRow(data as Row), ...prev])
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
        follow_up_date: data.followUpDate || null,
      })
      .select()
      .single()
    if (row) {
      await writeHistory((row as { id: string }).id, data.status)
      // Re-fetch with history
      const { data: full } = await supabase
        .from('job_applications')
        .select(SELECT)
        .eq('id', (row as { id: string }).id)
        .single()
      if (full) setApplications((prev) => [fromRow(full as Row), ...prev])
    }
  }

  async function updateApplication(id: string, data: ApplicationFormData) {
    const existing = applications.find((a) => a.id === id)
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
        follow_up_date: data.followUpDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (row) {
      // Write history only if status actually changed
      if (existing && existing.status !== data.status) {
        await writeHistory(id, data.status)
      }
      const { data: full } = await supabase
        .from('job_applications')
        .select(SELECT)
        .eq('id', id)
        .single()
      if (full) setApplications((prev) => prev.map((a) => (a.id === id ? fromRow(full as Row) : a)))
    }
  }

  async function patchStatus(id: string, status: ApplicationStatus) {
    const { data: row } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (row) {
      await writeHistory(id, status)
      const { data: full } = await supabase
        .from('job_applications')
        .select(SELECT)
        .eq('id', id)
        .single()
      if (full) setApplications((prev) => prev.map((a) => (a.id === id ? fromRow(full as Row) : a)))
    }
  }

  async function deleteApplication(id: string) {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (!error) setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  return { applications, loading, addApplication, updateApplication, patchStatus, deleteApplication }
}
