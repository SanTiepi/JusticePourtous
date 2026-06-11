/**
 * Tests directs — vulgarisation-loader.mjs
 *
 * Modules testés : loadVulgarisation, getVulgarisationForFiche,
 *   getVulgarisationByDomaine, getVulgarisationStats, clearVulgarisationCache
 *
 * Zéro LLM, zéro réseau. Utilise src/data/vulgarisation/asloca-kit.json
 * (30 entrées bail, présence garantie par fiche-validator et CI gate #2).
 *
 * Invariants connus sur asloca-kit.json :
 *   - 30 entrées, toutes domaine "bail"
 *   - 24 fiches distinctes référencées (fiches_liees)
 *   - Toutes les entrées ont anti_erreurs (30/30)
 *   - 12 entrées ont un délai
 *   - bail_resiliation_conteste : fiche la plus citée (5×)
 *   - bail_modification_contrat : fiche de la 1ère entrée
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadVulgarisation,
  getVulgarisationForFiche,
  getVulgarisationByDomaine,
  getVulgarisationStats,
  clearVulgarisationCache
} from '../src/services/vulgarisation-loader.mjs';

// ─── loadVulgarisation ──────────────────────────────────────────

describe('vulgarisation-loader — loadVulgarisation', () => {
  beforeEach(() => clearVulgarisationCache());

  it('retourne un objet avec entries, byFiche, bySource', () => {
    const result = loadVulgarisation();
    assert.ok(typeof result === 'object' && result !== null);
    assert.ok(Array.isArray(result.entries), 'entries doit être un tableau');
    assert.ok(typeof result.byFiche === 'object', 'byFiche doit être un objet');
    assert.ok(typeof result.bySource === 'object', 'bySource doit être un objet');
  });

  it('entries non vide (asloca-kit.json présent dans le repo)', () => {
    const { entries } = loadVulgarisation();
    assert.ok(entries.length > 0, `doit charger ≥1 entrée (reçu ${entries.length})`);
  });

  it('entries : chaque item a id, source_id, domaine, fiches_liees', () => {
    const { entries } = loadVulgarisation();
    for (const e of entries) {
      assert.ok(typeof e.id === 'string', `id string attendu (reçu ${typeof e.id})`);
      assert.ok(typeof e.source_id === 'string', `source_id string attendu`);
      assert.ok(typeof e.domaine === 'string', `domaine string attendu`);
      assert.ok(Array.isArray(e.fiches_liees), `fiches_liees tableau attendu`);
    }
  });

  it('cache : 2 appels consécutifs retournent la même référence', () => {
    const r1 = loadVulgarisation();
    const r2 = loadVulgarisation();
    assert.strictEqual(r1, r2, 'doit être la même référence (cache en mémoire)');
  });

  it('clearVulgarisationCache force un rechargement (objet différent)', () => {
    const r1 = loadVulgarisation();
    clearVulgarisationCache();
    const r2 = loadVulgarisation();
    assert.notStrictEqual(r1, r2, 'doit être un nouvel objet après clearCache');
  });

  it('byFiche : fiche connue est indexée (bail_modification_contrat)', () => {
    const { byFiche } = loadVulgarisation();
    assert.ok(byFiche['bail_modification_contrat'],
      'bail_modification_contrat doit être dans byFiche');
    assert.ok(byFiche['bail_modification_contrat'].length >= 1);
  });

  it('byFiche : fiche inconnue retourne undefined', () => {
    const { byFiche } = loadVulgarisation();
    assert.strictEqual(byFiche['fiche_xyz_inconnue_999'], undefined);
  });

  it('byFiche : fiche la plus citée (bail_resiliation_conteste) a ≥5 entrées', () => {
    const { byFiche } = loadVulgarisation();
    assert.ok(byFiche['bail_resiliation_conteste'],
      'bail_resiliation_conteste doit être indexée');
    assert.ok(byFiche['bail_resiliation_conteste'].length >= 5,
      `attendu ≥5, reçu ${byFiche['bail_resiliation_conteste'].length}`);
  });

  it('bySource : source_id "asloca_kit" présent avec ≥1 entrée', () => {
    const { bySource } = loadVulgarisation();
    assert.ok(bySource['asloca_kit'], 'source asloca_kit doit être indexée');
    assert.ok(bySource['asloca_kit'].length >= 1);
  });
});

// ─── getVulgarisationForFiche ────────────────────────────────────

describe('vulgarisation-loader — getVulgarisationForFiche', () => {
  beforeEach(() => clearVulgarisationCache());

  it('fiche inconnue retourne null', () => {
    const result = getVulgarisationForFiche('fiche_xyz_inconnue');
    assert.strictEqual(result, null);
  });

  it('fiche connue retourne la shape attendue', () => {
    const result = getVulgarisationForFiche('bail_modification_contrat');
    assert.ok(result !== null, 'doit retourner un objet');
    assert.equal(result.ficheId, 'bail_modification_contrat', 'ficheId doit correspondre');
    assert.ok(Array.isArray(result.questions_citoyennes), 'questions_citoyennes tableau');
    assert.ok(Array.isArray(result.anti_erreurs), 'anti_erreurs tableau');
    assert.ok(Array.isArray(result.delais), 'delais tableau');
    assert.ok(Array.isArray(result.articles_cles), 'articles_cles tableau');
  });

  it('questions_citoyennes : champs question, reponse_courte, source présents', () => {
    const result = getVulgarisationForFiche('bail_modification_contrat');
    assert.ok(result.questions_citoyennes.length > 0,
      'doit avoir au moins une question citoyenne');
    const q = result.questions_citoyennes[0];
    assert.ok(typeof q.question === 'string', 'question doit être string');
    assert.ok(typeof q.reponse_courte === 'string', 'reponse_courte doit être string');
    assert.ok(q.source, 'source doit être présent');
  });

  it('anti_erreurs non vide (toutes les entrées asloca ont anti_erreurs)', () => {
    const result = getVulgarisationForFiche('bail_modification_contrat');
    assert.ok(result.anti_erreurs.length > 0,
      'doit avoir au moins une anti-erreur');
    const ae = result.anti_erreurs[0];
    assert.ok(typeof ae.erreur === 'string', 'erreur doit être string');
    assert.ok(ae.source, 'source de l\'anti-erreur doit être présent');
    assert.ok(ae.question_ref, 'question_ref doit être présent');
  });

  it('articles_cles : pas de doublons (Set interne)', () => {
    const result = getVulgarisationForFiche('bail_modification_contrat');
    const set = new Set(result.articles_cles);
    assert.equal(set.size, result.articles_cles.length,
      'articles_cles ne doit pas contenir de doublons');
  });

  it('delais : bail_loyer_initial_abusif a au moins 1 délai', () => {
    const result = getVulgarisationForFiche('bail_loyer_initial_abusif');
    assert.ok(result !== null, 'fiche bail_loyer_initial_abusif doit être présente');
    assert.ok(result.delais.length >= 1,
      `bail_loyer_initial_abusif doit avoir ≥1 délai (reçu ${result.delais.length})`);
    const d = result.delais[0];
    assert.ok(typeof d.delai === 'string', 'délai string attendu');
    assert.ok(d.source, 'source du délai attendue');
  });

  it('résultat contient ficheId correct (fiche la plus citée)', () => {
    const result = getVulgarisationForFiche('bail_resiliation_conteste');
    assert.ok(result !== null);
    assert.equal(result.ficheId, 'bail_resiliation_conteste');
    assert.ok(result.questions_citoyennes.length >= 5,
      `bail_resiliation_conteste doit avoir ≥5 questions (reçu ${result.questions_citoyennes.length})`);
  });
});

// ─── getVulgarisationByDomaine ───────────────────────────────────

describe('vulgarisation-loader — getVulgarisationByDomaine', () => {
  beforeEach(() => clearVulgarisationCache());

  it('domaine "bail" retourne un tableau non vide', () => {
    const results = getVulgarisationByDomaine('bail');
    assert.ok(Array.isArray(results), 'doit retourner un tableau');
    assert.ok(results.length > 0, 'tableau non vide pour domaine bail');
  });

  it('domaine inconnu retourne tableau vide', () => {
    const results = getVulgarisationByDomaine('domaine_inexistant_xyz');
    assert.ok(Array.isArray(results), 'doit retourner un tableau');
    assert.equal(results.length, 0, 'domaine inconnu → tableau vide');
  });

  it('toutes les entrées filtrées ont le bon domaine', () => {
    const results = getVulgarisationByDomaine('bail');
    for (const e of results) {
      assert.equal(e.domaine, 'bail',
        `entrée ${e.id} a domaine "${e.domaine}" au lieu de "bail"`);
    }
  });

  it('domaine null retourne tableau vide (pas de crash)', () => {
    const results = getVulgarisationByDomaine(null);
    assert.ok(Array.isArray(results), 'doit retourner un tableau même avec domaine null');
    assert.equal(results.length, 0, 'null ne correspond à aucun domaine');
  });

  it('count domaine bail = total_entries (tout le corpus est bail)', () => {
    const results = getVulgarisationByDomaine('bail');
    const { entries } = loadVulgarisation();
    assert.equal(results.length, entries.length,
      `tout le corpus asloca-kit est bail (${results.length} vs ${entries.length})`);
  });
});

// ─── getVulgarisationStats ───────────────────────────────────────

describe('vulgarisation-loader — getVulgarisationStats', () => {
  beforeEach(() => clearVulgarisationCache());

  it('retourne tous les champs attendus avec les bons types', () => {
    const stats = getVulgarisationStats();
    assert.ok(Number.isInteger(stats.total_entries), 'total_entries entier');
    assert.ok(Array.isArray(stats.sources), 'sources tableau');
    assert.ok(Number.isInteger(stats.fiches_enrichies), 'fiches_enrichies entier');
    assert.ok(Number.isInteger(stats.total_anti_erreurs), 'total_anti_erreurs entier');
    assert.ok(Number.isInteger(stats.total_delais), 'total_delais entier');
    assert.ok(Array.isArray(stats.domaines), 'domaines tableau');
  });

  it('total_entries > 0 (asloca-kit.json présent)', () => {
    const stats = getVulgarisationStats();
    assert.ok(stats.total_entries > 0, `doit avoir ≥1 entrée (reçu ${stats.total_entries})`);
  });

  it('sources : "asloca_kit" présent avec count et domaines tableau', () => {
    const stats = getVulgarisationStats();
    const asloca = stats.sources.find(s => s.source_id === 'asloca_kit');
    assert.ok(asloca, 'source asloca_kit doit être listée');
    assert.ok(asloca.count > 0, 'count > 0');
    assert.ok(Array.isArray(asloca.domaines), 'domaines tableau dans source');
    assert.ok(asloca.domaines.includes('bail'), 'domaine bail dans asloca sources');
  });

  it('fiches_enrichies == nombre de fiches distinctes dans byFiche', () => {
    const stats = getVulgarisationStats();
    clearVulgarisationCache();
    const { byFiche } = loadVulgarisation();
    assert.equal(stats.fiches_enrichies, Object.keys(byFiche).length,
      'fiches_enrichies doit correspondre à byFiche.keys().length');
  });

  it('total_anti_erreurs > 0', () => {
    const stats = getVulgarisationStats();
    assert.ok(stats.total_anti_erreurs > 0,
      `doit avoir ≥1 anti-erreur totale (reçu ${stats.total_anti_erreurs})`);
  });

  it('total_delais ∈ [1, total_entries]', () => {
    const stats = getVulgarisationStats();
    assert.ok(stats.total_delais >= 1,
      `doit avoir ≥1 délai (reçu ${stats.total_delais})`);
    assert.ok(stats.total_delais <= stats.total_entries,
      `total_delais (${stats.total_delais}) ne peut pas dépasser total_entries (${stats.total_entries})`);
  });

  it('domaines : "bail" présent (tout le corpus asloca est bail)', () => {
    const stats = getVulgarisationStats();
    assert.ok(stats.domaines.includes('bail'), '"bail" doit être dans les domaines');
  });

  it('invariant round-trip : total_entries == getVulgarisationByDomaine("bail").length', () => {
    const stats = getVulgarisationStats();
    const bailEntries = getVulgarisationByDomaine('bail');
    assert.equal(stats.total_entries, bailEntries.length,
      'tout le corpus asloca-kit est domaine bail');
  });
});
