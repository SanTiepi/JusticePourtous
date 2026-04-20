#!/usr/bin/env node
/**
 * send-due-reminders.mjs — Dispatcher quotidien des rappels de délais.
 *
 * Flow :
 *   1. Charge tous les reminders dus dans les prochaines 48h, non envoyés.
 *   2. Pour chacun :
 *      - Résout l'email via citizen-account (decryptEmail du store)
 *      - Compose un email court (FR — TODO i18n via providers.mjs)
 *      - Envoie via Resend (RESEND_API_KEY) ou log en dev
 *      - Marque le reminder comme sent avec le résultat
 *   3. Output JSON stats sur stdout : { sent, skipped, errors, total, elapsed_ms }
 *
 * Modes :
 *   - REMINDERS_DRY_RUN=1   → pas d'envoi, log le payload qui serait envoyé
 *   - --dry-run             → équivalent CLI
 *   - --now=<iso>           → override now (tests)
 *   - --horizon-hours=48    → override horizon (default 48h)
 *
 * Usage :
 *   node scripts/send-due-reminders.mjs
 *   node scripts/send-due-reminders.mjs --dry-run
 *   REMINDERS_DRY_RUN=1 node scripts/send-due-reminders.mjs
 *
 * Les account_ids sont masqués dans les logs (k-anon : 4 premiers chars + ****).
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getDueReminders,
  markAsSent,
  maskAccountId
} from '../src/services/deadline-reminders.mjs';
import { safeLoadJSON } from '../src/services/atomic-write.mjs';
import { decryptEmail } from '../src/services/citizen-account.mjs';
import { getCase } from '../src/services/case-store.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Args ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRunArg = args.includes('--dry-run');
const dryRunEnv = process.env.REMINDERS_DRY_RUN === '1';
const DRY_RUN = dryRunArg || dryRunEnv;

const nowArg = args.find(a => a.startsWith('--now='));
const NOW = nowArg ? new Date(nowArg.slice('--now='.length)).getTime() : Date.now();

const horizonArg = args.find(a => a.startsWith('--horizon-hours='));
const HORIZON_HOURS = horizonArg ? parseInt(horizonArg.slice('--horizon-hours='.length), 10) : 48;
const BEFORE = NOW + HORIZON_HOURS * 60 * 60 * 1000;

// ─── Email resolution ──────────────────────────────────────────

const ACCOUNTS_PATH = process.env.CITIZEN_ACCOUNTS_PATH
  || join(__dirname, '..', 'src', 'data', 'meta', 'citizen-accounts.json');

function resolveEmailForAccount(account_id) {
  const store = safeLoadJSON(ACCOUNTS_PATH) || { accounts: {} };
  const account = store.accounts?.[account_id];
  if (!account) return null;
  if (account.preferences?.reminders_enabled === false) return null;
  return decryptEmail(account.email_encrypted);
}

// ─── Email composition (FR hard-coded — TODO i18n via providers.mjs) ──

/**
 * TODO i18n : quand compte citoyen expose `preferences.locale`, router via
 * src/services/i18n/providers.mjs avec templates FR/DE/IT/EN.
 */
function composeEmail(reminder, caseRec) {
  const dueDate = new Date(reminder.due_date_iso || reminder.delai_date_iso);
  const daysLeft = Math.max(0, Math.ceil((dueDate.getTime() - NOW) / (24 * 60 * 60 * 1000)));
  const urgencyLabel = {
    critical: 'URGENT',
    high: 'Important',
    medium: 'A prevoir',
    low: 'Info'
  }[reminder.severity] || 'Rappel';

  const ficheId = caseRec?.state?.enriched_primary?.fiche?.id || '';
  const ficheLink = ficheId
    ? `https://justicepourtous.ch/fiche.html?id=${encodeURIComponent(ficheId)}`
    : 'https://justicepourtous.ch/citizen';

  const subject = `[JusticePourtous] ${urgencyLabel} — ${reminder.titre || reminder.procedure} (${daysLeft}j)`;

  const textLines = [
    `Bonjour,`,
    ``,
    `Un délai juridique approche sur votre dossier :`,
    ``,
    `  • ${reminder.titre || reminder.procedure}`,
    `  • Échéance : ${dueDate.toISOString().slice(0, 10)} (dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''})`,
    reminder.description ? `  • Détail : ${reminder.description}` : null,
    reminder.base_legale ? `  • Base légale : ${reminder.base_legale}` : null,
    reminder.consequence ? `  • Conséquence si dépassé : ${reminder.consequence}` : null,
    ``,
    `Consulter la fiche et les étapes : ${ficheLink}`,
    `Votre espace : https://justicepourtous.ch/citizen`,
    ``,
    `— JusticePourtous`,
    `(Information juridique. Ne remplace pas un conseil d'avocat personnalisé.)`
  ].filter(Boolean);

  const text = textLines.join('\n');
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#1B1B1B">`
    + textLines.map(l => l ? l.replace(/</g, '&lt;') : '').join('<br>')
    + `</div>`;

  return { subject, text, html };
}

// ─── Resend sender ─────────────────────────────────────────────

async function sendViaResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true, reason: 'no_resend_key' };
  }
  const from = process.env.FROM_EMAIL || 'JusticePourtous <noreply@justicepourtous.ch>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: body.slice(0, 200) };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, provider: 'resend', message_id: data.id || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ─── Main loop ─────────────────────────────────────────────────

async function main() {
  const started = Date.now();
  const due = getDueReminders({ before: BEFORE });

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const details = [];

  for (const reminder of due) {
    const masked = maskAccountId(reminder.account_id || '');

    // Legacy reminders (sans account_id) : skip — le citoyen n'est pas authentifié.
    if (!reminder.account_id) {
      skipped++;
      details.push({ reminder_id: reminder.reminder_id, status: 'skipped', reason: 'no_account_id' });
      continue;
    }

    const email = resolveEmailForAccount(reminder.account_id);
    if (!email) {
      skipped++;
      details.push({ reminder_id: reminder.reminder_id, status: 'skipped', reason: 'no_email_or_disabled', account: masked });
      continue;
    }

    const caseRec = getCase(reminder.case_id);
    const payload = composeEmail(reminder, caseRec);

    if (DRY_RUN) {
      console.log(JSON.stringify({
        mode: 'dry-run',
        reminder_id: reminder.reminder_id,
        account: masked,
        to: email.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
        subject: payload.subject,
        severity: reminder.severity,
        due_date: reminder.due_date_iso || reminder.delai_date_iso,
      }));
      skipped++;
      details.push({ reminder_id: reminder.reminder_id, status: 'dry_run', account: masked });
      continue;
    }

    const result = await sendViaResend(email, payload.subject, payload.html);
    if (result.ok) {
      markAsSent(reminder.reminder_id, { sent_at: Date.now(), result });
      sent++;
      details.push({ reminder_id: reminder.reminder_id, status: 'sent', account: masked, provider: result.provider });
    } else if (result.skipped) {
      skipped++;
      details.push({ reminder_id: reminder.reminder_id, status: 'skipped', reason: result.reason, account: masked });
    } else {
      errors++;
      details.push({ reminder_id: reminder.reminder_id, status: 'error', error: result.error || 'unknown', account: masked });
    }
  }

  const stats = {
    sent,
    skipped,
    errors,
    total: due.length,
    dry_run: DRY_RUN,
    horizon_hours: HORIZON_HOURS,
    now_iso: new Date(NOW).toISOString(),
    elapsed_ms: Date.now() - started,
    details
  };

  console.log(JSON.stringify(stats, null, 2));
  return stats;
}

// Run when invoked directly (not when imported).
function isInvokedDirectly() {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  const normalized = argv1.replace(/\\/g, '/');
  return import.meta.url === `file://${argv1}` || import.meta.url.endsWith(normalized);
}

if (isInvokedDirectly()) {
  main().catch(err => {
    console.error(JSON.stringify({ fatal: err.message }));
    process.exit(1);
  });
}

export { main as runSendDueReminders, composeEmail };
