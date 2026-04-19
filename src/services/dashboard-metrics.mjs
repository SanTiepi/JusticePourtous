/**
 * Dashboard Metrics — Agrégation santé produit en un coup d'œil
 *
 * Expose `computeDashboardMetrics()` qui lit à la demande :
 *   - le catalogue d'intents (coverage)
 *   - les fiches (quality + freshness + actionability)
 *   - le registre de sources (source_id coverage)
 *   - le normative compiler (total_rules)
 *   - les fichiers de tests (total_tests)
 *   - analytics.json (safety signals 7j)
 *
 * Constitution : jamais de mutation, lecture seule. Pas de frameworks,
 * pas de dépendances externes. Temps cible : < 500ms.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getAllFiches } from './fiches.mjs';
import { computeFreshness } from './freshness-badge.mjs';
import { getRegistryStats, getSourceByRef } from './source-registry.mjs';
import { getAllArticles } from './donnees-juridiques.mjs';
import { ALL_RULES } from './normative-compiler.mjs';
import { safeLoadJSON } from './atomic-write.mjs';
// Fedlex diff (Cortex Phase 2) — intégration non-breaking : si le script/log
// n'existe pas encore, on expose un summary neutre.
import { getDashboardSummary as getFedlexDiffSummary } from '../../scripts/fedlex-daily-diff.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const META_DIR = join(DATA_DIR, 'meta');
const TEST_DIR = join(__dirname, '..', '..', 'test');

// Poids qualité par état de couverture (voir spec)
const QUALITY_WEIGHTS = {
  complete: 1.0,
  partial: 0.5,
  stub: 0.2,
  missing: 0.0
};

// ─── Helpers ────────────────────────────────────────────────────

function pct(num, den) {
  if (!den || den <= 0) return 0;
  return Math.round((num / den) * 100);
}

function safeArrayLen(v) {
  return Array.isArray(v) ? v.length : 0;
}

function hasCascade(fiche) {
  if (!fiche?.cascades) return false;
  if (Array.isArray(fiche.cascades)) return fiche.cascades.length > 0;
  if (typeof fiche.cascades === 'object') return Object.keys(fiche.cascades).length > 0;
  return false;
}

function hasTemplate(fiche) {
  if (!fiche) return false;
  // Un template peut être : reponse.modeleLettre, reponse.templates, fiche.template, etc.
  if (fiche.reponse?.modeleLettre) return true;
  if (Array.isArray(fiche.reponse?.templates) && fiche.reponse.templates.length > 0) return true;
  if (fiche.modeleLettre) return true;
  if (Array.isArray(fiche.templates) && fiche.templates.length > 0) return true;
  return false;
}

function hasJurisprudence(fiche) {
  if (!fiche) return false;
  if (Array.isArray(fiche.reponse?.jurisprudence) && fiche.reponse.jurisprudence.length > 0) return true;
  if (Array.isArray(fiche.jurisprudence) && fiche.jurisprudence.length > 0) return true;
  return false;
}

// ─── Coverage (depuis intents-catalog.json) ─────────────────────

function computeCoverage() {
  const catalogPath = join(META_DIR, 'intents-catalog.json');
  const intents = safeLoadJSON(catalogPath);

  if (!Array.isArray(intents)) {
    return {
      total_intents: 0,
      complete_intents: 0,
      partial_intents: 0,
      stub_intents: 0,
      missing_intents: 0,
      quality_percent: 0,
      by_domain: {}
    };
  }

  let complete = 0, partial = 0, stub = 0, missing = 0;
  const byDomain = {};

  for (const intent of intents) {
    const state = intent.etat_couverture || 'missing';
    if (state === 'complete') complete++;
    else if (state === 'partial') partial++;
    else if (state === 'stub') stub++;
    else missing++;

    const domaines = Array.isArray(intent.domaines) ? intent.domaines : [];
    // On rattache à chaque domaine (un intent peut toucher plusieurs domaines,
    // mais dans 99 % des cas il n'y en a qu'un).
    for (const d of domaines) {
      if (!byDomain[d]) {
        byDomain[d] = { total: 0, complete: 0, partial: 0, stub: 0, missing: 0, quality_percent: 0 };
      }
      byDomain[d].total++;
      if (state === 'complete') byDomain[d].complete++;
      else if (state === 'partial') byDomain[d].partial++;
      else if (state === 'stub') byDomain[d].stub++;
      else byDomain[d].missing++;
    }
  }

  // Quality = Σ weight(state) × count / total × 100
  const weightedSum = complete * QUALITY_WEIGHTS.complete
    + partial * QUALITY_WEIGHTS.partial
    + stub * QUALITY_WEIGHTS.stub;
  const quality_percent = intents.length > 0
    ? Math.round((weightedSum / intents.length) * 100)
    : 0;

  for (const d of Object.keys(byDomain)) {
    const bd = byDomain[d];
    const ws = bd.complete * QUALITY_WEIGHTS.complete
      + bd.partial * QUALITY_WEIGHTS.partial
      + bd.stub * QUALITY_WEIGHTS.stub;
    bd.quality_percent = bd.total > 0 ? Math.round((ws / bd.total) * 100) : 0;
  }

  return {
    total_intents: intents.length,
    complete_intents: complete,
    partial_intents: partial,
    stub_intents: stub,
    missing_intents: missing,
    quality_percent,
    by_domain: byDomain
  };
}

// ─── Quality (fiches + articles + rules + tests) ────────────────

function computeQuality() {
  const fiches = getAllFiches();
  const total_fiches = fiches.length;

  let withCascades = 0, withTemplate = 0, withJuris = 0;
  for (const f of fiches) {
    if (hasCascade(f)) withCascades++;
    if (hasTemplate(f)) withTemplate++;
    if (hasJurisprudence(f)) withJuris++;
  }

  // Articles: total + % résolus dans le source-registry
  let total_articles = 0;
  let articles_with_source_id = 0;
  try {
    const allArt = getAllArticles();
    const list = allArt?.data?.articles || [];
    total_articles = list.length;
    for (const a of list) {
      if (a.source_id || getSourceByRef(a.ref)) articles_with_source_id++;
    }
  } catch {
    // degraded mode
  }

  const total_rules = Array.isArray(ALL_RULES) ? ALL_RULES.length : 0;

  // Tests : compte `it(` et `test(` dans test/*.test.mjs
  const total_tests = countTests();

  return {
    total_fiches,
    fiches_with_cascades: withCascades,
    fiches_with_template: withTemplate,
    fiches_with_jurisprudence: withJuris,
    cascades_pct: pct(withCascades, total_fiches),
    template_pct: pct(withTemplate, total_fiches),
    jurisprudence_pct: pct(withJuris, total_fiches),
    total_articles,
    articles_with_source_id,
    source_id_coverage_pct: pct(articles_with_source_id, total_articles),
    total_rules,
    total_tests
  };
}

function countTests() {
  if (!existsSync(TEST_DIR)) return 0;
  let total = 0;
  try {
    const files = readdirSync(TEST_DIR).filter(f => f.endsWith('.test.mjs'));
    for (const f of files) {
      try {
        const content = readFileSync(join(TEST_DIR, f), 'utf-8');
        // compte les appels de niveau `it(` et `test(` (indenté ou non)
        const matches = content.match(/^\s*(it|test)\s*\(/gm) || [];
        total += matches.length;
      } catch {
        // fichier illisible, skip
      }
    }
  } catch {
    // test dir non accessible
  }
  return total;
}

// ─── Freshness ──────────────────────────────────────────────────

function computeFreshnessMetrics(now = Date.now()) {
  const fiches = getAllFiches();
  let withFreshness = 0, fresh = 0, aging = 0, stale = 0, expired = 0;
  let oldest = null, newest = null;

  for (const f of fiches) {
    if (f.last_verified_at) {
      withFreshness++;
      if (!oldest || f.last_verified_at < oldest) oldest = f.last_verified_at;
      if (!newest || f.last_verified_at > newest) newest = f.last_verified_at;
    }
    const status = computeFreshness(f, now).status;
    if (status === 'fresh') fresh++;
    else if (status === 'aging') aging++;
    else if (status === 'stale') stale++;
    else if (status === 'expired') expired++;
  }

  return {
    fiches_with_freshness: withFreshness,
    fiches_fresh: fresh,
    fiches_aging: aging,
    fiches_stale: stale,
    fiches_expired: expired,
    fresh_pct: pct(fresh, fiches.length),
    oldest_verified_at: oldest,
    newest_verified_at: newest
  };
}

// ─── Actionability ──────────────────────────────────────────────

function computeActionability(coverageStats) {
  const fiches = getAllFiches();
  let withTemplate = 0, withCascade = 0, actionable = 0;
  const intentsByFiche = new Map();

  for (const f of fiches) {
    const t = hasTemplate(f);
    const c = hasCascade(f);
    if (t) withTemplate++;
    if (c) withCascade++;
    // "actionable" = a au moins template OU cascade OU jurisprudence
    if (t || c || hasJurisprudence(f)) actionable++;
  }

  // Top 5 gaps = domaines avec la plus grande part d'intents "missing"
  const top_5_gaps = [];
  const byDomain = coverageStats?.by_domain || {};
  const domainGaps = Object.entries(byDomain).map(([domain, bd]) => ({
    domain,
    missing: bd.missing,
    total: bd.total,
    missing_pct: pct(bd.missing, bd.total)
  }));
  domainGaps.sort((a, b) => b.missing - a.missing);
  for (const g of domainGaps.slice(0, 5)) top_5_gaps.push(g);

  return {
    fiches_with_template: withTemplate,
    fiches_with_cascade: withCascade,
    intents_actionable_percent: pct(actionable, fiches.length),
    top_5_gaps
  };
}

// ─── Safety signals (depuis analytics.json + triage log si dispo) ─

function computeSafetyMetrics() {
  const analyticsPath = join(META_DIR, 'analytics.json');
  const analytics = safeLoadJSON(analyticsPath) || {};

  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Si analytics expose log_entries (future), on compte les 7 derniers jours.
  let safety_signals_last_7d = 0;
  let insufficient_certificates_last_7d = 0;

  const entries = Array.isArray(analytics.log_entries) ? analytics.log_entries : [];
  for (const e of entries) {
    const t = e?.timestamp ? Date.parse(e.timestamp) : 0;
    if (!t || nowMs - t > sevenDaysMs) continue;
    if (e.type === 'safety' || e.safety_flag || e.safety_signal) safety_signals_last_7d++;
    if (e.type === 'certificate_insufficient' || e.certificate_status === 'insufficient') {
      insufficient_certificates_last_7d++;
    }
  }

  return {
    safety_signals_last_7d,
    insufficient_certificates_last_7d
  };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Calcule toutes les métriques dashboard en une passe.
 * Cible : < 500ms. Lecture seule, aucune mutation.
 *
 * @param {object} [opts]
 * @param {number} [opts.now] timestamp ms (pour tests déterministes)
 * @returns {object}
 */
export function computeDashboardMetrics(opts = {}) {
  const now = opts.now || Date.now();

  const coverage = computeCoverage();
  const quality = computeQuality();
  const freshness = computeFreshnessMetrics(now);
  const actionability = computeActionability(coverage);
  const safety = computeSafetyMetrics();
  const fedlex_diff = computeFedlexDiffSummary();
  const readiness = computeReadinessMetrics();
  const review = computeReviewMetrics();
  const caselaw = computeCaselawMetrics();

  return {
    generated_at: new Date(now).toISOString(),
    coverage,
    quality,
    freshness,
    actionability,
    safety,
    fedlex_diff,
    readiness,
    review,
    caselaw
  };
}

/**
 * Caselaw 2.0 — canon_completeness par domaine.
 * Pour chaque fiche, mesure combien de composants canon sont présents
 * (leading / nuance / cantonal_practice / citizen_summary). Cible : ≥ 80%
 * de fiches en `canon_complete` sur les 5 domaines lourds.
 *
 * Sampling : mesure sur les 5 domaines core (bail, travail, dettes, famille,
 * etrangers) car le pipeline caselaw est async → pour éviter de bloquer
 * le dashboard, on fait un sampling synchrone via introspection.
 */
function computeCaselawMetrics() {
  const fiches = getAllFiches() || [];
  const coreDomains = new Set(['bail', 'travail', 'dettes', 'famille', 'etrangers']);
  const fichesCore = fiches.filter(f => coreDomains.has(f.domaine));
  return {
    core_domains: [...coreDomains],
    core_fiches_total: fichesCore.length,
    core_canon_target_percent: 80,
    // Mesure réelle : à remplir par un cron offline (evaluate-canon-completeness.mjs)
    // qui appelle getCanonCompleteness sur chaque fiche et écrit dans meta/.
    last_evaluation: _loadLastCanonEval()
  };
}

function _loadLastCanonEval() {
  try {
    const p = join(META_DIR, 'canon-completeness-report.json');
    const data = safeLoadJSON(p);
    if (!data) return { status: 'not_yet_evaluated', path: 'src/data/meta/canon-completeness-report.json' };
    return {
      status: 'evaluated',
      generated_at: data.generated_at,
      canon_complete_count: data.canon_complete_count,
      total_evaluated: data.total_evaluated,
      percent: data.percent
    };
  } catch {
    return { status: 'not_yet_evaluated' };
  }
}

/**
 * Readiness — distribution production vs beta vs draft.
 * Une fiche sans `readiness` est considérée 'production' (défaut legacy).
 */
function computeReadinessMetrics() {
  const fiches = getAllFiches() || [];
  const counts = { production: 0, beta: 0, draft: 0 };
  for (const f of fiches) {
    const r = f.readiness || 'production';
    counts[r] = (counts[r] || 0) + 1;
  }
  return {
    total: fiches.length,
    production: counts.production || 0,
    beta: counts.beta || 0,
    draft: counts.draft || 0,
    production_percent: pct(counts.production || 0, fiches.length),
    beta_percent: pct(counts.beta || 0, fiches.length)
  };
}

/**
 * Review — distribution des scopes de revue (draft_automated / reviewed_by_claude / reviewed_by_legal_expert).
 * Gate Phase 2 de la roadmap durcie : reviewed_by_legal_expert doit atteindre
 * un seuil par domaine avant annonce publique.
 */
function computeReviewMetrics() {
  const fiches = getAllFiches() || [];
  const counts = { draft_automated: 0, reviewed_by_claude: 0, reviewed_by_legal_expert: 0, unknown: 0 };
  for (const f of fiches) {
    const r = f.review_scope || 'unknown';
    counts[r] = (counts[r] || 0) + 1;
  }
  // Une fiche "structurellement validée" = reviewed_by_claude OU reviewed_by_legal_expert
  // (Claude fait le review structurel, expert humain ajoute le review juridique fin)
  const structurallyValidated = counts.reviewed_by_claude + counts.reviewed_by_legal_expert;
  return {
    total: fiches.length,
    draft_automated: counts.draft_automated,
    reviewed_by_claude: counts.reviewed_by_claude,
    reviewed_by_legal_expert: counts.reviewed_by_legal_expert,
    unknown: counts.unknown,
    // Structurel : au moins review automatisé Claude sur checklist stricte
    structurally_validated_percent: pct(structurallyValidated, fiches.length),
    structurally_validated_target: 40,
    structurally_validated_passed: pct(structurallyValidated, fiches.length) >= 40,
    // Juridique expert : seuil cible Phase 2 roadmap durcie
    expert_reviewed_percent: pct(counts.reviewed_by_legal_expert, fiches.length),
    gate_phase2_target_percent: 20,
    gate_phase2_passed: counts.reviewed_by_legal_expert / Math.max(1, fiches.length) >= 0.20
  };
}

/**
 * Résumé Fedlex diff — intègre le signal de fraîcheur législative.
 * Non-breaking : si getFedlexDiffSummary est indispo ou throw, retourne neutre.
 */
function computeFedlexDiffSummary() {
  try {
    const s = getFedlexDiffSummary();
    if (!s) return { enabled: false };
    return {
      enabled: true,
      last_run: s.last_run || null,
      changed_count: s.changed_count || 0,
      priority_high_count: s.priority_high_count || 0,
      total_runs: s.total_runs || 0,
      mode: s.mode || 'idle'
    };
  } catch {
    return { enabled: false };
  }
}

export default computeDashboardMetrics;
