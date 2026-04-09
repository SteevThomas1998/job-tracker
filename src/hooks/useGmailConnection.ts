import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface GmailStatus {
  connected: boolean
  email: string | null
  connectedAt: string | null
}

export function useGmailConnection() {
  const [status, setStatus] = useState<GmailStatus>({ connected: false, email: null, connectedAt: null })
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted: number } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollingRef = useRef(false)

  async function getAuthHeader(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session ? `Bearer ${session.access_token}` : null
  }

  const fetchStatus = useCallback(async () => {
    const auth = await getAuthHeader()
    if (!auth) { setLoading(false); return }
    const res = await fetch('/api/gmail-status', { headers: { Authorization: auth } })
    if (res.ok) setStatus(await res.json())
    setLoading(false)
  }, [])

  const triggerPoll = useCallback(async () => {
    if (pollingRef.current) return
    const auth = await getAuthHeader()
    if (!auth) return

    // Quick status check before polling
    const statusRes = await fetch('/api/gmail-status', { headers: { Authorization: auth } })
    if (!statusRes.ok) return
    const s = await statusRes.json()
    if (!s.connected) return

    pollingRef.current = true
    setPolling(true)
    try {
      await fetch('/api/gmail-poll', { method: 'POST', headers: { Authorization: auth } })
    } finally {
      pollingRef.current = false
      setPolling(false)
    }
  }, [])

  async function importPastEmails() {
    if (backfilling) return
    const auth = await getAuthHeader()
    if (!auth) return
    setBackfilling(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/gmail-poll?backfill=true', {
        method: 'POST',
        headers: { Authorization: auth },
      })
      if (res.ok) {
        const data = await res.json()
        const total = Object.values(data.results ?? {}).reduce(
          (sum: number, r: unknown) => sum + ((r as { inserted: number }).inserted ?? 0), 0
        )
        setImportResult({ inserted: total as number })
      }
    } finally {
      setBackfilling(false)
    }
  }

  async function connect() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    window.location.href = `/api/gmail-connect?token=${session.access_token}`
  }

  async function disconnect() {
    setDisconnecting(true)
    const auth = await getAuthHeader()
    if (auth) await fetch('/api/gmail-disconnect', { method: 'POST', headers: { Authorization: auth } })
    setStatus({ connected: false, email: null, connectedAt: null })
    setDisconnecting(false)
  }

  // Handle post-OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('gmail_connected')
    const error = params.get('gmail_error')
    if (connected || error) {
      window.history.replaceState({}, '', window.location.pathname)
      fetchStatus()
    }
  }, [fetchStatus])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return { status, loading, polling, backfilling, importResult, disconnecting, connect, disconnect, triggerPoll, importPastEmails }
}
