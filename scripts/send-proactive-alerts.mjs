#!/usr/bin/env node
/**
 * Cortex Phase 3 — Proactive alerts cron.
 *
 * Scanne tous les comptes citoyens, collecte les deadline-reminders
 * dus pour chaque case lié, et simule l'envoi d'un rappel (email en prod
 * via Resend — ici uniquement log + marquage "sent").
 *
 * Log dans src/data/meta/sent-alerts-log.json.
 *
 * Usage :
 *   node scripts/send-proactive-alerts.mjs
 *
 * Recommandé en cron quotidien à 8h.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { atomicWriteSync, safeLoadJSON } from '../src/services/atomic-write.mjs';
import { _listAccounts, getAccount, decryptEmail } from '../src/services/citizen-account.mjs';
import { listDueReminders, markReminderSent } from '../src/services/deadline-reminders.mjs';
import { getCase } from '../src/services/case-store.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, '..', 'src', 'data', 'meta', 'sent-alerts-log.json');

function loadLog() {
  const raw = safeLoadJSON(LOG_PATH);
  if (!raw || !Array.isArray(raw.alerts)) return { alerts: [] };
  return raw;
}

function saveLog(log) {
  const dir = dirname(LOG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  atomicWriteSync(LOG_PATH, JSON.stringify(log, null, 2));
}

async function sendEmail(to, subject, body) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log(`[DEV] → ${to} | ${subject}\n${body}\n`);
    return { ok: true, mode: 'dev-console' };
  }
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    const from = process.env.FROM_EMAIL || 'JusticePourtous <noreply@justicepourtous.ch>';
    const { error } = await resend.emails.send({
      from, to, subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px">${body.replace(/\n/g, '<br>')}</div>`
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, mode: 'resend' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function run() {
  const started = Date.now();
  const log = loadLog();

  // Collecte tous les rappels dus (global)
  const dueReminders = listDueReminders();
  if (dueReminders.length === 0) {
    console.log('[send-proactive-alerts] aucun rappel dû.');
    return;
  }

  // Indexation case_id → account
  const caseToAccount = new Map();
  const accounts = _listAccounts();
  for (const { account_id } of accounts) {
    // accès direct au store interne : on passe par getCase(case_id).linked_account_id plutôt
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    const caseRec = getCase(reminder.case_id);
    if (!caseRec) { skipped++; continue; }
    if (!caseRec.linked_account_id) { skipped++; continue; }

    // Récupère l'email via account store
    const account = accounts.find(a => a.account_id === caseRec.linked_account_id);
    if (!account) { skipped++; continue; }

    // On a besoin de l'email — passer par le store direct
    // getAccount nécessite un session_token : on lit directement le store interne
    // via une ruse : on injecte un faux session (pas acceptable). Mieux : exposer un accessor.
    // Pour l'instant on utilise decryptEmail sur store persistant.
    const storePath = process.env.CITIZEN_ACCOUNTS_PATH
      || join(__dirname, '..', 'src', 'data', 'meta', 'citizen-accounts.json');
    const storeData = safeLoadJSON(storePath) || { accounts: {} };
    const fullAccount = storeData.accounts[caseRec.linked_account_id];
    if (!fullAccount) { skipped++; continue; }

    const email = decryptEmail(fullAccount.email_encrypted);
    if (!email) { skipped++; continue; }

    const prefs = fullAccount.preferences || {};
    if (prefs.reminders_enabled === false) { skipped++; continue; }

    const subject = `[JusticePourtous] Rappel : ${reminder.procedure} dans ${Math.max(0, Math.ceil((new Date(reminder.delai_date_iso).getTime() - Date.now()) / 86400000))} j`;
    const body = [
      `Bonjour,`,
      ``,
      `Vous avez un délai juridique important approchant :`,
      ``,
      `• Procédure : ${reminder.procedure}`,
      `• Échéance : ${reminder.delai_date_iso}`,
      `• Délai : ${reminder.delai_raw}`,
      reminder.base_legale ? `• Base légale : ${reminder.base_legale}` : null,
      reminder.consequence ? `• Conséquence si dépassé : ${reminder.consequence}` : null,
      ``,
      `Consultez votre dossier sur https://justicepourtous.ch/citizen`,
      ``,
      `— JusticePourtous (information juridique, pas un conseil d'avocat)`
    ].filter(Boolean).join('\n');

    const result = await sendEmail(email, subject, body);

    if (result.ok) {
      markReminderSent(reminder.reminder_id);
      log.alerts.push({
        reminder_id: reminder.reminder_id,
        account_id_hash: caseRec.linked_account_id.slice(0, 8) + '...',
        procedure: reminder.procedure,
        delai_date_iso: reminder.delai_date_iso,
        severity: reminder.severity,
        sent_at_iso: new Date().toISOString(),
        mode: result.mode
      });
      sent++;
    } else {
      console.error(`[send-proactive-alerts] échec: ${result.error}`);
      failed++;
    }
  }

  saveLog(log);

  const elapsed = Date.now() - started;
  console.log(`[send-proactive-alerts] sent=${sent} skipped=${skipped} failed=${failed} (${elapsed}ms)`);
}

run().catch(err => {
  console.error('[send-proactive-alerts] fatal:', err.message);
  process.exit(1);
});
