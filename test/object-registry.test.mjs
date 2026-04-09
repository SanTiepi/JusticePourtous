import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  getObjectRegistry, getObjectStats, getObjectsByType,
  getObjectById, getObjectsByDomain, getDossierObjects,
  VERIFIED_CLAIM_SCHEMA
} from '../src/services/object-registry.mjs';
import { server } from '../src/server.mjs';

const PORT = 9882;
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

describe('Object Registry', () => {

  // --- Unit tests ---

  describe('registry build', () => {
    it('builds all 9 object collections', () => {
      const reg = getObjectRegistry();
      assert.ok(reg.norm_fragments.length > 0, 'norm_fragments populated');
      assert.ok(reg.decision_holdings.length > 0, 'decision_holdings populated');
      assert.ok(reg.proof_requirements.length > 0, 'proof_requirements populated');
      assert.ok(reg.procedure_deadlines.length > 0, 'procedure_deadlines populated');
      assert.ok(reg.amount_ranges.length > 0, 'amount_ranges populated');
      assert.ok(reg.anti_errors.length > 0, 'anti_errors populated');
      assert.ok(reg.practitioner_patterns.length > 0, 'practitioner_patterns populated');
      assert.ok(reg.coverage_gaps.length > 0, 'coverage_gaps populated');
      // authority_contacts may be 0 if escalade data is sparse — check exists
      assert.ok(Array.isArray(reg.authority_contacts));
    });
  });

  describe('norm_fragment', () => {
    it('has required evidence fields', () => {
      const fragments = getObjectsByType('norm_fragment');
      const sample = fragments[0];
      assert.equal(sample.object_type, 'norm_fragment');
      assert.ok(sample.source_id, 'has source_id');
      assert.ok(sample.ref, 'has ref');
      assert.ok(sample.tier >= 1 && sample.tier <= 3, 'valid tier');
      assert.ok(sample.binding_strength, 'has binding_strength');
      assert.ok(sample.verification_status, 'has verification_status');
      assert.ok(sample.freshness_status, 'has freshness_status');
    });

    it('Fedlex articles are tier 1 verified', () => {
      const fragments = getObjectsByType('norm_fragment');
      const fedlex = fragments.filter(f => f.lienFedlex);
      assert.ok(fedlex.length > 0, 'has fedlex articles');
      for (const f of fedlex.slice(0, 10)) {
        assert.equal(f.tier, 1);
        assert.equal(f.verification_status, 'verified');
        assert.equal(f.binding_strength, 'decisif');
      }
    });
  });

  describe('decision_holding', () => {
    it('has role classification (favorable/defavorable/neutre)', () => {
      const holdings = getObjectsByType('decision_holding');
      assert.ok(holdings.length > 0);
      const roles = new Set(holdings.map(h => h.role));
      assert.ok(roles.has('favorable') || roles.has('defavorable') || roles.has('neutre'));
    });

    it('has certainty grading', () => {
      const holdings = getObjectsByType('decision_holding');
      for (const h of holdings.slice(0, 10)) {
        assert.ok(['certain', 'probable', 'variable', 'incertain', 'insufficient'].includes(h.certainty),
          `Invalid certainty: ${h.certainty}`);
      }
    });
  });

  describe('procedure_deadline', () => {
    it('marks deterministic deadlines (from law)', () => {
      const deadlines = getObjectsByType('procedure_deadline');
      const deterministic = deadlines.filter(d => d.deterministic);
      // Some should be deterministic (have base_legale)
      assert.ok(deterministic.length > 0 || deadlines.every(d => !d.base_legale),
        'deterministic flag consistent with base_legale');
    });

    it('has consequence field', () => {
      const deadlines = getObjectsByType('procedure_deadline');
      const withConsequence = deadlines.filter(d => d.consequence);
      assert.ok(withConsequence.length > 0, 'some deadlines have consequences');
    });
  });

  describe('amount_range', () => {
    it('consolidates from jurisprudence and costs', () => {
      const ranges = getObjectsByType('amount_range');
      assert.ok(ranges.length > 0);
      const types = new Set(ranges.map(r => r.source_type));
      assert.ok(types.has('jurisprudence'), 'has jurisprudence ranges');
    });

    it('has min/max fields', () => {
      const ranges = getObjectsByType('amount_range');
      const juris = ranges.filter(r => r.source_type === 'jurisprudence');
      for (const r of juris.slice(0, 5)) {
        assert.ok(r.min !== undefined, 'has min');
        assert.ok(r.max !== undefined, 'has max');
        assert.equal(r.currency, 'CHF');
      }
    });
  });

  describe('anti_error', () => {
    it('has error_type classification', () => {
      const errors = getObjectsByType('anti_error');
      assert.ok(errors.length > 0);
      for (const e of errors.slice(0, 5)) {
        assert.ok(['procedural', 'substantive', 'evidentiary', 'computational'].includes(e.error_type),
          `Invalid error_type: ${e.error_type}`);
      }
    });
  });

  describe('practitioner_pattern', () => {
    it('has strategy and neJamaisFaire', () => {
      const patterns = getObjectsByType('practitioner_pattern');
      assert.ok(patterns.length > 0);
      const sample = patterns[0];
      assert.ok(Array.isArray(sample.strategieOptimale));
      assert.ok(Array.isArray(sample.neJamaisFaire));
    });
  });

  describe('coverage_gap', () => {
    it('detects out-of-v1-scope domains', () => {
      const gaps = getObjectsByType('coverage_gap');
      const scopeGaps = gaps.filter(g => g.issue_type === 'out_of_v1_scope');
      assert.ok(scopeGaps.length > 0, 'domains outside V1 scope are flagged');
    });
  });

  describe('verified_claim schema', () => {
    it('exports schema with rules', () => {
      assert.ok(VERIFIED_CLAIM_SCHEMA.fields);
      assert.ok(VERIFIED_CLAIM_SCHEMA.rules.length > 0);
      assert.ok(VERIFIED_CLAIM_SCHEMA.fields.source_ids);
      assert.ok(VERIFIED_CLAIM_SCHEMA.fields.verification_status);
    });
  });

  describe('getObjectsByDomain', () => {
    it('filters norm_fragments by bail', () => {
      const bail = getObjectsByDomain('norm_fragment', 'bail');
      assert.ok(bail.length > 0);
      assert.ok(bail.every(f => f.domaines.includes('bail')));
    });
  });

  describe('getDossierObjects', () => {
    it('returns all object types for bail domain', () => {
      const dossier = getDossierObjects('bail');
      assert.ok(dossier.norm_fragments.length > 0, 'bail has norm_fragments');
      assert.ok(dossier.decision_holdings.length > 0, 'bail has decision_holdings');
      assert.ok(dossier.anti_errors.length > 0, 'bail has anti_errors');
      assert.ok(dossier.practitioner_patterns.length > 0, 'bail has patterns');
    });
  });

  describe('getObjectStats', () => {
    it('returns counts with verification breakdown', () => {
      const stats = getObjectStats();
      assert.ok(stats.total_objects > 0);
      assert.ok(stats.object_types >= 9);
      assert.ok(stats.stats.norm_fragments);
      assert.ok(stats.stats.norm_fragments.total > 0);
      assert.ok(stats.stats.norm_fragments.verified >= 0);
      assert.ok(stats.verified_claim_schema);
    });
  });

  // --- API tests ---

  describe('API endpoints', () => {
    before(() => new Promise(resolve => server.listen(PORT, resolve)));
    after(() => new Promise(resolve => server.close(resolve)));

    it('GET /api/objects/stats returns object stats', async () => {
      const res = await httpGet('/api/objects/stats');
      assert.equal(res.status, 200);
      assert.ok(res.data.total_objects > 0);
      assert.ok(res.data.stats);
      assert.ok(res.data.disclaimer);
    });

    it('GET /api/objects/types?type=norm_fragment returns objects', async () => {
      const res = await httpGet('/api/objects/types?type=norm_fragment');
      assert.equal(res.status, 200);
      assert.ok(res.data.count > 0);
      assert.equal(res.data.type, 'norm_fragment');
    });

    it('GET /api/objects/types without param returns 400', async () => {
      const res = await httpGet('/api/objects/types');
      assert.equal(res.status, 400);
    });

    it('GET /api/objects/domain?type=anti_error&domaine=bail returns filtered', async () => {
      const res = await httpGet('/api/objects/domain?type=anti_error&domaine=bail');
      assert.equal(res.status, 200);
      assert.ok(res.data.count > 0);
      assert.equal(res.data.domaine, 'bail');
    });

    it('GET /api/objects/dossier?domaine=bail returns full dossier', async () => {
      const res = await httpGet('/api/objects/dossier?domaine=bail');
      assert.equal(res.status, 200);
      assert.ok(res.data.counts);
      assert.ok(res.data.dossier);
      assert.ok(res.data.counts.norm_fragments > 0);
    });

    it('GET /api/objects/dossier without domaine returns 400', async () => {
      const res = await httpGet('/api/objects/dossier');
      assert.equal(res.status, 400);
    });

    it('GET /api/objects/claim-schema returns verified_claim schema', async () => {
      const res = await httpGet('/api/objects/claim-schema');
      assert.equal(res.status, 200);
      assert.ok(res.data.fields);
      assert.ok(res.data.rules);
    });
  });
});
