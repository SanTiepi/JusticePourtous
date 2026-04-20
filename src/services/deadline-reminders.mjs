/**
 * Deadline Reminders — Cortex Phase 3
 *
 * Flow end-to-end (citoyen authentifié) :
 *
 *   1. Triage → fiche avec `delais` (ex: opposition commandement 10j)
 *   2. Si le case a un `linked_account_id` ET au moins un délai < 90j,
 *      on planifie automatiquement un reminder via `scheduleReminder(...)`
 *      (appelé depuis triage-orchestration ou citizen-account.linkCaseToAccount).
 *   3. Cron quotidien : `scripts/send-due-reminders.mjs`
 *        - charge `getDueReminders({ before: Date.now() + 48h })`
 *        - pour chaque : envoi email via Resend (RESEND_API_KEY en prod)
 *        - marque `markAsSent(reminder_id, { sent_at, result })`
 *        - output JSON stats (sent / skipped / errors)
 *   4. Endpoint admin `/api/admin/reminders` → liste paginée, account_ids masqués.
 *
 * Deux APIs cohabitent :
 *   - Legacy (plural) : `scheduleReminders(caseRec, contact)` extrait tous
 *     les délais d'un case et crée des rappels multi-niveaux. Utilisée par
 *     les routes HTTP `/api/case/:id/reminders/schedule`.
 *   - Nouvelle (singular) : `scheduleReminder({ account_id, case_id,
 *     due_date, titre, description })` — planification unitaire, côté
 *     citizen account longitudinal.
 *
 * Persistance : src/data/meta/scheduled-reminders.json via atomic-write.
 * Dry-run : `REMINDERS_DRY_RUN=1` sur le script d'envoi — n'appelle pas
 * Resend, log seulement.
 */

import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_STORE = join(__dirname, '..', 'data', 'meta', 'scheduled-reminders.json');

let STORE_PATH = process.env.REMINDERS_STORE_PATH || DEFAULT_STORE;

// ─── Severity thresholds ───────────────────────────────────────

const SEVERITY = Object.freeze({
  CRITICAL: 'critical', // < 7 days
  HIGH: 'high',         // < 30 days
  MEDIUM: 'medium',     // < 90 days
  LOW: 'low'            // >= 90 days
});
export { SEVERITY };

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Parsing délai_raw → jours ─────────────────────────────────

/**
 * Parse une chaîne "10 jours", "24h", "6 mois", "immédiat", "Aucun délai formel"
 * et retourne un nombre de jours (entier) ou null.
 */
export function parseDelaiRawToDays(delaiRaw) {
  if (!delaiRaw || typeof delaiRaw !== 'string') return null;
  const s = delaiRaw.toLowerCase().trim();

  // Pas de délai formel
  if (s.includes('aucun délai') || s.includes('pas de délai')) return null;

  // Immédiat / 24h / 48h
  if (s.includes('immédiat') || s.includes('immediat')) return 1;
  if (s.includes('24h') || /\b24\s*heures?\b/.test(s)) return 1;
  if (s.includes('48h') || /\b48\s*heures?\b/.test(s)) return 2;

  // Jours
  const mJours = s.match(/(\d+)\s*jours?/);
  if (mJours) return parseInt(mJours[1], 10);

  // Semaines
  const mSem = s.match(/(\d+)\s*semaines?/);
  if (mSem) return parseInt(mSem[1], 10) * 7;

  // Mois
  const mMois = s.match(/(\d+)\s*mois/);
  if (mMois) return parseInt(mMois[1], 10) * 30;

  // Années
  const mAns = s.match(/(\d+)\s*an(?:n[eé]es?)?s?/);
  if (mAns) return parseInt(mAns[1], 10) * 365;

  return null;
}

/**
 * Détermine la sévérité d'un délai en fonction du nombre de jours restants.
 */
export function severityFromDaysRemaining(daysRemaining) {
  if (daysRemaining == null) return SEVERITY.LOW;
  if (daysRemaining < 7) return SEVERITY.CRITICAL;
  if (daysRemaining < 30) return SEVERITY.HIGH;
  if (daysRemaining < 90) return SEVERITY.MEDIUM;
  return SEVERITY.LOW;
}

// ─── Extraction des délais d'un case ───────────────────────────

/**
 * Extrait tous les délais pertinents d'un caseRec.
 *
 * Sources :
 *  - caseRec.state.enriched_primary.delais[]        (format delai, procedure)
 *  - caseRec.state.enriched_primary.cascades[].etapes[].delai
 *  - caseRec.state.enriched_all[*].delais[]         (toutes fiches secondaires)
 *
 * Retourne une liste de :
 *   { procedure, delai_raw, days, delai_date_iso, days_remaining, severity,
 *     source_id?, base_legale?, consequence? }
 *
 * La date pivot ("dès quand court le délai") est :
 *   - caseRec.state.delai_reference_date_iso si présent
 *   - sinon caseRec.created_at
 */
export function extractDeadlinesFromCase(caseRec, now = Date.now()) {
  if (!caseRec || !caseRec.state) return [];

  const state = caseRec.state;
  const pivotMs = state.delai_reference_date_iso
    ? new Date(state.delai_reference_date_iso).getTime()
    : (caseRec.created_at || now);

  const out = [];
  const seen = new Set(); // dedup par procedure+delai_raw

  function pushDelai(rawProcedure, rawDelai, extra = {}) {
    const procedure = (rawProcedure || '').trim() || 'Délai juridique';
    const delaiRaw = (rawDelai || '').trim();
    if (!delaiRaw) return;
    const key = `${procedure}::${delaiRaw}`;
    if (seen.has(key)) return;
    seen.add(key);

    const days = parseDelaiRawToDays(delaiRaw);
    if (days == null) {
      // Sans parse possible, on liste quand même mais sans date ISO
      out.push({
        procedure,
        delai_raw: delaiRaw,
        days: null,
        delai_date_iso: null,
        days_remaining: null,
        severity: SEVERITY.LOW,
        ...extra
      });
      return;
    }

    const echeanceMs = pivotMs + days * DAY_MS;
    const daysRemaining = Math.ceil((echeanceMs - now) / DAY_MS);
    out.push({
      procedure,
      delai_raw: delaiRaw,
      days,
      delai_date_iso: new Date(echeanceMs).toISOString(),
      days_remaining: daysRemaining,
      severity: severityFromDaysRemaining(daysRemaining),
      ...extra
    });
  }

  // 1. enriched_primary.delais
  const primary = state.enriched_primary || {};
  for (const d of (primary.delais || [])) {
    pushDelai(d.procedure, d.delai, {
      source_id: d.source_id || null,
      base_legale: d.base_legale || null,
      consequence: d.consequence || null
    });
  }

  // 2. enriched_primary.cascades[].etapes[].delai
  for (const c of (primary.cascades || [])) {
    const label = c.nom || c.label || 'Cascade';
    for (const e of (c.etapes || [])) {
      if (!e?.delai) continue;
      pushDelai(`${label} — ${e.nom || e.label || 'étape'}`, e.delai, {
        source_id: e.source_id || null,
        base_legale: e.base_legale || null
      });
    }
  }

  // 3. enriched_all — autres fiches (typiquement 1-2 max)
  for (const fiche of (state.enriched_all || [])) {
    if (fiche === primary) continue;
    for (const d of (fiche?.delais || [])) {
      pushDelai(d.procedure, d.delai, {
        source_id: d.source_id || null,
        base_legale: d.base_legale || null,
        consequence: d.consequence || null
      });
    }
  }

  // Tri par urgence (days_remaining asc, null last)
  out.sort((a, b) => {
    const ar = a.days_remaining == null ? Infinity : a.days_remaining;
    const br = b.days_remaining == null ? Infinity : b.days_remaining;
    return ar - br;
  });

  return out;
}

// ─── Store des rappels ─────────────────────────────────────────

function loadStore() {
  const raw = safeLoadJSON(STORE_PATH);
  if (!raw || !Array.isArray(raw.reminders)) {
    return { reminders: [] };
  }
  return raw;
}

function saveStore(store) {
  const dir = dirname(STORE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  atomicWriteSync(STORE_PATH, JSON.stringify(store, null, 2));
}

/** Reset store — tests only. */
export function _resetRemindersForTests({ path } = {}) {
  if (path) STORE_PATH = path;
  try {
    // Always write an empty store (create if missing, overwrite if exists).
    saveStore({ reminders: [] });
  } catch { /* noop */ }
}

/** Retourne le chemin du store (tests). */
export function _getStorePath() {
  return STORE_PATH;
}

// ─── Scheduling logic ──────────────────────────────────────────

/**
 * Calcule les dates (ms absolues) de rappel pour un délai.
 * Règles :
 *  - daysRemaining < 7  → [maintenant, J-1]
 *  - daysRemaining < 30 → [J-7, J-1]
 *  - daysRemaining ≥ 30 → [J-14, J-1]
 * Filtre les rappels déjà passés.
 */
function computeReminderTimestamps(echeanceMs, now) {
  const daysRemaining = Math.ceil((echeanceMs - now) / DAY_MS);
  const all = [];
  if (daysRemaining < 7) {
    all.push(now); // immédiat
    all.push(echeanceMs - 1 * DAY_MS);
  } else if (daysRemaining < 30) {
    all.push(echeanceMs - 7 * DAY_MS);
    all.push(echeanceMs - 1 * DAY_MS);
  } else {
    all.push(echeanceMs - 14 * DAY_MS);
    all.push(echeanceMs - 1 * DAY_MS);
  }
  // Uniq + filtre passé (> now - 1min, on tolère le "juste maintenant")
  const threshold = now - 60 * 1000;
  const uniq = [...new Set(all.map(t => Math.round(t)))].filter(t => t >= threshold);
  return uniq.sort((a, b) => a - b);
}

/**
 * Planifie des rappels pour tous les délais d'un case.
 *
 * @param {object} caseRec
 * @param {string|null} emailOrPhone — destinataire (email, phone, ou null)
 * @param {object} [opts]
 * @param {number} [opts.now] — timestamp pour tests
 * @returns {{ scheduled: number, reminders: Array, skipped: number }}
 */
export function scheduleReminders(caseRec, emailOrPhone = null, { now = Date.now() } = {}) {
  if (!caseRec || !caseRec.case_id) {
    return { scheduled: 0, reminders: [], skipped: 0 };
  }
  const delais = extractDeadlinesFromCase(caseRec, now);
  const store = loadStore();
  const newReminders = [];
  let skipped = 0;

  for (const d of delais) {
    if (!d.delai_date_iso) { skipped++; continue; }
    const echeanceMs = new Date(d.delai_date_iso).getTime();
    if (Number.isNaN(echeanceMs)) { skipped++; continue; }
    const timestamps = computeReminderTimestamps(echeanceMs, now);
    if (timestamps.length === 0) { skipped++; continue; }

    for (const ts of timestamps) {
      const reminder = {
        reminder_id: randomBytes(8).toString('hex'),
        case_id: caseRec.case_id,
        procedure: d.procedure,
        delai_raw: d.delai_raw,
        delai_date_iso: d.delai_date_iso,
        reminder_at_iso: new Date(ts).toISOString(),
        reminder_at_ms: ts,
        severity: d.severity,
        contact: emailOrPhone || null,
        base_legale: d.base_legale || null,
        consequence: d.consequence || null,
        created_at_iso: new Date(now).toISOString(),
        sent: false,
        sent_at_iso: null
      };
      newReminders.push(reminder);
    }
  }

  store.reminders.push(...newReminders);
  saveStore(store);

  return {
    scheduled: newReminders.length,
    reminders: newReminders,
    skipped
  };
}

/**
 * Liste les rappels dus (échéance de rappel <= now + 24h, non envoyés).
 */
export function listDueReminders(now = Date.now()) {
  const store = loadStore();
  const horizon = now + 24 * 60 * 60 * 1000;
  return store.reminders
    .filter(r => !r.sent && r.reminder_at_ms <= horizon)
    .sort((a, b) => a.reminder_at_ms - b.reminder_at_ms);
}

/**
 * Liste tous les rappels d'un case (envoyés et non-envoyés).
 */
export function listRemindersForCase(case_id) {
  const store = loadStore();
  return store.reminders.filter(r => r.case_id === case_id);
}

/**
 * Marque un rappel comme envoyé.
 */
export function markReminderSent(reminder_id, sentAtMs = Date.now()) {
  const store = loadStore();
  const r = store.reminders.find(x => x.reminder_id === reminder_id);
  if (!r) return null;
  r.sent = true;
  r.sent_at_iso = new Date(sentAtMs).toISOString();
  saveStore(store);
  return r;
}

/**
 * Stats du store (tests / monitoring).
 */
export function getReminderStats() {
  const store = loadStore();
  const total = store.reminders.length;
  const sent = store.reminders.filter(r => r.sent).length;
  return {
    total,
    sent,
    pending: total - sent,
    due_now: listDueReminders().length
  };
}

// ─── Nouvelle API unitaire (citizen-account / triage auto-schedule) ──

/**
 * Planifie UN reminder unitaire. Utilisé quand le citoyen est authentifié
 * (compte longitudinal) et qu'on veut associer un délai à son account_id.
 *
 * Ne crée PAS de cascade de rappels (J-14/J-7/J-1) : ici on enregistre
 * l'échéance et on laissera le script d'envoi décider (horizon 48h).
 *
 * @param {object} params
 * @param {string} params.account_id
 * @param {string} params.case_id
 * @param {string|Date|number} params.due_date — ISO, Date, ou ms
 * @param {string} params.titre
 * @param {string} [params.description]
 * @param {string} [params.severity] — override (auto-calculée sinon)
 * @returns {string} reminder_id
 */
export function scheduleReminder({
  account_id,
  case_id,
  due_date,
  titre,
  description = '',
  severity = null
} = {}) {
  if (!account_id || typeof account_id !== 'string') {
    throw new Error('account_id requis');
  }
  if (!case_id || typeof case_id !== 'string') {
    throw new Error('case_id requis');
  }
  if (!titre || typeof titre !== 'string') {
    throw new Error('titre requis');
  }

  let dueMs;
  if (due_date instanceof Date) dueMs = due_date.getTime();
  else if (typeof due_date === 'number') dueMs = due_date;
  else if (typeof due_date === 'string') dueMs = new Date(due_date).getTime();
  else throw new Error('due_date invalide');
  if (Number.isNaN(dueMs)) throw new Error('due_date invalide');

  const now = Date.now();
  const daysRemaining = Math.ceil((dueMs - now) / DAY_MS);
  const computedSeverity = severity || severityFromDaysRemaining(daysRemaining);

  const reminder = {
    reminder_id: randomBytes(8).toString('hex'),
    account_id,
    case_id,
    procedure: titre,
    titre,
    description,
    delai_raw: description || titre,
    delai_date_iso: new Date(dueMs).toISOString(),
    due_date_iso: new Date(dueMs).toISOString(),
    due_date_ms: dueMs,
    // Pour compat avec listDueReminders legacy : on aligne reminder_at sur
    // due_date (le script d'envoi filtre par horizon = now + 48h).
    reminder_at_iso: new Date(dueMs).toISOString(),
    reminder_at_ms: dueMs,
    severity: computedSeverity,
    contact: null,
    base_legale: null,
    consequence: null,
    created_at_iso: new Date(now).toISOString(),
    sent: false,
    sent_at_iso: null,
    send_result: null
  };

  const store = loadStore();
  store.reminders.push(reminder);
  saveStore(store);
  return reminder.reminder_id;
}

/**
 * Retourne les reminders dont l'échéance ou la date de rappel tombe avant
 * `before` (par défaut now + 48h) ET qui ne sont pas encore envoyés.
 *
 * @param {object} [opts]
 * @param {number|Date|string} [opts.before] — default: now + 48h
 * @returns {Array}
 */
export function getDueReminders({ before } = {}) {
  let beforeMs;
  if (before == null) beforeMs = Date.now() + 48 * 60 * 60 * 1000;
  else if (before instanceof Date) beforeMs = before.getTime();
  else if (typeof before === 'number') beforeMs = before;
  else if (typeof before === 'string') beforeMs = new Date(before).getTime();
  else beforeMs = Date.now() + 48 * 60 * 60 * 1000;

  const store = loadStore();
  return store.reminders
    .filter(r => !r.sent)
    .filter(r => {
      const candidate = r.due_date_ms || r.reminder_at_ms;
      return typeof candidate === 'number' && candidate <= beforeMs;
    })
    .sort((a, b) => (a.due_date_ms || a.reminder_at_ms) - (b.due_date_ms || b.reminder_at_ms));
}

/**
 * Marque un reminder comme envoyé en attachant un résultat d'envoi.
 *
 * @param {string} reminder_id
 * @param {object} [opts]
 * @param {number|string|Date} [opts.sent_at]
 * @param {object} [opts.result] — { ok, provider, message_id?, error? }
 */
export function markAsSent(reminder_id, { sent_at = Date.now(), result = null } = {}) {
  const store = loadStore();
  const r = store.reminders.find(x => x.reminder_id === reminder_id);
  if (!r) return null;
  let sentAtMs;
  if (sent_at instanceof Date) sentAtMs = sent_at.getTime();
  else if (typeof sent_at === 'number') sentAtMs = sent_at;
  else if (typeof sent_at === 'string') sentAtMs = new Date(sent_at).getTime();
  else sentAtMs = Date.now();

  r.sent = true;
  r.sent_at_iso = new Date(sentAtMs).toISOString();
  if (result) r.send_result = result;
  saveStore(store);
  return r;
}

/**
 * Helper tests : retourne tous les reminders (clone) du store.
 */
export function _listRemindersForTests() {
  const store = loadStore();
  return store.reminders.map(r => ({ ...r }));
}

// ─── Auto-scheduling depuis un case triaged ────────────────────

/**
 * Auto-planifie des reminders pour un case lié à un compte citoyen.
 *
 * Règle : ne planifie QUE les délais < 90j (pas les "6 mois" etc.), et
 * UN reminder par délai (pas de cascade — c'est scheduleReminders qui fait ça).
 * Idempotent : si un reminder même (account_id, case_id, due_date, titre) existe
 * déjà, on skip.
 *
 * @param {object} caseRec — case-store record
 * @param {string} account_id
 * @param {object} [opts]
 * @returns {{ scheduled: number, skipped: number, reminder_ids: string[] }}
 */
export function autoScheduleRemindersForCase(caseRec, account_id, { maxDaysAhead = 90, now = Date.now() } = {}) {
  if (!caseRec || !account_id) return { scheduled: 0, skipped: 0, reminder_ids: [] };
  const deadlines = extractDeadlinesFromCase(caseRec, now);
  const store = loadStore();
  const existing = new Set(
    store.reminders
      .filter(r => r.account_id === account_id && r.case_id === caseRec.case_id)
      .map(r => `${r.procedure}::${r.due_date_iso || r.delai_date_iso}`)
  );

  const ids = [];
  let skipped = 0;

  for (const d of deadlines) {
    if (!d.delai_date_iso || d.days_remaining == null) { skipped++; continue; }
    if (d.days_remaining > maxDaysAhead) { skipped++; continue; }
    if (d.days_remaining < 0) { skipped++; continue; }
    const key = `${d.procedure}::${d.delai_date_iso}`;
    if (existing.has(key)) { skipped++; continue; }

    try {
      const id = scheduleReminder({
        account_id,
        case_id: caseRec.case_id,
        due_date: d.delai_date_iso,
        titre: d.procedure,
        description: [d.delai_raw, d.base_legale, d.consequence].filter(Boolean).join(' | '),
        severity: d.severity
      });
      ids.push(id);
    } catch {
      skipped++;
    }
  }

  return { scheduled: ids.length, skipped, reminder_ids: ids };
}

// ─── k-anonymization helper ────────────────────────────────────

/**
 * Masque un account_id pour les logs (k-anon). Garde les 4 premiers chars
 * et le reste devient ****.
 */
export function maskAccountId(account_id) {
  if (!account_id || typeof account_id !== 'string') return '****';
  if (account_id.length <= 4) return '****';
  return account_id.slice(0, 4) + '****';
}
