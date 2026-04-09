import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCase, GOLDEN_CASES, RUBRICS } from '../src/services/eval-harness.mjs';
import { semanticSearch } from '../src/services/semantic-search.mjs';
import { getAllFiches } from '../src/services/fiches.mjs';
import { queryByProblem, queryComplete } from '../src/services/knowledge-engine.mjs';
import { certifyIssue } from '../src/services/coverage-certificate.mjs';

const fiches = getAllFiches();

describe('Eval Harness', () => {

  describe('golden cases definition', () => {
    it('has at least 10 cases', () => {
      assert.ok(GOLDEN_CASES.length >= 10);
    });

    it('covers bail, travail, dettes domains', () => {
      const domains = new Set(GOLDEN_CASES.map(gc => gc.domaine));
      assert.ok(domains.has('bail'));
      assert.ok(domains.has('travail'));
      assert.ok(domains.has('dettes'));
    });

    it('each case has required fields', () => {
      for (const gc of GOLDEN_CASES) {
        assert.ok(gc.id, `case missing id`);
        assert.ok(gc.domaine, `${gc.id} missing domaine`);
        assert.ok(gc.query, `${gc.id} missing query`);
        assert.ok(gc.fiche_ids?.length > 0, `${gc.id} missing fiche_ids`);
      }
    });
  });

  describe('rubrics definition', () => {
    it('has at least 8 rubrics', () => {
      assert.ok(RUBRICS.length >= 8);
    });

    it('rubrics have id, label, weight', () => {
      for (const r of RUBRICS) {
        assert.ok(r.id);
        assert.ok(r.label);
        assert.ok(typeof r.weight === 'number' && r.weight > 0);
      }
    });

    it('total weight sums to reasonable number', () => {
      const total = RUBRICS.reduce((s, r) => s + r.weight, 0);
      assert.ok(total >= 10 && total <= 30, `Total weight ${total} seems off`);
    });
  });

  describe('evaluateCase scoring', () => {
    it('perfect result gets 100%', () => {
      const gc = GOLDEN_CASES[0]; // bail_moisissure_vd
      const perfectResult = {
        domaine: gc.domaine,
        fiche_id: gc.fiche_ids[0],
        articles: gc.required_articles.map(ref => ({ ref, source_id: `test:${ref}` })),
        arrets: [
          { role: 'favorable', resultat: 'favorable_locataire', source_id: 'j1' },
          { role: 'defavorable', resultat: 'favorable_bailleur', source_id: 'j2' },
        ],
        delais: [{ delai: '30 jours' }],
        anti_erreurs: [{ erreur: 'test' }],
        contacts: [{ nom: 'ASLOCA' }],
        certificate: { status: 'sufficient' },
      };

      const evaluation = evaluateCase(perfectResult, gc);
      assert.equal(evaluation.score, 100);
    });

    it('empty result gets 0%', () => {
      const gc = GOLDEN_CASES[0];
      const evaluation = evaluateCase({}, gc);
      assert.equal(evaluation.score, 0);
    });

    it('partial result gets intermediate score', () => {
      const gc = GOLDEN_CASES[0];
      const partialResult = {
        domaine: gc.domaine,
        fiche_id: gc.fiche_ids[0],
        articles: gc.required_articles.map(ref => ({ ref, source_id: `test:${ref}` })),
        arrets: [],
        delais: [],
      };

      const evaluation = evaluateCase(partialResult, gc);
      assert.ok(evaluation.score > 0, 'Should get some points');
      assert.ok(evaluation.score < 100, 'Should not be perfect');
    });
  });

  describe('semantic search domain accuracy on golden cases', () => {
    it('all golden cases match expected domain in top-1', () => {
      const misses = [];
      for (const gc of GOLDEN_CASES) {
        const results = semanticSearch(gc.query, fiches, 1);
        if (results.length === 0 || results[0].fiche.domaine !== gc.domaine) {
          misses.push(`${gc.id}: expected ${gc.domaine}, got ${results[0]?.fiche?.domaine || 'none'}`);
        }
      }
      assert.equal(misses.length, 0,
        `Domain mismatches:\n${misses.join('\n')}`);
    });
  });

  describe('knowledge engine enrichment on golden cases', () => {
    it('all golden cases get enriched results with articles', () => {
      const fails = [];
      for (const gc of GOLDEN_CASES) {
        const result = queryByProblem(gc.query, gc.canton);
        if (result.status !== 200) {
          fails.push(`${gc.id}: status ${result.status}`);
          continue;
        }
        if (!result.data.articles || result.data.articles.length === 0) {
          fails.push(`${gc.id}: no articles enriched`);
        }
      }
      assert.ok(fails.length <= 2,
        `Too many enrichment failures (${fails.length}):\n${fails.join('\n')}`);
    });
  });

  describe('coverage certificate on enriched golden cases', () => {
    it('most golden cases pass critical checks when enriched', () => {
      const results = [];
      for (const gc of GOLDEN_CASES) {
        const result = queryByProblem(gc.query, gc.canton);
        if (result.status !== 200 || !result.data.fiche) continue;

        // Build a pseudo-issue from enriched data
        const issue = {
          issue_id: gc.id,
          domaine: gc.domaine,
          articles: (result.data.articles || []).map(a => ({
            ref: a.ref,
            source_id: a.source_id || `art_${a.ref}`,
          })),
          arrets: (result.data.jurisprudence || []).map(j => ({
            signature: j.signature,
            role: j.role || 'neutre',
            resultat: j.resultat,
            source_id: j.source_id || `arret_${j.signature}`,
          })),
          delais: result.data.delais || [],
          preuves: result.data.preuves || [],
          anti_erreurs: result.data.antiErreurs || [],
          patterns: result.data.patterns || [],
          contacts: result.data.escalade || [],
        };

        const cert = certifyIssue(issue);
        results.push({ id: gc.id, status: cert.status, score: cert.score, fails: cert.critical_fails });
      }

      const insufficient = results.filter(r => r.status === 'insufficient');
      // Allow max 40% insufficient (contradictoire is now critical — some domains lack contra juris)
      assert.ok(insufficient.length <= Math.ceil(results.length * 0.4),
        `Too many insufficient certificates (${insufficient.length}/${results.length}):\n` +
        insufficient.map(r => `${r.id}: score=${r.score} fails=${r.fails.join(',')}`).join('\n'));
    });
  });
});
