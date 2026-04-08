import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';

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
