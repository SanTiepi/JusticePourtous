import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { certifyIssue, certifyDossier, getChecklistDefinition } from '../src/services/coverage-certificate.mjs';
import { server } from '../src/server.mjs';

const PORT = 9883;
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

describe('Coverage Certificate', () => {

  describe('certifyIssue', () => {
    it('sufficient issue passes all critical checks', () => {
      const issue = {
        issue_id: 'test_1',
        qualification: 'Défaut de la chose louée',
        domaine: 'bail',
        articles: [{ ref: 'CO 259a', source_id: 'fedlex:rs220:co-259a' }],
        arrets: [
          { signature: '4A_32/2018', role: 'favorable', resultat: 'favorable_locataire', source_id: 'juris:tf:4a_32-2018' },
          { signature: '4A_395/2017', role: 'defavorable', resultat: 'favorable_bailleur', source_id: 'juris:tf:4a_395-2017' },
        ],
        delais: [{ procedure: 'Signalement défaut', delai: 'immédiatement' }],
        preuves: [{ procedure: 'Preuve du défaut' }],
        anti_erreurs: [{ erreur: 'Ne pas agir seul' }],
        patterns: [{ situation: 'Moisissure locataire' }],
        contacts: [{ nom: 'ASLOCA' }],
      };

      const cert = certifyIssue(issue);
      assert.equal(cert.status, 'sufficient');
      assert.equal(cert.critical_fails.length, 0);
      assert.equal(cert.score, 100);
    });

    it('issue without articles fails critical check', () => {
      const issue = {
        issue_id: 'test_2',
        domaine: 'bail',
        articles: [],
        arrets: [],
        delais: [{ procedure: 'test', delai: '10j' }],
      };

      const cert = certifyIssue(issue);
      assert.equal(cert.status, 'insufficient');
      assert.ok(cert.critical_fails.includes('base_legale'));
    });

    it('issue without delai fails critical check', () => {
      const issue = {
        issue_id: 'test_3',
        domaine: 'bail',
        articles: [{ ref: 'CO 259a', source_id: 'fedlex:rs220:co-259a' }],
        arrets: [],
        delais: [],
      };

      const cert = certifyIssue(issue);
      assert.equal(cert.status, 'insufficient');
      assert.ok(cert.critical_fails.includes('delai'));
    });

    it('issue with articles but no source_ids fails', () => {
      const issue = {
        issue_id: 'test_4',
        domaine: 'bail',
        articles: [{ ref: 'CO 259a' }], // no source_id!
        arrets: [],
        delais: [{ procedure: 'test', delai: '30j' }],
      };

      const cert = certifyIssue(issue);
      assert.ok(cert.critical_fails.includes('source_ids'));
    });

    it('issue without contradictoire fails critical check (contradictoire is critical)', () => {
      const issue = {
        issue_id: 'test_5',
        domaine: 'bail',
        articles: [{ ref: 'CO 259a', source_id: 'fedlex:rs220:co-259a' }],
        arrets: [{ role: 'favorable', resultat: 'favorable_locataire', source_id: 'juris:tf:test' }],
        delais: [{ procedure: 'test', delai: '30j' }],
        preuves: [],
        anti_erreurs: [],
        patterns: [],
        contacts: [],
      };

      const cert = certifyIssue(issue);
      // contradictoire is now critical — only favorable, no contra
      assert.ok(cert.critical_fails.includes('contradictoire'),
        'Should fail contradictoire check when only favorable arrets');
      assert.equal(cert.status, 'insufficient');
    });
  });

  describe('certifyDossier', () => {
    it('empty dossier returns insufficient', () => {
      const cert = certifyDossier({ issues: [] });
      assert.equal(cert.status, 'insufficient');
      assert.equal(cert.reason, 'no_issues');
    });

    it('null dossier returns insufficient', () => {
      const cert = certifyDossier(null);
      assert.equal(cert.status, 'insufficient');
    });

    it('dossier status is worst issue status', () => {
      const cert = certifyDossier({
        issues: [
          {
            issue_id: 'ok',
            articles: [{ ref: 'CO 259a', source_id: 'test' }],
            arrets: [{ role: 'favorable', resultat: 'favorable_locataire', source_id: 'test' }],
            delais: [{ delai: '30j' }],
            preuves: [{}], anti_erreurs: [{}], patterns: [{}], contacts: [{}],
          },
          {
            issue_id: 'bad',
            articles: [],
            arrets: [],
            delais: [],
          },
        ],
      });
      assert.equal(cert.status, 'insufficient'); // worst = bad issue
      assert.equal(cert.aggregate.total, 2);
    });

    it('aggregate score is average of issues', () => {
      const cert = certifyDossier({
        issues: [
          {
            issue_id: 'full',
            articles: [{ ref: 'CO 259a', source_id: 'test' }],
            arrets: [
              { role: 'favorable', resultat: 'favorable_locataire', source_id: 't1' },
              { role: 'defavorable', resultat: 'favorable_bailleur', source_id: 't2' },
            ],
            delais: [{ delai: '30j' }],
            preuves: [{}], anti_erreurs: [{}], patterns: [{}], contacts: [{}],
          },
        ],
      });
      assert.ok(cert.aggregate.score >= 80);
      assert.equal(cert.aggregate.total, 1);
    });
  });

  describe('getChecklistDefinition', () => {
    it('returns all checks with id, label, critical', () => {
      const checks = getChecklistDefinition();
      assert.ok(checks.length >= 8);
      for (const c of checks) {
        assert.ok(c.id);
        assert.ok(c.label);
        assert.ok(typeof c.critical === 'boolean');
      }
    });
  });

  describe('API', () => {
    before(() => new Promise(resolve => server.listen(PORT, resolve)));
    after(() => new Promise(resolve => server.close(resolve)));

    it('GET /api/certificate/checklist returns checklist', async () => {
      const res = await httpGet('/api/certificate/checklist');
      assert.equal(res.status, 200);
      assert.ok(res.data.checklist.length >= 8);
      assert.ok(res.data.disclaimer);
    });

    it('GET /api/eval/golden-cases returns cases and rubrics', async () => {
      const res = await httpGet('/api/eval/golden-cases');
      assert.equal(res.status, 200);
      assert.ok(res.data.cases.length >= 10);
      assert.ok(res.data.rubrics.length >= 8);
      assert.ok(res.data.total >= 10);
    });
  });
});
