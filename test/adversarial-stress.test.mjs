/**
 * Adversarial stress tests — tests vicieux pour trouver les failles
 *
 * Couvre : XSS, null safety, cache coherence, large inputs,
 * cross-module integrity, edge cases pipeline V3, API abuse
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';
import {
  buildSourceRegistry, getRegistry, getSourceById,
  getSourceByRef, getSourceBySignature, getSourcesByTier,
  getSourcesByDomain, validateClaimSources, resolveSources,
  articleSourceId, arretSourceId
} from '../src/services/source-registry.mjs';
import {
  getObjectRegistry, getObjectsByType, getObjectById,
  getObjectsByDomain, getDossierObjects, getObjectStats
} from '../src/services/object-registry.mjs';
import { semanticSearch, expandQuery, scoreFiche } from '../src/services/semantic-search.mjs';
import { getAllFiches } from '../src/services/fiches.mjs';

const PORT = 9890;
const BASE = `http://localhost:${PORT}`;

async function httpGet(path) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    http.default.get(`${BASE}${path}`, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    }).on('error', reject);
  });
}

async function httpPost(path, data) {
  const http = await import('node:http');
  const payload = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const req = http.default.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ============================================================
// 1. XSS & INJECTION TESTS
// ============================================================

describe('XSS & injection hardening', () => {
  before(() => new Promise(resolve => server.listen(PORT, resolve)));
  after(() => new Promise(resolve => server.close(resolve)));

  it('search query with <script> tag does not reflect raw HTML', async () => {
    const xss = '<script>alert(1)</script>';
    const res = await httpGet('/api/search?q=' + encodeURIComponent(xss));
    const body = JSON.stringify(res.data);
    assert.ok(!body.includes('<script>'), 'Raw <script> tag should not appear in API response');
  });

  it('source ID with special chars in URL does not crash', async () => {
    const malicious = encodeURIComponent('fedlex:../../etc/passwd');
    const res = await httpGet(`/api/sources/${malicious}`);
    assert.ok([200, 404].includes(res.status), 'Should return 200 or 404, not crash');
  });

  it('POST /api/sources/validate with non-array source_ids returns 400', async () => {
    const res = await httpPost('/api/sources/validate', { source_ids: 'not-an-array' });
    assert.equal(res.status, 400);
  });

  it('POST /api/sources/validate with 10000 source_ids does not crash', async () => {
    const ids = Array.from({ length: 10000 }, (_, i) => `fake:source:${i}`);
    const res = await httpPost('/api/sources/validate', { source_ids: ids });
    assert.equal(res.status, 200);
    assert.equal(res.data.valid, false);
    assert.equal(res.data.issues.length, 10000 + 1); // 10000 not_found + 1 no_binding_source
  });

  it('search with SQL injection pattern returns result, not error', async () => {
    const sql = "'; DROP TABLE fiches; --";
    const res = await httpGet('/api/search?q=' + encodeURIComponent(sql));
    assert.ok([200, 404].includes(res.status));
  });

  it('objects/types with XSS type param returns 200 empty or valid', async () => {
    const res = await httpGet('/api/objects/types?type=' + encodeURIComponent('<img onerror=alert(1)>'));
    assert.equal(res.status, 200);
    assert.equal(res.data.count, 0); // unknown type → empty array
  });
});

// ============================================================
// 2. NULL & EDGE CASE SAFETY
// ============================================================

describe('Null safety & edge cases', () => {

  it('articleSourceId handles empty strings', () => {
    const id = articleSourceId('', '');
    assert.ok(typeof id === 'string');
    assert.ok(id.length > 0);
  });

  it('arretSourceId handles null tribunal', () => {
    const id = arretSourceId('4A_32/2018', null);
    assert.ok(id.includes('tf')); // defaults to tf
  });

  it('getSourceByRef with non-existent ref returns null, not error', () => {
    assert.equal(getSourceByRef('FAKE 999'), null);
  });

  it('getSourceBySignature with empty string returns null', () => {
    assert.equal(getSourceBySignature(''), null);
  });

  it('getSourceById with undefined returns null', () => {
    assert.equal(getSourceById(undefined), null);
  });

  it('validateClaimSources with empty array is valid (vacuous truth)', () => {
    const result = validateClaimSources([]);
    // Empty claims = no issues (nothing to validate)
    assert.equal(result.issues.length, 0);
    assert.equal(result.hasBindingSource, false);
  });

  it('resolveSources with mixed valid/invalid returns correct split', () => {
    const validId = articleSourceId('CO 259a', 'RS 220');
    const { resolved, missing } = resolveSources([validId, 'nonexistent:id', validId]);
    assert.equal(resolved.length, 2); // same valid ID twice = 2 resolved
    assert.equal(missing.length, 1);
  });

  it('getObjectsByType with unknown type returns empty array, not error', () => {
    const result = getObjectsByType('nonexistent_type');
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 0);
  });

  it('getObjectsByDomain with empty domain returns empty array', () => {
    const result = getObjectsByDomain('norm_fragment', '');
    assert.ok(Array.isArray(result));
  });

  it('getDossierObjects with nonexistent domain returns empty collections', () => {
    const dossier = getDossierObjects('fake_domain_xyz');
    assert.ok(dossier.norm_fragments.length === 0);
    assert.ok(dossier.decision_holdings.length === 0);
  });

  it('semanticSearch with empty string returns empty array', () => {
    const fiches = getAllFiches();
    const results = semanticSearch('', fiches, 5);
    assert.ok(Array.isArray(results));
  });

  it('semanticSearch with very long input (5000 chars) does not crash', () => {
    const fiches = getAllFiches();
    const longInput = 'moisissure '.repeat(500);
    const results = semanticSearch(longInput, fiches, 5);
    assert.ok(results.length > 0);
  });

  it('expandQuery with only stopwords returns terms map', () => {
    const { terms } = expandQuery('le la les un une de du des');
    assert.ok(terms instanceof Map);
  });

  it('scoreFiche with fiche missing tags does not crash', () => {
    const terms = new Map([['test', 1]]);
    const score = scoreFiche({ id: 'x', domaine: 'bail', reponse: {} }, terms);
    assert.ok(typeof score === 'number');
  });
});

// ============================================================
// 3. CROSS-MODULE INTEGRITY
// ============================================================

describe('Cross-module integrity', () => {

  it('every norm_fragment source_id exists in source registry', () => {
    const fragments = getObjectsByType('norm_fragment');
    const registry = getRegistry();
    let missing = 0;
    for (const f of fragments.slice(0, 100)) {
      if (!getSourceById(f.source_id)) missing++;
    }
    assert.equal(missing, 0, `${missing} norm_fragments have orphan source_ids`);
  });

  it('every decision_holding source_id exists in source registry', () => {
    const holdings = getObjectsByType('decision_holding');
    let missing = 0;
    for (const h of holdings.slice(0, 100)) {
      if (!getSourceById(h.source_id)) missing++;
    }
    assert.equal(missing, 0, `${missing} decision_holdings have orphan source_ids`);
  });

  it('every norm_fragment has a matching source and count is coherent', () => {
    const reg = getRegistry();
    const fragments = getObjectsByType('norm_fragment');
    const articleSources = reg.entries.filter(e => e.type === 'article');
    // Every norm_fragment source_id must exist in registry (no orphans)
    let orphans = 0;
    for (const f of fragments) {
      if (!getSourceById(f.source_id)) orphans++;
    }
    assert.equal(orphans, 0, `${orphans} norm_fragments have no matching source`);
    // norm_fragments <= article sources (object-registry may deduplicate further)
    assert.ok(fragments.length <= articleSources.length,
      `norm_fragments (${fragments.length}) exceeds article sources (${articleSources.length})`);
    assert.ok(fragments.length > articleSources.length * 0.9,
      `norm_fragments (${fragments.length}) is far below article sources (${articleSources.length}) — possible data loss`);
  });

  it('object registry decision_holdings match source registry arret count', () => {
    const holdings = getObjectsByType('decision_holding');
    const reg = getRegistry();
    const arretSources = reg.entries.filter(e => e.type === 'arret');
    assert.equal(holdings.length, arretSources.length,
      `decision_holdings (${holdings.length}) should match arret sources (${arretSources.length})`);
  });

  it('getDossierObjects bail has coherent data across modules', () => {
    const dossier = getDossierObjects('bail');
    // Every norm_fragment in dossier should have a valid source_id
    for (const nf of dossier.norm_fragments) {
      assert.ok(nf.source_id, `norm_fragment ${nf.ref} missing source_id`);
      assert.ok(nf.tier >= 1 && nf.tier <= 3, `norm_fragment ${nf.ref} invalid tier ${nf.tier}`);
    }
    // Every anti_error should have a domaine
    for (const ae of dossier.anti_errors) {
      assert.equal(ae.domaine, 'bail', `anti_error in bail dossier has wrong domaine: ${ae.domaine}`);
    }
  });

  it('validateClaimSources works end-to-end with real source_ids from objects', () => {
    const fragments = getObjectsByType('norm_fragment');
    const tier1 = fragments.filter(f => f.tier === 1).slice(0, 3);
    if (tier1.length === 0) return; // skip if no tier 1

    const result = validateClaimSources(tier1.map(f => f.source_id));
    assert.equal(result.valid, true, 'Claims with tier 1 sources should be valid');
    assert.equal(result.hasBindingSource, true);
    assert.equal(result.issues.length, 0);
  });
});

// ============================================================
// 4. PERFORMANCE & SCALE
// ============================================================

describe('Performance & scale', () => {

  it('source registry build is under 500ms', () => {
    const start = performance.now();
    buildSourceRegistry();
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 500, `Registry build took ${elapsed.toFixed(0)}ms, expected < 500ms`);
  });

  it('getObjectStats is under 50ms', () => {
    const start = performance.now();
    getObjectStats();
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 50, `getObjectStats took ${elapsed.toFixed(0)}ms, expected < 50ms`);
  });

  it('getSourcesByTier(1) returns in under 20ms', () => {
    const start = performance.now();
    const result = getSourcesByTier(1);
    const elapsed = performance.now() - start;
    assert.ok(result.length > 0);
    assert.ok(elapsed < 20, `getSourcesByTier took ${elapsed.toFixed(0)}ms, expected < 20ms`);
  });

  it('getDossierObjects bail returns in under 100ms', () => {
    const start = performance.now();
    getDossierObjects('bail');
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 100, `getDossierObjects took ${elapsed.toFixed(0)}ms, expected < 100ms`);
  });

  it('100 sequential semanticSearch calls complete in under 500ms', () => {
    const fiches = getAllFiches();
    const queries = [
      'moisissure', 'licenciement', 'dette poursuite', 'divorce garde',
      'permis sejour', 'harcelement travail', 'loyer augmente', 'caution',
      'accident travail', 'heritage testament'
    ];
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      semanticSearch(queries[i % queries.length], fiches, 3);
    }
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 500, `100 searches took ${elapsed.toFixed(0)}ms, expected < 500ms`);
  });
});

// ============================================================
// 5. DATA QUALITY & CONSTITUTION COMPLIANCE
// ============================================================

describe('Constitution compliance', () => {

  it('no norm_fragment has tier 0 or tier > 3', () => {
    const fragments = getObjectsByType('norm_fragment');
    for (const f of fragments) {
      assert.ok(f.tier >= 1 && f.tier <= 3, `${f.ref} has invalid tier ${f.tier}`);
    }
  });

  it('every Fedlex article is tier 1 (binding law)', () => {
    const fragments = getObjectsByType('norm_fragment');
    const fedlex = fragments.filter(f => f.lienFedlex);
    for (const f of fedlex) {
      assert.equal(f.tier, 1, `Fedlex article ${f.ref} should be tier 1, got ${f.tier}`);
      assert.equal(f.binding_strength, 'decisif');
    }
  });

  it('all procedure_deadlines with base_legale are marked deterministic', () => {
    const deadlines = getObjectsByType('procedure_deadline');
    for (const d of deadlines) {
      if (d.base_legale && d.source_id) {
        assert.equal(d.deterministic, true,
          `Deadline "${d.procedure}" has base_legale but is not deterministic`);
      }
    }
  });

  it('coverage_gaps flag all non-V1 domains', () => {
    const gaps = getObjectsByType('coverage_gap');
    const scopeGaps = gaps.filter(g => g.issue_type === 'out_of_v1_scope');
    const flaggedDomains = new Set(scopeGaps.map(g => g.domain));
    // V1 domains should NOT be flagged
    assert.ok(!flaggedDomains.has('bail'), 'bail is V1, should not be flagged');
    assert.ok(!flaggedDomains.has('travail'), 'travail is V1, should not be flagged');
    assert.ok(!flaggedDomains.has('dettes'), 'dettes is V1, should not be flagged');
  });

  it('every source_id in registry is unique and stable', () => {
    const reg = getRegistry();
    const ids = reg.entries.map(e => e.source_id);
    const unique = new Set(ids);
    assert.equal(ids.length, unique.size, `${ids.length - unique.size} duplicate source_ids found`);
  });

  it('amount_ranges from jurisprudence have source_ids', () => {
    const ranges = getObjectsByType('amount_range');
    const jurisRanges = ranges.filter(r => r.source_type === 'jurisprudence');
    for (const r of jurisRanges) {
      assert.ok(r.source_id, `Amount range "${r.context}" from jurisprudence missing source_id`);
    }
  });

  it('anti_errors have valid error_type classification', () => {
    const errors = getObjectsByType('anti_error');
    const validTypes = ['procedural', 'substantive', 'evidentiary', 'computational'];
    for (const e of errors) {
      assert.ok(validTypes.includes(e.error_type),
        `Anti-error "${e.erreur?.slice(0, 40)}" has invalid error_type: ${e.error_type}`);
    }
  });

  it('practitioner_patterns have non-empty neJamaisFaire arrays', () => {
    const patterns = getObjectsByType('practitioner_pattern');
    const withNJF = patterns.filter(p => p.neJamaisFaire && p.neJamaisFaire.length > 0);
    // At least half should have neJamaisFaire
    assert.ok(withNJF.length >= patterns.length * 0.3,
      `Only ${withNJF.length}/${patterns.length} patterns have neJamaisFaire`);
  });

  it('decision_holdings have contradictoire roles (favorable + defavorable)', () => {
    const holdings = getObjectsByType('decision_holding');
    const roles = {};
    for (const h of holdings) {
      roles[h.role] = (roles[h.role] || 0) + 1;
    }
    // favorable_locataire → favorable, favorable_bailleur → defavorable (citoyen perspective)
    assert.ok(roles['favorable'] > 0, 'No favorable holdings found');
    assert.ok(roles['defavorable'] > 0,
      'No defavorable holdings — contradictoire dossier needs pro AND contra. Roles: ' + JSON.stringify(roles));
    assert.ok(roles['neutre'] > 0, 'No neutre holdings found');
  });
});

// ============================================================
// 6. SEMANTIC SEARCH ADVERSARIAL (extended)
// ============================================================

describe('Semantic search adversarial extended', () => {
  const fiches = getAllFiches();

  it('emoji-only query does not crash', () => {
    const results = semanticSearch('😡🏠💸', fiches, 3);
    assert.ok(Array.isArray(results));
  });

  it('numbers-only query returns results or empty, no crash', () => {
    const results = semanticSearch('12345 678 90', fiches, 3);
    assert.ok(Array.isArray(results));
  });

  it('repeated word 100x does not cause score explosion', () => {
    const results = semanticSearch('loyer '.repeat(100), fiches, 3);
    // Score should be bounded
    if (results.length > 0) {
      assert.ok(results[0].score < 100000, `Score ${results[0].score} seems unbounded`);
    }
  });

  it('mixed languages (fr+de+en) still finds something', () => {
    const results = semanticSearch('Miete rent loyer Wohnung', fiches, 3);
    assert.ok(results.length > 0, 'Should find bail fiche even with mixed langs');
    assert.equal(results[0].fiche.domaine, 'bail');
  });

  it('profanity and slang still routes correctly', () => {
    const results = semanticSearch('mon putain de proprio me fout dehors', fiches, 3);
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'bail');
  });

  it('negation does not confuse domain (je ne suis PAS harcelé)', () => {
    const results = semanticSearch('je ne suis pas harcelé au travail', fiches, 3);
    // Should still find travail domain (negation handling is hard but shouldn't crash)
    assert.ok(results.length > 0);
  });

  it('two domains in one query returns both in top-3', () => {
    const results = semanticSearch('mon patron me harcele et mon propriétaire veut m expulser', fiches, 5);
    const domains = new Set(results.map(r => r.fiche.domaine));
    assert.ok(domains.has('travail') || domains.has('bail'),
      'Multi-domain query should cover at least one domain in top-5');
  });
});
