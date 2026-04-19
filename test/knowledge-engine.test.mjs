import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';

const PORT = 9878;
const BASE = `http://localhost:${PORT}`;

async function httpGet(path, { headers = {} } = {}) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    const req = http.default.get(`${BASE}${path}`, { headers }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
  });
}

describe('Knowledge Engine API', () => {
  before(() => {
    // /api/admin/* requires ADMIN_TOKEN. Set a deterministic value for tests.
    if (!process.env.ADMIN_TOKEN) process.env.ADMIN_TOKEN = 'test-admin-token';
    return new Promise(resolve => server.listen(PORT, resolve));
  });
  after(() => new Promise(resolve => server.close(resolve)));

  // --- Query by problem (citizen) ---
  describe('GET /api/query/problem', () => {
    it('trouve une fiche par mot-clé', async () => {
      const res = await httpGet('/api/query/problem?q=moisissure');
      assert.equal(res.status, 200);
      assert.ok(res.data.fiche, 'Doit retourner une fiche');
      assert.ok(res.data.fiche.id.includes('moisissure') || res.data.fiche.tags?.includes('moisissure'));
    });

    it('retourne des articles enrichis', async () => {
      const res = await httpGet('/api/query/problem?q=moisissure');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.articles), 'Doit retourner des articles');
    });

    it('retourne des anti-erreurs', async () => {
      const res = await httpGet('/api/query/problem?q=loyer');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.antiErreurs), 'Doit retourner des anti-erreurs');
    });

    it('retourne des patterns praticien', async () => {
      const res = await httpGet('/api/query/problem?q=moisissure');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.patterns));
    });

    it('retourne le niveau de confiance', async () => {
      const res = await httpGet('/api/query/problem?q=moisissure');
      assert.equal(res.status, 200);
      assert.ok(['certain', 'probable', 'variable', 'incertain'].includes(res.data.confiance));
    });

    it('retourne les lacunes (ce qu\'on ne sait pas)', async () => {
      const res = await httpGet('/api/query/problem?q=moisissure');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.lacunes));
    });

    it('retourne des fiches alternatives', async () => {
      const res = await httpGet('/api/query/problem?q=loyer');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.alternatives));
    });

    it('retourne des fiches liées', async () => {
      const res = await httpGet('/api/query/problem?q=moisissure');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.related));
      assert.ok(res.data.related.length > 0, 'Doit avoir des fiches liées');
    });

    it('filtre par canton', async () => {
      const res = await httpGet('/api/query/problem?q=moisissure&canton=VD');
      assert.equal(res.status, 200);
      // Escalade should be filtered to VD
      if (res.data.escalade?.length > 0) {
        for (const e of res.data.escalade) {
          assert.ok(!e.cantons || e.cantons.includes('VD'));
        }
      }
    });

    it('unclear si aucun résultat confiant', async () => {
      const res = await httpGet('/api/query/problem?q=xyznonexistent123');
      assert.equal(res.status, 200);
      assert.equal(res.data.type, 'unclear');
      assert.ok(res.data.message);
      assert.ok(Array.isArray(res.data.suggestions));
    });

    it('400 sans paramètre', async () => {
      const res = await httpGet('/api/query/problem');
      assert.equal(res.status, 400);
    });
  });

  // --- Query by article (lawyer) ---
  describe('GET /api/query/article', () => {
    it('retourne un article avec contexte complet', async () => {
      const res = await httpGet('/api/query/article?ref=CO%20259a');
      assert.equal(res.status, 200);
      assert.ok(res.data.article);
      assert.ok(Array.isArray(res.data.fiches));
      assert.ok(res.data.fiches.length > 0, 'CO 259a doit être lié à au moins 1 fiche');
    });

    it('retourne la jurisprudence liée', async () => {
      const res = await httpGet('/api/query/article?ref=CO%20259a');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.jurisprudence));
    });

    it('retourne les templates liés', async () => {
      const res = await httpGet('/api/query/article?ref=CO%20259a');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.templates));
    });

    it('retourne le contexte TDM', async () => {
      const res = await httpGet('/api/query/article?ref=CO%20259a');
      assert.equal(res.status, 200);
      assert.ok(res.data.tableDesMatieres);
      assert.equal(res.data.tableDesMatieres.code, 'CO');
    });

    it('gère un article non indexé', async () => {
      const res = await httpGet('/api/query/article?ref=CC%209999');
      assert.equal(res.status, 200);
      assert.equal(res.data.article.status, 'non indexé dans notre base');
    });
  });

  // --- Query by domain (association) ---
  describe('GET /api/query/domain', () => {
    it('retourne tout pour un domaine', async () => {
      const res = await httpGet('/api/query/domain?domaine=bail');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.fiches));
      assert.ok(res.data.fiches.length >= 10);
      assert.ok(Array.isArray(res.data.delais));
      assert.ok(Array.isArray(res.data.patterns));
      assert.ok(Array.isArray(res.data.antiErreurs));
      assert.ok(Array.isArray(res.data.escalade));
    });

    it('404 pour domaine inexistant', async () => {
      const res = await httpGet('/api/query/domain?domaine=inexistant');
      assert.equal(res.status, 404);
    });
  });

  // --- Query complete (enrich fiche) ---
  describe('GET /api/query/fiche/:id', () => {
    it('enrichit une fiche avec tout le contexte', async () => {
      const res = await httpGet('/api/query/fiche/bail_defaut_moisissure');
      assert.equal(res.status, 200);
      assert.ok(res.data.fiche);
      assert.ok(Array.isArray(res.data.articles));
      assert.ok(Array.isArray(res.data.templates));
      assert.ok(Array.isArray(res.data.delais));
      assert.ok(Array.isArray(res.data.antiErreurs));
      assert.ok(Array.isArray(res.data.patterns));
      assert.ok(Array.isArray(res.data.related));
      assert.ok(res.data.confiance);
      assert.ok(Array.isArray(res.data.lacunes));
      assert.ok(res.data._meta);
    });

    it('404 pour fiche inexistante', async () => {
      const res = await httpGet('/api/query/fiche/inexistant');
      assert.equal(res.status, 404);
    });
  });

  // --- Tables des matières ---
  describe('GET /api/tdm', () => {
    it('retourne toutes les TDM', async () => {
      const res = await httpGet('/api/tdm');
      assert.equal(res.status, 200);
      assert.ok(res.data.codes);
      assert.ok(res.data.codes.CO);
    });

    it('retourne une TDM spécifique', async () => {
      const res = await httpGet('/api/tdm?code=CO');
      assert.equal(res.status, 200);
      assert.ok(res.data.nom);
      assert.ok(Array.isArray(res.data.articles));
      assert.ok(res.data.total > 0);
    });

    it('404 pour code inexistant', async () => {
      const res = await httpGet('/api/tdm?code=XXX');
      assert.equal(res.status, 404);
    });
  });

  // --- Completeness dashboard ---
  describe('GET /api/admin/completeness', () => {
    it('retourne les métriques de complétude', async () => {
      const res = await httpGet('/api/admin/completeness', {
        headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN}` }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.stats);
      assert.ok(res.data.orphans);
      assert.ok(res.data.coverage);
      assert.ok(res.data.tableDesMatieres);
      assert.ok(typeof res.data.stats.totalFiches === 'number');
      assert.ok(typeof res.data.stats.missingArticleRefs === 'number');
    });
  });
});
