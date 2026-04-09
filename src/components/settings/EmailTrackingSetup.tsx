interface Props {
  status: { connected: boolean; email: string | null }
  backfilling: boolean
  disconnecting: boolean
  onDisconnect: () => void
  onImportPast: () => void
}

export default function GmailManage({ status, backfilling, disconnecting, onDisconnect, onImportPast }: Props) {
  return (
    <div className="space-y-4">
      {/* Connected badge */}
      <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4">
        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-900 dark:text-green-300">Gmail connected</p>
          {status.email && (
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{status.email}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        New job emails are checked automatically every time you open the dashboard.
      </p>

      {/* Import past emails */}
      <button
        onClick={onImportPast}
        disabled={backfilling}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {backfilling ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Importing past emails…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Import past emails (last 1 year)
          </>
        )}
      </button>

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
