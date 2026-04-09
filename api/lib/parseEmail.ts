import OpenAI from 'openai'

export type ApplicationStatus =
  | 'Saved' | 'Applied' | 'Phone Screen' | 'Interview Scheduled'
  | 'Technical Assessment' | 'Offer Received' | 'Rejected' | 'Withdrawn'

export interface EmailFields {
  subject: string
  from: string
  body: string
  date: string
}

export interface ParsedEmail {
  company: string | null
  job_title: string | null
  location: string | null
  job_url: string | null
  status: ApplicationStatus
  date_applied: string
  salary_range: string | null
  notes: string | null
  contact_person: string | null
}

export const VALID_STATUSES: ApplicationStatus[] = [
  'Saved', 'Applied', 'Phone Screen', 'Interview Scheduled',
  'Technical Assessment', 'Offer Received', 'Rejected', 'Withdrawn',
]

// ── Known ATS / job-related sender domains ────────────────────────────────
// Note: linkedin.com and indeed.com are intentionally excluded — they send mostly
// newsletters and job alerts. Their actual application confirmation emails are caught
// by JOB_SUBJECT_RE patterns instead (e.g. "indeed application", "linkedin.*application").
export const ATS_DOMAINS = new Set([
  'greenhouse.io', 'lever.co', 'jobvite.com', 'workday.com', 'myworkdayjobs.com',
  'icims.com', 'taleo.net', 'brassring.com', 'smartrecruiters.com', 'ashbyhq.com',
  'rippling.com', 'bamboohr.com', 'jazz.co', 'recruitee.com', 'pinpointhq.com',
  'glassdoor.com', 'ziprecruiter.com',
  'seemehired.com', 'occupop.com', 'occupop-mail.com', 'cezannehr.com',
  'rezoomo.com', 'sigmar.ie', 'irishjobs.ie', 'publicjobs.ie', 'jobs.ie',
  'totaljobs.com', 'reed.co.uk', 'cv-library.co.uk', 'cwjobs.co.uk',
])

// ── Noise patterns ────────────────────────────────────────────────────────
export const NOISE_RE = /newsletter|digest|jobs you may like|jobs based on|recommended jobs|top jobs for you|your weekly|people also viewed|suggested jobs|jobs near you|job alert|job alerts|jobs alert|new jobs for you|jobs recommended|jobs matching|\d+ new jobs|new job matches|jobs found for|salary insights|visa application|police certificate|financial aid|passport|police verification|credit card|bank account|insurance|hiring graduates|hiring freshers|career for freshers|we are hiring \d+|save up to|flash sale|unsubscribe|view in browser|email preferences/i

// ── Job subject patterns ──────────────────────────────────────────────────
export const JOB_SUBJECT_RE = /thank you for applying|your application|job application|application received|application submitted|application success|application update|applied for|we received your application|indeed application|linkedin.*application|interview|job offer|offer letter|we reviewed your|next steps|moving forward|not moving forward|regret to inform|unfortunately|position has been filled|technical assessment|coding challenge|take.?home test/i

// ── Status detection ──────────────────────────────────────────────────────
export function detectStatus(subject: string, body: string): ApplicationStatus {
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
export function extractCompany(subject: string, from: string): string | null {
  let m = subject.match(/\bat\s+([A-Z][^|,\n]{2,40})(?:\s*[|,]|$)/i)
  if (m) return m[1].trim()

  m = subject.match(/\bto\s+([A-Z][A-Za-z0-9 &.'-]{2,40})(?:\s+(?:has|for|is|–|-)|$)/i)
  if (m) return m[1].trim()

  m = subject.match(/[-|]\s*([A-Z][A-Za-z0-9 &.'-]{2,40})\s*$/)
  if (m) return m[1].trim()

  m = from.match(/^"?([^"<@\n]{3,50})"?\s*</i)
  if (m) {
    const name = m[1].trim()
    if (!/no.?reply|recruiting|talent|careers|jobs|hr |noreply/i.test(name)) return name
  }

  m = from.match(/@([\w.-]+)/)
  if (m) {
    const domain = m[1].replace(/\.(com|org|net|io|co\.uk|co|app)$/i, '')
    return domain.split('.').pop()!.replace(/^./, c => c.toUpperCase())
  }

  return null
}

// ── Job title extraction ──────────────────────────────────────────────────
export function extractJobTitle(subject: string, body: string): string | null {
  let m = subject.match(/indeed application:\s*(.+?)(?:\s+at\s+|\s*$)/i)
  if (m) return m[1].trim()

  m = subject.match(/—\s*(.+?)\s*(?:at\s+\w|$)/i)
  if (m && m[1].length < 80) return m[1].trim()

  m = subject.match(/(?:application for|applied for|applying for|re:\s*)([A-Z][^|,\n]{3,60})(?:\s+(?:at|position|role)|$)/i)
  if (m) return m[1].trim()

  m = subject.match(/for the\s+(.+?)\s+(?:role|position|job)/i)
  if (m) return m[1].trim()

  m = body.match(/(?:position of|role of|the position of|applying for(?: the)?)\s+([A-Z][^.\n,]{3,60}?)(?:\s+(?:at|with|position|role)|[.,\n])/i)
  if (m) return m[1].trim()

  m = body.match(/(?:right fit for(?: the)?|suitable for(?: the)?|selected for(?: the)?|progressing with(?: the)?|move forward with(?: the)?)\s+([A-Z][^.\n,(]{3,60}?)(?:\s*[–\-,(]|$)/im)
  if (m) return m[1].trim()

  m = body.match(/your (?:recent )?application for(?: the)?\s+([A-Z][^.\n,]{3,60}?)(?:\s+(?:at|with|role|position)|[.,\n])/i)
  if (m) return m[1].trim()

  m = subject.match(/[-–:]\s*([A-Za-z][A-Za-z0-9 /()&]{4,50})\s*$/)
  if (m && !/update|notice|tracker|application|success|confirmation/i.test(m[1])) return m[1].trim()

  return null
}

// ── Location extraction ───────────────────────────────────────────────────
export function extractLocation(subject: string, body: string): string | null {
  const text = subject + ' ' + body.slice(0, 1000)
  const m = text.match(/\b(Remote|Hybrid|On.?site|[A-Z][a-z]+(?:,\s*[A-Z]{2,3})?)\b/)
  if (m && /remote|hybrid|on.?site/i.test(m[1])) return m[1]
  return null
}

// ── Job URL extraction ────────────────────────────────────────────────────
export function extractJobUrl(body: string): string | null {
  const matches = body.match(/https?:\/\/[^\s"'<>]+/g) ?? []
  return matches.find(u => /job|position|apply|careers|opening|vacancy/i.test(u)) ?? null
}

// ── Mass blast detection ──────────────────────────────────────────────────
export function isMassBlast(body: string): boolean {
  const titleMatches = body.match(/\b(analyst|engineer|manager|developer|designer|coordinator|associate|specialist|intern)\b/gi) ?? []
  const uniqueTitles = new Set(titleMatches.map(t => t.toLowerCase()))
  return uniqueTitles.size >= 4
}

// ── Rule-based parser ─────────────────────────────────────────────────────
export function parseEmail(p: EmailFields): ParsedEmail | null {
  const { subject, from, body, date } = p

  if (NOISE_RE.test(subject)) return null

  const senderDomain = (from.match(/@([\w.-]+)/) ?? [])[1] ?? ''
  const isATS = ATS_DOMAINS.has(senderDomain)
  const hasJobSubject = JOB_SUBJECT_RE.test(subject)
  if (!isATS && !hasJobSubject) return null

  if (isMassBlast(body)) return null

  const job_title = extractJobTitle(subject, body)
  if (!job_title) return null

  // Reject suspiciously generic or low-quality extractions
  const GENERIC_WORDS = /^(remote|hybrid|unknown|n\/a|job|position|role|opportunity|vacancy|opening|alert|update|notification|info|null)$/i
  if (GENERIC_WORDS.test(job_title.trim())) return null

  const company = extractCompany(subject, from)

  // Skip if company and job title are identical (bad extraction)
  if (company && company.toLowerCase() === job_title.toLowerCase()) return null

  return {
    company,
    job_title,
    location: extractLocation(subject, body),
    job_url: extractJobUrl(body),
    status: detectStatus(subject, body),
    date_applied: date.slice(0, 10),
    salary_range: null,
    notes: null,
    contact_person: null,
  }
}

// ── GPT-4o-mini fallback ──────────────────────────────────────────────────
export async function callGPTFallback(p: EmailFields): Promise<ParsedEmail | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `You are a strict job-application email classifier. Analyze this email and return ONLY valid JSON — no markdown, no explanation.

Email:
Subject: ${p.subject}
From: ${p.from}
Date: ${p.date}
---
${p.body.slice(0, 4000)}
---

If NOT a direct personal job email (reject newsletters, mass blasts, visa/police/finance emails), return exactly: {"is_job_email": false}

If IS a direct personal job email, return:
{
  "is_job_email": true,
  "company": "<hiring company, required>",
  "job_title": "<specific role, required>",
  "location": "<city/Remote or null>",
  "job_url": "<URL or null>",
  "status": "<one of: Applied | Phone Screen | Interview Scheduled | Technical Assessment | Offer Received | Rejected | Withdrawn>",
  "salary_range": "<salary if mentioned or null>",
  "notes": "<1-2 sentence summary or null>",
  "contact_person": "<recruiter name or null>"
}

Status rules: application confirmation→Applied, recruiter outreach for specific role→Phone Screen, interview invite→Interview Scheduled, take-home test/coding challenge→Technical Assessment, offer letter→Offer Received, rejection→Rejected.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (response.choices[0].message.content ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(raw) } catch { return null }

  if (!parsed.is_job_email || !parsed.job_title) return null

  const status = VALID_STATUSES.includes(parsed.status as ApplicationStatus)
    ? (parsed.status as ApplicationStatus)
    : 'Applied'

  return {
    company: (parsed.company as string) ?? null,
    job_title: parsed.job_title as string,
    location: (parsed.location as string) ?? null,
    job_url: (parsed.job_url as string) ?? null,
    status,
    date_applied: p.date.slice(0, 10),
    salary_range: (parsed.salary_range as string) ?? null,
    notes: (parsed.notes as string) ?? null,
    contact_person: (parsed.contact_person as string) ?? null,
  }
}

// ── Company domain fallback ───────────────────────────────────────────────
export function companyFromDomain(from: string): string {
  const m = from.match(/@([\w.-]+)/)
  return m
    ? m[1].replace(/\.(com|org|net|io|co\.uk|co|app)$/i, '').replace(/^./, c => c.toUpperCase())
    : 'Unknown Company'
}
