import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';

const PORT = 9879;
const BASE = `http://localhost:${PORT}`;

async function httpPost(path, body) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.default.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

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

describe('Triage Engine', () => {
  before(() => new Promise(resolve => server.listen(PORT, resolve)));
  after(() => new Promise(resolve => server.close(resolve)));

  // --- Core: the triage always returns a structured result ---

  it('retourne un résultat structuré pour moisissure', async () => {
    const res = await httpPost('/api/triage', { texte: 'mon appart est moisi', canton: 'VD' });
    assert.equal(res.status, 200);
    assert.ok(res.data.trouve, 'Doit trouver une fiche');
    assert.equal(res.data.domaine, 'bail');
    assert.ok(res.data.diagnostic);
    assert.ok(res.data.contacts.length > 0);
    assert.ok(res.data.disclaimer);
    assert.ok(['simple', 'moyen', 'complexe'].includes(res.data.complexite));
  });

  it('retourne un résultat pour harcèlement', async () => {
    const res = await httpPost('/api/triage', { texte: 'mon patron me harcèle au travail' });
    assert.equal(res.status, 200);
    assert.ok(res.data.trouve);
    assert.equal(res.data.domaine, 'travail');
  });

  it('retourne un résultat pour dettes', async () => {
    const res = await httpPost('/api/triage', { texte: "j'ai reçu un commandement de payer" });
    assert.equal(res.status, 200);
    assert.ok(res.data.trouve);
    assert.ok(['dettes', 'bail'].includes(res.data.domaine));
  });

  it('retourne un résultat pour loyer', async () => {
    const res = await httpPost('/api/triage', { texte: 'mon loyer est trop cher' });
    assert.equal(res.status, 200);
    assert.ok(res.data.trouve);
    assert.equal(res.data.domaine, 'bail');
  });

  // --- Complexity scoring is data-driven ---

  it('le score de complexité est calculé sur les données', async () => {
    const res = await httpPost('/api/triage', { texte: 'moisissure logement' });
    assert.equal(res.status, 200);
    assert.ok(typeof res.data.complexiteScore === 'number');
    assert.ok(res.data.complexiteScore >= 0 && res.data.complexiteScore <= 100);
  });

  // --- API contract ---

  it('retourne tous les champs requis', async () => {
    const res = await httpPost('/api/triage', { texte: 'problème de loyer', canton: 'GE' });
    assert.equal(res.status, 200);
    const required = ['complexite', 'besoinAvocat', 'urgence', 'diagnostic', 'disclaimer'];
    for (const field of required) {
      assert.ok(res.data[field] !== undefined, `Champ '${field}' manquant`);
    }
  });

  it('GET /api/triage?q=... fonctionne', async () => {
    const res = await httpGet('/api/triage?q=moisissure&canton=VD');
    assert.equal(res.status, 200);
    assert.ok(res.data.domaine || res.data.diagnostic);
  });

  it('400 sans texte', async () => {
    const res = await httpPost('/api/triage', {});
    assert.equal(res.status, 400);
  });

  it('gère un texte sans correspondance', async () => {
    const res = await httpPost('/api/triage', { texte: 'problème extraterrestre sur mars' });
    assert.equal(res.status, 200);
    assert.ok(res.data.diagnostic);
  });

  it('filtre les contacts par canton', async () => {
    const res = await httpPost('/api/triage', { texte: 'moisissure', canton: 'VD' });
    assert.equal(res.status, 200);
    for (const c of (res.data.contacts || [])) {
      if (c.cantons) assert.ok(c.cantons.includes('VD'));
    }
  });

  // --- Cost estimation ---

  it('GET /api/triage/cost retourne les prix', async () => {
    const res = await httpGet('/api/triage/cost?type=triage');
    assert.equal(res.status, 200);
    assert.ok(res.data.min);
    assert.ok(res.data.description);
  });

  // --- Fallback mode ---

  it('fonctionne en mode basique sans clé API', async () => {
    const res = await httpPost('/api/triage', { texte: 'moisissure dans mon appartement' });
    assert.equal(res.status, 200);
    // Should work regardless of LLM availability
    assert.ok(res.data.diagnostic);
    assert.ok(res.data.disclaimer);
  });
});
