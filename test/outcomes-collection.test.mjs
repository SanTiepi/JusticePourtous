/**
 * Outcomes feedback collection — citizen "Did this help?" widget.
 *
 * Couvre :
 *  - recordSimpleOutcome stocke + PII-strip notes
 *  - duplicate case_id (deuxième appel) rejeté
 *  - consent=false rejeté
 *  - getAggregateStats respecte k=5 (domaine avec <5 outcomes masqué)
 *  - HTTP POST /api/outcome happy path
 *  - HTTP rejette sans consent (403)
 *  - HTTP rejette helpful hors range (400)
 *  - Admin GET /api/admin/outcomes → stats k-anon
 *  - Admin GET /api/admin/outcomes sans token → 403
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, rmSync } from 'node:fs';
import http from 'node:http';

const TEST_OUTCOMES_PATH = join(tmpdir(), 'jpt-outcomes-collection-test.json');
process.env.OUTCOMES_STORE_PATH = TEST_OUTCOMES_PATH;
process.env.OUTCOMES_HASH_SALT = 'test-salt-collection';
process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token';

const {
  recordSimpleOutcome,
  getAggregateStats,
  _listOutcomesForTests,
  _resetOutcomesForTests,
  _flushOutcomes,
  K_ANONYMITY_THRESHOLD
} = await import('../src/services/outcomes-tracker.mjs');

const { server } = await import('../src/server.mjs');

let BASE;

function reset() {
  _resetOutcomesForTests({ path: TEST_OUTCOMES_PATH });
}

before(() => new Promise((resolve) => {
  server.listen(0, () => {
    const addr = server.address();
    BASE = `http://localhost:${addr.port}`;
    resolve();
  });
}));

after(() => new Promise((resolve) => {
  _flushOutcomes();
  try { if (existsSync(TEST_OUTCOMES_PATH)) rmSync(TEST_OUTCOMES_PATH); } catch {}
  server.close(resolve);
}));

function request(path, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          json: () => JSON.parse(data),
          text: () => data
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════
// Service layer — recordSimpleOutcome
// ═══════════════════════════════════════════════════════════════

describe('outcomes-collection — recordSimpleOutcome (service)', () => {
  beforeEach(reset);

  it('consent=true + helpful=3 → recorded avec outcome_id', () => {
    const r = recordSimpleOutcome({
      case_id: 'case-hello',
      helpful: 3,
      free_text: 'tres utile',
      consent: true,
      context: { fiche_id: 'bail_defaut_moisissure', domaine: 'bail' }
    });
    assert.equal(r.recorded, true);
    assert.match(r.outcome_id, /^[0-9a-f]{16}$/);
    const list = _listOutcomesForTests();
    assert.equal(list.length, 1);
    assert.equal(list[0].helpful, 3);
    assert.equal(list[0].result, 'won');
    assert.equal(list[0].domaine, 'bail');
  });

  it('PII-strip appliqué au free_text (email, tél, nom propre)', () => {
    const r = recordSimpleOutcome({
      case_id: 'case-pii',
      helpful: 2,
      free_text: 'contact jean.dupont@example.ch +41 78 123 45 67 Jean Dupont',
      consent: true,
      context: { fiche_id: 'bail_defaut_moisissure', domaine: 'bail' }
    });
    assert.equal(r.recorded, true);
    const stored = _listOutcomesForTests()[0];
    assert.ok(!stored.notes_anonymized.includes('jean.dupont@example.ch'));
    assert.ok(!stored.notes_anonymized.includes('78 123 45 67'));
    assert.ok(!stored.notes_anonymized.includes('Jean Dupont'));
    assert.ok(stored.notes_anonymized.includes('[redacted]'));
  });

  it('consent=false → rejeté avec reason=consent_required', () => {
    const r = recordSimpleOutcome({
      case_id: 'case-no-consent',
      helpful: 3,
      consent: false
    });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'consent_required');
    assert.equal(_listOutcomesForTests().length, 0);
  });

  it('consent absent → rejeté', () => {
    const r = recordSimpleOutcome({ case_id: 'x', helpful: 3 });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'consent_required');
  });

  it('helpful hors {1,2,3} → rejeté', () => {
    const cases = [0, 4, 5, -1, null, 'yes', undefined];
    for (const h of cases) {
      const r = recordSimpleOutcome({
        case_id: `case-bad-${String(h)}`,
        helpful: h,
        consent: true
      });
      assert.equal(r.recorded, false, `helpful=${h} devrait être rejeté`);
      assert.equal(r.reason, 'helpful_invalid');
    }
  });

  it('case_id manquant → rejeté', () => {
    const r = recordSimpleOutcome({ helpful: 3, consent: true });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'case_id_required');
  });

  it('duplicate case_id (second appel) → rejeté already_recorded', () => {
    const r1 = recordSimpleOutcome({
      case_id: 'dup-case',
      helpful: 3,
      consent: true,
      context: { fiche_id: 'bail_defaut_moisissure', domaine: 'bail' }
    });
    assert.equal(r1.recorded, true);

    const r2 = recordSimpleOutcome({
      case_id: 'dup-case',
      helpful: 2,
      consent: true,
      context: { fiche_id: 'bail_defaut_moisissure', domaine: 'bail' }
    });
    assert.equal(r2.recorded, false);
    assert.equal(r2.reason, 'already_recorded');
    assert.equal(_listOutcomesForTests().length, 1);
  });

  it('case_id jamais stocké en clair (hash seulement)', () => {
    recordSimpleOutcome({
      case_id: 'SUPER-SECRET-123',
      helpful: 3,
      consent: true,
      context: { fiche_id: 'x', domaine: 'bail' }
    });
    const stored = _listOutcomesForTests()[0];
    assert.equal(stored.case_id, undefined);
    assert.equal(stored.case_id_hash.length, 64);
    const json = JSON.stringify(stored);
    assert.ok(!json.includes('SUPER-SECRET-123'));
  });
});

// ═══════════════════════════════════════════════════════════════
// getAggregateStats — k-anonymity
// ═══════════════════════════════════════════════════════════════

describe('outcomes-collection — getAggregateStats (k=5)', () => {
  beforeEach(reset);

  function seed(n, { prefix, domaine, helpful = 3 }) {
    for (let i = 0; i < n; i++) {
      recordSimpleOutcome({
        case_id: `${prefix}-${i}`,
        helpful,
        consent: true,
        context: { fiche_id: `${domaine}_f`, domaine }
      });
    }
  }

  it('k=5 bloque le détail helpful_distribution quand total<5', () => {
    seed(3, { prefix: 'small', domaine: 'bail' });
    const stats = getAggregateStats();
    assert.equal(stats.total, 3);
    assert.equal(stats.helpful_distribution, null, 'masqué sous k=5');
    assert.deepEqual(stats.top_domains, []);
  });

  it('n ≥ 5 → helpful_distribution visible + domaine dans top_domains', () => {
    seed(6, { prefix: 'bail', domaine: 'bail', helpful: 3 });
    const stats = getAggregateStats();
    assert.equal(stats.total, 6);
    assert.ok(stats.helpful_distribution);
    assert.equal(stats.helpful_distribution[3], 6);
    assert.equal(stats.top_domains.length, 1);
    assert.equal(stats.top_domains[0].domaine, 'bail');
    assert.equal(stats.top_domains[0].total, 6);
    // by_result bucket "won" ≥ 5 → visible
    assert.equal(stats.top_domains[0].by_result.won, 6);
  });

  it('domaine avec < 5 outcomes exclu du top_domains', () => {
    seed(6, { prefix: 'bail', domaine: 'bail', helpful: 3 });
    seed(2, { prefix: 'travail', domaine: 'travail', helpful: 3 });
    const stats = getAggregateStats();
    assert.equal(stats.total, 8);
    const domains = stats.top_domains.map(d => d.domaine);
    assert.ok(domains.includes('bail'));
    assert.ok(!domains.includes('travail'), 'travail < k=5 doit être masqué');
  });

  it('sous-bucket by_result < 5 masqué même si total domaine ≥ 5', () => {
    // 6 total en bail : 5 won + 1 partially_won (le bucket partially_won < k)
    seed(5, { prefix: 'won', domaine: 'bail', helpful: 3 });
    seed(1, { prefix: 'part', domaine: 'bail', helpful: 2 });
    const stats = getAggregateStats();
    assert.equal(stats.total, 6);
    assert.equal(stats.top_domains.length, 1);
    const bail = stats.top_domains[0];
    assert.equal(bail.by_result.won, 5);
    assert.equal(bail.by_result.partially_won, undefined,
      'bucket partially_won (n=1) doit être masqué');
  });

  it('k_anonymity_threshold exposé dans la réponse', () => {
    const stats = getAggregateStats();
    assert.equal(stats.k_anonymity_threshold, K_ANONYMITY_THRESHOLD);
    assert.equal(stats.k_anonymity_threshold, 5);
  });
});

// ═══════════════════════════════════════════════════════════════
// HTTP POST /api/outcome
// ═══════════════════════════════════════════════════════════════

describe('HTTP POST /api/outcome', () => {
  beforeEach(reset);

  it('happy path — helpful=3 + consent → 200 recorded', async () => {
    const res = await request('/api/outcome', {
      method: 'POST',
      body: {
        case_id: 'http-case-1',
        helpful: 3,
        free_text: 'super utile',
        consent_anon_aggregate: true
      }
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.recorded, true);
    assert.match(data.outcome_id, /^[0-9a-f]{16}$/);
  });

  it('sans consent → 403 consent_required', async () => {
    const res = await request('/api/outcome', {
      method: 'POST',
      body: {
        case_id: 'http-no-consent',
        helpful: 3
        // consent_anon_aggregate absent
      }
    });
    assert.equal(res.status, 403);
    const data = res.json();
    assert.equal(data.recorded, false);
    assert.equal(data.reason, 'consent_required');
  });

  it('consent=false explicite → 403', async () => {
    const res = await request('/api/outcome', {
      method: 'POST',
      body: {
        case_id: 'http-false-consent',
        helpful: 3,
        consent_anon_aggregate: false
      }
    });
    assert.equal(res.status, 403);
    assert.equal(res.json().reason, 'consent_required');
  });

  it('helpful=7 → 400 helpful_invalid', async () => {
    const res = await request('/api/outcome', {
      method: 'POST',
      body: {
        case_id: 'http-bad-helpful',
        helpful: 7,
        consent_anon_aggregate: true
      }
    });
    assert.equal(res.status, 400);
    assert.equal(res.json().reason, 'helpful_invalid');
  });

  it('duplicate case_id → 400 already_recorded', async () => {
    const body = {
      case_id: 'http-dup-1',
      helpful: 3,
      consent_anon_aggregate: true
    };
    const r1 = await request('/api/outcome', { method: 'POST', body });
    assert.equal(r1.status, 200);
    const r2 = await request('/api/outcome', { method: 'POST', body });
    assert.equal(r2.status, 400);
    assert.equal(r2.json().reason, 'already_recorded');
  });
});

// ═══════════════════════════════════════════════════════════════
// HTTP GET /api/admin/outcomes
// ═══════════════════════════════════════════════════════════════

describe('HTTP GET /api/admin/outcomes', () => {
  beforeEach(reset);

  it('sans token → 403', async () => {
    const res = await request('/api/admin/outcomes');
    assert.equal(res.status, 403);
  });

  it('mauvais token → 403', async () => {
    const res = await request('/api/admin/outcomes', {
      headers: { Authorization: 'Bearer wrong' }
    });
    assert.equal(res.status, 403);
  });

  it('token valide → 200 stats k-anon', async () => {
    // Seed 6 bail/won + 2 travail → bail publié, travail masqué
    for (let i = 0; i < 6; i++) {
      recordSimpleOutcome({
        case_id: `adm-bail-${i}`,
        helpful: 3,
        consent: true,
        context: { fiche_id: 'bail_f', domaine: 'bail' }
      });
    }
    for (let i = 0; i < 2; i++) {
      recordSimpleOutcome({
        case_id: `adm-trav-${i}`,
        helpful: 2,
        consent: true,
        context: { fiche_id: 'trav_f', domaine: 'travail' }
      });
    }

    const res = await request('/api/admin/outcomes', {
      headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` }
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.total, 8);
    assert.ok(data.helpful_distribution, 'total=8 ≥ k doit exposer la distribution');
    assert.equal(data.k_anonymity_threshold, 5);
    const domains = data.top_domains.map(d => d.domaine);
    assert.ok(domains.includes('bail'));
    assert.ok(!domains.includes('travail'), 'travail n=2 doit être masqué');
  });

  it('respecte le query param since', async () => {
    for (let i = 0; i < 6; i++) {
      recordSimpleOutcome({
        case_id: `since-${i}`,
        helpful: 3,
        consent: true,
        context: { fiche_id: 'bail_f', domaine: 'bail' }
      });
    }
    const future = new Date(Date.now() + 60_000).toISOString();
    const res = await request(`/api/admin/outcomes?since=${encodeURIComponent(future)}`, {
      headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` }
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.total, 0, 'since dans le futur → 0 outcomes');
  });
});
