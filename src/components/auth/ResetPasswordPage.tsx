import { useState } from 'react'

interface Props {
  onUpdate: (password: string) => Promise<string | null>
}

export default function ResetPasswordPage({ onUpdate }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const inputClass = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const err = await onUpdate(password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-200 dark:shadow-violet-950"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
              <path d="M15 7H9a2 2 0 0 0-2 2v.5A2 2 0 0 0 9 11.5h6a2 2 0 0 1 2 2v.5A2 2 0 0 1 15 16H8.5" stroke="white" strokeWidth="2.25" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Stealeen</h1>
          <span className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Job Tracker
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5">Set a new password for your account</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">New password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Confirm password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all shadow-md shadow-violet-200 dark:shadow-violet-950 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{ background: loading ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
