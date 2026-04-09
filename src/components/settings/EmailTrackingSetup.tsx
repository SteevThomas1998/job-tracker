interface Props {
  status: { connected: boolean; email: string | null; connectedAt: string | null }
  loading: boolean
  polling: boolean
  disconnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export default function GmailConnect({ status, loading, polling, disconnecting, onConnect, onDisconnect }: Props) {
  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900 dark:text-green-300">Gmail connected</p>
            {status.email && (
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{status.email}</p>
            )}
          </div>
          {polling && (
            <div className="ml-auto w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Job emails are checked automatically when you open the dashboard. New applications appear instantly.
        </p>

        <button
          onClick={onDisconnect}
          disabled={disconnecting}
          className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {disconnecting ? 'Disconnecting…' : 'Disconnect Gmail'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Automatic email tracking</h3>
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
          Connect your Gmail account once and job-related emails are tracked automatically — no scripts, no manual setup.
        </p>
      </div>

      <ol className="space-y-2">
        {[
          'Click "Connect Gmail" below',
          'Sign in with your Google account',
          'Click Allow',
        ].map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
          </li>
        ))}
      </ol>

      <button
        onClick={onConnect}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Connect Gmail
      </button>
    </div>
  )
}
