/**
 * Tests de robustesse et comportement pour :
 *   - src/services/pivot-detector.mjs    (detectPivot)
 *   - src/services/domain-recommender.mjs (recommendDomainOrder)
 *
 * Fonctions pures, zéro LLM, zéro réseau.
 *
 * Bug fixé 2026-05-29 : recommendDomainOrder(null) crashait avec
 * "enrichedAll is not iterable" — le paramètre par défaut ne s'applique
 * pas pour null (uniquement undefined). Garde ajoutée.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { detectPivot } from '../src/services/pivot-detector.mjs';
import { recommendDomainOrder } from '../src/services/domain-recommender.mjs';

// ---------------------------------------------------------------------------
// detectPivot — entrées dégénérées
// ---------------------------------------------------------------------------

describe('detectPivot — entrées dégénérées', () => {
  test('sans arguments → pas de pivot', () => {
    const r = detectPivot();
    assert.equal(r.is_pivot, false);
    assert.deepEqual(r.reasons, []);
    assert.equal(r.severity, 0);
  });

  test('objets vides → pas de pivot', () => {
    const r = detectPivot({}, {});
    assert.equal(r.is_pivot, false);
    assert.deepEqual(r.reasons, []);
  });

  test('null/null → pas de crash, pas de pivot', () => {
    let r;
    assert.doesNotThrow(() => { r = detectPivot(null, null); });
    assert.equal(r.is_pivot, false);
  });

  test('undefined/undefined → pas de pivot', () => {
    const r = detectPivot(undefined, undefined);
    assert.equal(r.is_pivot, false);
  });
});

// ---------------------------------------------------------------------------
// detectPivot — changement de domaine
// ---------------------------------------------------------------------------

describe('detectPivot — changement de domaine', () => {
  function snap(ficheId, domaine) {
    return {
      navigation: { fiches_pertinentes: [ficheId], resume_situation: 'situation générique' },
      enriched_primary: { fiche: { id: ficheId, domaine } }
    };
  }

  test('domaine bail → travail = pivot (severity 3)', () => {
    const r = detectPivot(snap('bail_moisissure', 'bail'), snap('travail_licenciement', 'travail'));
    assert.equal(r.is_pivot, true);
    assert.ok(r.reasons.some(rr => rr.startsWith('domain_change:')));
    assert.ok(r.severity >= 3);
  });

  test('même domaine, même fiche → pas de pivot', () => {
    const r = detectPivot(snap('bail_moisissure', 'bail'), snap('bail_moisissure', 'bail'));
    assert.equal(r.is_pivot, false);
  });

  test('même domaine, fiche différente, situation similaire → pas de pivot', () => {
    const before = {
      navigation: { fiches_pertinentes: ['bail_moisissure'], resume_situation: 'loyer moisissure humidité appartement' },
      enriched_primary: { fiche: { id: 'bail_moisissure', domaine: 'bail' } }
    };
    const after = {
      navigation: { fiches_pertinentes: ['bail_defaut_entretien'], resume_situation: 'loyer moisissure humidité appartement défaut' },
      enriched_primary: { fiche: { id: 'bail_defaut_entretien', domaine: 'bail' } }
    };
    const r = detectPivot(before, after);
    // Jaccard élevé sur les mots communs → pas de pivot
    assert.equal(r.is_pivot, false);
  });

  test('même domaine, fiche différente, situation radicalement différente → fiche_change_with_situation_shift', () => {
    const before = {
      navigation: { fiches_pertinentes: ['bail_moisissure'], resume_situation: 'humidité moisissure champignons muraille' },
      enriched_primary: { fiche: { id: 'bail_moisissure', domaine: 'bail' } }
    };
    const after = {
      navigation: { fiches_pertinentes: ['bail_expulsion'], resume_situation: 'résiliation préavis congé délai tribunal' },
      enriched_primary: { fiche: { id: 'bail_expulsion', domaine: 'bail' } }
    };
    const r = detectPivot(before, after);
    assert.ok(r.reasons.some(rr => rr.startsWith('fiche_change_with_situation_shift:')));
    assert.ok(r.severity >= 2);
  });

  test('domaine inféré depuis fiche_id (pas de fiche enrichie)', () => {
    const before = { navigation: { fiches_pertinentes: ['bail_moisissure'], resume_situation: 'a' } };
    const after  = { navigation: { fiches_pertinentes: ['travail_licenciement'], resume_situation: 'b' } };
    const r = detectPivot(before, after);
    assert.equal(r.is_pivot, true);
    assert.ok(r.reasons.some(rr => rr.includes('bail→travail')));
  });
});

// ---------------------------------------------------------------------------
// detectPivot — contradictions centrales
// ---------------------------------------------------------------------------

describe('detectPivot — contradictions centrales', () => {
  function withContradictions(severity_list) {
    return {
      unresolved_contradictions: severity_list.map(s => ({ severity: s }))
    };
  }

  test('contradiction severity 3 → pivot', () => {
    const r = detectPivot({}, withContradictions([3]));
    assert.equal(r.is_pivot, true);
    assert.ok(r.reasons.some(rr => rr.startsWith('central_contradictions:')));
  });

  test('contradiction severity 2 seulement → pas de pivot (seuil = 3)', () => {
    const r = detectPivot({}, withContradictions([2, 2]));
    assert.equal(r.is_pivot, false);
  });

  test('tableau vide → pas de contradiction', () => {
    const r = detectPivot({}, { unresolved_contradictions: [] });
    assert.equal(r.is_pivot, false);
  });

  test('domain change + contradiction → severity >= 6', () => {
    const before = { enriched_primary: { fiche: { id: 'bail_x', domaine: 'bail' } } };
    const after  = { enriched_primary: { fiche: { id: 'travail_x', domaine: 'travail' } }, unresolved_contradictions: [{ severity: 3 }] };
    const r = detectPivot(before, after);
    assert.ok(r.severity >= 6);
  });
});

// ---------------------------------------------------------------------------
// recommendDomainOrder — entrées dégénérées
// ---------------------------------------------------------------------------

describe('recommendDomainOrder — entrées dégénérées', () => {
  test('tableau vide → []', () => {
    assert.deepEqual(recommendDomainOrder([]), []);
  });

  test('null → [] (bug fix : ne crashe plus)', () => {
    let r;
    assert.doesNotThrow(() => { r = recommendDomainOrder(null); });
    assert.deepEqual(r, []);
  });

  test('undefined → []', () => {
    assert.deepEqual(recommendDomainOrder(undefined), []);
  });

  test('[null, undefined] → [] (ignore les entrées non-objet)', () => {
    const r = recommendDomainOrder([null, undefined]);
    assert.deepEqual(r, []);
  });

  test('fiche sans domaine → ignorée', () => {
    const r = recommendDomainOrder([{ fiche: null, delais: [] }]);
    assert.deepEqual(r, []);
  });
});

// ---------------------------------------------------------------------------
// recommendDomainOrder — scoring délais
// ---------------------------------------------------------------------------

describe('recommendDomainOrder — scoring délais', () => {
  function ficheWithDelai(domaine, delaiStr) {
    return { fiche: { domaine }, delais: [{ delai: delaiStr, procedure: 'test' }], cascades: [], confiance: 'certain' };
  }

  test('délai critique ≤ 3j → score 40, reasons inclut délai critique', () => {
    const r = recommendDomainOrder([ficheWithDelai('bail', '3 jours')]);
    assert.equal(r.length, 1);
    assert.ok(r[0].priority_score >= 40);
    assert.ok(r[0].reasons.some(rr => rr.includes('délai critique')));
  });

  test('"immédiat" → parsé comme 1j → score 40', () => {
    const r = recommendDomainOrder([ficheWithDelai('dettes', 'immédiat')]);
    assert.ok(r[0].priority_score >= 40);
  });

  test('"48h" → parsé comme 2j → score 40', () => {
    const r = recommendDomainOrder([ficheWithDelai('travail', '48h')]);
    assert.ok(r[0].priority_score >= 40);
  });

  test('délai ≤ 14j (court) → score 25', () => {
    const r = recommendDomainOrder([ficheWithDelai('famille', '14 jours')]);
    assert.ok(r[0].priority_score >= 25);
    assert.ok(r[0].reasons.some(rr => rr.includes('délai court')));
  });

  test('délai ≤ 30j → score 10', () => {
    const r = recommendDomainOrder([ficheWithDelai('social', '30 jours')]);
    assert.ok(r[0].priority_score >= 10);
  });

  test('pas de délais → score 0 (pas de raison délai)', () => {
    const r = recommendDomainOrder([{ fiche: { domaine: 'etrangers' }, delais: [], cascades: [], confiance: 'certain' }]);
    assert.equal(r.length, 1);
    assert.ok(!r[0].reasons.some(rr => rr.includes('délai')));
  });
});

// ---------------------------------------------------------------------------
// recommendDomainOrder — bonus financier + cascade + confiance
// ---------------------------------------------------------------------------

describe('recommendDomainOrder — bonus cascade, confiance, financier', () => {
  test('cascade ≥ 3 étapes → bonus 15 + reason "effet cascade"', () => {
    const fiche = {
      fiche: { domaine: 'famille' },
      delais: [],
      cascades: [{ etapes: [{ step: 1 }, { step: 2 }, { step: 3 }] }],
      confiance: 'certain'
    };
    const r = recommendDomainOrder([fiche]);
    assert.ok(r[0].priority_score >= 15);
    assert.ok(r[0].reasons.some(rr => rr.includes('cascade')));
  });

  test('cascade < 3 étapes → pas de bonus cascade', () => {
    const fiche = {
      fiche: { domaine: 'famille' },
      delais: [],
      cascades: [{ etapes: [{ step: 1 }, { step: 2 }] }],
      confiance: 'certain'
    };
    const r = recommendDomainOrder([fiche]);
    assert.ok(!r[0].reasons.some(rr => rr.includes('cascade')));
  });

  test('confiance incertain → -10 au score', () => {
    const certain  = [{ fiche: { domaine: 'bail' }, delais: [], cascades: [], confiance: 'certain' }];
    const incertain = [{ fiche: { domaine: 'bail' }, delais: [], cascades: [], confiance: 'incertain' }];
    const rc = recommendDomainOrder(certain);
    const ri = recommendDomainOrder(incertain);
    assert.ok(ri[0].priority_score < rc[0].priority_score);
    assert.ok(ri[0].reasons.some(rr => rr.includes('faible confiance')));
  });

  test('bail + délai ≤ 14j → bonus financier +5 sur le score', () => {
    const r = recommendDomainOrder([{ fiche: { domaine: 'bail' }, delais: [{ delai: '10 jours' }], cascades: [], confiance: 'certain' }]);
    assert.ok(r[0].reasons.some(rr => rr.includes('enjeu financier')));
  });

  test('voisinage + délai court → PAS de bonus financier', () => {
    const r = recommendDomainOrder([{ fiche: { domaine: 'voisinage' }, delais: [{ delai: '10 jours' }], cascades: [], confiance: 'certain' }]);
    assert.ok(!r[0].reasons.some(rr => rr.includes('enjeu financier')));
  });
});

// ---------------------------------------------------------------------------
// recommendDomainOrder — tri multi-domaines
// ---------------------------------------------------------------------------

describe('recommendDomainOrder — tri multi-domaines', () => {
  test('domaine avec délai critique avant domaine sans délai', () => {
    const urgent = { fiche: { domaine: 'bail' }, delais: [{ delai: '2 jours' }], cascades: [], confiance: 'certain' };
    const calm   = { fiche: { domaine: 'famille' }, delais: [], cascades: [], confiance: 'certain' };
    const r = recommendDomainOrder([calm, urgent]);
    assert.equal(r[0].domaine, 'bail');
  });

  test('retourne un résultat par domaine unique (deux fiches même domaine → 1 entrée)', () => {
    const f1 = { fiche: { domaine: 'bail' }, delais: [{ delai: '5 jours' }], cascades: [], confiance: 'certain' };
    const f2 = { fiche: { domaine: 'bail' }, delais: [{ delai: '30 jours' }], cascades: [], confiance: 'certain' };
    const r = recommendDomainOrder([f1, f2]);
    assert.equal(r.length, 1);
    assert.equal(r[0].domaine, 'bail');
  });

  test('delai_min_jours reflète le délai le plus court du domaine', () => {
    const fiche = { fiche: { domaine: 'travail' }, delais: [{ delai: '30 jours' }, { delai: '10 jours' }], cascades: [], confiance: 'certain' };
    const r = recommendDomainOrder([fiche]);
    assert.equal(r[0].delai_min_jours, 10);
  });
});
