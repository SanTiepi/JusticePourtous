#!/usr/bin/env node
/**
 * send-due-reminders.mjs — Dispatch des rappels de délais dus.
 *
 * MVP : simule l'envoi via console.log. À brancher sur Resend (déjà dans
 * package.json) ou Twilio pour prod.
 *
 * Usage :
 *   node scripts/send-due-reminders.mjs [--dry-run] [--now=<iso>]
 */

import { listDueReminders, markReminderSent } from '../src/services/deadline-reminders.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const nowArg = args.find(a => a.startsWith('--now='));
const now = nowArg ? new Date(nowArg.slice('--now='.length)).getTime() : Date.now();

const due = listDueReminders(now);
console.log(`[send-due-reminders] ${due.length} rappel(s) dû(s) à ${new Date(now).toISOString()}`);

if (due.length === 0) process.exit(0);

let sent = 0;
let skipped = 0;
for (const r of due) {
  const target = r.contact || '(aucun contact enregistré)';
  const urgencyTag = r.severity === 'critical' ? '[CRITIQUE]'
    : r.severity === 'high' ? '[URGENT]'
    : r.severity === 'medium' ? '[À PRÉVOIR]'
    : '[INFO]';

  console.log(
    `${urgencyTag} ${r.procedure} — échéance ${r.delai_date_iso} — destinataire: ${target}` +
    (r.base_legale ? ` — base: ${r.base_legale}` : '') +
    ` — case: ${r.case_id} — reminder: ${r.reminder_id}`
  );

  if (dryRun) { skipped++; continue; }

  // Ici : brancher resend/twilio. Pour l'instant, on marque envoyé.
  markReminderSent(r.reminder_id, now);
  sent++;
}

console.log(`\n[send-due-reminders] ${sent} envoyé(s), ${skipped} simulé(s) (dry-run).`);
