import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

type ApplicationStatus =
  | 'Saved' | 'Applied' | 'Phone Screen' | 'Interview Scheduled'
  | 'Technical Assessment' | 'Offer Received' | 'Rejected' | 'Withdrawn'

interface IngestPayload {
  token: string
  message_id: string
  subject: string
  from: string
  body: string
  date: string
}

interface ParsedEmail {
  company: string | null
  job_title: string | null
  location: string | null
  job_url: string | null
  status: ApplicationStatus
  date_applied: string
  notes: string | null
}

function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing env var: ${name}`)
  return val
}

// ── Known ATS / job-related sender domains ────────────────────────────────
const ATS_DOMAINS = new Set([
  'greenhouse.io', 'lever.co', 'jobvite.com', 'workday.com', 'myworkdayjobs.com',
  'icims.com', 'taleo.net', 'brassring.com', 'smartrecruiters.com', 'ashbyhq.com',
  'rippling.com', 'bamboohr.com', 'jazz.co', 'recruitee.com', 'pinpointhq.com',
  'indeed.com', 'linkedin.com', 'glassdoor.com', 'ziprecruiter.com', 'monster.com',
])

// ── Noise patterns — skip immediately ─────────────────────────────────────
const NOISE_RE = /newsletter|digest|jobs you may like|jobs based on|recommended jobs|top jobs for you|your weekly|people also viewed|suggested jobs|jobs near you|visa application|police certificate|financial aid|passport|police verification|financial aid|credit card|bank account|insurance|hiring graduates|hiring freshers|career for freshers|we are hiring \d+|save up to|flash sale/i

// ── Job subject patterns ───────────────────────────────────────────────────
const JOB_SUBJECT_RE = /thank you for applying|your application|job application|application received|application submitted|applied for|we received your application|indeed application|linkedin.*application|interview|job offer|offer letter|we reviewed your|next steps|moving forward|not moving forward|regret to inform|unfortunately|position has been filled|technical assessment|coding challenge|take.?home test/i

// ── Status detection ──────────────────────────────────────────────────────
function detectStatus(subject: string, body: string): ApplicationStatus {
  const text = subject + ' ' + body.slice(0, 500)
  if (/job offer|offer letter|pleased to offer|we.{0,20}(offer|offerred)|salary.*offer|congratulations.*offer/i.test(text)) return 'Offer Received'
  if (/unfortunately|regret to inform|not.*moving forward|not.*selected|position.*filled|other candidates|not.*proceed|unsuccessful/i.test(subject)) return 'Rejected'
  if (/technical assessment|coding (challenge|test)|take.?home (test|assignment|project)|online (test|assessment)/i.test(text)) return 'Technical Assessment'
  if (/interview.*(scheduled|invitation|invite|confirmed)|invited.*interview|schedule.*interview/i.test(text)) return 'Interview Scheduled'
  if (/thank you for applying|application received|application submitted|indeed application|we received your application|your application (has been|was) (received|submitted)/i.test(subject)) return 'Applied'
  if (/application/i.test(subject)) return 'Applied'
  return 'Phone Screen'
}

// ── Company extraction ────────────────────────────────────────────────────
function extractCompany(subject: string, from: string): string | null {
  // "Indeed Application: Title at Company"
  let m = subject.match(/\bat\s+([A-Z][^|,\n]{2,40})(?:\s*[|,]|$)/i)
  if (m) return m[1].trim()

  // "Your application to Company"
  m = subject.match(/\bto\s+([A-Z][A-Za-z0-9 &.'-]{2,40})(?:\s+(?:has|for|is|–|-)|$)/i)
  if (m) return m[1].trim()

  // " - Company" or " | Company" at end of subject
  m = subject.match(/[-|]\s*([A-Z][A-Za-z0-9 &.'-]{2,40})\s*$/)
  if (m) return m[1].trim()

  // From display name: "Acme Corp <jobs@acme.com>" — take display name if it looks like a company
  m = from.match(/^"?([^"<@\n]{3,50})"?\s*</i)
  if (m) {
    const name = m[1].trim()
    if (!/no.?reply|recruiting|talent|careers|jobs|hr |noreply/i.test(name)) return name
  }

  // Fall back to sender domain
  m = from.match(/@([\w.-]+)/)
  if (m) {
    const domain = m[1].replace(/\.(com|org|net|io|co\.uk|co|app)$/i, '')
    return domain.split('.').pop()!.replace(/^./, c => c.toUpperCase())
  }

  return null
}

// ── Job title extraction ──────────────────────────────────────────────────
function extractJobTitle(subject: string, body: string): string | null {
  // "Indeed Application: Software Engineer"
  let m = subject.match(/indeed application:\s*(.+?)(?:\s+at\s+|\s*$)/i)
  if (m) return m[1].trim()

  // "LinkedIn: Your application was sent to X — Job Title"
  m = subject.match(/—\s*(.+?)\s*(?:at\s+\w|$)/i)
  if (m && m[1].length < 80) return m[1].trim()

  // "Your application for Software Engineer"
  m = subject.match(/(?:application for|applied for|applying for|re:\s*)([A-Z][^|,\n]{3,60})(?:\s+(?:at|position|role)|$)/i)
  if (m) return m[1].trim()

  // "for the <Title> role/position"
  m = subject.match(/for the\s+(.+?)\s+(?:role|position|job)/i)
  if (m) return m[1].trim()

  // Body: "position of <Title>", "role of <Title>", "the <Title> position"
  m = body.match(/(?:position of|role of|the position of|applying for(?: the)?)\s+([A-Z][^.\n,]{3,60}?)(?:\s+(?:at|with|position|role)|[.,\n])/i)
  if (m) return m[1].trim()

  return null
}

// ── Location extraction ───────────────────────────────────────────────────
function extractLocation(subject: string, body: string): string | null {
  const text = subject + ' ' + body.slice(0, 1000)
  const m = text.match(/\b(Remote|Hybrid|On.?site|[A-Z][a-z]+(?:,\s*[A-Z]{2,3})?)\b/)
  if (m && /remote|hybrid|on.?site/i.test(m[1])) return m[1]
  return null
}

// ── Job URL extraction ────────────────────────────────────────────────────
function extractJobUrl(body: string): string | null {
  const matches = body.match(/https?:\/\/[^\s"'<>]+/g) ?? []
  return matches.find(u => /job|position|apply|careers|opening|vacancy/i.test(u)) ?? null
}

// ── Mass blast detection ──────────────────────────────────────────────────
function isMassBlast(body: string): boolean {
  // Multiple different job titles listed = mass broadcast
  const titleMatches = body.match(/\b(analyst|engineer|manager|developer|designer|coordinator|associate|specialist|intern)\b/gi) ?? []
  const uniqueTitles = new Set(titleMatches.map(t => t.toLowerCase()))
  return uniqueTitles.size >= 4
}

// ── Main parser ───────────────────────────────────────────────────────────
function parseEmail(p: IngestPayload): ParsedEmail | null {
  const { subject, from, body, date } = p

  // Reject noise immediately
  if (NOISE_RE.test(subject)) return null

  // Must either be from a known ATS domain or have a job-related subject
  const senderDomain = (from.match(/@([\w.-]+)/) ?? [])[1] ?? ''
  const isATS = ATS_DOMAINS.has(senderDomain)
  const hasJobSubject = JOB_SUBJECT_RE.test(subject)
  if (!isATS && !hasJobSubject) return null

  // Reject mass blasts
  if (isMassBlast(body)) return null

  const company = extractCompany(subject, from)
  const job_title = extractJobTitle(subject, body)

  // Need at least a job title to be useful
  if (!job_title) return null

  return {
    company,
    job_title,
    location: extractLocation(subject, body),
    job_url: extractJobUrl(body),
    status: detectStatus(subject, body),
    date_applied: date.slice(0, 10),
    notes: null,
  }
}

// ── Handler ───────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Input size limits — prevent DoS via large payloads
  const rawBody = JSON.stringify(req.body ?? {})
  if (rawBody.length > 100_000) {
    return res.status(413).json({ error: 'Payload too large' })
  }

  const payload = req.body as Partial<IngestPayload>
  if (!payload.token || !payload.subject || !payload.body) {
    return res.status(400).json({ error: 'Missing required fields: token, subject, body' })
  }

  // Field length limits
  if (payload.subject.length > 500 || payload.from!.length > 500 || payload.body.length > 50_000) {
    return res.status(400).json({ error: 'Field exceeds maximum length' })
  }

  const adminClient = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

  // Look up user by personal token
  const { data: tokenRow } = await adminClient
    .from('user_webhook_tokens')
    .select('user_id')
    .eq('token', payload.token)
    .single()

  if (!tokenRow) return res.status(401).json({ error: 'Invalid token' })

  const userId = tokenRow.user_id

  // Deduplication
  if (payload.message_id) {
    const { data: existing } = await adminClient
      .from('job_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('gmail_message_id', payload.message_id)
      .single()

    if (existing) return res.status(200).json({ ok: false, skipped: true, reason: 'already processed' })
  }

  // Parse email with rules
  const parsed = parseEmail(payload as IngestPayload)
  if (!parsed) return res.status(200).json({ ok: false, skipped: true, reason: 'not a job application email' })

  // Fall back to sender domain for company if extraction failed
  if (!parsed.company) {
    const m = payload.from!.match(/@([\w.-]+)/)
    parsed.company = m ? m[1].replace(/\.(com|org|net|io|co\.uk|co|app)$/i, '').replace(/^./, c => c.toUpperCase()) : 'Unknown Company'
  }

  const { error: insertError } = await adminClient.from('job_applications').insert({
    user_id: userId,
    gmail_message_id: payload.message_id ?? null,
    company: parsed.company,
    job_title: parsed.job_title,
    location: parsed.location,
    job_url: parsed.job_url,
    status: parsed.status,
    date_applied: parsed.date_applied,
    salary_range: null,
    notes: parsed.notes,
    contact_person: null,
  })

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    return res.status(500).json({ error: 'Failed to process email' })
  }

  return res.status(200).json({ ok: true, company: parsed.company, job_title: parsed.job_title, status: parsed.status })
}
