/**
 * Deadline Reminders — Cortex Phase 3
 *
 * Extrait les délais juridiques d'un cas (enriched_primary.delais, cascades),
 * les convertit en dates ISO absolues, calcule la sévérité et planifie
 * des rappels multi-niveaux.
 *
 * Pas d'envoi d'email/SMS ici — uniquement la logique de scheduling. Un script
 * externe (scripts/send-due-reminders.mjs) consomme listDueReminders() pour
 * simuler / exécuter l'envoi.
 *
 * Persistance : src/data/meta/scheduled-reminders.json via atomic-write.
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
    if (existsSync(STORE_PATH)) {
      // Overwrite with empty store
      saveStore({ reminders: [] });
    }
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
