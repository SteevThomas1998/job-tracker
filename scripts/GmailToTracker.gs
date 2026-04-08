// ═══════════════════════════════════════════════════════════════════
//  Job Tracker — Gmail Automation
//  1. Go to https://script.google.com → New project
//  2. Paste this file, fill in CONFIG
//  3. Run markExistingEmailsAsProcessed() ONCE manually
//  4. Set trigger: runEvery15Minutes → Time-driven → Every 15 minutes
// ═══════════════════════════════════════════════════════════════════

// ── Configuration ────────────────────────────────────────────────────────
var CONFIG = {
  WEBHOOK_URL:      'https://job-tracker-seven-weld.vercel.app/api/ingest-email',
  WEBHOOK_SECRET:   'PASTE_YOUR_SECRET_HERE',   // from EMAIL_WEBHOOK_SECRET env var
  SUPABASE_USER_ID: 'PASTE_YOUR_USER_UUID_HERE', // Supabase → Auth → Users → User UID
};

// ── Gmail search query ────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────
function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

// ── Main (attach this to the time-driven trigger) ─────────────────────────
function runEvery15Minutes() {
  var processedLabel = getOrCreateLabel('job-tracker-processed');
  var errorLabel     = getOrCreateLabel('job-tracker-error');

  var threads = GmailApp.search(SEARCH_QUERY, 0, 50);
  Logger.log('Found ' + threads.length + ' thread(s) to process.');

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var msg = messages[messages.length - 1]; // latest message in thread

    var payload = JSON.stringify({
      user_id: CONFIG.SUPABASE_USER_ID,
      subject: msg.getSubject(),
      from:    msg.getFrom(),
      body:    msg.getPlainBody().substring(0, 8000),
      date:    msg.getDate().toISOString(),
    });

    var options = {
      method:            'post',
      contentType:       'application/json',
      headers:           { 'x-webhook-secret': CONFIG.WEBHOOK_SECRET },
      payload:           payload,
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

    Utilities.sleep(500); // avoid Gmail API rate limits
  });
}

// ── One-time bootstrap ────────────────────────────────────────────────────
// Run this ONCE manually before activating the trigger.
// It labels all existing matching emails so they won't be reprocessed.
function markExistingEmailsAsProcessed() {
  var processedLabel  = getOrCreateLabel('job-tracker-processed');
  var bootstrapQuery  = SEARCH_QUERY.replace('-label:job-tracker-processed', '');
  var threads         = GmailApp.search(bootstrapQuery, 0, 500);

  Logger.log('Marking ' + threads.length + ' existing thread(s) as processed...');
  threads.forEach(function(thread) { thread.addLabel(processedLabel); });
  Logger.log('Done. Only new emails will be processed going forward.');
}
