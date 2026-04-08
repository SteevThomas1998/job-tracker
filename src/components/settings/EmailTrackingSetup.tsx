import { useState } from 'react'
import { useWebhookToken } from '../../hooks/useWebhookToken'

const WEBHOOK_URL = 'https://job-tracker-seven-weld.vercel.app/api/ingest-email'

function buildScript(token: string): string {
  return `// ═══════════════════════════════════════════════════════════════════
//  Job Tracker — Gmail Automation
//  1. Go to https://script.google.com → New project
//  2. Paste this entire script (replace any existing code)
//  3. Run markExistingEmailsAsProcessed() ONCE manually
//  4. Set trigger: runEvery15Minutes → Time-driven → Every 15 minutes
// ═══════════════════════════════════════════════════════════════════

var CONFIG = {
  WEBHOOK_URL:   '${WEBHOOK_URL}',
  WEBHOOK_TOKEN: '${token}',
};

var SEARCH_QUERY = [
  '(',
  '  subject:(application OR "thank you for applying" OR "your application" OR',
  '           interview OR offer OR "next steps" OR "moving forward" OR',
  '           "unfortunately" OR "regret to inform" OR "not moving forward" OR',
  '           hired OR "job offer" OR "we reviewed")',
  '  OR',
  '  from:(greenhouse.io OR lever.co OR jobvite.com OR workday.com OR',
  '         myworkdayjobs.com OR icims.com OR taleo.net OR brassring.com OR',
  '         smartrecruiters.com OR ashbyhq.com OR rippling.com OR bamboohr.com OR',
  '         jazz.co OR recruitee.com OR pinpointhq.com)',
  ')',
  '-label:job-tracker-processed',
  'newer_than:7d',
].join(' ');

function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function runEvery15Minutes() {
  var processedLabel = getOrCreateLabel('job-tracker-processed');
  var errorLabel     = getOrCreateLabel('job-tracker-error');
  var threads = GmailApp.search(SEARCH_QUERY, 0, 50);
  Logger.log('Found ' + threads.length + ' thread(s) to process.');

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var msg = messages[messages.length - 1];

    var options = {
      method:             'post',
      contentType:        'application/json',
      headers:            {},
      payload:            JSON.stringify({
        token:   CONFIG.WEBHOOK_TOKEN,
        subject: msg.getSubject(),
        from:    msg.getFrom(),
        body:    msg.getPlainBody().substring(0, 8000),
        date:    msg.getDate().toISOString(),
      }),
      muteHttpExceptions: true,
    };

    try {
      var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
      var code = response.getResponseCode();
      if (code === 200) {
        Logger.log('OK: ' + msg.getSubject());
        thread.addLabel(processedLabel);
        thread.removeLabel(errorLabel);
      } else {
        Logger.log('ERROR ' + code + ': ' + msg.getSubject() + ' → ' + response.getContentText());
        thread.addLabel(errorLabel);
      }
    } catch (e) {
      Logger.log('EXCEPTION: ' + msg.getSubject() + ' → ' + e.toString());
      thread.addLabel(errorLabel);
    }
    Utilities.sleep(500);
  });
}

function markExistingEmailsAsProcessed() {
  var processedLabel = getOrCreateLabel('job-tracker-processed');
  var bootstrapQuery = SEARCH_QUERY.replace('-label:job-tracker-processed', '');
  var threads = GmailApp.search(bootstrapQuery, 0, 500);
  Logger.log('Marking ' + threads.length + ' existing thread(s) as processed...');
  threads.forEach(function(thread) { thread.addLabel(processedLabel); });
  Logger.log('Done. Only new emails will be processed going forward.');
}

// ── One-time bulk import of old emails (up to 1 year) ─────────────────────
// Run this manually, multiple times if needed, until it reports 0 threads found.
// Already-processed emails are skipped automatically via the label.
function importOldEmails() {
  var processedLabel = getOrCreateLabel('job-tracker-processed');
  var errorLabel     = getOrCreateLabel('job-tracker-error');

  var oldQuery = SEARCH_QUERY
    .replace('-label:job-tracker-processed', '')
    .replace('newer_than:7d', 'newer_than:365d')
    + ' -label:job-tracker-processed';

  var threads = GmailApp.search(oldQuery, 0, 50);
  Logger.log('Found ' + threads.length + ' unprocessed thread(s) to import.');

  if (threads.length === 0) {
    Logger.log('All done! No more old emails to import.');
    return;
  }

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var msg = messages[messages.length - 1];

    var options = {
      method:             'post',
      contentType:        'application/json',
      headers:            {},
      payload:            JSON.stringify({
        token:   CONFIG.WEBHOOK_TOKEN,
        subject: msg.getSubject(),
        from:    msg.getFrom(),
        body:    msg.getPlainBody().substring(0, 8000),
        date:    msg.getDate().toISOString(),
      }),
      muteHttpExceptions: true,
    };

    try {
      var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
      var code = response.getResponseCode();
      if (code === 200) {
        Logger.log('OK: ' + msg.getSubject());
        thread.addLabel(processedLabel);
        thread.removeLabel(errorLabel);
      } else {
        Logger.log('ERROR ' + code + ': ' + msg.getSubject() + ' → ' + response.getContentText());
        thread.addLabel(errorLabel);
      }
    } catch (e) {
      Logger.log('EXCEPTION: ' + msg.getSubject() + ' → ' + e.toString());
      thread.addLabel(errorLabel);
    }
    Utilities.sleep(500);
  });

  Logger.log('Batch done. Run importOldEmails() again if more remain.');
}`
}

export default function EmailTrackingSetup() {
  const { token, loading, regenerating, regenerate } = useWebhookToken()
  const [copied, setCopied] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  async function handleCopy() {
    if (!token) return
    await navigator.clipboard.writeText(buildScript(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setConfirmRegen(false)
    await regenerate()
  }

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">How it works</h3>
        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
          A Google Apps Script runs in your Gmail account every 15 minutes, detects job-related emails, and automatically adds them to your tracker. Your personal token below is pre-filled — just copy and paste.
        </p>
      </div>

      {/* Setup steps */}
      <ol className="space-y-3">
        {[
          { n: 1, text: 'Copy the Apps Script below' },
          { n: 2, text: 'Go to script.google.com → New project → paste the code' },
          { n: 3, text: 'Run markExistingEmailsAsProcessed() once (prevents duplicate entries)' },
          { n: 4, text: 'Set a trigger: runEvery15Minutes → Time-driven → Every 15 minutes' },
        ].map(({ n, text }) => (
          <li key={n} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">{n}</span>
            <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">{text}</span>
          </li>
        ))}
      </ol>

      {/* Script block */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Apps Script</span>
          <button
            onClick={handleCopy}
            disabled={loading || !token}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy script
              </>
            )}
          </button>
        </div>

        <div className="relative">
          {loading ? (
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <pre className="bg-gray-900 text-gray-100 text-xs rounded-xl p-4 overflow-auto max-h-64 leading-relaxed select-all">
              {token ? buildScript(token) : '// Token not available'}
            </pre>
          )}
        </div>
      </div>

      {/* Regenerate token */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Regenerating your token will invalidate your existing Apps Script. You'll need to copy and paste the new script.
        </p>
        {confirmRegen ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Are you sure?</span>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {regenerating ? 'Regenerating…' : 'Yes, regenerate'}
            </button>
            <button
              onClick={() => setConfirmRegen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRegen(true)}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Regenerate token
          </button>
        )}
      </div>
    </div>
  )
}
