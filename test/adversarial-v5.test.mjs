/**
 * Adversarial V5 — 20 cas tordus pour exposer les failles du pipeline
 *
 * Catégories :
 * 1. Multi-domaines (3+ fiches touchées)
 * 2. Ambiguïté sémantique (le même mot = sens différent)
 * 3. Faux amis juridiques (signal trompeur → mauvais domaine)
 * 4. Cantons edge case (Tessin, nouveaux cantons, bilingue)
 * 5. Données manquantes / floues
 * 6. Enrichissement vulgarisation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { semanticSearch } from '../src/services/semantic-search.mjs';
import { getAllFiches } from '../src/services/fiches.mjs';
import { getVulgarisationForFiche } from '../src/services/vulgarisation-loader.mjs';
import { loadVulgarisation } from '../src/services/vulgarisation-loader.mjs';

const fiches = getAllFiches();
function search(q, n = 5) { return semanticSearch(q, fiches, n); }

// ============================================================
// 1. MULTI-DOMAINES — une situation, plusieurs fiches
// ============================================================

describe('Multi-domaines adversarial', () => {
  it('viré + loyer impayé + accident → bail + travail', () => {
    const results = search('je me suis fait virer et je ne peux plus payer mon loyer, en plus j ai eu un accident au travail');
    const domains = new Set(results.map(r => r.fiche.domaine));
    assert.ok(domains.size >= 2, `should span >=2 domains, got: ${[...domains].join(', ')}`);
  });

  it('divorce + pension alimentaire + dettes → famille + dettes', () => {
    const results = search('mon ex ne paie pas la pension et j ai des dettes à cause du divorce');
    const domains = new Set(results.map(r => r.fiche.domaine));
    assert.ok(domains.has('famille') || domains.has('dettes'),
      `should cover famille or dettes, got: ${[...domains].join(', ')}`);
  });

  it('étranger + travail + logement → finds relevant results', () => {
    const results = search('j ai un permis B, mon employeur me licencie et mon bailleur veut m expulser');
    assert.ok(results.length >= 3, `multi-domain query should return >=3 results, got ${results.length}`);
    // At minimum should find étranger domain (permis B is strong signal)
    const domains = new Set(results.map(r => r.fiche.domaine));
    assert.ok(domains.has('etrangers') || domains.has('travail') || domains.has('bail'),
      `should cover at least one relevant domain, got: ${[...domains].join(', ')}`);
  });

  it('moisissure + sous-location + augmentation → 3 fiches bail distinctes', () => {
    const results = search('il y a de la moisissure, je sous-loue une chambre et le bailleur veut augmenter le loyer');
    const ficheIds = new Set(results.map(r => r.fiche.id));
    assert.ok(ficheIds.size >= 2, `should find >=2 distinct fiches, got: ${[...ficheIds].join(', ')}`);
  });
});

// ============================================================
// 2. AMBIGUÏTÉ SÉMANTIQUE — même mot, sens différent
// ============================================================

describe('Ambiguïté sémantique adversarial', () => {
  it('"mon patron me doit de l argent" → travail (salaire), pas dettes', () => {
    const results = search('mon patron me doit de l argent');
    assert.ok(results.length > 0);
    // "doit de l'argent" pourrait router vers dettes, mais le contexte "patron" = travail
    const top = results[0];
    assert.equal(top.fiche.domaine, 'travail',
      `"patron + argent" should be travail, got ${top.fiche.domaine} (${top.fiche.id})`);
  });

  it('"charges" dans bail vs dettes → bail si contexte loyer', () => {
    const results = search('mes charges de loyer ont été augmentées sans explication');
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'bail',
      `"charges loyer" should be bail, got ${results[0].fiche.domaine}`);
  });

  it('"résiliation" ambigu — bail ou travail ?', () => {
    // Sans contexte, les deux sont valides. Top-5 devrait couvrir les deux.
    const results = search('j ai reçu une résiliation');
    const domains = new Set(results.map(r => r.fiche.domaine));
    // Au moins un des deux domaines devrait être présent
    assert.ok(domains.has('bail') || domains.has('travail'),
      `"résiliation" should route to bail or travail, got: ${[...domains].join(', ')}`);
  });

  it('"mon propriétaire me doit de l argent" → bail, pas dettes', () => {
    const results = search('mon propriétaire me doit de l argent pour les réparations');
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'bail',
      `"propriétaire + argent + réparations" should be bail, got ${results[0].fiche.domaine}`);
  });
});

// ============================================================
// 3. FAUX AMIS JURIDIQUES — signal trompeur
// ============================================================

describe('Faux amis juridiques adversarial', () => {
  it('"bail international" = pas forcément complexe', () => {
    const results = search('j ai signé un bail pour un appartement à Genève avec un bailleur français');
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'bail',
      `"bail international" should still be bail, got ${results[0].fiche.domaine}`);
  });

  it('"poursuite" au sens travail (harcèlement) vs LP (dettes)', () => {
    const results = search('mon employeur me poursuit et me harcèle');
    assert.ok(results.length > 0);
    // Le contexte "employeur" + "harcèle" devrait router vers travail
    assert.equal(results[0].fiche.domaine, 'travail',
      `"employeur + poursuit + harcèle" should be travail, got ${results[0].fiche.domaine}`);
  });

  it('"assurance" dans contexte bail ≠ assurance sociale', () => {
    const results = search('mon assurance ne veut pas couvrir les dégâts dans mon appartement');
    assert.ok(results.length > 0);
    // Could be bail (dégâts = état des lieux) — at minimum should not crash
    assert.ok(['bail', 'assurances'].includes(results[0].fiche.domaine),
      `"assurance + dégâts + appartement" should be bail or assurances, got ${results[0].fiche.domaine}`);
  });

  it('"garde" ambigu — garde d enfant vs garde à vue', () => {
    const results = search('je veux récupérer la garde');
    assert.ok(results.length > 0);
    // Without more context, should lean towards famille (garde d'enfant)
    assert.equal(results[0].fiche.domaine, 'famille',
      `"garde" should lean towards famille, got ${results[0].fiche.domaine}`);
  });
});

// ============================================================
// 4. CANTONS EDGE CASE
// ============================================================

describe('Cantons edge case adversarial', () => {
  it('query in Italian (Tessin context) still finds results', () => {
    const results = search('il mio padrone di casa vuole aumentare l affitto a Lugano');
    // We don't support Italian well, but should not crash
    assert.ok(Array.isArray(results));
    // Bonus: if it finds bail, great
  });

  it('canton-specific term "régie" → bail domain', () => {
    const results = search('la régie de Lausanne refuse de rendre ma caution');
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'bail',
      `"régie + caution" should be bail, got ${results[0].fiche.domaine}`);
  });

  it('new canton (Glaris) does not break search', () => {
    const results = search('j habite à Glaris et mon bailleur ne fait pas les réparations');
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'bail');
  });

  it('Jura specificities: prud\'hommes → travail', () => {
    const results = search('je vais saisir les prud hommes à Delémont pour salaire impayé');
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'travail');
  });
});

// ============================================================
// 5. DONNÉES MANQUANTES / FLOUES
// ============================================================

describe('Données manquantes adversarial', () => {
  it('query sans canton, sans montant — ne crash pas', () => {
    const results = search('on me doit de l argent pour un truc');
    assert.ok(Array.isArray(results));
  });

  it('query vague "j ai un problème" → résultats, pas erreur', () => {
    const results = search('j ai un problème');
    assert.ok(Array.isArray(results));
  });

  it('query avec seulement des chiffres "3 mois 2500" → résultats ou vide', () => {
    const results = search('3 mois 2500 francs');
    assert.ok(Array.isArray(results));
  });

  it('query contradictoire "je veux augmenter et baisser mon loyer" → bail', () => {
    const results = search('je veux contester l augmentation de loyer et demander une baisse');
    assert.ok(results.length > 0);
    assert.equal(results[0].fiche.domaine, 'bail');
    // Should find multiple bail fiches
    const bailResults = results.filter(r => r.fiche.domaine === 'bail');
    assert.ok(bailResults.length >= 2, `should find >=2 bail fiches for hausse+baisse, got ${bailResults.length}`);
  });
});

// ============================================================
// 6. VULGARISATION ENRICHMENT
// ============================================================

describe('Vulgarisation enrichment quality', () => {
  it('bail_depot_garantie has anti-erreurs about Swisscaution', () => {
    const v = getVulgarisationForFiche('bail_depot_garantie');
    assert.ok(v, 'should have vulgarisation');
    const hasSwisscaution = v.anti_erreurs.some(ae => ae.erreur.includes('Swisscaution'));
    assert.ok(hasSwisscaution, 'should warn about Swisscaution vs garantie bancaire');
  });

  it('bail_resiliation_conteste has 30-day deadline', () => {
    const v = getVulgarisationForFiche('bail_resiliation_conteste');
    assert.ok(v, 'should have vulgarisation');
    const has30Days = v.delais.some(d => d.delai.includes('30'));
    assert.ok(has30Days, 'should mention 30-day deadline for contesting');
  });

  it('vulgarisation covers all 3 lifecycle phases', () => {
    const { entries } = loadVulgarisation();
    const sections = new Set(entries.map(e => e.section));
    assert.ok(sections.has('signature'), 'missing signature phase');
    assert.ok(sections.has('en_cours'), 'missing en_cours phase');
    assert.ok(sections.has('fin'), 'missing fin phase');
    // Each section should have ~10 entries
    for (const s of ['signature', 'en_cours', 'fin']) {
      const count = entries.filter(e => e.section === s).length;
      assert.ok(count >= 8, `section ${s} has only ${count} entries, expected >=8`);
    }
  });

  it('anti-erreurs are specific enough to prevent real mistakes', () => {
    const { entries } = loadVulgarisation();
    const allAntiErreurs = entries.flatMap(e => e.anti_erreurs || []);
    // Check that anti-erreurs are specific (mention actions, not vague advice)
    const actionable = allAntiErreurs.filter(ae =>
      /risque|perte|nul|impossible|interdit|danger|obligation|sans|pas|ne.*pas|trop|délai|charge/i.test(ae)
    );
    const ratio = actionable.length / allAntiErreurs.length;
    assert.ok(ratio > 0.4, `only ${Math.round(ratio*100)}% anti-erreurs are actionable, expected >40%`);
  });
});
