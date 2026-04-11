import { useState } from 'react'
import type { ApplicationFormData, ApplicationStatus } from '../../types'
import { APPLICATION_STATUSES } from '../../types'

interface Props {
  initialData?: ApplicationFormData
  onSubmit: (data: ApplicationFormData) => void
  onCancel: () => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const BLANK: ApplicationFormData = {
  company: '',
  jobTitle: '',
  location: '',
  jobUrl: '',
  status: 'Saved',
  dateApplied: today(),
  salaryRange: '',
  notes: '',
  contactPerson: '',
  followUpDate: '',
}

export default function ApplicationForm({ initialData, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ApplicationFormData>(initialData ?? BLANK)
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationFormData, string>>>({})

  function set<K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ApplicationFormData, string>> = {}
    if (!form.company.trim()) newErrors.company = 'Company is required'
    if (!form.jobTitle.trim()) newErrors.jobTitle = 'Job title is required'
    if (!form.dateApplied) newErrors.dateApplied = 'Date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  const inputClass = (field: keyof ApplicationFormData) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-gray-200 dark:placeholder-gray-500 ${
      errors[field]
        ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
        : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
    }`

  const labelClass = 'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1'

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Company *</label>
          <input
            className={inputClass('company')}
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="e.g. Stripe"
          />
          {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company}</p>}
        </div>
        <div>
          <label className={labelClass}>Job Title *</label>
          <input
            className={inputClass('jobTitle')}
            value={form.jobTitle}
            onChange={(e) => set('jobTitle', e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
          />
          {errors.jobTitle && <p className="mt-1 text-xs text-red-600">{errors.jobTitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass('status')}
            value={form.status}
            onChange={(e) => set('status', e.target.value as ApplicationStatus)}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date Applied *</label>
          <input
            type="date"
            className={inputClass('dateApplied')}
            value={form.dateApplied}
            onChange={(e) => set('dateApplied', e.target.value)}
          />
          {errors.dateApplied && <p className="mt-1 text-xs text-red-600">{errors.dateApplied}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Location</label>
          <input
            className={inputClass('location')}
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Remote, New York, NY"
          />
        </div>
        <div>
          <label className={labelClass}>Salary Range</label>
          <input
            className={inputClass('salaryRange')}
            value={form.salaryRange}
            onChange={(e) => set('salaryRange', e.target.value)}
            placeholder="e.g. $120k–$150k"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Job URL</label>
        <input
          type="url"
          className={inputClass('jobUrl')}
          value={form.jobUrl}
          onChange={(e) => set('jobUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className={labelClass}>Contact Person</label>
        <input
          className={inputClass('contactPerson')}
          value={form.contactPerson}
          onChange={(e) => set('contactPerson', e.target.value)}
          placeholder="e.g. Jane Doe (Recruiter)"
        />
      </div>

      <div>
        <label className={labelClass}>Follow-up reminder</label>
        <input
          type="date"
          className={inputClass('followUpDate')}
          value={form.followUpDate}
          onChange={(e) => set('followUpDate', e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Set a date to follow up if you haven't heard back</p>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={`${inputClass('notes')} resize-none`}
          rows={4}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any notes about this application..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
        >
          {initialData ? 'Save Changes' : 'Add Application'}
        </button>
      </div>
    </form>
  )
}
