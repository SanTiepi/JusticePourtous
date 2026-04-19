/**
 * Citizen Account — Cortex Phase 3 (dernière brique).
 *
 * Compte citoyen persistant sur 12 mois. Objectif : passer du triage
 * stateless 72h à une mémoire longitudinale (profil, cases historiques,
 * échéances, alertes proactives).
 *
 * Pattern : magic link (pas de mot de passe).
 *  1. createAccount(email, canton) → magic token (15 min)
 *  2. verifyMagicToken(token) → session token (90 jours)
 *  3. getAccount(session) → profil + cases + alertes
 *  4. linkCaseToAccount(session, case_id) → le case passe de 72h à 12 mois
 *
 * Persistance : src/data/meta/citizen-accounts.json (atomic-write debounced).
 *
 * LPD compliance :
 *  - email hashé (SHA256 + salt) pour le lookup
 *  - email chiffré (AES-256-GCM avec clé env) OU fallback clair en dev
 *    avec avertissement
 *  - closeAccount → wipe immédiat (anonymisation)
 */

import { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';
import {
  getCase,
  _linkCaseToAccount as caseStoreLink,
  exportCase
} from './case-store.mjs';
import { extractDeadlinesFromCase } from './deadline-reminders.mjs';
import { createLogger } from './logger.mjs';

const log = createLogger('citizen-account');
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(__dirname, '..', 'data', 'meta', 'citizen-accounts.json');

// ─── Constantes ───────────────────────────────────────────────

export const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000;                // 15 min
export const SESSION_TTL_MS     = 90 * 24 * 60 * 60 * 1000;       // 90 jours
export const ACCOUNT_TTL_MS     = 365 * 24 * 60 * 60 * 1000;      // 12 mois
export const LINKED_CASE_TTL_MS = ACCOUNT_TTL_MS;                  // 12 mois

let STORE_PATH = process.env.CITIZEN_ACCOUNTS_PATH || DEFAULT_PATH;

// ─── Crypto helpers ───────────────────────────────────────────

// Fix CRITIQUE review vague 2 : en prod, salt par défaut = rainbow table possible.
// Throw au chargement si NODE_ENV=production et CITIZEN_EMAIL_SALT manquant.
if (process.env.NODE_ENV === 'production' && !process.env.CITIZEN_EMAIL_SALT) {
  throw new Error(
    'CITIZEN_EMAIL_SALT env var is REQUIRED in production — ' +
    'fallback "jpt-dev-salt-change-me" rendrait les hashes email vulnérables. ' +
    'Générer : node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}
const EMAIL_SALT = process.env.CITIZEN_EMAIL_SALT || 'jpt-dev-salt-change-me';
const EMAIL_ENC_KEY_HEX = process.env.CITIZEN_EMAIL_ENC_KEY || null;

function hashEmail(email) {
  const normalized = String(email || '').toLowerCase().trim();
  return createHmac('sha256', EMAIL_SALT).update(normalized).digest('hex');
}

function encryptEmail(email) {
  const normalized = String(email || '').toLowerCase().trim();
  if (!EMAIL_ENC_KEY_HEX) {
    // Dev fallback : stocké en clair, préfixé pour distinguer.
    return 'plain:' + normalized;
  }
  try {
    const key = Buffer.from(EMAIL_ENC_KEY_HEX, 'hex');
    if (key.length !== 32) throw new Error('CITIZEN_EMAIL_ENC_KEY must be 32 bytes hex');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return 'gcm:' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + enc.toString('hex');
  } catch (err) {
    log.warn('encryption_failed_fallback_plain', { err: err.message });
    return 'plain:' + normalized;
  }
}

export function decryptEmail(payload) {
  if (!payload) return null;
  if (payload.startsWith('plain:')) return payload.slice(6);
  if (payload.startsWith('gcm:') && EMAIL_ENC_KEY_HEX) {
    try {
      const [, ivHex, tagHex, encHex] = payload.split(':');
      const key = Buffer.from(EMAIL_ENC_KEY_HEX, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const enc = Buffer.from(encHex, 'hex');
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
      return dec.toString('utf8');
    } catch {
      return null;
    }
  }
  return null;
}

// ─── Store ────────────────────────────────────────────────────

function emptyStore() {
  return { accounts: {}, magic_tokens: {}, sessions: {} };
}

let store = emptyStore();

function loadStore() {
  const raw = safeLoadJSON(STORE_PATH);
  if (!raw || typeof raw !== 'object') { store = emptyStore(); return; }
  store = {
    accounts: raw.accounts || {},
    magic_tokens: raw.magic_tokens || {},
    sessions: raw.sessions || {}
  };
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
    atomicWriteSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch {
    // silent — dev mode
  }
}

export function _flushCitizenAccounts() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  flushNow();
}

export function _resetCitizenAccountsForTests({ path } = {}) {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  store = emptyStore();
  if (path) STORE_PATH = path;
  try { if (existsSync(STORE_PATH)) unlinkSync(STORE_PATH); } catch { /* noop */ }
}

export function _getStorePath() {
  return STORE_PATH;
}

function newId(bytes = 16) {
  return randomBytes(bytes).toString('hex');
}

// ─── Cleanup expired tokens/sessions ──────────────────────────

function cleanupExpired(now = Date.now()) {
  let changed = false;
  for (const [tok, rec] of Object.entries(store.magic_tokens)) {
    if (!rec || now > rec.expires_at) { delete store.magic_tokens[tok]; changed = true; }
  }
  for (const [tok, rec] of Object.entries(store.sessions)) {
    if (!rec || now > rec.expires_at) { delete store.sessions[tok]; changed = true; }
  }
  if (changed) scheduleSave();
}

// ─── Lookup helpers ───────────────────────────────────────────

function findAccountByEmailHash(email_hash) {
  for (const acc of Object.values(store.accounts)) {
    if (acc.email_hash === email_hash) return acc;
  }
  return null;
}

function sessionToAccount(session_token) {
  if (!session_token) return null;
  const sess = store.sessions[session_token];
  if (!sess) return null;
  if (Date.now() > sess.expires_at) {
    delete store.sessions[session_token];
    scheduleSave();
    return null;
  }
  const acc = store.accounts[sess.account_id];
  if (!acc) return null;
  return acc;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Crée ou réutilise un compte citoyen. Retourne un magic token (15 min).
 * En prod : envoyer par email. En dev : retourné dans la réponse JSON.
 */
export function createAccount({ email, canton = null } = {}) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { error: 'email_invalid', status: 400 };
  }
  cleanupExpired();

  const email_hash = hashEmail(email);
  let account = findAccountByEmailHash(email_hash);
  const now = Date.now();

  if (!account) {
    const account_id = newId(16);
    account = {
      account_id,
      email_hash,
      email_encrypted: encryptEmail(email),
      canton: canton || null,
      profile: { situation_familiale: null, activite: null },
      created_at: new Date(now).toISOString(),
      last_login_at: null,
      expires_at: new Date(now + ACCOUNT_TTL_MS).toISOString(),
      cases: [],
      alerts: [],
      preferences: { reminders_enabled: true, reminder_channel: 'email' }
    };
    store.accounts[account_id] = account;
  } else {
    // mise à jour canton si fourni et absent
    if (canton && !account.canton) account.canton = canton;
    account.expires_at = new Date(now + ACCOUNT_TTL_MS).toISOString();
  }

  const magic_token = newId(24);
  const expires_at = now + MAGIC_TOKEN_TTL_MS;
  store.magic_tokens[magic_token] = {
    account_id: account.account_id,
    expires_at,
    created_at: now
  };

  scheduleSave();

  return {
    account_id: account.account_id,
    magic_token,
    expires_at,
    expires_at_iso: new Date(expires_at).toISOString()
  };
}

/**
 * Consomme un magic token, retourne une session (90j).
 * Le magic token est à usage unique.
 */
export function verifyMagicToken(token) {
  if (!token) return null;
  cleanupExpired();

  const rec = store.magic_tokens[token];
  if (!rec) return null;
  if (Date.now() > rec.expires_at) {
    delete store.magic_tokens[token];
    scheduleSave();
    return null;
  }

  const account = store.accounts[rec.account_id];
  if (!account) return null;

  // Consume the token
  delete store.magic_tokens[token];

  const session_token = newId(32);
  const now = Date.now();
  const expires_at = now + SESSION_TTL_MS;
  store.sessions[session_token] = {
    account_id: account.account_id,
    expires_at,
    created_at: now
  };
  account.last_login_at = new Date(now).toISOString();
  // Fenêtre 12 mois glissante : toute connexion repousse
  account.expires_at = new Date(now + ACCOUNT_TTL_MS).toISOString();

  scheduleSave();

  return {
    account_id: account.account_id,
    session_token,
    expires_at,
    expires_at_iso: new Date(expires_at).toISOString()
  };
}

/**
 * Retourne l'account complet via une session valide. null si invalide.
 */
export function getAccount(session_token) {
  const account = sessionToAccount(session_token);
  if (!account) return null;

  return {
    account_id: account.account_id,
    email: decryptEmail(account.email_encrypted),
    canton: account.canton,
    profile: { ...account.profile },
    created_at: account.created_at,
    last_login_at: account.last_login_at,
    expires_at: account.expires_at,
    cases: [...account.cases],
    alerts: [...account.alerts],
    preferences: { ...account.preferences }
  };
}

/**
 * Lie un case existant au compte. Étend son expires_at à 12 mois (via case-store).
 * Rejette si case introuvable ou déjà lié à un autre compte.
 */
export function linkCaseToAccount(session_token, case_id) {
  const account = sessionToAccount(session_token);
  if (!account) return { error: 'unauthorized', status: 401 };

  const caseRec = getCase(case_id);
  if (!caseRec) return { error: 'case_not_found', status: 404 };

  if (caseRec.linked_account_id && caseRec.linked_account_id !== account.account_id) {
    return { error: 'case_linked_to_other_account', status: 409 };
  }

  // Extension via case-store : 72h → 12 mois
  caseStoreLink(case_id, account.account_id, LINKED_CASE_TTL_MS);

  if (!account.cases.includes(case_id)) {
    account.cases.push(case_id);
  }

  scheduleSave();
  return {
    status: 200,
    case_id,
    account_id: account.account_id,
    linked: true,
    new_expires_at_ms: Date.now() + LINKED_CASE_TTL_MS
  };
}

/**
 * Timeline des cas d'un compte. Résistant aux cases expirés (filtre).
 * Input : account_id (server-side, après auth).
 */
export function listCasesByAccount(account_id) {
  const account = store.accounts[account_id];
  if (!account) return [];

  const out = [];
  for (const case_id of account.cases) {
    const exported = exportCase(case_id);
    if (!exported) {
      // case expiré / supprimé — skip silencieusement
      continue;
    }
    const raw = getCase(case_id);
    const texte = raw?.state?.texte_initial || '';
    const navigation = raw?.state?.navigation || {};
    const title = navigation.resume_situation
      || (texte.length > 80 ? texte.slice(0, 77) + '...' : texte)
      || 'Cas sans titre';

    // Prochaine échéance
    const delais = raw ? extractDeadlinesFromCase(raw) : [];
    const nextDeadline = delais.find(d => d.days_remaining != null && d.days_remaining >= 0) || null;

    out.push({
      case_id,
      title,
      created_at_iso: raw ? new Date(raw.created_at).toISOString() : null,
      status: exported.payment_gate.status,
      canton: exported.canton,
      rounds_done: exported.rounds_done,
      next_deadline: nextDeadline
        ? {
            procedure: nextDeadline.procedure,
            days_remaining: nextDeadline.days_remaining,
            delai_date_iso: nextDeadline.delai_date_iso,
            severity: nextDeadline.severity
          }
        : null
    });
  }

  // tri par date récente d'abord
  out.sort((a, b) => (b.created_at_iso || '').localeCompare(a.created_at_iso || ''));
  return out;
}

/**
 * Aggrège les délais à venir des cases du compte, triés par urgence.
 */
export function getUpcomingDeadlines(account_id, days_ahead = 30) {
  const account = store.accounts[account_id];
  if (!account) return [];

  const now = Date.now();
  const out = [];
  for (const case_id of account.cases) {
    const caseRec = getCase(case_id);
    if (!caseRec) continue;
    const delais = extractDeadlinesFromCase(caseRec, now);
    for (const d of delais) {
      if (d.days_remaining == null) continue;
      if (d.days_remaining < 0) continue;
      if (d.days_remaining > days_ahead) continue;
      out.push({
        case_id,
        procedure: d.procedure,
        delai_raw: d.delai_raw,
        delai_date_iso: d.delai_date_iso,
        days_remaining: d.days_remaining,
        severity: d.severity,
        base_legale: d.base_legale || null
      });
    }
  }
  out.sort((a, b) => a.days_remaining - b.days_remaining);
  return out;
}

/**
 * Ferme un compte. LPD : wipe immédiat — email_encrypted effacé,
 * cases dé-liés (redeviennent anonymes), sessions révoquées.
 */
export function closeAccount(session_token) {
  const account = sessionToAccount(session_token);
  if (!account) return { error: 'unauthorized', status: 401 };

  const account_id = account.account_id;

  // Révoque toutes les sessions du compte
  for (const [tok, sess] of Object.entries(store.sessions)) {
    if (sess.account_id === account_id) delete store.sessions[tok];
  }
  // Révoque tous les magic tokens
  for (const [tok, rec] of Object.entries(store.magic_tokens)) {
    if (rec.account_id === account_id) delete store.magic_tokens[tok];
  }

  // Anonymise
  account.email_encrypted = null;
  account.email_hash = 'anonymized:' + newId(8);
  account.canton = null;
  account.profile = {};
  account.cases = [];
  account.alerts = [];
  account.closed_at = new Date().toISOString();

  // Suppression complète
  delete store.accounts[account_id];
  scheduleSave();

  return { status: 200, closed: true, account_id };
}

// ─── Profile helpers (for future /api/citizen/profile PATCH) ──

export function updateProfile(session_token, patch = {}) {
  const account = sessionToAccount(session_token);
  if (!account) return { error: 'unauthorized', status: 401 };
  const allowed = ['situation_familiale', 'activite', 'canton'];
  for (const k of allowed) {
    if (k in patch) {
      if (k === 'canton') account.canton = patch.canton;
      else account.profile[k] = patch[k];
    }
  }
  scheduleSave();
  return { status: 200, profile: { ...account.profile }, canton: account.canton };
}

/** Alertes (lecture seule pour l'instant, écriture via cron script). */
export function addAlert(account_id, alert) {
  const account = store.accounts[account_id];
  if (!account) return null;
  const rec = {
    alert_id: newId(8),
    type: alert.type || 'generic',
    case_id: alert.case_id || null,
    text: alert.text || '',
    created_at: new Date().toISOString(),
    triggered_at: alert.triggered_at || null
  };
  account.alerts.push(rec);
  scheduleSave();
  return rec;
}

/** Liste interne — tests / admin. */
export function _listAccounts() {
  return Object.values(store.accounts).map(a => ({
    account_id: a.account_id,
    canton: a.canton,
    cases_count: a.cases.length,
    created_at: a.created_at
  }));
}

/** Résolution account_id par token de session (utile pour routes HTTP). */
export function resolveSession(session_token) {
  const account = sessionToAccount(session_token);
  if (!account) return null;
  return { account_id: account.account_id };
}

loadStore();
