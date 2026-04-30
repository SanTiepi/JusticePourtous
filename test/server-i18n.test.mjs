import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.JB_TRANSLATION_FAKE = '1';

const PORT = 3107;
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
      res.on('data', chunk => body += chunk);
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

describe('server i18n integration', () => {
  before(async () => {
    const mod = await import('../src/server.mjs');
    server = mod.server;
    await new Promise((resolve) => server.listen(PORT, resolve));
  });

  after(async () => {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it('traduit /api/fiches/:id quand lang est fourni', async () => {
    const res = await request('/api/fiches/bail_defaut_moisissure?lang=de');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.display_lang, 'de');
    assert.equal(data.source_lang, 'fr');
    assert.ok(['fresh', 'cached'].includes(data.translation_status));
    assert.match(data.fiche.reponse.explication, /\[\[de\]\]/);
  });

  it('traduit /api/i18n/html et conserve les références protégées', async () => {
    const res = await request('/api/i18n/html', {
      method: 'POST',
      body: JSON.stringify({
        lang: 'de',
        html: '<p>CO 271 [DATE] CHF 200</p>'
      })
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.display_lang, 'de');
    assert.match(data.html, /CO 271/);
    assert.match(data.html, /\[DATE\]/);
    assert.match(data.html, /CHF 200/);
  });

  it('sert un guide localisé via /guides/<lang>/<slug>.html', async () => {
    const res = await request('/guides/de/bail_resiliation_conteste.html');
    assert.equal(res.status, 200);
    const html = res.text();
    assert.match(html, /hreflang="de"/);
    assert.match(html, /\[\[de\]\]/);
  });

  it('régression : /guides/<lang>/<slug-inexistant>.html → fallback FR (200) au lieu de 500', async () => {
    // Bug détecté tick #14 : un slug listé dans le sitemap mais sans fichier
    // physique localisé renvoyait 500 (renderGuideForLocale throw, attrapé
    // par le handler global). Désormais : try/catch + fallback vers FR
    // si le source existe, vraie 404 sinon.
    // On utilise un slug FR existant mais peu probable d'avoir une version
    // localisée pré-générée ET stable.
    const res = await request('/guides/de/bail_defaut_moisissure.html');
    assert.notEqual(res.status, 500, 'JAMAIS 500 sur guide localisé — bug régression');
    // Acceptable : 200 (traduit ou fallback FR) ou 404 (vraiment introuvable)
    assert.ok(res.status === 200 || res.status === 404,
      `attendu 200 ou 404, reçu ${res.status}`);
  });

  it('régression : /guides/<lang>/slug-totalement-inexistant.html → 404 propre', async () => {
    // Vraie 404 : ni version localisée ni source FR
    const res = await request('/guides/de/abcdef_xyz_inexistant.html');
    assert.equal(res.status, 404, 'doit être 404 (pas 500)');
  });

  it('traduit /api/search avec un payload public allégé pour éviter les latences extrêmes', async () => {
    const q = encodeURIComponent('mon propriétaire refuse de rembourser ma caution');
    const res = await request(`/api/search?q=${q}&lang=en`);
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.display_lang, 'en');
    assert.equal(data.source_lang, 'fr');
    assert.ok(['fresh', 'cached'].includes(data.translation_status));
    assert.match(data.fiche.reponse.explication, /\[\[en\]\]/);
    assert.ok(!('patterns' in data), 'search payload should not expose unused heavy fields');
    assert.ok((data.jurisprudence || []).length <= 7, 'search payload should cap jurisprudence excerpts');
    assert.ok((data.templates || []).length <= 5, 'search payload should cap templates');
  });
});
