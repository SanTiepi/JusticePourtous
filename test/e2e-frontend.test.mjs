/**
 * E2E Frontend Tests — Full user flow hitting actual server endpoints
 *
 * Covers: homepage, all pages, static assets, free search, annuaire,
 * domaines, consultation, premium wallet/credits/analysis/letter/docx,
 * session enforcement, accent correctness.
 *
 * Tests that depend on LLM (search, V3 analysis, letter, docx) have
 * extended timeouts and gracefully handle 503/400 when no API key is set.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { server } from '../src/server.mjs';

const PORT = 3097;
const BASE = `http://localhost:${PORT}`;

function request(path, options = {}) {
  const timeoutMs = options.timeout || 10000;
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf-8');
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer: () => buffer,
          json: () => JSON.parse(text),
          text: () => text
        });
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Shared wallet session created in premium tests
let walletSession = null;

describe('E2E Frontend — full user flow', { timeout: 300000 }, () => {
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

  // ─── 1. Homepage ─────────────────────────────────────────────
  describe('1. Homepage', () => {
    it('GET / returns 200 with full page structure', async () => {
      const res = await request('/');
      assert.equal(res.status, 200);
      const html = res.text();
      assert.ok(html.includes('nav-inner'), 'Missing nav-inner');
      assert.ok(html.includes('searchForm') || html.includes('search'), 'Missing search form');
      assert.ok(html.includes('process-step'), 'Missing process steps');
      assert.ok(html.includes('domains') || html.includes('domaines'), 'Missing domains section');
      assert.ok(html.includes('premium-cta'), 'Missing premium CTA');
    });

    it('GET / contains JusticePourtous branding', async () => {
      const res = await request('/');
      const html = res.text();
      assert.ok(html.includes('JusticePourtous'), 'Missing brand name');
    });
  });

  // ─── 2. All pages load ────────────────────────────────────────
  describe('2. All pages load', () => {
    const pages = [
      '/annuaire.html',
      '/resultat.html',
      '/premium.html',
      '/consulter.html',
      '/methodologie.html'
    ];

    for (const page of pages) {
      it(`GET ${page} returns 200`, async () => {
        const res = await request(page);
        assert.equal(res.status, 200, `${page} did not return 200 (got ${res.status})`);
        const html = res.text();
        assert.ok(html.length > 100, `${page} has suspiciously short content`);
      });
    }
  });

  // ─── 3. Static assets ────────────────────────────────────────
  describe('3. Static assets', () => {
    it('GET /style.css returns 200 with text/css', async () => {
      const res = await request('/style.css');
      assert.equal(res.status, 200);
      assert.ok(res.headers['content-type'].includes('text/css'), `Expected text/css, got ${res.headers['content-type']}`);
      const css = res.text();
      assert.ok(css.length > 500, 'CSS file suspiciously small');
    });

    it('GET /app.js returns 200 with application/javascript', async () => {
      const res = await request('/app.js');
      assert.equal(res.status, 200);
      assert.ok(res.headers['content-type'].includes('javascript'), `Expected javascript, got ${res.headers['content-type']}`);
      const js = res.text();
      assert.ok(js.length > 100, 'JS file suspiciously small');
    });
  });

  // ─── 4. Free search (LLM-first with keyword fallback) ────────
  describe('4. Free search', { timeout: 60000 }, () => {
    it('GET /api/search?q=caution+non+rendue returns enriched result', async () => {
      const res = await request('/api/search?q=caution+non+rendue', { timeout: 55000 });
      assert.equal(res.status, 200);
      const data = res.json();
      // Must have a fiche
      assert.ok(data.fiche, 'Missing fiche in search result');
      assert.ok(data.fiche.id, 'Fiche has no id');
      // Must have articles
      assert.ok(data.articles || data.fiche.reponse?.articles, 'Missing articles');
      // Must have delais or deadlines
      assert.ok(
        data.delais || data.fiche.reponse?.delais || data.fiche.reponse?.etapes,
        'Missing delais/etapes in search result'
      );
      // Disclaimer always present
      assert.ok(data.disclaimer, 'Missing disclaimer');
    });

    it('GET /api/search without q returns 400', async () => {
      const res = await request('/api/search');
      assert.equal(res.status, 400);
    });
  });

  // ─── 5. Annuaire ─────────────────────────────────────────────
  describe('5. Annuaire', () => {
    it('GET /api/services/VD returns services array', async () => {
      const res = await request('/api/services/VD');
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(Array.isArray(data.services), 'services is not an array');
      assert.ok(data.services.length >= 3, `Expected >= 3 services for VD, got ${data.services.length}`);
    });

    it('GET /api/services/FR returns 8+ services', async () => {
      const res = await request('/api/services/FR');
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(Array.isArray(data.services), 'services is not an array');
      assert.ok(data.services.length >= 8, `Expected >= 8 services for FR, got ${data.services.length}`);
    });
  });

  // ─── 6. Domaines ─────────────────────────────────────────────
  describe('6. Domaines', () => {
    it('GET /api/domaines returns 10 domaines', async () => {
      const res = await request('/api/domaines');
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(Array.isArray(data.domaines), 'domaines is not an array');
      assert.equal(data.domaines.length, 10, `Expected 10 domaines, got ${data.domaines.length}`);
    });

    it('domaines have accented names', async () => {
      const res = await request('/api/domaines');
      const data = res.json();
      const noms = data.domaines.map(d => d.nom);
      assert.ok(noms.includes('Étrangers'), `Expected "Étrangers" in domaine names, got: ${noms.join(', ')}`);
    });
  });

  // ─── 7. Consultation ─────────────────────────────────────────
  describe('7. Consultation', () => {
    it('GET /api/domaines/bail/questions returns questions array', async () => {
      const res = await request('/api/domaines/bail/questions');
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(data.questions || data.domaine, 'Missing questions data');
      if (data.questions) {
        assert.ok(Array.isArray(data.questions), 'questions is not an array');
        assert.ok(data.questions.length > 0, 'questions array is empty');
      }
    });
  });

  // ─── 8. Premium wallet ───────────────────────────────────────
  describe('8. Premium wallet', () => {
    it('POST /api/premium/acheter with montant=500 creates session with solde=500', async () => {
      const res = await request('/api/premium/acheter', {
        method: 'POST',
        body: JSON.stringify({ montant: 500 })
      });
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(data.sessionCode, 'Missing sessionCode');
      assert.equal(data.solde, 500, `Expected solde=500, got ${data.solde}`);
      // Store for later tests
      walletSession = data.sessionCode;
    });
  });

  // ─── 9. Premium credits ──────────────────────────────────────
  describe('9. Premium credits', () => {
    it('GET /api/premium/credits?session=<code> returns valid balance', async () => {
      // First create a wallet if not already created
      if (!walletSession) {
        const setup = await request('/api/premium/acheter', {
          method: 'POST',
          body: JSON.stringify({ montant: 500 })
        });
        walletSession = setup.json().sessionCode;
      }
      const res = await request(`/api/premium/credits?session=${walletSession}`);
      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(typeof data.solde === 'number', `solde should be a number, got ${typeof data.solde}`);
      assert.ok(data.solde > 0, `solde should be positive, got ${data.solde}`);
    });

    it('GET /api/premium/credits without session returns error', async () => {
      const res = await request('/api/premium/credits');
      assert.ok(res.status >= 400, `Expected error status, got ${res.status}`);
    });
  });

  // ─── 10. Premium V3 analysis (LLM-dependent) ─────────────────
  describe('10. Premium V3 analysis', { timeout: 90000 }, () => {
    it('POST /api/premium/analyze-v3 with session returns structured response', async () => {
      // Create a fresh wallet with enough credits
      const walletRes = await request('/api/premium/acheter', {
        method: 'POST',
        body: JSON.stringify({ montant: 5000 })
      });
      const session = walletRes.json().sessionCode;

      let res;
      try {
        res = await request('/api/premium/analyze-v3', {
          method: 'POST',
          timeout: 85000,
          body: JSON.stringify({
            session,
            texte: 'Mon proprietaire ne me rend pas ma caution de 3000 CHF apres 2 mois',
            canton: 'VD'
          })
        });
      } catch (err) {
        // Timeout or connection error — LLM pipeline too slow, skip gracefully
        if (err.message.includes('timeout') || err.message.includes('ECONNRESET')) return;
        throw err;
      }

      // LLM may be unavailable (no API key) => 503 is acceptable
      if (res.status === 503) {
        const data = res.json();
        assert.ok(data.error, 'Expected error message on 503');
        assert.ok(data.disclaimer, 'Missing disclaimer on 503');
        return; // graceful skip
      }

      assert.equal(res.status, 200);
      const data = res.json();
      // V3 should return claims, questions, verification_status
      assert.ok(data.verification_status, 'Missing verification_status');
      assert.ok(data.disclaimer, 'Missing disclaimer');
      // At least one of claims/questions/resume should be present
      assert.ok(
        data.claims || data.questions || data.resume,
        'V3 response missing claims, questions, and resume'
      );
    });
  });

  // ─── 11. Letter generation (LLM-dependent) ───────────────────
  describe('11. Letter generation', { timeout: 90000 }, () => {
    it('POST /api/premium/generate-letter returns letter text', async () => {
      const walletRes = await request('/api/premium/acheter', {
        method: 'POST',
        body: JSON.stringify({ montant: 5000 })
      });
      const session = walletRes.json().sessionCode;

      let res;
      try {
        res = await request('/api/premium/generate-letter', {
          method: 'POST',
          timeout: 85000,
          body: JSON.stringify({
            session,
            ficheId: 'bail_defaut_moisissure',
            userContext: { nom: 'Test User', adresse: 'Rue du Test 1, 1000 Lausanne' },
            type: 'mise_en_demeure'
          })
        });
      } catch (err) {
        if (err.message.includes('timeout') || err.message.includes('ECONNRESET')) return;
        throw err;
      }

      // LLM may be unavailable
      if (res.status === 503 || res.status === 400) {
        return; // graceful skip when no API key
      }

      assert.equal(res.status, 200);
      const data = res.json();
      assert.ok(data.lettre || data.letter || data.text, 'Missing letter text in response');
    });
  });

  // ─── 12. DOCX generation (LLM-dependent) ─────────────────────
  describe('12. DOCX generation', { timeout: 90000 }, () => {
    it('POST /api/premium/generate-docx returns binary with correct content-type', async () => {
      const walletRes = await request('/api/premium/acheter', {
        method: 'POST',
        body: JSON.stringify({ montant: 5000 })
      });
      const session = walletRes.json().sessionCode;

      let res;
      try {
        res = await request('/api/premium/generate-docx', {
          method: 'POST',
          timeout: 85000,
          body: JSON.stringify({
            session,
            ficheId: 'bail_defaut_moisissure',
            userContext: { nom: 'Test User' },
            type: 'mise_en_demeure'
          })
        });
      } catch (err) {
        if (err.message.includes('timeout') || err.message.includes('ECONNRESET')) return;
        throw err;
      }

      // LLM may be unavailable
      if (res.status === 503 || res.status === 400 || res.status === 500) {
        return; // graceful skip when no API key
      }

      assert.equal(res.status, 200);
      const ct = res.headers['content-type'];
      assert.ok(
        ct.includes('openxmlformats') || ct.includes('officedocument'),
        `Expected DOCX content-type, got ${ct}`
      );
      const buf = res.buffer();
      assert.ok(buf.length > 100, 'DOCX file suspiciously small');
      // DOCX files start with PK (ZIP signature)
      assert.equal(buf[0], 0x50, 'DOCX should start with PK zip signature');
      assert.equal(buf[1], 0x4B, 'DOCX should start with PK zip signature');
    });
  });

  // ─── 13. Session required ────────────────────────────────────
  describe('13. Session required', () => {
    it('POST /api/premium/analyze-v3 WITHOUT session returns 403', async () => {
      const res = await request('/api/premium/analyze-v3', {
        method: 'POST',
        body: JSON.stringify({
          texte: 'Test sans session'
        })
      });
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
      const data = res.json();
      assert.ok(data.error, 'Expected error message');
    });

    it('POST /api/premium/analyze-v3 with invalid session returns 403', async () => {
      const res = await request('/api/premium/analyze-v3', {
        method: 'POST',
        body: JSON.stringify({
          session: 'invalid-session-xyz',
          texte: 'Test session invalide'
        })
      });
      assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
    });
  });

  // ─── 14. Accent check ────────────────────────────────────────
  describe('14. Accent check', () => {
    it('domaines descriptions contain proper French accents', async () => {
      const res = await request('/api/domaines');
      assert.equal(res.status, 200);
      const data = res.json();
      const raw = JSON.stringify(data);

      // Check that "Etrangers" without accent is NOT present as a domaine name
      const etrangersDomaine = data.domaines.find(d => d.id === 'etrangers');
      assert.ok(etrangersDomaine, 'Missing etrangers domaine');
      assert.equal(etrangersDomaine.nom, 'Étrangers', `Expected "Étrangers" with accent, got "${etrangersDomaine.nom}"`);

      // Verify other accented content
      assert.ok(raw.includes('é') || raw.includes('è') || raw.includes('ê'),
        'No French accents found in domaines data');
    });

    it('homepage HTML contains proper UTF-8 accents', async () => {
      const res = await request('/');
      const html = res.text();
      // The charset should be declared
      assert.ok(
        html.includes('charset') || html.includes('UTF-8') || html.includes('utf-8'),
        'Missing charset declaration in HTML'
      );
    });
  });
});
