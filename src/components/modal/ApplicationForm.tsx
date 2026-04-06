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
    `w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`

  const labelClass = 'block text-xs font-medium text-gray-700 mb-1'

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
        <label className={labelClass}>Notes</label>
        <textarea
          className={`${inputClass('notes')} resize-none`}
          rows={4}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any notes about this application..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Save Changes' : 'Add Application'}
        </button>
      </div>
    </form>
  )
}
