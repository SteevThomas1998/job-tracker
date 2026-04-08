import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

type ApplicationStatus =
  | 'Saved' | 'Applied' | 'Phone Screen' | 'Interview Scheduled'
  | 'Technical Assessment' | 'Offer Received' | 'Rejected' | 'Withdrawn'

interface ParsedApplication {
  company: string
  job_title: string
  location: string | null
  job_url: string | null
  status: ApplicationStatus
  date_applied: string | null
  salary_range: string | null
  notes: string | null
  contact_person: string | null
}

interface IngestPayload {
  token: string
  message_id: string
  subject: string
  from: string
  body: string
  date: string
}

const VALID_STATUSES: ApplicationStatus[] = [
  'Saved', 'Applied', 'Phone Screen', 'Interview Scheduled',
  'Technical Assessment', 'Offer Received', 'Rejected', 'Withdrawn',
]

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing env var: ${name}`)
  return val
}

function buildPrompt(p: IngestPayload): string {
  return `You are a strict job-application email classifier and data extractor.

## Email
Subject: ${p.subject}
From: ${p.from}
Date: ${p.date}
---
${p.body.slice(0, 6000)}
---

## Step 1: Is this a direct, personal job application email?
Only classify as a job email if it is DIRECTLY addressed to this specific person about a specific role:
- Confirmation that THIS person applied for a specific job/position/role
- A recruiter or hiring manager personally reaching out to THIS person about a specific opportunity
- Interview invitation for THIS person for a specific job
- Technical assessment or coding challenge sent to THIS person
- Job offer letter for THIS person
- Rejection email for THIS person's specific application

Classify as NOT a job email if:
- It is a mass/broadcast email (e.g. "We're hiring graduates", LinkedIn announcements, "Career For Freshers")
- It is a newsletter, digest, or job recommendations list
- It mentions multiple unrelated job titles in the same email (mass recruiter blast)
- Visa, immigration, passport, police certificates
- Financial aid, scholarships, course applications (e.g. Coursera)
- Bank accounts, credit cards, insurance, financial products
- Gaming, shopping, subscriptions, promotions

## Step 2: Return JSON
If NOT a job email, return exactly: {"is_job_email": false}

If IS a direct personal job email, return:
{
  "is_job_email": true,
  "company": "<hiring company name, required>",
  "job_title": "<specific job title, required>",
  "location": "<city/state/Remote or null>",
  "job_url": "<URL from email or null>",
  "status": "<one of: Saved | Applied | Phone Screen | Interview Scheduled | Technical Assessment | Offer Received | Rejected | Withdrawn>",
  "date_applied": "<YYYY-MM-DD or null>",
  "salary_range": "<salary if mentioned or null>",
  "notes": "<1-2 sentence summary or null>",
  "contact_person": "<recruiter/hiring manager name or null>"
}

## Status rules
- Application confirmation → "Applied"
- Direct recruiter outreach for a specific role, no interview yet → "Phone Screen"
- Interview invitation → "Interview Scheduled"
- Take-home test / coding challenge → "Technical Assessment"
- Offer letter or verbal offer → "Offer Received"
- Rejection → "Rejected"
- Candidate withdrawing → "Withdrawn"

Return ONLY valid JSON — no markdown, no explanation, no code fences.`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const payload = req.body as Partial<IngestPayload>
  if (!payload.token || !payload.subject || !payload.body) {
    return res.status(400).json({ error: 'Missing required fields: token, subject, body' })
  }

  const adminClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

  // Look up user by their personal token
  const { data: tokenRow } = await adminClient
    .from('user_webhook_tokens')
    .select('user_id')
    .eq('token', payload.token)
    .single()

  if (!tokenRow) return res.status(401).json({ error: 'Invalid token' })

  const userId = tokenRow.user_id

  // Deduplication: skip if this Gmail message was already processed
  if (payload.message_id) {
    const { data: existing } = await adminClient
      .from('job_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('gmail_message_id', payload.message_id)
      .single()

    if (existing) {
      return res.status(200).json({ ok: false, skipped: true, reason: 'already processed' })
    }
  }

  try {
    // 1. Parse email with Claude
    const anthropic = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(payload as IngestPayload) }],
    })

    const rawText = (message.content[0] as { type: 'text'; text: string }).text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    let parsed: ParsedApplication & { is_job_email?: boolean }
    try {
      parsed = JSON.parse(rawText)
    } catch {
      console.error('Non-JSON response from Claude:', rawText)
      return res.status(422).json({ error: 'Claude returned non-JSON', raw: rawText })
    }

    // Claude classified this as not a job email — skip silently
    if (parsed.is_job_email === false) {
      return res.status(200).json({ ok: false, skipped: true, reason: 'not a job application email' })
    }

    // Fall back to sender domain if company not found
    if (!parsed.company) {
      const match = (payload as IngestPayload).from.match(/@([\w.-]+)/)
      parsed.company = match ? match[1].replace(/\.(com|org|net|io|co)$/, '') : 'Unknown Company'
    }

    if (!parsed.job_title) {
      return res.status(200).json({ ok: false, skipped: true, reason: 'not a job application email' })
    }

    const status: ApplicationStatus = VALID_STATUSES.includes(parsed.status)
      ? parsed.status
      : 'Saved'

    // 2. Insert into Supabase
    const { error: insertError } = await adminClient.from('job_applications').insert({
      user_id: userId,
      gmail_message_id: payload.message_id ?? null,
      company: parsed.company,
      job_title: parsed.job_title,
      location: parsed.location ?? null,
      job_url: parsed.job_url ?? null,
      status,
      date_applied: parsed.date_applied ?? new Date().toISOString().slice(0, 10),
      salary_range: parsed.salary_range ?? null,
      notes: parsed.notes ?? null,
      contact_person: parsed.contact_person ?? null,
    })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return res.status(500).json({ error: 'Database insert failed', detail: insertError.message })
    }

    return res.status(200).json({ ok: true, company: parsed.company, job_title: parsed.job_title, status })
  } catch (err) {
    console.error('Unexpected error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
