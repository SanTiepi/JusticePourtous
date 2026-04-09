import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { server } from '../src/server.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 9885;
const BASE = `http://localhost:${PORT}`;

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

describe('Barèmes & références nationales', () => {

  describe('data file', () => {
    const baremes = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'baremes', 'references-nationales.json'), 'utf-8'));

    it('has taux hypothécaire de référence', () => {
      assert.ok(baremes.taux_hypothecaire_reference);
      assert.ok(baremes.taux_hypothecaire_reference.valeur_actuelle);
      assert.equal(typeof baremes.taux_hypothecaire_reference.valeur_actuelle.taux, 'number');
      assert.ok(baremes.taux_hypothecaire_reference.historique.length >= 5);
    });

    it('taux has usage_juridique with base_legale', () => {
      const t = baremes.taux_hypothecaire_reference;
      assert.ok(t.usage_juridique);
      assert.ok(t.usage_juridique.base_legale);
      assert.ok(t.usage_juridique.contestation_augmentation);
    });

    it('has minimum vital base with cantonal variations', () => {
      assert.ok(baremes.minimum_vital_base);
      assert.ok(baremes.minimum_vital_base.montants_base_2025);
      assert.ok(baremes.minimum_vital_base.variations_cantonales);
      assert.ok(baremes.minimum_vital_base.variations_cantonales.VD);
      assert.ok(baremes.minimum_vital_base.variations_cantonales.GE);
    });

    it('GE minimum vital is higher than base (known cantonal variation)', () => {
      const mv = baremes.minimum_vital_base;
      assert.ok(mv.variations_cantonales.GE.debiteur_seul > mv.montants_base_2025.debiteur_seul,
        'Genève should have higher minimum vital');
    });

    it('has CCT principales with at least 3 conventions', () => {
      assert.ok(baremes.cct_principales);
      assert.ok(baremes.cct_principales.length >= 3);
      for (const cct of baremes.cct_principales) {
        assert.ok(cct.branche, 'CCT missing branche');
        assert.ok(cct.salaire_minimum_2025, `${cct.branche} missing salaire_minimum`);
      }
    });
  });

  describe('cantons data', () => {
    const cantons = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'cantons', 'donnees-cantonales.json'), 'utf-8'));

    it('has at least 14 cantons', () => {
      assert.ok(cantons.length >= 14, `Only ${cantons.length} cantons`);
    });

    it('all major cantons covered (VD, GE, ZH, BE, BS, LU)', () => {
      const codes = new Set(cantons.map(c => c.code));
      for (const c of ['VD', 'GE', 'ZH', 'BE', 'BS', 'LU']) {
        assert.ok(codes.has(c), `${c} missing`);
      }
    });

    it('each canton has conciliation bail', () => {
      for (const c of cantons) {
        assert.ok(c.conciliationBail, `${c.code} missing conciliationBail`);
        assert.ok(c.conciliationBail.autorite, `${c.code} missing conciliation autorite`);
      }
    });

    it('each canton has minimum vital', () => {
      for (const c of cantons) {
        assert.ok(c.minimumVitalLP, `${c.code} missing minimumVitalLP`);
        assert.ok(c.minimumVitalLP.seul > 0, `${c.code} minimum vital seul should be > 0`);
      }
    });
  });

  describe('API', () => {
    before(() => new Promise(resolve => server.listen(PORT, resolve)));
    after(() => new Promise(resolve => server.close(resolve)));

    it('GET /api/baremes returns all baremes', async () => {
      const res = await httpGet('/api/baremes');
      assert.equal(res.status, 200);
      assert.ok(res.data.taux_hypothecaire_reference);
      assert.ok(res.data.cct_principales);
      assert.ok(res.data.disclaimer);
    });

    it('GET /api/baremes/taux-hypothecaire returns taux', async () => {
      const res = await httpGet('/api/baremes/taux-hypothecaire');
      assert.equal(res.status, 200);
      assert.ok(res.data.valeur_actuelle);
      assert.equal(typeof res.data.valeur_actuelle.taux, 'number');
    });
  });
});
