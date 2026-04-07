import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';

const PORT = 9876;
const BASE = `http://localhost:${PORT}`;

function fetch(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const http = require('node:http');
    http.get(url, res => {
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

// Use dynamic import for http.get since we're ESM
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

describe('Statistiques API', () => {
  before(() => new Promise(resolve => server.listen(PORT, resolve)));
  after(() => new Promise(resolve => server.close(resolve)));

  it('GET /api/statistiques retourne des donnees', async () => {
    const res = await httpGet('/api/statistiques');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.statistiques));
    assert.ok(res.data.statistiques.length >= 10, 'Au moins 10 procedures');
    assert.ok(res.data.total >= 10);
  });

  it('chaque statistique a un domaine et une source', async () => {
    const res = await httpGet('/api/statistiques');
    for (const stat of res.data.statistiques) {
      assert.ok(stat.domaine, `domaine manquant pour: ${stat.procedure}`);
      assert.ok(stat.procedure, 'procedure manquante');
      // Au moins une source (sourceSucces ou sourceVolume)
      const hasSource = stat.sourceSucces || stat.sourceVolume;
      assert.ok(hasSource, `source manquante pour: ${stat.procedure}`);
    }
  });

  it('GET /api/statistiques/:domaine filtre correctement', async () => {
    const res = await httpGet('/api/statistiques/bail');
    assert.equal(res.status, 200);
    assert.ok(res.data.statistiques.length >= 1);
    assert.equal(res.data.domaine, 'bail');
    for (const stat of res.data.statistiques) {
      assert.equal(stat.domaine, 'bail');
    }
  });

  it('GET /api/statistiques/:domaine retourne 404 pour domaine inconnu', async () => {
    const res = await httpGet('/api/statistiques/inexistant');
    assert.equal(res.status, 404);
    assert.ok(res.data.error);
    assert.ok(res.data.error.includes('inexistant'));
  });

  it('chaque statistique a les champs requis du schema', async () => {
    const res = await httpGet('/api/statistiques');
    const requiredFields = ['procedure', 'domaine', 'conseilPratique', 'risques'];
    for (const stat of res.data.statistiques) {
      for (const field of requiredFields) {
        assert.ok(stat[field] !== undefined, `champ "${field}" manquant pour: ${stat.procedure}`);
        assert.ok(typeof stat[field] === 'string' && stat[field].length > 0,
          `champ "${field}" vide pour: ${stat.procedure}`);
      }
    }
  });
});
