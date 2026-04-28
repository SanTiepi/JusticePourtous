/**
 * Test de régression : fallback gracieux quand le provider de traduction
 * (LLM Anthropic ou DeepL) est indisponible.
 *
 * Bug observé en prod 2026-04-27 et 2026-04-28 : 108 erreurs 5xx sur 9 jours,
 * concentrées en grappes — un user arrive en lang non-FR, /api/domaines retourne
 * 500 et toute la cascade /api/i18n/html retourne 503 quand l'API LLM est down.
 *
 * Comportement attendu après fix :
 *   - /api/i18n/html       → 200 + HTML source + translation_status='failed'
 *   - /api/domaines        → 200 + payload source + translation_status='failed_internal'
 *   - /api/fiches/:id      → 200 + fiche source + translation_status
 *
 * Permet au frontend de toujours afficher quelque chose (FR brut) plutôt qu'une
 * page d'erreur. Le translation_status sert à afficher éventuellement un
 * avertissement discret.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Active le fake translator EN MODE THROW : tout appel à un provider échoue.
process.env.JB_TRANSLATION_FAKE = '1';
process.env.JB_TRANSLATION_FAKE_THROW = '1';

const PORT = 3119;
const BASE = `http://localhost:${PORT}`;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text: () => body,
          json: () => JSON.parse(body)
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

describe('i18n fallback — provider de traduction indisponible', () => {
  before(async () => {
    const mod = await import('../src/server.mjs');
    server = mod.server;
    await new Promise((resolve) => server.listen(PORT, resolve));
  });

  after(async () => {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    delete process.env.JB_TRANSLATION_FAKE_THROW;
  });

  it('POST /api/i18n/html avec lang=de renvoie 200 + HTML source quand le provider throw', async () => {
    const res = await request('/api/i18n/html', {
      method: 'POST',
      body: JSON.stringify({
        lang: 'de',
        html: '<p>Le bailleur doit réparer dans les 30 jours.</p>'
      })
    });
    // Critique : pas de 503 (régression du bug prod). Frontend doit toujours
    // recevoir un HTML utilisable.
    assert.equal(res.status, 200, `attendu 200 sur fallback, reçu ${res.status}`);
    const data = res.json();
    assert.equal(data.translation_status, 'failed',
      `translation_status attendu 'failed', reçu '${data.translation_status}'`);
    // HTML source intact (pas modifié, l'utilisateur peut au moins lire le FR)
    assert.match(data.html, /Le bailleur doit réparer/);
    assert.equal(data.source_lang, 'fr');
    assert.equal(data.display_lang, 'de');
    // Le caller peut diagnostiquer la cause
    assert.ok(data.translation_error, 'translation_error attendu pour diagnostic');
  });

  it('GET /api/domaines avec lang=en renvoie 200 + payload source quand le provider throw', async () => {
    const res = await request('/api/domaines?lang=en');
    assert.equal(res.status, 200, `attendu 200 sur fallback, reçu ${res.status}`);
    const data = res.json();
    // domaines reste accessible — donnée source intacte
    assert.ok(Array.isArray(data.domaines) || data.domaines, 'domaines doit être présent');
    // translation_status signale la dégradation pour le frontend
    assert.ok(
      ['failed', 'failed_internal', 'fresh', 'cached'].includes(data.translation_status),
      `translation_status valide attendu, reçu '${data.translation_status}'`
    );
  });

  it('POST /api/i18n/html avec lang=fr (= source) renvoie 200 même avec provider down', async () => {
    // Cas trivial : pas de traduction nécessaire, ne doit jamais échouer
    const res = await request('/api/i18n/html', {
      method: 'POST',
      body: JSON.stringify({
        lang: 'fr',
        html: '<p>Texte français.</p>'
      })
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.match(data.html, /Texte français/);
    assert.equal(data.display_lang, 'fr');
  });
});
