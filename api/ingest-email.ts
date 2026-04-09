import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { parseEmail, callGPTFallback, companyFromDomain } from './lib/parseEmail.js'

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing env var: ${name}`)
  return val
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const rawBody = JSON.stringify(req.body ?? {})
  if (rawBody.length > 100_000) return res.status(413).json({ error: 'Payload too large' })

  const payload = req.body as { token?: string; subject?: string; from?: string; body?: string; message_id?: string; date?: string }
  if (!payload.token || !payload.subject || !payload.body) {
    return res.status(400).json({ error: 'Missing required fields: token, subject, body' })
  }
  if (payload.subject.length > 500 || (payload.from ?? '').length > 500 || payload.body.length > 50_000) {
    return res.status(400).json({ error: 'Field exceeds maximum length' })
  }

  const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

  const { data: tokenRow } = await admin
    .from('user_webhook_tokens')
    .select('user_id')
    .eq('token', payload.token)
    .single()

  if (!tokenRow) return res.status(401).json({ error: 'Invalid token' })

  const userId = tokenRow.user_id

  if (payload.message_id) {
    const { data: existing } = await admin
      .from('job_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('gmail_message_id', payload.message_id)
      .single()
    if (existing) return res.status(200).json({ ok: false, skipped: true, reason: 'already processed' })
  }

  const fields = { subject: payload.subject, from: payload.from ?? '', body: payload.body, date: payload.date ?? new Date().toISOString() }

  let parsed = parseEmail(fields)
  if (!parsed && process.env.OPENAI_API_KEY) parsed = await callGPTFallback(fields)
  if (!parsed) return res.status(200).json({ ok: false, skipped: true, reason: 'not a job application email' })

  if (!parsed.company) parsed.company = companyFromDomain(payload.from ?? '')

  const { error: insertError } = await admin.from('job_applications').insert({
    user_id: userId,
    gmail_message_id: payload.message_id ?? null,
    company: parsed.company,
    job_title: parsed.job_title,
    location: parsed.location,
    job_url: parsed.job_url,
    status: parsed.status,
    date_applied: parsed.date_applied,
    salary_range: parsed.salary_range,
    notes: parsed.notes,
    contact_person: parsed.contact_person,
  })

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    return res.status(500).json({ error: 'Failed to process email' })
  }

  return res.status(200).json({ ok: true, company: parsed.company, job_title: parsed.job_title, status: parsed.status })
}
