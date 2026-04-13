import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadVulgarisation,
  getVulgarisationForFiche,
  getVulgarisationByDomaine,
  getVulgarisationStats,
  clearVulgarisationCache,
} from '../src/services/vulgarisation-loader.mjs';

describe('Vulgarisation Loader', () => {
  before(() => clearVulgarisationCache());

  describe('loadVulgarisation', () => {
    it('loads all entries', () => {
      const { entries } = loadVulgarisation();
      assert.ok(entries.length >= 30, `should have >=30 entries, got ${entries.length}`);
    });

    it('indexes by fiche', () => {
      const { byFiche } = loadVulgarisation();
      assert.ok(Object.keys(byFiche).length > 10, 'should index >10 fiches');
    });

    it('indexes by source', () => {
      const { bySource } = loadVulgarisation();
      assert.ok(bySource.asloca_kit, 'should have asloca_kit source');
      assert.ok(bySource.asloca_kit.length >= 30, 'asloca_kit should have >=30 entries');
    });
  });

  describe('getVulgarisationForFiche', () => {
    it('returns content for bail_depot_garantie', () => {
      const result = getVulgarisationForFiche('bail_depot_garantie');
      assert.ok(result, 'should return content');
      assert.ok(result.questions_citoyennes.length >= 1);
      assert.ok(result.anti_erreurs.length >= 1);
      assert.ok(result.articles_cles.includes('CO 257e'));
    });

    it('returns content for bail_defaut_moisissure', () => {
      const result = getVulgarisationForFiche('bail_defaut_moisissure');
      assert.ok(result, 'should return content');
      assert.ok(result.questions_citoyennes.some(q => q.question.includes('r\u00e9duction')));
    });

    it('returns null for unknown fiche', () => {
      const result = getVulgarisationForFiche('fiche_inexistante');
      assert.equal(result, null);
    });

    it('returns delais when available', () => {
      const result = getVulgarisationForFiche('bail_augmentation_loyer');
      assert.ok(result, 'should return content');
      assert.ok(result.delais.length >= 1, 'should have deadline for augmentation');
    });

    it('aggregates content from multiple entries', () => {
      const result = getVulgarisationForFiche('bail_resiliation_conteste');
      assert.ok(result, 'should return content');
      // Multiple ASLOCA Q&As touch r\u00e9siliation
      assert.ok(result.questions_citoyennes.length >= 2, `should have >=2 Q&As, got ${result.questions_citoyennes.length}`);
    });
  });

  describe('getVulgarisationByDomaine', () => {
    it('returns bail entries', () => {
      const entries = getVulgarisationByDomaine('bail');
      assert.ok(entries.length >= 30, `should have >=30 bail entries, got ${entries.length}`);
    });

    it('returns empty for unknown domaine', () => {
      const entries = getVulgarisationByDomaine('cuisine');
      assert.equal(entries.length, 0);
    });
  });

  describe('getVulgarisationStats', () => {
    it('returns complete stats', () => {
      const stats = getVulgarisationStats();
      assert.ok(stats.total_entries >= 30);
      assert.ok(stats.fiches_enrichies >= 10);
      assert.ok(stats.total_anti_erreurs >= 20, `should have >=20 anti-erreurs, got ${stats.total_anti_erreurs}`);
      assert.ok(stats.domaines.includes('bail'));
      assert.ok(stats.sources.some(s => s.source_id === 'asloca_kit'));
    });
  });
});

describe('Vulgarisation — data quality', () => {
  it('every entry has required fields', () => {
    const { entries } = loadVulgarisation();
    for (const e of entries) {
      assert.ok(e.id, `missing id`);
      assert.ok(e.source_id, `missing source_id for ${e.id}`);
      assert.ok(e.question, `missing question for ${e.id}`);
      assert.ok(e.reponse_courte, `missing reponse_courte for ${e.id}`);
      assert.ok(e.reponse_detail, `missing reponse_detail for ${e.id}`);
      assert.ok(e.fiches_liees?.length > 0, `missing fiches_liees for ${e.id}`);
      assert.ok(e.domaine, `missing domaine for ${e.id}`);
      assert.ok(e.source_url, `missing source_url for ${e.id}`);
    }
  });

  it('all fiches_liees reference existing fiches', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const d = dirname(fileURLToPath(import.meta.url));
    const bailFiches = JSON.parse(readFileSync(join(d, '..', 'src', 'data', 'fiches', 'bail.json'), 'utf-8'));
    const ficheIds = new Set(bailFiches.map(f => f.id));

    const { entries } = loadVulgarisation();
    for (const e of entries) {
      for (const ficheId of e.fiches_liees) {
        assert.ok(ficheIds.has(ficheId), `fiche ${ficheId} referenced by ${e.id} does not exist in bail.json`);
      }
    }
  });

  it('no duplicate IDs', () => {
    const { entries } = loadVulgarisation();
    const ids = entries.map(e => e.id);
    const unique = new Set(ids);
    assert.equal(ids.length, unique.size, 'duplicate vulgarisation IDs found');
  });

  it('anti_erreurs are actionable (not generic)', () => {
    const { entries } = loadVulgarisation();
    for (const e of entries) {
      for (const ae of (e.anti_erreurs || [])) {
        assert.ok(ae.length > 15, `anti_erreur too short for ${e.id}: "${ae}"`);
        // Should not be a generic statement like "faire attention"
        assert.ok(!ae.toLowerCase().startsWith('faire attention'), `anti_erreur too generic for ${e.id}`);
      }
    }
  });

  it('reponse_courte is concise (< 200 chars)', () => {
    const { entries } = loadVulgarisation();
    for (const e of entries) {
      assert.ok(e.reponse_courte.length < 200, `reponse_courte too long for ${e.id}: ${e.reponse_courte.length} chars`);
    }
  });

  it('covers all 3 ASLOCA sections (signature, en_cours, fin)', () => {
    const { entries } = loadVulgarisation();
    const sections = new Set(entries.map(e => e.section));
    assert.ok(sections.has('signature'), 'missing signature section');
    assert.ok(sections.has('en_cours'), 'missing en_cours section');
    assert.ok(sections.has('fin'), 'missing fin section');
  });
});

describe('Vulgarisation — adversarial cases', () => {
  it('handles fiche with many vulgarisation entries gracefully', () => {
    const result = getVulgarisationForFiche('bail_resiliation_conteste');
    assert.ok(result);
    // Should deduplicate articles_cles
    const uniqueArticles = new Set(result.articles_cles);
    assert.equal(result.articles_cles.length, uniqueArticles.size, 'articles_cles should be deduplicated');
  });

  it('handles fiche with zero vulgarisation gracefully', () => {
    const result = getVulgarisationForFiche('bail_parking');
    // bail_parking has no ASLOCA entry — should be null
    assert.equal(result, null);
  });

  it('mixed domaine query returns only matching entries', () => {
    const bail = getVulgarisationByDomaine('bail');
    const travail = getVulgarisationByDomaine('travail');
    // All bail entries should have domaine='bail'
    for (const e of bail) {
      assert.equal(e.domaine, 'bail');
    }
    // Travail might be empty (only ASLOCA bail for now) — that's OK
    for (const e of travail) {
      assert.equal(e.domaine, 'travail');
    }
  });
});
