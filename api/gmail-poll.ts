import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { parseEmail, callGPTFallback, companyFromDomain, NOISE_RE, ATS_DOMAINS, JOB_SUBJECT_RE } from './lib/parseEmail.js'

// Gmail API types
interface GmailMessage {
  id: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{ mimeType: string; body?: { data?: string }; parts?: Array<{ mimeType: string; body?: { data?: string } }> }>
  }
  internalDate: string
}

interface GmailConnection {
  user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
}

async function getValidToken(conn: GmailConnection, admin: ReturnType<typeof createClient>): Promise<string> {
  const expiresAt = new Date(conn.token_expires_at).getTime()
  if (Date.now() + 5 * 60 * 1000 < expiresAt) return conn.access_token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: conn.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)

  const data = await res.json() as { access_token: string; expires_in: number }
  await admin.from('gmail_connections').update({
    access_token: data.access_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', conn.user_id)

  return data.access_token
}

function extractBody(msg: GmailMessage): string {
  function decodeBase64(data: string): string {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  }

  // Flat body
  if (msg.payload.body?.data) return decodeBase64(msg.payload.body.data)

  // Parts (multipart)
  const allParts = msg.payload.parts ?? []
  // Search recursively for text/plain
  function findText(parts: typeof allParts): string | null {
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return decodeBase64(part.body.data)
      if (part.parts) {
        const found = findText(part.parts)
        if (found) return found
      }
    }
    return null
  }

  return findText(allParts) ?? ''
}

function getHeader(msg: GmailMessage, name: string): string {
  return msg.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

async function getMessageIds(accessToken: string, historyId: string | null, backfill = false): Promise<{ ids: string[]; newHistoryId: string | null }> {
  if (backfill) return searchMessages(accessToken, '365d')
  // Incremental via History API
  if (historyId) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}&historyTypes=messageAdded&maxResults=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (res.status === 404) {
      // historyId expired — fall back to search
    } else if (res.ok) {
      const data = await res.json() as {
        history?: Array<{ messagesAdded?: Array<{ message: { id: string } }> }>
        historyId?: string
      }
      const ids = (data.history ?? [])
        .flatMap(h => h.messagesAdded ?? [])
        .map(m => m.message.id)
      return { ids, newHistoryId: data.historyId ?? null }
    }
  }

  // Fallback: search last 7 days (or 365 days for backfill)
  return searchMessages(accessToken, backfill ? '365d' : '7d')
}

async function searchMessages(accessToken: string, period: string): Promise<{ ids: string[]; newHistoryId: null }> {
  const q = encodeURIComponent(
    `(subject:("thank you for applying" OR "your application" OR "job application" OR "application received" OR "application submitted" OR "application success" OR "application update" OR "interview" OR "job offer" OR "offer letter" OR "indeed application" OR "thank you for your application" OR "right fit for" OR "we have reviewed your application") OR from:(greenhouse.io OR lever.co OR ashbyhq.com OR workday.com OR jobvite.com OR indeed.com OR linkedin.com OR seemehired.com OR occupop.com OR cezannehr.com OR rezoomo.com)) newer_than:${period}`,
  )
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) return { ids: [], newHistoryId: null }
  const data = await res.json() as { messages?: Array<{ id: string }> }
  return { ids: (data.messages ?? []).map(m => m.id), newHistoryId: null }
}

async function pollForUser(
  userId: string,
  admin: ReturnType<typeof createClient>,
  backfill = false,
): Promise<{ processed: number; inserted: number }> {
  const { data: conn } = await admin
    .from('gmail_connections').select('*').eq('user_id', userId).single()
  if (!conn) return { processed: 0, inserted: 0 }

  const { data: pollState } = await admin
    .from('gmail_poll_state').select('last_history_id').eq('user_id', userId).single()

  const accessToken = await getValidToken(conn as GmailConnection, admin)
  const { ids: messageIds, newHistoryId } = await getMessageIds(accessToken, pollState?.last_history_id ?? null, backfill)

  // Update historyId watermark
  const currentHistoryId = newHistoryId ?? await (async () => {
    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!r.ok) return null
    const p = await r.json() as { historyId: string }
    return p.historyId
  })()

  if (currentHistoryId) {
    await admin.from('gmail_poll_state').upsert({
      user_id: userId,
      last_history_id: currentHistoryId,
      last_polled_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  let processed = 0
  let inserted = 0

  for (const msgId of messageIds) {
    // Dedup check
    const { data: existing } = await admin
      .from('job_applications').select('id').eq('user_id', userId).eq('gmail_message_id', msgId).single()
    if (existing) continue

    // Fetch full message
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    if (!msgRes.ok) continue

    const msg = await msgRes.json() as GmailMessage
    const subject = getHeader(msg, 'subject')
    const from = getHeader(msg, 'from')
    const body = extractBody(msg).slice(0, 8000)
    const date = new Date(parseInt(msg.internalDate)).toISOString()

    // Pre-filter: skip obvious noise before any parsing
    if (NOISE_RE.test(subject)) continue
    const senderDomain = (from.match(/@([\w.-]+)/) ?? [])[1] ?? ''
    if (!ATS_DOMAINS.has(senderDomain) && !JOB_SUBJECT_RE.test(subject)) continue

    processed++

    const fields = { subject, from, body, date }
    let result = parseEmail(fields)
    if (!result && process.env.OPENAI_API_KEY) result = await callGPTFallback(fields)
    if (!result) continue

    if (!result.company) result.company = companyFromDomain(from)

    const { error } = await admin.from('job_applications').insert({
      user_id: userId,
      gmail_message_id: msgId,
      company: result.company,
      job_title: result.job_title,
      location: result.location,
      job_url: result.job_url,
      status: result.status,
      date_applied: result.date_applied,
      salary_range: result.salary_range,
      notes: result.notes,
      contact_person: result.contact_person,
    })

    if (!error) inserted++
  }

  return { processed, inserted }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Auth: cron secret (all users) or user JWT (single user)
  const cronSecret = req.headers['x-cron-secret']
  const vercelCronJwt = (req.headers.authorization ?? '').replace('Bearer ', '')

  let userIds: string[]

  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    const { data } = await admin.from('gmail_connections').select('user_id')
    userIds = (data ?? []).map((r: { user_id: string }) => r.user_id)
  } else if (vercelCronJwt && vercelCronJwt === process.env.CRON_SECRET) {
    // Vercel cron uses Authorization: Bearer header
    const { data } = await admin.from('gmail_connections').select('user_id')
    userIds = (data ?? []).map((r: { user_id: string }) => r.user_id)
  } else if (vercelCronJwt) {
    // User-triggered: validate Supabase JWT
    const userClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${vercelCronJwt}` } } },
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return res.status(401).json({ error: 'Invalid session' })
    userIds = [user.id]
  } else {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const backfill = req.query.backfill === 'true' || req.body?.backfill === true
  const results: Record<string, { processed: number; inserted: number; error?: string }> = {}

  for (const userId of userIds) {
    try {
      results[userId] = await pollForUser(userId, admin, backfill)
    } catch (e) {
      console.error(`Poll error for ${userId}:`, e)
      results[userId] = { processed: 0, inserted: 0, error: String(e) }
    }
  }

  return res.status(200).json({ ok: true, results })
}
