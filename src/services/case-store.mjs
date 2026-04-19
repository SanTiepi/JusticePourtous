/**
 * Case Store — persistant 72h, remplace la Map session 30min en mémoire.
 *
 * Unité = "case" (un triage citoyen, potentiellement multi-rounds et multi-pivots).
 *
 * Garanties :
 * - TTL 72h glissant (toute activité repousse expires_at)
 * - case_id stable sur pivots (sauf overflow MAX_PIVOTS qui force un nouveau case)
 * - payment_gate (bootstrap / continuation_required / paid / locked)
 * - Audit rounds et pivots conservé pour analyse qualité
 * - Persistance disque atomique debounced 1s (réutilise atomic-write)
 *
 * Pas de logique métier ici — juste le stockage, les transitions d'état
 * et l'anti-abuse (pivots). Le triage-engine orchestre.
 */

import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(__dirname, '..', 'data', 'meta', 'cases.json');

export const CASE_TTL_MS = 72 * 60 * 60 * 1000;
export const MAX_PIVOTS = 3;

const GATE_STATES = Object.freeze({
  BOOTSTRAP: 'bootstrap',
  CONTINUATION_REQUIRED: 'continuation_required',
  PAID: 'paid',
  LOCKED: 'locked'
});
export { GATE_STATES };

let STORE_PATH = process.env.CASE_STORE_PATH || DEFAULT_PATH;
const cases = new Map();

function loadStore() {
  const entries = safeLoadJSON(STORE_PATH);
  if (!Array.isArray(entries)) return;
  cases.clear();
  for (const [id, c] of entries) cases.set(id, c);
}

let _saveTimer = null;
function scheduleSave() {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    flushNow();
  }, 1000);
}

function flushNow() {
  try {
    const dir = dirname(STORE_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const entries = [...cases.entries()];
    atomicWriteSync(STORE_PATH, JSON.stringify(entries, null, 2));
  } catch {
    // silent in dev, caller should not crash on disk issues
  }
}

/** Force flush (graceful shutdown, tests). */
export function _flushCases() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  flushNow();
}

/** Reset store to a clean state — tests only. */
export function _resetStoreForTests({ path } = {}) {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  cases.clear();
  if (path) STORE_PATH = path;
  try { if (existsSync(STORE_PATH)) unlinkSync(STORE_PATH); } catch { /* noop */ }
}

function newCaseId() {
  return randomBytes(16).toString('hex');
}

function isExpiredAt(caseObj, now) {
  return now > caseObj.expires_at;
}

/** Remove cases past their expires_at. Called opportunistically on each create. */
export function cleanupExpired(now = Date.now()) {
  let removed = 0;
  for (const [id, c] of cases) {
    if (isExpiredAt(c, now)) { cases.delete(id); removed++; }
  }
  if (removed) scheduleSave();
  return removed;
}

// ─── Periodic compaction ──────────────────────────────────────────
// `cleanupExpired` est appelé à la création d'un case mais un serveur
// busy sans nouveaux cases laisse les expirés gonfler la Map. L'interval
// ci-dessous garantit une passe régulière même sans traffic de création.

const COMPACTION_INTERVAL_MS = 10 * 60 * 1000;
let _compactionTimer = null;
const _compactionStats = {
  runs: 0,
  total_removed: 0,
  last_run_at: null,
  last_removed: 0,
};

export function startCompactionLoop({ intervalMs = COMPACTION_INTERVAL_MS } = {}) {
  if (_compactionTimer) return false;
  _compactionTimer = setInterval(() => {
    const removed = cleanupExpired();
    _compactionStats.runs++;
    _compactionStats.last_run_at = Date.now();
    _compactionStats.last_removed = removed;
    _compactionStats.total_removed += removed;
  }, intervalMs);
  _compactionTimer.unref?.();
  return true;
}

export function stopCompactionLoop() {
  if (!_compactionTimer) return false;
  clearInterval(_compactionTimer);
  _compactionTimer = null;
  return true;
}

export function getCompactionStats() {
  return {
    ..._compactionStats,
    active_cases: cases.size,
    loop_running: !!_compactionTimer,
  };
}

/**
 * Create a new case.
 * @param {object} init
 * @param {string} init.texte — initial user text
 * @param {string} [init.canton]
 * @param {object} [init.navigation] — LLM navigator output (optional at creation)
 * @param {object} [init.enrichedPrimary]
 * @param {Array} [init.enrichedAll]
 * @returns {{case_id, expires_at, payment_gate, resume_expires_at_iso}}
 */
export function createCase(init = {}) {
  cleanupExpired();
  const now = Date.now();
  const case_id = newCaseId();
  const expires_at = now + CASE_TTL_MS;
  const record = {
    case_id,
    created_at: now,
    last_activity_at: now,
    expires_at,
    linked_account_id: null,
    state: {
      texte_initial: init.texte || '',
      canton: init.canton || null,
      navigation: init.navigation || null,
      enriched_primary: init.enrichedPrimary || null,
      enriched_all: init.enrichedAll || [],
      rounds_done: 0,
      pivots_count: 0,
      assumptions: [],
      redacted_dimensions: []
    },
    payment_gate: {
      status: GATE_STATES.BOOTSTRAP,
      trial_round_done: false,
      paid_at: null,
      amount_paid_centimes: 0,
      wallet_session: null
    },
    audit: { rounds: [], pivots: [], locks: [] }
  };
  cases.set(case_id, record);
  scheduleSave();
  return {
    case_id,
    expires_at,
    resume_expires_at_iso: new Date(expires_at).toISOString(),
    payment_gate: { ...record.payment_gate }
  };
}

/** Get a case by id. Returns null if missing OR expired. */
export function getCase(case_id) {
  if (!case_id) return null;
  const c = cases.get(case_id);
  if (!c) return null;
  if (isExpiredAt(c, Date.now())) {
    cases.delete(case_id);
    scheduleSave();
    return null;
  }
  return c;
}

/** Bump last_activity_at and extend expires_at by TTL. No-op on missing/expired. */
export function touchCase(case_id) {
  const c = getCase(case_id);
  if (!c) return null;
  const now = Date.now();
  c.last_activity_at = now;
  c.expires_at = now + CASE_TTL_MS;
  scheduleSave();
  return { expires_at: c.expires_at };
}

/** Shallow-merge patch into state. */
export function updateCaseState(case_id, patch = {}) {
  const c = getCase(case_id);
  if (!c) return null;
  c.state = { ...c.state, ...patch };
  c.last_activity_at = Date.now();
  c.expires_at = c.last_activity_at + CASE_TTL_MS;
  scheduleSave();
  return c.state;
}

/** Record a completed round. Increments rounds_done, appends audit. */
export function recordRound(case_id, { questions = [], answers = {} } = {}) {
  const c = getCase(case_id);
  if (!c) return null;
  c.state.rounds_done = (c.state.rounds_done || 0) + 1;
  c.audit.rounds.push({
    n: c.state.rounds_done,
    questions,
    answers,
    at: Date.now()
  });
  c.last_activity_at = Date.now();
  c.expires_at = c.last_activity_at + CASE_TTL_MS;
  scheduleSave();
  return { rounds_done: c.state.rounds_done };
}

/**
 * Record a pivot (major change of case between rounds, cf. règle #10).
 * If pivots exceed MAX_PIVOTS, the current case is locked and a new one must be created.
 *
 * @returns {{forced_new: boolean, pivots_count: number, reason?: string}}
 */
export function recordPivot(case_id, { from_summary = null, to_summary = null } = {}) {
  const c = getCase(case_id);
  if (!c) return { forced_new: false, pivots_count: 0, error: 'case_not_found' };

  c.state.pivots_count = (c.state.pivots_count || 0) + 1;
  c.audit.pivots.push({ from_summary, to_summary, at: Date.now() });
  c.last_activity_at = Date.now();
  c.expires_at = c.last_activity_at + CASE_TTL_MS;

  if (c.state.pivots_count > MAX_PIVOTS) {
    c.payment_gate.status = GATE_STATES.LOCKED;
    c.audit.locks.push({ reason: 'max_pivots_exceeded', at: Date.now() });
    scheduleSave();
    return { forced_new: true, pivots_count: c.state.pivots_count, reason: 'max_pivots_exceeded' };
  }

  scheduleSave();
  return { forced_new: false, pivots_count: c.state.pivots_count };
}

/**
 * Advance the payment gate. Deterministic transitions only.
 *
 * Actions:
 * - 'complete_bootstrap_round'  : R1 delivered. If still incomplete → continuation_required.
 *                                 If the case is already paid, stays paid.
 * - 'mark_paid'                 : requires {wallet_session, amount_centimes}. Sets paid.
 * - 'lock'                      : requires {reason}. Sets locked.
 * - 'reset_to_bootstrap'        : internal, for new case promoted after pivot overflow (test support).
 */
export function advancePaymentGate(case_id, action, payload = {}) {
  const c = getCase(case_id);
  if (!c) return { error: 'case_not_found' };
  const g = c.payment_gate;

  switch (action) {
    case 'complete_bootstrap_round': {
      g.trial_round_done = true;
      if (g.status === GATE_STATES.BOOTSTRAP) g.status = GATE_STATES.CONTINUATION_REQUIRED;
      break;
    }
    case 'mark_paid': {
      if (g.status === GATE_STATES.LOCKED) return { error: 'case_locked' };
      g.status = GATE_STATES.PAID;
      g.paid_at = Date.now();
      g.amount_paid_centimes = payload.amount_centimes || 0;
      g.wallet_session = payload.wallet_session || null;
      break;
    }
    case 'lock': {
      g.status = GATE_STATES.LOCKED;
      c.audit.locks.push({ reason: payload.reason || 'unspecified', at: Date.now() });
      break;
    }
    case 'reset_to_bootstrap': {
      g.status = GATE_STATES.BOOTSTRAP;
      g.trial_round_done = false;
      break;
    }
    default:
      return { error: 'unknown_action', action };
  }

  c.last_activity_at = Date.now();
  c.expires_at = c.last_activity_at + CASE_TTL_MS;
  scheduleSave();
  return { payment_gate: { ...g } };
}

/**
 * Can this case proceed to a paid action (refine, deep analysis) right now ?
 * Returns reason codes for UI messaging.
 */
export function canProceed(case_id, { action = 'refine' } = {}) {
  const c = getCase(case_id);
  if (!c) return { ok: false, reason: 'case_not_found_or_expired' };
  const g = c.payment_gate;

  if (g.status === GATE_STATES.LOCKED) return { ok: false, reason: 'case_locked' };

  if (action === 'bootstrap') {
    return { ok: true };
  }
  if (action === 'refine' || action === 'deep_analysis') {
    if (g.status === GATE_STATES.PAID) return { ok: true };
    if (g.status === GATE_STATES.BOOTSTRAP) return { ok: true };
    if (g.status === GATE_STATES.CONTINUATION_REQUIRED) {
      return { ok: false, reason: 'payment_required', gate: g.status };
    }
  }
  return { ok: false, reason: 'unsupported_action' };
}

/** Snapshot a case for API output — strips internals. */
export function exportCase(case_id) {
  const c = getCase(case_id);
  if (!c) return null;
  return {
    case_id: c.case_id,
    expires_at: c.expires_at,
    resume_expires_at_iso: new Date(c.expires_at).toISOString(),
    rounds_done: c.state.rounds_done,
    pivots_count: c.state.pivots_count,
    canton: c.state.canton,
    payment_gate: { ...c.payment_gate },
    assumptions: [...(c.state.assumptions || [])],
    redacted_dimensions: [...(c.state.redacted_dimensions || [])]
  };
}

/** List active (non-expired) case ids — tests / debugging. */
export function _listActiveCases() {
  cleanupExpired();
  return [...cases.keys()];
}

/**
 * Lie un case à un compte citoyen et étend son expires_at.
 * Non-breaking : les cases non liés gardent CASE_TTL_MS (72h).
 * Appelé par citizen-account.mjs → linkCaseToAccount.
 *
 * @param {string} case_id
 * @param {string} account_id
 * @param {number} ttl_ms — nouvelle fenêtre (typiquement 12 mois)
 * @returns {{linked: boolean, new_expires_at?: number}}
 */
export function _linkCaseToAccount(case_id, account_id, ttl_ms) {
  const c = cases.get(case_id);
  if (!c) return { linked: false, error: 'case_not_found' };
  c.linked_account_id = account_id;
  const now = Date.now();
  c.last_activity_at = now;
  c.expires_at = now + (ttl_ms || CASE_TTL_MS);
  scheduleSave();
  return { linked: true, new_expires_at: c.expires_at };
}

loadStore();
