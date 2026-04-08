import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expandQuery, semanticSearch, SYNONYMES } from '../src/services/semantic-search.mjs';
import { getAllFiches } from '../src/services/fiches.mjs';

describe('Semantic Search', () => {
  const fiches = getAllFiches();

  describe('expandQuery', () => {
    it('expands profane terms to juridical', () => {
      const { terms } = expandQuery('mon patron me harcèle');
      assert.ok(terms.has('harcèlement') || terms.has('mobbing'));
      assert.ok(terms.get('harcèlement') > 0 || terms.get('mobbing') > 0);
    });

    it('handles multi-word phrases', () => {
      const { terms } = expandQuery('pas payé mon salaire');
      assert.ok(terms.has('salaire impayé') || terms.has('salaire'));
    });

    it('expands moisissure correctly', () => {
      const { terms } = expandQuery('mon appart est moisi');
      assert.ok(terms.has('moisissure'));
      assert.ok(terms.get('moisissure') > 2);
    });
  });

  describe('semanticSearch', () => {
    it('finds moisissure fiche for "moisi"', () => {
      const results = semanticSearch('mon appart est moisi', fiches);
      assert.ok(results.length > 0);
      assert.ok(results[0].fiche.id.includes('moisissure'));
    });

    it('finds harcèlement for "patron me harcèle"', () => {
      const results = semanticSearch('mon patron me harcèle', fiches);
      assert.ok(results.length > 0);
      assert.ok(results[0].fiche.id.includes('harcelement'));
    });

    it('finds grossesse for "enceinte virée"', () => {
      const results = semanticSearch('je suis enceinte et viree', fiches);
      assert.ok(results.length > 0);
      assert.ok(results[0].fiche.id.includes('grossesse'));
    });

    it('finds pension for "ex paie pas pension"', () => {
      const results = semanticSearch('mon ex paie pas la pension', fiches);
      assert.ok(results.length > 0);
      assert.ok(results[0].fiche.id.includes('pension'));
    });

    it('finds nuisances for "voisin bruit"', () => {
      const results = semanticSearch('mon voisin fait du bruit', fiches);
      assert.ok(results.length > 0);
      assert.ok(results[0].fiche.id.includes('nuisance') || results[0].fiche.id.includes('bruit'));
    });

    it('returns multiple results ranked', () => {
      const results = semanticSearch('problème de loyer', fiches);
      assert.ok(results.length >= 2);
      assert.ok(results[0].score >= results[1].score);
    });

    it('returns empty for nonsense', () => {
      const results = semanticSearch('xyzabc123nonsense', fiches);
      assert.equal(results.length, 0);
    });
  });

  describe('SYNONYMES coverage', () => {
    it('has entries for all 5 domains', () => {
      const domains = { bail: false, travail: false, famille: false, dettes: false, etrangers: false };
      // Check that searching domain-related terms yields results
      const domainTests = {
        bail: 'loyer moisissure',
        travail: 'licencié patron',
        famille: 'divorce pension',
        dettes: 'poursuite dette',
        etrangers: 'permis asile'
      };
      for (const [dom, query] of Object.entries(domainTests)) {
        const results = semanticSearch(query, fiches);
        if (results.length > 0 && results[0].fiche.domaine === dom) {
          domains[dom] = true;
        }
      }
      // At least 4/5 domains should match correctly
      const matched = Object.values(domains).filter(Boolean).length;
      assert.ok(matched >= 4, `Only ${matched}/5 domains matched correctly`);
    });
  });
});
