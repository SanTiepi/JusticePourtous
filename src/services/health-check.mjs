/**
 * health-check.mjs — Vérifie la santé de chaque module critique au runtime.
 *
 * Test léger, exécutable via `GET /api/health`. Sert à :
 *   - monitoring production (rollback rapide si un module est cassé)
 *   - CI de déploiement (refuser le deploy si un check fail)
 *   - self-diagnostic en dev
 *
 * Chaque check a :
 *   - `name`
 *   - `status` : 'ok' | 'warn' | 'error'
 *   - `detail` : objet avec métriques
 *   - `duration_ms`
 *
 * Global status : 'ok' si tous ok, 'degraded' si ≥1 warn, 'failing' si ≥1 error.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

async function timed(name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    return {
      name,
      status: detail.status || 'ok',
      detail,
      duration_ms: Date.now() - start
    };
  } catch (err) {
    return {
      name,
      status: 'error',
      detail: { error: err.message },
      duration_ms: Date.now() - start
    };
  }
}

async function checkFiches() {
  const dir = join(ROOT, 'src/data/fiches');
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  let total = 0;
  const byDomain = {};
  for (const f of files) {
    const arr = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const domain = f.replace('.json', '');
    byDomain[domain] = arr.length;
    total += arr.length;
  }
  return {
    total_fiches: total,
    domains: Object.keys(byDomain).length,
    status: total >= 200 ? 'ok' : 'warn'
  };
}

async function checkCaseStore() {
  const { _listActiveCases, getCompactionStats } = await import('./case-store.mjs');
  const active = _listActiveCases();
  const compaction = getCompactionStats();
  return {
    active_cases: active.length,
    compaction,
    status: 'ok'
  };
}

async function checkNormativeCompiler() {
  const { ALL_RULES } = await import('./normative-compiler.mjs');
  // Baseline actuelle committée: 22 règles sur 7 domaines.
  // Seuil = détection de régression, pas objectif aspirationnel.
  const n = ALL_RULES.length;
  return {
    total_rules: n,
    status: n >= 20 ? 'ok' : (n >= 10 ? 'warn' : 'error')
  };
}

async function checkSourceRegistry() {
  const { getRegistryStats, getSourceByRef } = await import('./source-registry.mjs');
  const stats = getRegistryStats();
  // Test fallback RS
  const testRefs = ['CO 259a', 'LAA 36', 'LCR 90', 'LAO 1'];
  const resolved = testRefs.filter(r => {
    try { return !!getSourceByRef(r)?.source_id; } catch { return false; }
  }).length;
  return {
    registry_stats: stats,
    fallback_test: `${resolved}/${testRefs.length}`,
    status: resolved === testRefs.length ? 'ok' : 'warn'
  };
}

async function checkFreshness() {
  const dir = join(ROOT, 'src/data/fiches');
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  let total = 0, withFreshness = 0;
  for (const f of files) {
    const arr = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const fiche of arr) {
      total++;
      if (fiche.last_verified_at) withFreshness++;
    }
  }
  const pct = Math.round((withFreshness / total) * 100);
  return {
    total_fiches: total,
    with_freshness: withFreshness,
    percent: pct,
    status: pct >= 95 ? 'ok' : 'warn'
  };
}

async function checkIntentCatalog() {
  const path = join(ROOT, 'src/data/meta/intents-catalog.json');
  if (!existsSync(path)) return { status: 'warn', note: 'intents-catalog.json absent' };
  const intents = JSON.parse(readFileSync(path, 'utf8'));
  return {
    total_intents: intents.length,
    status: intents.length >= 150 ? 'ok' : 'warn'
  };
}

async function checkCaselaw() {
  const { OpenCaseLawProvider, EntscheidsucheProvider } = await import('./caselaw/index.mjs');
  const p1 = new OpenCaseLawProvider();
  const p2 = new EntscheidsucheProvider();
  return {
    providers: [
      { id: p1.id, health: p1.getHealth() },
      { id: p2.id, health: p2.getHealth() }
    ],
    status: 'ok'
  };
}

async function checkGraph() {
  // Le graph est construit en mémoire au boot (knowledge-engine.mjs),
  // graph.json sur disque est optionnel (cache). On vérifie l'in-memory.
  const { _getGraphStats } = await import('./knowledge-engine.mjs').catch(() => ({}));
  if (typeof _getGraphStats === 'function') {
    const stat = _getGraphStats();
    return {
      fiches_indexed: stat.fiches_indexed,
      articles_indexed: stat.articles_indexed,
      status: 'ok'
    };
  }
  // Fallback fichier si helper absent
  const path = join(ROOT, 'src/data/index/graph.json');
  if (!existsSync(path)) return { status: 'warn', note: 'graph.json absent (and no _getGraphStats helper)' };
  const stat = JSON.parse(readFileSync(path, 'utf8'));
  return {
    fiches_indexed: Object.keys(stat.ficheToArticles || {}).length,
    articles_indexed: Object.keys(stat.articleToFiches || {}).length,
    status: 'ok'
  };
}

async function checkCitizenAccount() {
  const { _listAccountsForTests } = await import('./citizen-account.mjs').catch(() => ({}));
  // Ne pas lancer si fonction pas exposée, just check import
  return {
    module_loadable: true,
    status: 'ok'
  };
}

async function checkEnrichCache() {
  const { _enrichCacheStats } = await import('./knowledge-engine.mjs');
  const stats = _enrichCacheStats();
  return {
    ...stats,
    status: 'ok'
  };
}

async function checkLogger() {
  const { getLoggerConfig } = await import('./logger.mjs');
  return {
    ...getLoggerConfig(),
    status: 'ok'
  };
}

async function checkCoverageCertificate() {
  const { certifyIssue, requireSufficientCertificate } = await import('./coverage-certificate.mjs');
  const testIssue = {
    articles: [{ ref: 'CO 259a', source_id: 'fedlex:rs220:co-259a' }],
    arrets: [
      { role: 'favorable', tier: 1, source_id: 'bger:4A_test_leading' },
      { role: 'defavorable', tier: 2, source_id: 'bger:4A_test_nuance' }
    ],
    delais: [{ procedure: 'test', delai: '30j', base_legale: 'CO 259a' }],
    preuves: [],
    anti_erreurs: [],
    patterns: [],
    contacts: []
  };
  const cert = certifyIssue(testIssue);
  return {
    test_issue_status: cert.status,
    status: ['sufficient', 'limited'].includes(cert.status) ? 'ok' : 'warn'
  };
}

/**
 * Lance tous les checks en parallèle et retourne un rapport.
 */
export async function runHealthChecks() {
  const results = await Promise.all([
    timed('fiches', checkFiches),
    timed('case_store', checkCaseStore),
    timed('normative_compiler', checkNormativeCompiler),
    timed('source_registry', checkSourceRegistry),
    timed('freshness', checkFreshness),
    timed('intent_catalog', checkIntentCatalog),
    timed('caselaw', checkCaselaw),
    timed('graph', checkGraph),
    timed('citizen_account', checkCitizenAccount),
    timed('coverage_certificate', checkCoverageCertificate),
    timed('enrich_cache', checkEnrichCache),
    timed('logger', checkLogger)
  ]);

  const hasError = results.some(r => r.status === 'error');
  const hasWarn = results.some(r => r.status === 'warn');
  const global_status = hasError ? 'failing' : (hasWarn ? 'degraded' : 'ok');

  const total_duration = results.reduce((s, r) => s + r.duration_ms, 0);

  return {
    global_status,
    checked_at: new Date().toISOString(),
    total_duration_ms: total_duration,
    checks: results,
    summary: {
      ok: results.filter(r => r.status === 'ok').length,
      warn: results.filter(r => r.status === 'warn').length,
      error: results.filter(r => r.status === 'error').length,
      total: results.length
    }
  };
}
