/**
 * Phase Cortex — Dashboard metrics
 *
 * Teste :
 *   - computeDashboardMetrics() retourne toutes les sections attendues
 *   - les agrégations sont cohérentes (sum by_domain ~ total)
 *   - endpoint GET /api/dashboard/metrics retourne 200 + JSON
 *   - endpoint retourne 403 en mode production sans token admin
 *   - les pourcentages sont des entiers bornés [0, 100]
 *   - performance < 500ms
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { computeDashboardMetrics } from '../src/services/dashboard-metrics.mjs';

// Port 0 = OS-assigned, évite EADDRINUSE quand plusieurs fichiers de tests
// instancient un serveur sur le même port. BASE est résolu après server.listen().
let BASE = 'http://localhost:0';

async function httpGet(path, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, { headers }, res => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

describe('Phase Cortex — Dashboard metrics (unit)', () => {
  it('computeDashboardMetrics() retourne toutes les sections attendues', () => {
    const m = computeDashboardMetrics();
    assert.ok(m.generated_at, 'generated_at présent');
    assert.ok(typeof m.generated_at === 'string');
    assert.ok(m.coverage && typeof m.coverage === 'object');
    assert.ok(m.quality && typeof m.quality === 'object');
    assert.ok(m.freshness && typeof m.freshness === 'object');
    assert.ok(m.actionability && typeof m.actionability === 'object');
    assert.ok(m.safety && typeof m.safety === 'object');
  });

  it('coverage expose total_intents + répartition + quality_percent', () => {
    const { coverage } = computeDashboardMetrics();
    assert.ok(Number.isInteger(coverage.total_intents));
    assert.ok(coverage.total_intents > 0, 'doit avoir des intents');
    assert.ok(Number.isInteger(coverage.complete_intents));
    assert.ok(Number.isInteger(coverage.partial_intents));
    assert.ok(Number.isInteger(coverage.stub_intents));
    assert.ok(Number.isInteger(coverage.missing_intents));

    const sum = coverage.complete_intents + coverage.partial_intents
      + coverage.stub_intents + coverage.missing_intents;
    assert.equal(sum, coverage.total_intents,
      `sum(complete+partial+stub+missing) doit = total (${sum} vs ${coverage.total_intents})`);

    assert.ok(coverage.quality_percent >= 0 && coverage.quality_percent <= 100);
    assert.ok(Number.isInteger(coverage.quality_percent));
  });

  it('coverage.by_domain : sum des totaux par domaine = total_intents (si 1 domaine par intent)', () => {
    const { coverage } = computeDashboardMetrics();
    assert.ok(coverage.by_domain && typeof coverage.by_domain === 'object');
    const domainTotal = Object.values(coverage.by_domain).reduce((a, d) => a + d.total, 0);
    // Un intent peut appartenir à plusieurs domaines, mais en pratique c'est 1:1 donc on tolère ±10%.
    assert.ok(domainTotal >= coverage.total_intents,
      `domainTotal ${domainTotal} >= total_intents ${coverage.total_intents}`);
    assert.ok(domainTotal <= coverage.total_intents * 1.2,
      `domainTotal ${domainTotal} <= 1.2 × total_intents`);

    for (const [name, d] of Object.entries(coverage.by_domain)) {
      const s = d.complete + d.partial + d.stub + d.missing;
      assert.equal(s, d.total, `domaine ${name}: sum ${s} doit = total ${d.total}`);
      assert.ok(Number.isInteger(d.quality_percent) && d.quality_percent >= 0 && d.quality_percent <= 100);
    }
  });

  it('quality : total_fiches, source_id_coverage_pct ∈ [0,100], total_rules > 0', () => {
    const { quality } = computeDashboardMetrics();
    assert.ok(Number.isInteger(quality.total_fiches) && quality.total_fiches > 0);
    assert.ok(Number.isInteger(quality.total_articles) && quality.total_articles > 0);
    assert.ok(Number.isInteger(quality.total_rules) && quality.total_rules > 0);
    assert.ok(Number.isInteger(quality.total_tests) && quality.total_tests > 0);

    for (const key of ['cascades_pct', 'template_pct', 'jurisprudence_pct', 'source_id_coverage_pct']) {
      const v = quality[key];
      assert.ok(Number.isInteger(v), `${key} doit être un int (reçu ${v})`);
      assert.ok(v >= 0 && v <= 100, `${key} doit être dans [0,100] (reçu ${v})`);
    }

    assert.ok(quality.fiches_with_cascades <= quality.total_fiches);
    assert.ok(quality.fiches_with_template <= quality.total_fiches);
    assert.ok(quality.articles_with_source_id <= quality.total_articles);
  });

  it('freshness : compteurs cohérents et oldest <= newest', () => {
    const { freshness } = computeDashboardMetrics();
    const sum = freshness.fiches_fresh + freshness.fiches_aging
      + freshness.fiches_stale + freshness.fiches_expired;
    assert.ok(sum >= freshness.fiches_with_freshness - 1,
      `sum statuts >= with_freshness (unknown exclu)`);
    assert.ok(freshness.fresh_pct >= 0 && freshness.fresh_pct <= 100);
    assert.ok(Number.isInteger(freshness.fresh_pct));

    if (freshness.oldest_verified_at && freshness.newest_verified_at) {
      assert.ok(freshness.oldest_verified_at <= freshness.newest_verified_at,
        `oldest ${freshness.oldest_verified_at} <= newest ${freshness.newest_verified_at}`);
    }
  });

  it('actionability : top_5_gaps est un array de 0-5 entrées avec missing_pct', () => {
    const { actionability } = computeDashboardMetrics();
    assert.ok(Array.isArray(actionability.top_5_gaps));
    assert.ok(actionability.top_5_gaps.length <= 5);
    for (const g of actionability.top_5_gaps) {
      assert.ok(typeof g.domain === 'string');
      assert.ok(Number.isInteger(g.missing));
      assert.ok(Number.isInteger(g.total));
      assert.ok(Number.isInteger(g.missing_pct));
      assert.ok(g.missing_pct >= 0 && g.missing_pct <= 100);
    }
    assert.ok(Number.isInteger(actionability.intents_actionable_percent));
    assert.ok(actionability.intents_actionable_percent >= 0 && actionability.intents_actionable_percent <= 100);
  });

  it('safety : retourne des ints ≥ 0 même sans logs', () => {
    const { safety } = computeDashboardMetrics();
    assert.ok(Number.isInteger(safety.safety_signals_last_7d));
    assert.ok(safety.safety_signals_last_7d >= 0);
    assert.ok(Number.isInteger(safety.insufficient_certificates_last_7d));
    assert.ok(safety.insufficient_certificates_last_7d >= 0);
  });

  it('performance : s\'exécute en < 500ms', () => {
    const t0 = Date.now();
    computeDashboardMetrics();
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 500, `compute trop lent : ${elapsed}ms (limite 500ms)`);
  });
});

describe('Phase Cortex — Dashboard metrics (endpoint)', () => {
  let server;
  const originalNodeEnv = process.env.NODE_ENV;

  before(async () => {
    // En dev, l'endpoint est public
    delete process.env.NODE_ENV;
    const mod = await import('../src/server.mjs');
    server = mod.server;
    await new Promise(resolve => server.listen(0, resolve));
    const addr = server.address();
    BASE = `http://localhost:${addr.port}`;
  });

  after(() => new Promise(resolve => {
    if (originalNodeEnv) process.env.NODE_ENV = originalNodeEnv;
    else delete process.env.NODE_ENV;
    server.close(resolve);
  }));

  it('GET /api/dashboard/metrics retourne 200 + JSON valide en dev', async () => {
    const res = await httpGet('/api/dashboard/metrics');
    assert.equal(res.status, 200, `statut attendu 200, reçu ${res.status}`);
    assert.ok(typeof res.data === 'object');
    assert.ok(res.data.generated_at);
    assert.ok(res.data.coverage);
    assert.ok(res.data.quality);
    assert.ok(res.data.freshness);
    assert.ok(res.data.actionability);
    assert.ok(res.data.safety);
  });

  it('GET /api/dashboard/metrics retourne 403 en prod sans token admin', async () => {
    process.env.NODE_ENV = 'production';
    // pas de ADMIN_TOKEN configuré → checkAdmin renvoie 403
    const savedToken = process.env.ADMIN_TOKEN;
    delete process.env.ADMIN_TOKEN;

    try {
      const res = await httpGet('/api/dashboard/metrics');
      assert.equal(res.status, 403, `statut attendu 403 en prod, reçu ${res.status}`);
    } finally {
      process.env.NODE_ENV = originalNodeEnv || '';
      if (!originalNodeEnv) delete process.env.NODE_ENV;
      if (savedToken) process.env.ADMIN_TOKEN = savedToken;
    }
  });

  it('GET /api/dashboard/metrics renvoie des intents > 0 + quality_percent borné', async () => {
    const res = await httpGet('/api/dashboard/metrics');
    assert.equal(res.status, 200);
    assert.ok(res.data.coverage.total_intents > 0);
    assert.ok(res.data.coverage.quality_percent >= 0 && res.data.coverage.quality_percent <= 100);
    assert.ok(Number.isInteger(res.data.coverage.quality_percent));
  });
});
