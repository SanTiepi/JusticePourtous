import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeFrontier, getNextIngestionPriorities, getSourceCatalog, SOURCE_CATALOG
} from '../src/services/source-frontier.mjs';
import { server } from '../src/server.mjs';

const PORT = 9884;
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

describe('Source Frontier', () => {

  describe('catalog', () => {
    it('has at least 15 sources cataloged', () => {
      const catalog = getSourceCatalog();
      assert.ok(catalog.length >= 15, `Only ${catalog.length} sources cataloged`);
    });

    it('each source has required fields', () => {
      for (const src of getSourceCatalog()) {
        assert.ok(src.id, 'missing id');
        assert.ok(src.name, `${src.id} missing name`);
        assert.ok(src.type, `${src.id} missing type`);
        assert.ok(src.tier >= 1 && src.tier <= 3, `${src.id} invalid tier`);
        assert.ok(Array.isArray(src.domaines), `${src.id} domaines not array`);
        assert.ok(src.our_status, `${src.id} missing our_status`);
      }
    });

    it('covers all 3 V1 domains', () => {
      const catalog = getSourceCatalog();
      const domaines = new Set(catalog.flatMap(s => s.domaines));
      assert.ok(domaines.has('bail'), 'bail missing');
      assert.ok(domaines.has('travail'), 'travail missing');
      assert.ok(domaines.has('dettes'), 'dettes missing');
    });

    it('has sources at all 3 tiers', () => {
      const catalog = getSourceCatalog();
      const tiers = new Set(catalog.map(s => s.tier));
      assert.ok(tiers.has(1), 'no tier 1 sources');
      assert.ok(tiers.has(2), 'no tier 2 sources');
      assert.ok(tiers.has(3), 'no tier 3 sources');
    });

    it('has at least 2 already ingested sources', () => {
      const ingested = getSourceCatalog().filter(s => s.our_status === 'ingested');
      assert.ok(ingested.length >= 2, `Only ${ingested.length} ingested`);
    });
  });

  describe('analyzeFrontier', () => {
    it('returns coverage analysis with all fields', () => {
      const analysis = analyzeFrontier();
      assert.ok(analysis.total_sources_known >= 15);
      assert.ok(analysis.ingested >= 2);
      assert.ok(analysis.not_mapped >= 5);
      assert.ok(analysis.coverage_rate);
      assert.ok(analysis.by_domain);
      assert.ok(analysis.by_domain.bail);
      assert.ok(analysis.by_domain.travail);
      assert.ok(analysis.by_domain.dettes);
    });

    it('high_value_gaps identifies sources that impact golden cases', () => {
      const analysis = analyzeFrontier();
      assert.ok(analysis.high_value_gaps.length > 0, 'Should have high-value gaps');
      for (const gap of analysis.high_value_gaps) {
        assert.ok(gap.impacts_golden_cases?.length > 0, `${gap.id} should impact golden cases`);
      }
    });

    it('each domain has gaps identified', () => {
      const analysis = analyzeFrontier();
      for (const domain of ['bail', 'travail', 'dettes']) {
        const d = analysis.by_domain[domain];
        assert.ok(d, `${domain} missing from analysis`);
        assert.ok(d.mapped > 0, `${domain} has 0 mapped sources`);
      }
    });
  });

  describe('getNextIngestionPriorities', () => {
    it('returns ranked list of sources to ingest', () => {
      const priorities = getNextIngestionPriorities(5);
      assert.ok(priorities.length > 0);
      assert.ok(priorities.length <= 5);
      // Ranked by score descending
      for (let i = 1; i < priorities.length; i++) {
        assert.ok(priorities[i].priority_score <= priorities[i-1].priority_score,
          `Priority ${i} score ${priorities[i].priority_score} > ${priorities[i-1].priority_score}`);
      }
    });

    it('top priorities impact V1 domains', () => {
      const top = getNextIngestionPriorities(3);
      const v1 = ['bail', 'travail', 'dettes'];
      for (const p of top) {
        const hasV1 = p.domaines.some(d => v1.includes(d));
        assert.ok(hasV1, `Top priority ${p.id} doesn't impact V1 domains: ${p.domaines}`);
      }
    });

    it('does not include already ingested sources', () => {
      const priorities = getNextIngestionPriorities(20);
      for (const p of priorities) {
        assert.notEqual(p.our_status, 'ingested', `${p.id} is already ingested`);
      }
    });
  });

  describe('API', () => {
    before(() => new Promise(resolve => server.listen(PORT, resolve)));
    after(() => new Promise(resolve => server.close(resolve)));

    it('GET /api/frontier/analysis returns full analysis', async () => {
      const res = await httpGet('/api/frontier/analysis');
      assert.equal(res.status, 200);
      assert.ok(res.data.total_sources_known >= 15);
      assert.ok(res.data.high_value_gaps);
      assert.ok(res.data.disclaimer);
    });

    it('GET /api/frontier/priorities returns ranked priorities', async () => {
      const res = await httpGet('/api/frontier/priorities?n=5');
      assert.equal(res.status, 200);
      assert.ok(res.data.priorities.length > 0);
      assert.ok(res.data.priorities.length <= 5);
    });

    it('GET /api/frontier/catalog returns full catalog', async () => {
      const res = await httpGet('/api/frontier/catalog');
      assert.equal(res.status, 200);
      assert.ok(res.data.count >= 15);
    });
  });
});
