import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';

const PORT = 9877;
const BASE = `http://localhost:${PORT}`;

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

describe('Données juridiques API', () => {
  before(() => new Promise(resolve => server.listen(PORT, resolve)));
  after(() => new Promise(resolve => server.close(resolve)));

  // --- Loi ---
  it('GET /api/loi retourne des articles', async () => {
    const res = await httpGet('/api/loi');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.articles));
    assert.ok(res.data.total > 0, 'Au moins 1 article');
    assert.ok(res.data.disclaimer);
  });

  it('GET /api/loi?q=CO recherche dans les articles', async () => {
    const res = await httpGet('/api/loi?q=CO');
    assert.equal(res.status, 200);
    assert.ok(res.data.total > 0);
    assert.equal(res.data.query, 'CO');
  });

  // --- Jurisprudence ---
  it('GET /api/jurisprudence retourne des arrêts', async () => {
    const res = await httpGet('/api/jurisprudence');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.arrets));
    assert.ok(res.data.total > 0);
  });

  it('GET /api/jurisprudence?q=bail filtre les arrêts', async () => {
    const res = await httpGet('/api/jurisprudence?q=bail');
    assert.equal(res.status, 200);
    assert.ok(res.data.query === 'bail');
  });

  // --- Confiance ---
  it('GET /api/confiance retourne les niveaux', async () => {
    const res = await httpGet('/api/confiance');
    assert.equal(res.status, 200);
    assert.ok(res.data.disclaimer);
  });

  // --- Recevabilité ---
  it('GET /api/recevabilite retourne les conditions', async () => {
    const res = await httpGet('/api/recevabilite');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.conditions));
  });

  // --- Délais ---
  it('GET /api/delais retourne les délais', async () => {
    const res = await httpGet('/api/delais');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.delais));
  });

  it('GET /api/delais?domaine=bail filtre par domaine', async () => {
    const res = await httpGet('/api/delais?domaine=bail');
    assert.equal(res.status, 200);
    assert.equal(res.data.domaine, 'bail');
  });

  // --- Preuves ---
  it('GET /api/preuves retourne les exigences', async () => {
    const res = await httpGet('/api/preuves');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.preuves));
  });

  // --- Taxonomie ---
  it('GET /api/taxonomie retourne la taxonomie', async () => {
    const res = await httpGet('/api/taxonomie');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.taxonomie));
  });

  it('GET /api/taxonomie?q=expulser recherche', async () => {
    const res = await httpGet('/api/taxonomie?q=expulser');
    assert.equal(res.status, 200);
    assert.equal(res.data.query, 'expulser');
  });

  // --- Anti-erreurs ---
  it('GET /api/anti-erreurs retourne les erreurs', async () => {
    const res = await httpGet('/api/anti-erreurs');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.erreurs));
  });

  it('GET /api/anti-erreurs?domaine=bail filtre', async () => {
    const res = await httpGet('/api/anti-erreurs?domaine=bail');
    assert.equal(res.status, 200);
    assert.equal(res.data.domaine, 'bail');
  });

  it('anti-erreurs : chaque entrée a domaine, erreur, gravite, consequence, correction, base_legale', async () => {
    // Validation schema des entrées (regression : si une nouvelle entry mal formée
    // est ajoutée comme l'étaient mes 2 ajouts en cycle 39, on la détecte au lieu
    // d'un crash silencieux côté frontend qui consomme ces champs)
    const fs = await import('node:fs');
    const path = await import('node:path');
    const arr = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/anti-erreurs/anti-erreurs.json'), 'utf8'));
    assert.ok(arr.length >= 25, `attendu ≥ 25 anti-erreurs, reçu ${arr.length}`);
    // Vocabulary réel observé dans le corpus (FR descriptif)
    const validGravite = ['critique', 'élevée', 'moyenne', 'faible'];
    for (const ae of arr) {
      assert.ok(ae.domaine, `anti-erreur sans domaine: ${JSON.stringify(ae).slice(0, 80)}`);
      assert.ok(ae.erreur, `anti-erreur sans erreur: ${ae.domaine}`);
      assert.ok(validGravite.includes(ae.gravite), `gravite invalide: ${ae.gravite}`);
      assert.ok(ae.consequence, `anti-erreur sans consequence: ${ae.domaine}`);
      assert.ok(ae.correction, `anti-erreur sans correction: ${ae.domaine}`);
      assert.ok(ae.base_legale, `anti-erreur sans base_legale: ${ae.domaine}`);
    }
  });

  // --- Patterns ---
  it('GET /api/patterns retourne les patterns praticien', async () => {
    const res = await httpGet('/api/patterns');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.patterns));
    assert.ok(res.data.total > 0, 'Au moins 1 pattern');
  });

  it('GET /api/patterns?domaine=bail filtre', async () => {
    const res = await httpGet('/api/patterns?domaine=bail');
    assert.equal(res.status, 200);
    assert.equal(res.data.domaine, 'bail');
    assert.ok(res.data.total > 0);
  });

  // --- Cas pratiques ---
  it('GET /api/cas-pratiques retourne les cas', async () => {
    const res = await httpGet('/api/cas-pratiques');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.cas));
  });

  // --- Escalade ---
  it('GET /api/escalade retourne le réseau relais', async () => {
    const res = await httpGet('/api/escalade');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.relais));
  });

  // --- Annuaire complet ---
  it('GET /api/annuaire retourne tous les services', async () => {
    const res = await httpGet('/api/annuaire');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.services));
    assert.ok(res.data.total > 0);
  });

  it('GET /api/annuaire?canton=VD filtre par canton', async () => {
    const res = await httpGet('/api/annuaire?canton=VD');
    assert.equal(res.status, 200);
    assert.equal(res.data.canton, 'VD');
  });

  // --- Cantons ---
  it('GET /api/cantons retourne les données cantonales', async () => {
    const res = await httpGet('/api/cantons');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.cantons));
    assert.ok(res.data.total > 0);
  });

  it('GET /api/cantons/VD retourne le canton', async () => {
    const res = await httpGet('/api/cantons/VD');
    assert.equal(res.status, 200);
    assert.ok(res.data.code === 'VD');
  });

  it('GET /api/cantons/XX retourne 404', async () => {
    const res = await httpGet('/api/cantons/XX');
    assert.equal(res.status, 404);
  });

  // --- Coûts ---
  it('GET /api/couts retourne les coûts', async () => {
    const res = await httpGet('/api/couts');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.couts));
    assert.ok(res.data.total > 0);
  });

  // --- Templates ---
  it('GET /api/templates retourne les modèles', async () => {
    const res = await httpGet('/api/templates');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.templates));
    assert.ok(res.data.total > 0);
  });

  // --- Couverture ---
  it('GET /api/couverture retourne les métriques', async () => {
    const res = await httpGet('/api/couverture');
    assert.equal(res.status, 200);
    assert.ok(res.data.disclaimer);
  });
});
