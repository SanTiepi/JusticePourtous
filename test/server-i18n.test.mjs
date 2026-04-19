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
});
