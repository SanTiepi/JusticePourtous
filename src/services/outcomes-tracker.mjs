/**
 * Outcomes Tracker — Cortex Phase 4 (le vrai data moat).
 *
 * Capture d'outcomes structurés et consentis :
 *   action faite → réponse reçue → issue → temps → satisfaction.
 *
 * Objectif (6 mois) : pouvoir dire à un citoyen
 *   "12 personnes similaires à toi ont obtenu X% de réduction
 *    en Y mois à VD".
 *
 * Garanties :
 *  - Append-only, atomic-write (réutilise atomic-write.mjs)
 *  - case_id JAMAIS stocké en clair (SHA256(case_id + salt))
 *  - Notes anonymisées : strip emails, téls suisses, adresses, noms propres
 *  - K-anonymity : getOutcomeStats refuse n < 5
 *  - consent_given doit être strictement true sinon refus (status 'no_consent')
 *  - Idempotence : un même case_id_hash + fiche_id ne crée qu'un seul outcome
 *    (mise à jour de l'existant si déjà présent — outcomes évoluent dans le temps)
 *
 * Pas de logique HTTP ici — module isolé, app.js / server.mjs câbleront plus tard.
 */

import { randomBytes, createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(__dirname, '..', 'data', 'meta', 'outcomes.json');
const INTENTS_PATH = join(__dirname, '..', 'data', 'meta', 'intents-catalog.json');

// ─── Constantes ────────────────────────────────────────────────

export const K_ANONYMITY_THRESHOLD = 5;
export const NOTES_MAX_LENGTH = 200;

const VALID_ACTIONS = new Set(['negotiated', 'went_court', 'abandoned', 'awaiting']);
const VALID_RESULTS = new Set(['won', 'partially_won', 'lost', 'settled', 'pending']);

// Salt pour hash case_id. En prod : OUTCOMES_HASH_SALT obligatoire.
if (process.env.NODE_ENV === 'production' && !process.env.OUTCOMES_HASH_SALT) {
  throw new Error(
    'OUTCOMES_HASH_SALT env var is REQUIRED in production — ' +
    'fallback "jpt-outcomes-dev-salt" rendrait les hashes case_id devinables. ' +
    'Générer : node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}
const HASH_SALT = process.env.OUTCOMES_HASH_SALT || 'jpt-outcomes-dev-salt';

let STORE_PATH = process.env.OUTCOMES_STORE_PATH || DEFAULT_PATH;

// ─── Hash helpers ──────────────────────────────────────────────

function hashCaseId(case_id) {
  return createHash('sha256').update(String(case_id) + ':' + HASH_SALT).digest('hex');
}

function newOutcomeId() {
  return randomBytes(8).toString('hex'); // hex16
}

// ─── Anonymisation ─────────────────────────────────────────────

/**
 * Strip PII from free-text notes.
 *  - emails (foo@bar.tld)
 *  - téléphones suisses (+41 ..., 0XX ..., formats variés)
 *  - adresses (rue/route/avenue/chemin/place + numéro)
 *  - codes postaux suisses (4 chiffres) + ville en majuscule
 *  - noms propres "Prénom Nom" (deux tokens capitalisés consécutifs)
 *
 * Tronque à NOTES_MAX_LENGTH chars. Toujours retourne string (jamais null).
 */
export function anonymizeNotes(text) {
  if (text == null) return '';
  let s = String(text);

  // Emails
  s = s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted]');

  // Téléphones suisses : +41 78 123 45 67, 0041 ..., 078 123 45 67, etc.
  // On capture aussi formats compactés.
  s = s.replace(/(?:\+|00)\s*41[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g, '[redacted]');
  s = s.replace(/\b0\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, '[redacted]');

  // Adresses : "rue/route/avenue/chemin/place/boulevard/impasse/quai + nom + numéro"
  // Ex: "rue de Lausanne 12", "avenue du Léman 45b"
  s = s.replace(
    /\b(?:rue|route|avenue|chemin|place|boulevard|impasse|quai|allée|allee|ruelle|esplanade)\s+[^\n,.;]{2,60}?\s+\d+[a-zA-Z]?\b/gi,
    '[redacted]'
  );

  // Codes postaux suisses + ville (1003 Lausanne, 1290 Versoix)
  s = s.replace(/\b[1-9]\d{3}\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ-]+(?:[\s-][A-ZÀ-Ý][A-Za-zÀ-ÿ-]+)*\b/g, '[redacted]');

  // Noms propres "Prénom Nom" (Mme/M./Maître + Nom OU Prénom + Nom)
  // Préfixes de civilité d'abord (capture plus large).
  s = s.replace(
    /\b(?:M\.|Mme|Mlle|Maître|Me|Dr\.?|Prof\.?)\s+[A-ZÀ-Ý][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ-]+)?/g,
    '[redacted]'
  );
  // Deux tokens capitalisés consécutifs (Jean Dupont, Marie-Claire Müller)
  // On évite de strip les débuts de phrase isolés en exigeant DEUX tokens.
  s = s.replace(
    /\b[A-ZÀ-Ý][a-zà-ÿ-]{1,30}\s+[A-ZÀ-Ý][a-zà-ÿ-]{2,30}\b/g,
    '[redacted]'
  );

  // Compactage des [redacted] adjacents
  s = s.replace(/\[redacted\](\s+\[redacted\])+/g, '[redacted]');

  // Normalisation espaces
  s = s.replace(/\s+/g, ' ').trim();

  // Troncature finale
  if (s.length > NOTES_MAX_LENGTH) {
    s = s.slice(0, NOTES_MAX_LENGTH - 1).trimEnd() + '…';
  }
  return s;
}

// ─── Store ─────────────────────────────────────────────────────

function emptyStore() {
  return { outcomes: [] };
}

let store = emptyStore();
let _intentsByFiche = null;

function loadIntents() {
  if (_intentsByFiche) return _intentsByFiche;
  _intentsByFiche = new Map();
  const raw = safeLoadJSON(INTENTS_PATH);
  if (!Array.isArray(raw)) return _intentsByFiche;
  for (const intent of raw) {
    if (!intent?.id) continue;
    const fiches = Array.isArray(intent.fiches_associees) ? intent.fiches_associees : [];
    for (const fiche_id of fiches) {
      // Premier intent rencontré pour une fiche gagne (catalog est ordonné)
      if (!_intentsByFiche.has(fiche_id)) {
        _intentsByFiche.set(fiche_id, intent.id);
      }
    }
  }
  return _intentsByFiche;
}

function lookupIntentId(fiche_id) {
  const m = loadIntents();
  return m.get(fiche_id) || null;
}

function loadStore() {
  const raw = safeLoadJSON(STORE_PATH);
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.outcomes)) {
    store = emptyStore();
    return;
  }
  store = { outcomes: raw.outcomes };
}

let _saveTimer = null;
function scheduleSave() {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    flushNow();
  }, 500);
}

function flushNow() {
  try {
    const dir = dirname(STORE_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    atomicWriteSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch {
    // silent in dev
  }
}

export function _flushOutcomes() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  flushNow();
}

export function _resetOutcomesForTests({ path } = {}) {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  store = emptyStore();
  if (path) STORE_PATH = path;
  try { if (existsSync(STORE_PATH)) unlinkSync(STORE_PATH); } catch { /* noop */ }
}

export function _getOutcomesPath() {
  return STORE_PATH;
}

export function _resetIntentsCache() {
  _intentsByFiche = null;
}

// ─── Validation ────────────────────────────────────────────────

function validateInput(input) {
  if (!input || typeof input !== 'object') {
    return { error: 'invalid_input' };
  }
  if (input.consent_given !== true) {
    return { error: 'no_consent' };
  }
  if (!input.case_id || typeof input.case_id !== 'string') {
    return { error: 'case_id_required' };
  }
  if (!input.fiche_id || typeof input.fiche_id !== 'string') {
    return { error: 'fiche_id_required' };
  }
  if (!input.domaine || typeof input.domaine !== 'string') {
    return { error: 'domaine_required' };
  }
  if (input.action_taken && !VALID_ACTIONS.has(input.action_taken)) {
    return { error: 'action_invalid' };
  }
  if (input.result && !VALID_RESULTS.has(input.result)) {
    return { error: 'result_invalid' };
  }
  if (input.satisfaction != null) {
    const s = Number(input.satisfaction);
    if (!Number.isFinite(s) || s < 1 || s > 5) {
      return { error: 'satisfaction_out_of_range' };
    }
  }
  if (input.duration_weeks != null) {
    const d = Number(input.duration_weeks);
    if (!Number.isFinite(d) || d < 0 || d > 1040) { // 20 ans max
      return { error: 'duration_invalid' };
    }
  }
  if (input.cost_chf != null) {
    const c = Number(input.cost_chf);
    if (!Number.isFinite(c) || c < 0) {
      return { error: 'cost_invalid' };
    }
  }
  return null;
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Enregistre un outcome.
 * @returns {{outcome_id, status}} status ∈ {'recorded','updated','no_consent','invalid'}
 */
export function recordOutcome({
  case_id,
  fiche_id,
  domaine,
  canton = null,
  consent_given = false,
  action_taken = 'awaiting',
  result = 'pending',
  duration_weeks = null,
  cost_chf = null,
  satisfaction = null,
  notes_anonymized = ''
} = {}) {
  const err = validateInput({
    case_id, fiche_id, domaine, consent_given,
    action_taken, result, duration_weeks, cost_chf, satisfaction
  });
  if (err) {
    return { outcome_id: null, status: err.error };
  }

  const case_id_hash = hashCaseId(case_id);
  const intent_id = lookupIntentId(fiche_id);

  // Idempotence : un seul outcome par (case_id_hash, fiche_id).
  // Si déjà présent → update (pas de doublon).
  const existing = store.outcomes.find(
    o => o.case_id_hash === case_id_hash && o.fiche_id === fiche_id
  );

  const cleanedNotes = anonymizeNotes(notes_anonymized || '');

  if (existing) {
    existing.action_taken = action_taken;
    existing.result = result;
    existing.duration_weeks = duration_weeks != null ? Number(duration_weeks) : existing.duration_weeks;
    existing.cost_chf = cost_chf != null ? Number(cost_chf) : existing.cost_chf;
    existing.satisfaction = satisfaction != null ? Number(satisfaction) : existing.satisfaction;
    existing.notes_anonymized = cleanedNotes;
    existing.updated_at = new Date().toISOString();
    existing.canton = canton || existing.canton;
    scheduleSave();
    return { outcome_id: existing.outcome_id, status: 'updated' };
  }

  const outcome = {
    outcome_id: newOutcomeId(),
    created_at: new Date().toISOString(),
    case_id_hash,
    fiche_id,
    intent_id,
    domaine,
    canton: canton || null,
    action_taken,
    result,
    duration_weeks: duration_weeks != null ? Number(duration_weeks) : null,
    cost_chf: cost_chf != null ? Number(cost_chf) : null,
    satisfaction: satisfaction != null ? Number(satisfaction) : null,
    notes_anonymized: cleanedNotes
  };

  store.outcomes.push(outcome);
  scheduleSave();

  return { outcome_id: outcome.outcome_id, status: 'recorded' };
}

// ─── Aggregation helpers ───────────────────────────────────────

function median(values) {
  const arr = values.filter(v => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (arr.length === 0) return null;
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) return (arr[mid - 1] + arr[mid]) / 2;
  return arr[mid];
}

function mean(values) {
  const arr = values.filter(v => v != null && Number.isFinite(v));
  if (arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round((sum / arr.length) * 100) / 100;
}

function aggregate(outcomes) {
  const by_result = {};
  for (const o of outcomes) {
    const k = o.result || 'unknown';
    by_result[k] = (by_result[k] || 0) + 1;
  }
  const by_action = {};
  for (const o of outcomes) {
    const k = o.action_taken || 'unknown';
    by_action[k] = (by_action[k] || 0) + 1;
  }
  return {
    total: outcomes.length,
    by_result,
    by_action,
    median_duration_weeks: median(outcomes.map(o => o.duration_weeks)),
    median_cost_chf: median(outcomes.map(o => o.cost_chf)),
    mean_satisfaction: mean(outcomes.map(o => o.satisfaction))
  };
}

/**
 * Stats par intent_id (lookup via intents-catalog).
 * Pas de gate k-anonymity ici (utilisé en interne / debug).
 * Les routes publiques DOIVENT passer par getOutcomeStats().
 */
export function getOutcomesByIntent(intent_id) {
  if (!intent_id) return null;
  const matched = store.outcomes.filter(o => o.intent_id === intent_id);
  if (matched.length === 0) {
    return { intent_id, total: 0, by_result: {}, by_action: {},
      median_duration_weeks: null, median_cost_chf: null, mean_satisfaction: null };
  }
  return { intent_id, ...aggregate(matched) };
}

/**
 * Stats agrégées avec garde-fou k-anonymity.
 * Retourne null si l'échantillon < min_n (défaut 5).
 *
 * Filtres optionnels : domaine, canton, fiche_id, intent_id.
 */
export function getOutcomeStats({
  domaine = null,
  canton = null,
  fiche_id = null,
  intent_id = null,
  min_n = K_ANONYMITY_THRESHOLD
} = {}) {
  let matched = store.outcomes.slice();
  if (domaine) matched = matched.filter(o => o.domaine === domaine);
  if (canton) matched = matched.filter(o => o.canton === canton);
  if (fiche_id) matched = matched.filter(o => o.fiche_id === fiche_id);
  if (intent_id) matched = matched.filter(o => o.intent_id === intent_id);

  if (matched.length < min_n) {
    return null;
  }

  return {
    n: matched.length,
    domaine,
    canton,
    fiche_id,
    intent_id,
    ...aggregate(matched)
  };
}

/**
 * Liste interne — tests / scripts uniquement.
 * Retourne les outcomes bruts (déjà anonymisés au stockage).
 */
export function _listOutcomes() {
  return store.outcomes.slice();
}

/**
 * Snapshot complet du store (pour reporting). Anonymisé par construction.
 */
export function snapshotStore() {
  return { outcomes: store.outcomes.slice() };
}

loadStore();
