import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const jwt = (req.headers.authorization ?? '').replace('Bearer ', '')
  if (!jwt) return res.status(401).json({ error: 'Unauthorized' })

  const userClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Invalid session' })

  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Revoke token (best-effort, don't fail if it errors)
  const { data: conn } = await admin
    .from('gmail_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .single()

  if (conn?.access_token) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${conn.access_token}`, { method: 'POST' }).catch(() => {})
  }

  await admin.from('gmail_connections').delete().eq('user_id', user.id)
  await admin.from('gmail_poll_state').delete().eq('user_id', user.id)

  return res.status(200).json({ ok: true })
}
