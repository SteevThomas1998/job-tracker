import { useState } from 'react'

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>
  onSignUp: (email: string, password: string) => Promise<string | null>
  onGoogleSignIn: () => Promise<string | null>
  onResetPassword: (email: string) => Promise<string | null>
}

export default function AuthPage({ onSignIn, onSignUp, onGoogleSignIn, onResetPassword }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  function switchMode(next: 'signin' | 'signup' | 'forgot') {
    setMode(next)
    setError(null)
    setMessage(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'forgot') {
      const err = await onResetPassword(email)
      if (err) { setError(err) } else { setMessage('Check your email for a password reset link.') }
    } else if (mode === 'signin') {
      const err = await onSignIn(email, password)
      if (err) setError(err)
    } else {
      const err = await onSignUp(email, password)
      if (err) {
        setError(err)
      } else {
        setMessage('Check your email to confirm your account, then sign in.')
        switchMode('signin')
      }
    }

    setLoading(false)
  }

  async function handleGoogle() {
    setOauthLoading(true)
    setError(null)
    const err = await onGoogleSignIn()
    if (err) { setError(err); setOauthLoading(false) }
  }

  const inputClass = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors'

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5">
            {mode === 'forgot' ? 'Reset your password' : mode === 'signin' ? 'Welcome back' : 'Start tracking your applications'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 p-6">

          {mode !== 'forgot' && (
            <>
              {/* Sign in / Sign up toggle */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${mode === 'signin' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${mode === 'signup' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Sign up
                </button>
              </div>

              {/* Google button */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={oauthLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {oauthLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {message && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all shadow-md shadow-violet-200 dark:shadow-violet-950 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{ background: loading ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
            >
              {loading
                ? 'Please wait…'
                : mode === 'forgot'
                  ? 'Send reset link'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
