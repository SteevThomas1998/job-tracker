interface Props {
  status: { connected: boolean; email: string | null }
  backfilling: boolean
  disconnecting: boolean
  onDisconnect: () => void
  onImportPast: () => void
}

export default function GmailManage({ status, backfilling, disconnecting, onDisconnect, onImportPast }: Props) {
  return (
    <div className="space-y-5">
      {/* Connected card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 p-5">
        <div className="flex items-center gap-4">
          {/* Gmail G icon */}
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center flex-shrink-0 border border-green-100 dark:border-green-900">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#34A853" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-green-900 dark:text-green-200">Connected</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
            </div>
            {status.email && (
              <p className="text-xs text-green-700 dark:text-green-400 truncate">{status.email}</p>
            )}
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 opacity-50" />
        <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 opacity-40" />
      </div>

      {/* Info text */}
      <div className="flex items-start gap-2.5 px-1">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Job emails are checked automatically when you open the dashboard. New applications appear instantly.
        </p>
      </div>

      {/* Import button */}
      <button
        onClick={onImportPast}
        disabled={backfilling}
        className="w-full group flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center flex-shrink-0 transition-colors">
          {backfilling ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {backfilling ? 'Importing past emails…' : 'Import past emails'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Scans your last 12 months of email</p>
        </div>
        {!backfilling && (
          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Disconnect */}
      <button
        onClick={onDisconnect}
        disabled={disconnecting}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm group"
      >
        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 flex items-center justify-center flex-shrink-0 transition-colors">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {disconnecting ? 'Disconnecting…' : 'Disconnect Gmail'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Remove Gmail access from Stealeen</p>
        </div>
      </button>
    </div>
  )
}
