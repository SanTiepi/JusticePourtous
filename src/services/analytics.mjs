// Analytics service — lightweight in-memory counters persisted to file
// No external deps, flush to JSON every 5 minutes

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';
import { createLogger } from './logger.mjs';

const log = createLogger('analytics');
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'meta', 'analytics.json');

// Funnel events autorisés (allowlist stricte — tout autre nom est ignoré pour
// éviter la pollution / l'abus de l'endpoint public /api/track).
// 2a (haut-funnel) : home_view, input_focus, triage_submit, triage_result_rendered, triage_error
// 2b (profondeur, page résultat) : plan_viewed, step_expanded, letter_clicked, contact_clicked, feedback_submitted
const FUNNEL_EVENTS = new Set([
  'home_view', 'input_focus', 'triage_submit', 'triage_result_rendered', 'triage_error',
  'plan_viewed', 'step_expanded', 'letter_clicked', 'contact_clicked', 'feedback_submitted'
]);

// Fenêtre de corrélation par case_id (gate de sortie : ≥95% submit→result_rendered /7j)
const CASE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CASES = 5000; // borne anti-croissance (drop les plus vieux)

// In-memory counters
let stats = {
  pageViews: {},       // path → count
  searchCount: 0,
  premiumAnalysisCount: 0,
  languages: {},       // lang → count
  funnel: {},          // event name → count
  lastFlush: null,
  startedAt: new Date().toISOString()
};

// Corrélation par case_id (interne, jamais dumpée telle quelle ; pas de PII —
// le case_id est un identifiant aléatoire). caseId → { t, s, r, e } (timestamps).
let funnelCases = {};

// Load from file on startup
function loadFromFile() {
  const saved = safeLoadJSON(DATA_FILE);
  if (saved && typeof saved === 'object') {
    stats.pageViews = saved.pageViews || {};
    stats.searchCount = saved.searchCount || 0;
    stats.premiumAnalysisCount = saved.premiumAnalysisCount || 0;
    stats.languages = saved.languages || {};
    stats.funnel = saved.funnel || {};
    stats.lastFlush = saved.lastFlush || null;
    stats.startedAt = saved.startedAt || stats.startedAt;
    funnelCases = (saved._funnelCases && typeof saved._funnelCases === 'object') ? saved._funnelCases : {};
  }
}

loadFromFile();

// Flush to file
function flushToFile() {
  try {
    stats.lastFlush = new Date().toISOString();
    atomicWriteSync(DATA_FILE, JSON.stringify({ ...stats, _funnelCases: funnelCases }, null, 2));
  } catch (err) {
    log.error('flush_failed', { err: err.message });
  }
}

// Flush every 5 minutes (unref so tests can exit)
setInterval(flushToFile, 5 * 60 * 1000).unref();

// --- Helpers ---

function sanitizeCaseId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  return /^[a-zA-Z0-9_-]{1,64}$/.test(raw) ? raw : null;
}

function pruneCases(now) {
  const cutoff = now - CASE_WINDOW_MS;
  for (const id in funnelCases) {
    if (funnelCases[id].t < cutoff) delete funnelCases[id];
  }
  const ids = Object.keys(funnelCases);
  if (ids.length > MAX_CASES) {
    ids.sort((a, b) => funnelCases[a].t - funnelCases[b].t);
    const excess = ids.length - MAX_CASES;
    for (let i = 0; i < excess; i++) delete funnelCases[ids[i]];
  }
}

// --- Public API ---

export function trackPageView(path) {
  if (!path || typeof path !== 'string') return;
  stats.pageViews[path] = (stats.pageViews[path] || 0) + 1;
}

export function trackSearch() {
  stats.searchCount++;
}

export function trackPremiumAnalysis() {
  stats.premiumAnalysisCount++;
}

export function trackLanguage(lang) {
  if (!lang || typeof lang !== 'string') return;
  const clean = lang.slice(0, 10).toLowerCase();
  stats.languages[clean] = (stats.languages[clean] || 0) + 1;
}

// Funnel event (2a/2b). name doit être dans l'allowlist. caseId optionnel :
// quand présent, on corrèle submit→result_rendered/error par case pour la gate.
export function trackEvent(name, opts = {}) {
  if (!name || typeof name !== 'string' || !FUNNEL_EVENTS.has(name)) return;
  stats.funnel[name] = (stats.funnel[name] || 0) + 1;
  const caseId = sanitizeCaseId(opts.caseId);
  if (!caseId) return;
  const now = Date.now();
  const entry = funnelCases[caseId] || { t: now };
  if (name === 'triage_submit') entry.s = now;
  else if (name === 'triage_result_rendered') entry.r = now;
  else if (name === 'triage_error') entry.e = now;
  funnelCases[caseId] = entry;
  pruneCases(now);
}

// Métriques de corrélation pour la gate de sortie + dashboard.
export function getFunnelMetrics() {
  const now = Date.now();
  const cutoff = now - CASE_WINDOW_MS;
  let submits = 0, rendered = 0, erroredNoRender = 0;
  for (const id in funnelCases) {
    const c = funnelCases[id];
    if (c.t < cutoff) continue;
    if (c.s) {
      submits++;
      if (c.r) rendered++;
      else if (c.e) erroredNoRender++;
    }
  }
  return {
    window_days: 7,
    counters: { ...stats.funnel },
    triage_submitted: submits,
    triage_rendered: rendered,
    submit_to_render_rate: submits ? Math.round((rendered / submits) * 1000) / 1000 : null,
    triage_errored_no_render: erroredNoRender,
    cases_tracked: Object.keys(funnelCases).length
  };
}

export function getStats() {
  return {
    ...stats,
    funnelMetrics: getFunnelMetrics(),
    _snapshotAt: new Date().toISOString()
  };
}

// Flush on process exit (best effort)
process.on('beforeExit', flushToFile);

// Test-only: remet les compteurs à zéro sans toucher au fichier de persistance.
// Jamais appelé en prod.
export function _resetForTests() {
  stats = {
    pageViews: {},
    searchCount: 0,
    premiumAnalysisCount: 0,
    languages: {},
    funnel: {},
    lastFlush: null,
    startedAt: new Date().toISOString()
  };
  funnelCases = {};
}
