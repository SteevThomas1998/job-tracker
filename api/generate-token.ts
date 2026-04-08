import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing env var: ${name}`)
  return val
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const jwt = (req.headers.authorization ?? '').replace('Bearer ', '')
  if (!jwt) return res.status(401).json({ error: 'No authorization header' })

  // Verify the JWT by creating a user-scoped client
  const userClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('VITE_SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return res.status(401).json({ error: 'Invalid session' })

  const newToken = randomBytes(32).toString('hex')

  // Use service role to upsert (bypasses RLS for the write)
  const adminClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))
  const { data, error: upsertError } = await adminClient
    .from('user_webhook_tokens')
    .upsert({ user_id: user.id, token: newToken }, { onConflict: 'user_id' })
    .select('token')
    .single()

  if (upsertError || !data) {
    console.error('Upsert error:', upsertError)
    return res.status(500).json({ error: 'Failed to generate token' })
  }

  return res.status(200).json({ token: data.token })
}
