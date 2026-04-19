import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSourceRegistry, getRegistry, getRegistryStats,
  getSourceById, getSourceByRef, getSourceBySignature,
  getSourcesByTier, getSourcesByDomain,
  resolveSources, validateClaimSources,
  articleSourceId, arretSourceId
} from '../src/services/source-registry.mjs';
import { server } from '../src/server.mjs';

// Port 0 = OS-assigned, évite les collisions EADDRINUSE quand plusieurs
// fichiers de test démarrent le même `server` en parallèle.
let BASE = '';

async function httpGet(path) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    http.default.get(`${BASE}${path}`, res => {
      let body = '';
      res.on('data', c => body += c);
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

describe('Source Registry', () => {

  // --- Unit tests (no server needed) ---

  describe('sourceId generation', () => {
    it('generates stable article source_id', () => {
      const id = articleSourceId('CO 259a', 'RS 220');
      assert.equal(id, 'fedlex:rs220:co-259a');
    });

    it('generates stable arret source_id', () => {
      const id = arretSourceId('4A_32/2018', 'TF');
      assert.equal(id, 'juris:tf:4a_32-2018');
    });

    it('source_id is deterministic (same input → same output)', () => {
      const id1 = articleSourceId('CO 259a', 'RS 220');
      const id2 = articleSourceId('CO 259a', 'RS 220');
      assert.equal(id1, id2);
    });
  });

  describe('registry build', () => {
    it('builds registry with entries', () => {
      const reg = buildSourceRegistry();
      assert.ok(reg.totalSources > 0, 'At least 1 source');
      assert.ok(reg.entries.length > 0);
      assert.ok(reg.generatedAt);
      assert.equal(reg.version, '1.0.0');
    });

    it('has all 3 tiers populated', () => {
      const reg = getRegistry();
      assert.ok(reg.byTier[1] > 0, 'Tier 1 has sources');
      assert.ok(reg.byTier[2] > 0, 'Tier 2 has sources');
      assert.ok(reg.byTier[3] > 0, 'Tier 3 has sources');
    });

    it('tier 1 > tier 2 for law-heavy corpus', () => {
      const reg = getRegistry();
      assert.ok(reg.byTier[1] >= reg.byTier[2], 'More binding sources than quasi-official');
    });

    it('each entry has required fields (constitution)', () => {
      const reg = getRegistry();
      for (const entry of reg.entries.slice(0, 50)) {
        assert.ok(entry.source_id, `Missing source_id on ${JSON.stringify(entry).slice(0, 80)}`);
        assert.ok(entry.tier >= 1 && entry.tier <= 3, `Invalid tier ${entry.tier}`);
        assert.ok(entry.binding_strength, `Missing binding_strength`);
        assert.ok(entry.statut_validite, `Missing statut_validite`);
        assert.ok(Array.isArray(entry.perimetre), `perimetre must be array`);
      }
    });

    it('no duplicate source_ids', () => {
      const reg = getRegistry();
      const seen = new Set();
      for (const e of reg.entries) {
        assert.ok(!seen.has(e.source_id), `Duplicate source_id: ${e.source_id}`);
        seen.add(e.source_id);
      }
    });
  });

  describe('lookups', () => {
    it('getSourceByRef finds CO 259a', () => {
      const src = getSourceByRef('CO 259a');
      assert.ok(src, 'CO 259a should exist');
      assert.equal(src.type, 'article');
      assert.equal(src.tier, 1);
      assert.equal(src.binding_strength, 'decisif');
    });

    it('getSourceBySignature finds a TF decision', () => {
      const src = getSourceBySignature('4A_32/2018');
      assert.ok(src, '4A_32/2018 should exist');
      assert.equal(src.type, 'arret');
      assert.ok(src.tier <= 2, 'TF decisions are tier 1 or 2');
    });

    it('getSourceById round-trips article', () => {
      const id = articleSourceId('CO 259a', 'RS 220');
      const src = getSourceById(id);
      assert.ok(src);
      assert.equal(src.ref, 'CO 259a');
    });

    it('getSourceById returns null for unknown', () => {
      assert.equal(getSourceById('does-not-exist'), null);
    });
  });

  describe('filtering', () => {
    it('getSourcesByTier(1) returns only tier 1', () => {
      const sources = getSourcesByTier(1);
      assert.ok(sources.length > 0);
      assert.ok(sources.every(s => s.tier === 1));
    });

    it('getSourcesByDomain bail returns bail sources', () => {
      const sources = getSourcesByDomain('bail');
      assert.ok(sources.length > 0);
      assert.ok(sources.every(s => s.perimetre.includes('bail')));
    });
  });

  describe('resolveSources', () => {
    it('resolves known source_ids', () => {
      const id = articleSourceId('CO 259a', 'RS 220');
      const { resolved, missing } = resolveSources([id]);
      assert.equal(resolved.length, 1);
      assert.equal(missing.length, 0);
    });

    it('reports missing source_ids', () => {
      const { resolved, missing } = resolveSources(['fake:id:123']);
      assert.equal(resolved.length, 0);
      assert.equal(missing.length, 1);
      assert.equal(missing[0], 'fake:id:123');
    });
  });

  describe('validateClaimSources', () => {
    it('valid if has tier 1 source', () => {
      const id = articleSourceId('CO 259a', 'RS 220');
      const result = validateClaimSources([id]);
      assert.equal(result.valid, true);
      assert.equal(result.hasBindingSource, true);
    });

    it('flags missing source_id', () => {
      const result = validateClaimSources(['nonexistent:source']);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some(i => i.issue === 'source_not_found'));
    });

    it('flags no binding source when only tier 3', () => {
      const reg = getRegistry();
      const tier3 = reg.entries.find(e => e.tier === 3);
      if (tier3) {
        const result = validateClaimSources([tier3.source_id]);
        assert.ok(result.issues.some(i => i.issue === 'no_binding_source'));
      }
    });
  });

  describe('getRegistryStats', () => {
    it('returns summary with all fields', () => {
      const stats = getRegistryStats();
      assert.ok(stats.totalSources > 0);
      assert.ok(stats.byTier);
      assert.ok(stats.byType);
      assert.ok(stats.freshness);
      assert.ok(stats.tiers);
      assert.ok(stats.version);
    });
  });

  // --- API tests (server needed) ---

  describe('API endpoints', () => {
    before(() => new Promise(resolve => {
      server.listen(0, () => {
        BASE = `http://localhost:${server.address().port}`;
        resolve();
      });
    }));
    after(() => new Promise(resolve => server.close(resolve)));

    it('GET /api/sources/stats returns registry stats', async () => {
      const res = await httpGet('/api/sources/stats');
      assert.equal(res.status, 200);
      assert.ok(res.data.totalSources > 0);
      assert.ok(res.data.byTier);
      assert.ok(res.data.disclaimer);
    });

    it('GET /api/sources/tier?tier=1 returns tier 1 sources', async () => {
      const res = await httpGet('/api/sources/tier?tier=1');
      assert.equal(res.status, 200);
      assert.ok(res.data.count > 0);
      assert.ok(res.data.sources.every(s => s.tier === 1));
    });

    it('GET /api/sources/tier without param returns 400', async () => {
      const res = await httpGet('/api/sources/tier');
      assert.equal(res.status, 400);
    });

    it('GET /api/sources/domain?domaine=bail returns bail sources', async () => {
      const res = await httpGet('/api/sources/domain?domaine=bail');
      assert.equal(res.status, 200);
      assert.ok(res.data.count > 0);
      assert.equal(res.data.domaine, 'bail');
    });

    it('GET /api/sources/:id returns a source', async () => {
      const id = encodeURIComponent(articleSourceId('CO 259a', 'RS 220'));
      const res = await httpGet(`/api/sources/${id}`);
      assert.equal(res.status, 200);
      assert.equal(res.data.type, 'article');
      assert.equal(res.data.tier, 1);
    });

    it('GET /api/sources/:id returns 404 for unknown', async () => {
      const res = await httpGet('/api/sources/fake:source');
      assert.equal(res.status, 404);
    });

    it('POST /api/sources/validate validates source_ids', async () => {
      const id = articleSourceId('CO 259a', 'RS 220');
      const res = await httpPost('/api/sources/validate', { source_ids: [id] });
      assert.equal(res.status, 200);
      assert.equal(res.data.valid, true);
    });

    it('POST /api/sources/validate rejects bad payload', async () => {
      const res = await httpPost('/api/sources/validate', { wrong: 'field' });
      assert.equal(res.status, 400);
    });
  });
});
