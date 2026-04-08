import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useWebhookToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  async function fetchOrCreate() {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_webhook_tokens')
      .select('token')
      .single()

    if (data) {
      setToken(data.token)
      setLoading(false)
      return
    }

    // No token yet (PGRST116 = no rows), or any other error — create one
    if (error) {
      await callGenerateToken()
    }
    setLoading(false)
  }

  async function callGenerateToken() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/generate-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setToken(json.token)
    }
  }

  useEffect(() => {
    fetchOrCreate()
  }, [])

  async function regenerate() {
    setRegenerating(true)
    await callGenerateToken()
    setRegenerating(false)
  }

  return { token, loading, regenerating, regenerate }
}
