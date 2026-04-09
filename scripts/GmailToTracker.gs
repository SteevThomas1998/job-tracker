// ═══════════════════════════════════════════════════════════════════
//  Job Tracker — Gmail Automation
//  Get your personal pre-filled script from the app:
//  Click the email icon (✉) in the header → copy the script from there.
//
//  Manual setup (if needed):
//  1. Go to https://script.google.com → New project
//  2. Paste this file, fill in WEBHOOK_TOKEN from the app's Email Setup modal
//  3. Run markExistingEmailsAsProcessed() ONCE manually
//  4. Set trigger: runEvery15Minutes → Time-driven → Every 15 minutes
// ═══════════════════════════════════════════════════════════════════

// ── Configuration ────────────────────────────────────────────────────────
var CONFIG = {
  WEBHOOK_URL:   'https://job-tracker-seven-weld.vercel.app/api/ingest-email',
  WEBHOOK_TOKEN: 'PASTE_YOUR_PERSONAL_TOKEN_HERE', // copy from the app → email icon → Email Tracking Setup
};

// ── Gmail search query ────────────────────────────────────────────────────
var SEARCH_QUERY = [
  '(',
  '  subject:("thank you for applying" OR "your application" OR "job application" OR',
  '           "application received" OR "application submitted" OR "application success" OR',
  '           "application update" OR "applied for" OR',
  '           "interview" OR "job offer" OR "offer letter" OR "we reviewed your" OR',
  '           "next steps" OR "moving forward with your" OR "not moving forward" OR',
  '           "regret to inform" OR "unfortunately" OR "position has been filled" OR',
  '           "indeed application" OR "linkedin application")',
  '  OR',
  '  from:(greenhouse.io OR lever.co OR jobvite.com OR workday.com OR',
  '         myworkdayjobs.com OR icims.com OR taleo.net OR brassring.com OR',
  '         smartrecruiters.com OR ashbyhq.com OR rippling.com OR bamboohr.com OR',
  '         jazz.co OR recruitee.com OR pinpointhq.com OR indeed.com OR linkedin.com OR',
  '         seemehired.com OR occupop.com OR occupop-mail.com OR cezannehr.com OR',
  '         rezoomo.com OR sigmar.ie OR irishjobs.ie OR totaljobs.com OR reed.co.uk)',
  '  OR',
  '  ("thank you for your application" OR "thank you for your recent application" OR',
  '   "right fit for" OR "not progressing with your application" OR',
  '   "your application has been" OR "we have reviewed your application")',
  ')',
  '-subject:(visa OR "police certificate" OR "financial aid" OR passport OR',
  '          "police verification" OR coursera OR revolut OR ubisoft OR',
  '          "credit card" OR "bank account" OR insurance OR',
  '          newsletter OR digest OR "jobs you may like" OR "jobs based on" OR',
  '          "recommended jobs" OR "top jobs for you" OR "your weekly" OR',
  '          "people also viewed" OR "suggested jobs" OR "jobs near you")',
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
    var msg = messages[messages.length - 1];

    var options = {
      method:            'post',
      contentType:       'application/json',
      headers:           {},
      payload:           JSON.stringify({
        token:      CONFIG.WEBHOOK_TOKEN,
        message_id: msg.getId(),
        subject:    msg.getSubject(),
        from:       msg.getFrom(),
        body:       msg.getPlainBody().substring(0, 8000),
        date:       msg.getDate().toISOString(),
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

// ── One-time bootstrap ────────────────────────────────────────────────────
function markExistingEmailsAsProcessed() {
  var processedLabel  = getOrCreateLabel('job-tracker-processed');
  var bootstrapQuery  = SEARCH_QUERY.replace('-label:job-tracker-processed', '');
  var threads         = GmailApp.search(bootstrapQuery, 0, 500);

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
}
