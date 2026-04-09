import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k.trim(), v.join('=')]
    }),
  )
}

function frontendUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { code, state, error } = req.query as Record<string, string>

  if (error) {
    return res.redirect(302, `${frontendUrl()}?gmail_error=${encodeURIComponent(error)}`)
  }

  // CSRF check
  const cookies = parseCookies(req.headers.cookie ?? '')
  if (!cookies.oauth_state || cookies.oauth_state !== state) {
    return res.redirect(302, `${frontendUrl()}?gmail_error=state_mismatch`)
  }

  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = decoded.userId
  } catch {
    return res.redirect(302, `${frontendUrl()}?gmail_error=invalid_state`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return res.redirect(302, `${frontendUrl()}?gmail_error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  if (!tokens.refresh_token) {
    // refresh_token is only returned on first authorization — user must revoke and reconnect
    return res.redirect(302, `${frontendUrl()}?gmail_error=no_refresh_token`)
  }

  // Fetch Gmail address
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = profileRes.ok ? await profileRes.json() as { email: string } : null

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  await admin.from('gmail_connections').upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: expiresAt,
    email: profile?.email ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Store current historyId so first poll only checks future emails
  const gmailProfileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  if (gmailProfileRes.ok) {
    const gProfile = await gmailProfileRes.json() as { historyId: string }
    await admin.from('gmail_poll_state').upsert({
      user_id: userId,
      last_history_id: gProfile.historyId,
      last_polled_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  // Clear state cookie
  res.setHeader('Set-Cookie', 'oauth_state=; HttpOnly; Secure; Max-Age=0; Path=/')
  return res.redirect(302, `${frontendUrl()}/?gmail_connected=1`)
}
