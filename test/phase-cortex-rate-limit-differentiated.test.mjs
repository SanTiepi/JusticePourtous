/**
 * Rate-limit différencié par bucket — review vague 2, Finding HAUT sécurité.
 *
 * Vérifie :
 *  - mapping path → bucket correct (premium_llm, letter_generation, validation_heavy, default)
 *  - fenêtre glissante par (ip, bucket)
 *  - 429 + Retry-After côté HTTP sur /api/premium/analyze après 10 req
 *  - bucket par défaut reste à 60/min et n'affecte pas les buckets coûteux
 *  - IPs différentes indépendantes
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  rateLimitFor,
  bucketForPath,
  RATE_LIMIT_BUCKETS,
  _resetRateLimitStores,
} from '../src/lib/http-helpers.mjs';

describe('rate-limit différencié : mapping path → bucket', () => {
  it('mappe /api/premium/analyze → premium_llm', () => {
    assert.equal(bucketForPath('/api/premium/analyze'), 'premium_llm');
    assert.equal(bucketForPath('/api/premium/analyze-v3'), 'premium_llm');
    assert.equal(bucketForPath('/api/premium/analyze-v3/refine'), 'premium_llm');
    assert.equal(bucketForPath('/api/premium/ocr'), 'premium_llm');
    assert.equal(bucketForPath('/api/premium/analyze-ocr'), 'premium_llm');
    assert.equal(bucketForPath('/api/premium/translate'), 'premium_llm');
  });

  it('mappe génération lettre / escalation → letter_generation', () => {
    assert.equal(bucketForPath('/api/premium/generate-letter'), 'letter_generation');
    assert.equal(bucketForPath('/api/triage/escalation'), 'letter_generation');
    assert.equal(bucketForPath('/api/triage/escalation/abc-123/download.json'), 'letter_generation');
    assert.equal(bucketForPath('/api/case/case-42/letter'), 'letter_generation');
  });

  it('mappe /api/sources/validate → validation_heavy', () => {
    assert.equal(bucketForPath('/api/sources/validate'), 'validation_heavy');
  });

  it('tout le reste → default', () => {
    assert.equal(bucketForPath('/api/triage'), 'default');
    assert.equal(bucketForPath('/api/health'), 'default');
    assert.equal(bucketForPath('/api/fiches'), 'default');
    assert.equal(bucketForPath('/api/domaines'), 'default');
    // Note: /api/case/X/letter/Y/download est GET — pas dans la liste fermée protégée
    assert.equal(bucketForPath('/api/case/X/letter/Y/download'), 'default');
  });
});

describe('rate-limit différencié : fenêtre glissante par bucket', () => {
  beforeEach(() => {
    _resetRateLimitStores();
  });

  it('10 premières requêtes /api/premium/analyze passent, la 11ème → 429', () => {
    const ip = '10.0.0.1';
    const t0 = 1_000_000_000_000; // timestamp fixe
    for (let i = 0; i < 10; i++) {
      const r = rateLimitFor('/api/premium/analyze', ip, t0 + i * 10);
      assert.equal(r.allowed, true, `req ${i + 1} devrait passer`);
      assert.equal(r.bucket, 'premium_llm');
    }
    const blocked = rateLimitFor('/api/premium/analyze', ip, t0 + 200);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.bucket, 'premium_llm');
    assert.ok(typeof blocked.retry_after_seconds === 'number');
    assert.ok(blocked.retry_after_seconds >= 1, 'retry_after_seconds doit être ≥ 1');
    assert.ok(blocked.retry_after_seconds <= 60, 'retry_after_seconds doit être ≤ 60');
    assert.match(blocked.reason || '', /rate_limit/);
  });

  it('bucket premium_llm saturé n\'affecte PAS bucket default pour la même IP', () => {
    const ip = '10.0.0.2';
    const t0 = 2_000_000_000_000;
    // Saturer premium_llm
    for (let i = 0; i < 10; i++) {
      rateLimitFor('/api/premium/analyze', ip, t0 + i);
    }
    const blockedLlm = rateLimitFor('/api/premium/analyze', ip, t0 + 100);
    assert.equal(blockedLlm.allowed, false);

    // Un endpoint sans bucket coûteux reste autorisé
    const okDefault = rateLimitFor('/api/triage', ip, t0 + 200);
    assert.equal(okDefault.allowed, true);
    assert.equal(okDefault.bucket, 'default');
  });

  it('après 60s, la fenêtre glisse et l\'IP peut à nouveau consommer', () => {
    const ip = '10.0.0.3';
    const t0 = 3_000_000_000_000;
    for (let i = 0; i < 10; i++) {
      rateLimitFor('/api/premium/analyze', ip, t0 + i);
    }
    // Immédiatement : bloqué
    assert.equal(rateLimitFor('/api/premium/analyze', ip, t0 + 100).allowed, false);
    // 60_001 ms plus tard : fenêtre glisse, toutes les timestamps sont expirées
    const after = rateLimitFor('/api/premium/analyze', ip, t0 + 60_001);
    assert.equal(after.allowed, true, 'après 60s la fenêtre doit glisser');
  });

  it('IPs différentes ne se blockent pas mutuellement', () => {
    const t0 = 4_000_000_000_000;
    const ipA = '10.1.0.1';
    const ipB = '10.1.0.2';
    // ipA sature premium_llm
    for (let i = 0; i < 10; i++) {
      rateLimitFor('/api/premium/analyze', ipA, t0 + i);
    }
    assert.equal(rateLimitFor('/api/premium/analyze', ipA, t0 + 100).allowed, false);
    // ipB n'a rien consommé
    assert.equal(rateLimitFor('/api/premium/analyze', ipB, t0 + 200).allowed, true);
  });

  it('validation_heavy: 20 req/min (bucket dédié)', () => {
    const ip = '10.2.0.1';
    const t0 = 5_000_000_000_000;
    for (let i = 0; i < 20; i++) {
      const r = rateLimitFor('/api/sources/validate', ip, t0 + i);
      assert.equal(r.allowed, true, `validate req ${i + 1}/20 doit passer`);
      assert.equal(r.bucket, 'validation_heavy');
    }
    const blocked = rateLimitFor('/api/sources/validate', ip, t0 + 100);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.bucket, 'validation_heavy');
    assert.ok(blocked.retry_after_seconds >= 1);
  });

  it('letter_generation: 10 req/min (bucket dédié)', () => {
    const ip = '10.3.0.1';
    const t0 = 6_000_000_000_000;
    for (let i = 0; i < 10; i++) {
      const r = rateLimitFor('/api/premium/generate-letter', ip, t0 + i);
      assert.equal(r.allowed, true);
      assert.equal(r.bucket, 'letter_generation');
    }
    const blocked = rateLimitFor('/api/premium/generate-letter', ip, t0 + 100);
    assert.equal(blocked.allowed, false);
  });

  it('bucket default reste à 60/min (rétro-compat)', () => {
    assert.equal(RATE_LIMIT_BUCKETS.default.max, 60);
    const ip = '10.4.0.1';
    const t0 = 7_000_000_000_000;
    for (let i = 0; i < 60; i++) {
      const r = rateLimitFor('/api/triage', ip, t0 + i);
      assert.equal(r.allowed, true, `default req ${i + 1}/60 doit passer`);
      assert.equal(r.bucket, 'default');
    }
    const blocked = rateLimitFor('/api/triage', ip, t0 + 100);
    assert.equal(blocked.allowed, false);
  });
});

// ─── Test d'intégration HTTP : 429 + Retry-After sur /api/premium/analyze ───

const PORT = 3088;
const BASE = `http://localhost:${PORT}`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          json: () => { try { return JSON.parse(body); } catch { return null; } },
          text: () => body,
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

describe('rate-limit différencié : intégration HTTP', () => {
  let server;

  before(async () => {
    _resetRateLimitStores();
    const mod = await import('../src/server.mjs');
    server = mod.server;
    await new Promise((resolve) => server.listen(PORT, resolve));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('11ème requête /api/premium/analyze → 429 avec Retry-After header numérique', async () => {
    const ip = '203.0.113.42'; // IP dédiée à ce test (TEST-NET-3)
    const body = JSON.stringify({ text: 'test' });
    const headers = { 'x-forwarded-for': ip };

    // 10 premières requêtes : le handler peut répondre 400/401/402 (validation)
    // mais ne doit pas être 429
    let saw429 = false;
    let retryAfter = null;
    for (let i = 0; i < 11; i++) {
      const res = await request('/api/premium/analyze', {
        method: 'POST', body, headers,
      });
      if (i < 10) {
        assert.notEqual(res.status, 429, `req ${i + 1} ne doit pas être 429`);
      } else {
        if (res.status === 429) {
          saw429 = true;
          retryAfter = res.headers['retry-after'];
        }
      }
    }
    assert.equal(saw429, true, '11ème requête /api/premium/analyze doit renvoyer 429');
    assert.ok(retryAfter, 'header Retry-After doit être présent');
    const retryNum = Number(retryAfter);
    assert.ok(Number.isFinite(retryNum), `Retry-After doit être numérique, reçu: ${retryAfter}`);
    assert.ok(retryNum >= 1 && retryNum <= 60, `Retry-After dans [1,60], reçu: ${retryNum}`);
  });

  it('IP différente non impactée : /api/premium/analyze passe à nouveau', async () => {
    const ip = '203.0.113.43'; // autre IP de test
    const res = await request('/api/premium/analyze', {
      method: 'POST',
      body: JSON.stringify({ text: 'test' }),
      headers: { 'x-forwarded-for': ip },
    });
    assert.notEqual(res.status, 429, 'IP neuve ne doit pas être rate-limitée');
  });
});
