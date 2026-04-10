# Stealeen — LinkedIn Post

---

**Post:**

---

I built an AI-powered job application tracker that reads your Gmail and does the work for you. No spreadsheets. No manual entry. Just a clean dashboard that knows exactly where every application stands.

It's called **Stealeen** — and it's in beta.

---

Here's the problem it solves:

When you're applying to dozens of roles at once, keeping track becomes a job in itself. Which companies ghosted you? Which ones sent an interview invite? Where did that offer letter land?

Most people fall back on spreadsheets — or just lose track entirely. Existing tools like Huntr or Teal still make you add every application by hand. That friction kills the habit.

**Stealeen eliminates the friction entirely.**

---

🔍 **How it works:**

Connect your Gmail via OAuth (read-only, secure), and Stealeen automatically detects job-related emails — application confirmations, interview invites, technical assessments, offer letters, rejections — and builds your tracker for you.

Every new email is scanned in real time. You can also import up to 12 months of history to backfill everything you've applied to so far.

---

🧠 **The AI layer — and why it's built smart:**

Parsing job emails is messy. I use a two-layer approach to keep it accurate and cost-efficient:

**Layer 1 — Custom regex engine:** Recognises 30+ ATS sender domains (Greenhouse, Lever, Workday, Ashby, iCIMS, Jobvite, BambooHR, and more) and matches subject line patterns to classify status. Fast, free, zero API calls. This handles the vast majority of emails.

**Layer 2 — GPT-4o-mini fallback:** Only fires when the regex engine can't parse an email. Sends the subject, sender, and first 4,000 characters of the body with a strict structured prompt — returns clean JSON. The result: OpenAI costs stay near zero for most users.

Noise filtering is equally aggressive. Newsletters, job alert digests, recruiter blasts, LinkedIn/Indeed marketing — all actively discarded. Without this, the tracker would be full of garbage.

---

📊 **What you get:**

- Auto-classification across 6 stages: Applied → Phone Screen → Interview Scheduled → Technical Assessment → Offer Received → Rejected
- List view + Kanban board with drag-and-drop between stages
- Inline status editing on every card
- Real-time updates + dark mode
- Gmail History API integration — only fetches *new* emails since the last check (no unnecessary re-scanning)

---

⚙️ **Tech stack:**

React + TypeScript · Vite · Tailwind CSS · Vercel serverless functions · Supabase (Postgres + real-time + row-level security) · Gmail API (OAuth 2.0) · GPT-4o-mini

---

This is a **solo project** — no team, no co-founder, no agency. Every decision, every bug, every feature — designed, built, and shipped by me alone. Full-stack, end-to-end.

If you're actively job hunting and want to try it, I'd love to have you as a beta tester. One thing to note: because the app is still in Google OAuth review, I have to manually add your email as a test user before you can sign in. So if you're interested, **drop your email in the comments or send me a DM** and I'll get you added.

It takes 30 seconds on my end — and your feedback would mean a lot at this stage.

---

#buildinpublic #jobsearch #careertips #AI #OpenAI #SaaS #React #Supabase #FullStackDeveloper #GPT4 #WebDevelopment #Stealeen #IndieHacker #MVP
