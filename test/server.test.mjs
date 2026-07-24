import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';

process.env.LEGAL_SAFE_MODE = '0';

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;

function fetch_(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const http = require('node:http');
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          json: () => JSON.parse(body),
          text: () => body
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Use dynamic import for http since we need require for CJS-style usage
import http from 'node:http';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          json: () => JSON.parse(body),
          text: () => body
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

describe('Server API', () => {
  before(() => {
    return new Promise((resolve) => {
      server.listen(PORT, resolve);
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('GET / retourne 200 HTML', async () => {
    const res = await request('/');
    assert.equal(res.status, 200);
    const text = res.text();
    assert.ok(text.includes('JusticePourtous'));
  });

  it('GET /api/health retourne 200', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.status, 'ok');
  });

  it('GET /api/domaines retourne les domaines', async () => {
    const res = await request('/api/domaines');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.domaines.length >= 5, `Au moins 5 domaines, trouvé ${data.domaines.length}`);
  });

  it('POST /api/consulter valide retourne fiche', async () => {
    const res = await request('/api/consulter', {
      method: 'POST',
      body: JSON.stringify({
        domaine: 'bail',
        reponses: ['moisissure'],
        canton: 'VD'
      })
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.fiche);
    assert.ok(data.fiche.id);
  });

  it('GET /api/services/VD retourne services', async () => {
    const res = await request('/api/services/VD');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.services.length >= 3);
  });

  it('GET /api/fiches/bail_defaut_moisissure retourne fiche complete', async () => {
    const res = await request('/api/fiches/bail_defaut_moisissure');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.fiche);
    assert.equal(data.fiche.id, 'bail_defaut_moisissure');
    assert.ok(data.fiche.reponse.explication);
    assert.ok(data.fiche.reponse.articles.length > 0);
  });

  it('GET /api/fiches/:id retourne anti-erreurs + vulgarisation (parité /api/search)', async () => {
    // Régression : avant le fix f6b3f72, /api/fiches/:id ne retournait QUE
    // la fiche brute. Les users qui arrivaient direct (lien partagé, SEO)
    // ne voyaient pas les anti-erreurs ni la vulgarisation citoyenne.
    const res = await request('/api/fiches/bail_defaut_moisissure');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(Array.isArray(data.antiErreurs), 'antiErreurs doit être présent (array)');
    assert.ok(data.antiErreurs.length > 0, 'au moins 1 anti-erreur du domaine bail');
    assert.ok(data.vulgarisation, 'vulgarisation ASLOCA doit être présente sur cette fiche');
  });

  it('GET /api/fiches/:id expose claude_legal_review_date sur fiches reviewées', async () => {
    // Régression : trust badge frontend dépend de ce champ. Si stripé du
    // payload (ex: STRUCTURED_SKIP_KEYS), le badge ne s'affiche pas.
    const res = await request('/api/fiches/bail_defaut_moisissure');
    assert.equal(res.status, 200);
    const data = res.json();
    // bail_defaut_moisissure a été legal-reviewed le 2026-04-29
    assert.ok(data.fiche.claude_legal_review_date,
      'claude_legal_review_date doit être exposé pour les fiches reviewées');
    assert.match(data.fiche.claude_legal_review_date, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('GET /api/stats retourne stats publiques sans auth', async () => {
    // Régression : endpoint public de transparence (pas d'auth requise).
    const res = await request('/api/stats');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.corpus, 'corpus présent');
    assert.equal(typeof data.corpus.total_fiches, 'number');
    assert.ok(data.corpus.total_fiches >= 200);
    assert.equal(typeof data.corpus.fiches_actionnables, 'number');
    assert.ok(data.qualite, 'qualite présent');
    assert.equal(typeof data.qualite.claude_legal_reviewed, 'number');
    assert.equal(typeof data.qualite.claude_legal_reviewed_pct, 'number');
    assert.ok(data.meta);
    assert.ok(data.meta.legal_review_disclaimer.includes('avocat'),
      'disclaimer doit mentionner que ce n\'est pas un avocat humain');
  });

  it('GET /api/search court-circuite en safety_stop sur un signal de violence', async () => {
    // Régression critique : la barre de recherche du hero (entrée la plus
    // visible) passe par /api/search. Sans ce court-circuit, une victime de
    // violence recevait une fiche générique au lieu du protocole d'urgence.
    const res = await request('/api/search?q=' + encodeURIComponent('mon mari me frappe et menace de me tuer'));
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.status, 'safety_stop', 'doit déclencher safety_stop, pas une fiche');
    assert.ok(data.safety_response, 'safety_response présent');
    assert.ok(Array.isArray(data.safety_response.resources) && data.safety_response.resources.length > 0,
      'ressources d\'urgence présentes');
    assert.ok(data.safety_response.resources.some(r => r.phone === '117'), 'le 117 doit figurer');
  });

  it('GET /api/search?safety_ack=1 poursuit la recherche malgré le signal', async () => {
    // "Continuer quand même" : l'usager a vu l'écran sécurité et choisit de
    // poursuivre — on ne doit plus court-circuiter.
    const res = await request('/api/search?safety_ack=1&q=' + encodeURIComponent('mon mari me frappe et menace de me tuer'));
    assert.equal(res.status, 200);
    const data = res.json();
    assert.notEqual(data.status, 'safety_stop', 'safety_ack=1 doit lever le court-circuit');
  });

  it('404 sur route inconnue', async () => {
    const res = await request('/api/inexistant');
    assert.equal(res.status, 404);
  });

  it('headers securite (CSP, X-Content-Type-Options)', async () => {
    const res = await request('/api/health');
    assert.ok(res.headers['x-content-type-options']);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['content-security-policy']);
  });
});
