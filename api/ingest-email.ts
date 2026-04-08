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
  return `You are a job-application data extractor. Analyze the email and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

## Email
Subject: ${p.subject}
From: ${p.from}
Date: ${p.date}
---
${p.body.slice(0, 6000)}
---

## Required JSON shape
{
  "company": "<company name, required>",
  "job_title": "<job title, required>",
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
- Recruiter outreach, no interview yet → "Phone Screen"
- Interview invitation → "Interview Scheduled"
- Take-home test / coding challenge → "Technical Assessment"
- Offer letter or verbal offer → "Offer Received"
- Rejection email → "Rejected"
- Acknowledgement / not yet reviewed → "Saved"
- Candidate withdrawing → "Withdrawn"

"company" and "job_title" are required — infer from context if needed. Use null for any field you cannot determine.`
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

  try {
    // 1. Parse email with Claude
    const anthropic = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: buildPrompt(payload as IngestPayload) }],
    })

    const rawText = (message.content[0] as { type: 'text'; text: string }).text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    let parsed: ParsedApplication
    try {
      parsed = JSON.parse(rawText) as ParsedApplication
    } catch {
      console.error('Non-JSON response from Claude:', rawText)
      return res.status(422).json({ error: 'Claude returned non-JSON', raw: rawText })
    }

    if (!parsed.company || !parsed.job_title) {
      return res.status(422).json({ error: 'Could not extract company or job_title', parsed })
    }

    const status: ApplicationStatus = VALID_STATUSES.includes(parsed.status)
      ? parsed.status
      : 'Saved'

    // 2. Insert into Supabase
    const { error: insertError } = await adminClient.from('job_applications').insert({
      user_id: userId,
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
