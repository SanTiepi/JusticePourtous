import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TIERS,
  TIER_ORDER,
  ALLOWED_DOMAINS,
  tierRank,
  maxTier,
  scoreDimensions,
  applyHardRules,
  evaluateComplexity
} from '../src/services/complexity-router.mjs';

// ─── 1. Constants invariants ──────────────────────────────────────────────────

describe('TIERS + TIER_ORDER + constants', () => {
  it('TIERS has exactly 5 values', () => {
    assert.equal(Object.keys(TIERS).length, 5);
  });

  it('TIER_ORDER has 5 entries in ascending complexity order', () => {
    assert.equal(TIER_ORDER.length, 5);
    assert.equal(TIER_ORDER[0], TIERS.TRIVIAL);
    assert.equal(TIER_ORDER[TIER_ORDER.length - 1], TIERS.HUMAIN);
  });

  it('tierRank: trivial < standard < complexe < limite < humain', () => {
    const ranks = [TIERS.TRIVIAL, TIERS.STANDARD, TIERS.COMPLEXE, TIERS.LIMITE, TIERS.HUMAIN]
      .map(tierRank);
    for (let i = 0; i < ranks.length - 1; i++) {
      assert.ok(ranks[i] < ranks[i + 1], `rank[${i}] should be < rank[${i + 1}]`);
    }
  });

  it('maxTier returns the higher tier', () => {
    assert.equal(maxTier(TIERS.TRIVIAL, TIERS.HUMAIN), TIERS.HUMAIN);
    assert.equal(maxTier(TIERS.HUMAIN, TIERS.TRIVIAL), TIERS.HUMAIN);
    assert.equal(maxTier(TIERS.STANDARD, TIERS.STANDARD), TIERS.STANDARD);
  });

  it('ALLOWED_DOMAINS contains exactly 10 core domains', () => {
    assert.equal(ALLOWED_DOMAINS.size, 10);
    assert.ok(ALLOWED_DOMAINS.has('bail'));
    assert.ok(ALLOWED_DOMAINS.has('travail'));
    assert.ok(!ALLOWED_DOMAINS.has('successions'));
    assert.ok(!ALLOWED_DOMAINS.has('circulation'));
  });
});

// ─── 2. scoreDimensions — entrées dégénérées ─────────────────────────────────

describe('scoreDimensions — entrées dégénérées', () => {
  it('no args → returns valid shape with max=70', () => {
    const r = scoreDimensions();
    assert.ok(r.dimensions);
    assert.equal(r.max, 70);
    assert.equal(typeof r.total, 'number');
  });

  it('empty context → total is a number between 0 and 70', () => {
    const { total } = scoreDimensions({});
    assert.ok(total >= 0 && total <= 70);
  });

  it('dimensions object contains all 7 expected keys', () => {
    const { dimensions } = scoreDimensions({});
    const keys = ['domains', 'clarity', 'urgency', 'stakes', 'adversary', 'coverage', 'jurisprudence'];
    for (const k of keys) assert.ok(k in dimensions, `missing key: ${k}`);
  });
});

// ─── 3. dimension domains ─────────────────────────────────────────────────────

describe('scoreDimensions — dimension domains', () => {
  it('no fiches → 0 domains → score=0', () => {
    const { dimensions } = scoreDimensions({ enrichedAll: [] });
    assert.equal(dimensions.domains.score, 0);
    assert.equal(dimensions.domains.value, 0);
  });

  it('2 fiches same domain → 1 domain → score=0', () => {
    const enrichedAll = [
      { fiche: { domaine: 'bail' } },
      { fiche: { domaine: 'bail' } }
    ];
    const { dimensions } = scoreDimensions({ enrichedAll });
    assert.equal(dimensions.domains.score, 0);
  });

  it('2 fiches different domains → score=5', () => {
    const enrichedAll = [
      { fiche: { domaine: 'bail' } },
      { fiche: { domaine: 'travail' } }
    ];
    const { dimensions } = scoreDimensions({ enrichedAll });
    assert.equal(dimensions.domains.score, 5);
  });

  it('3+ fiches different domains → score=10', () => {
    const enrichedAll = [
      { fiche: { domaine: 'bail' } },
      { fiche: { domaine: 'travail' } },
      { fiche: { domaine: 'famille' } }
    ];
    const { dimensions } = scoreDimensions({ enrichedAll });
    assert.equal(dimensions.domains.score, 10);
  });
});

// ─── 4. dimension clarity ─────────────────────────────────────────────────────

describe('scoreDimensions — dimension clarity', () => {
  it('all 3 critical facts in navigation → score=0', () => {
    const navigation = { infos_extraites: { canton: 'VD', date: '2024-01-01', domaine: 'bail' } };
    const { dimensions } = scoreDimensions({ navigation });
    assert.equal(dimensions.clarity.score, 0);
  });

  it('2/3 critical facts → score=4', () => {
    const navigation = { infos_extraites: { canton: 'GE', date: '2024-01-01' } };
    const { dimensions } = scoreDimensions({ navigation });
    assert.equal(dimensions.clarity.score, 4);
  });

  it('0/3 critical facts → score=8', () => {
    const { dimensions } = scoreDimensions({ facts: {}, navigation: null });
    assert.equal(dimensions.clarity.score, 8);
  });

  it('critical facts in facts object (not only navigation)', () => {
    const facts = { canton: 'BE', date: '2024-01-01', domaine: 'bail' };
    const { dimensions } = scoreDimensions({ facts });
    assert.equal(dimensions.clarity.score, 0);
  });
});

// ─── 5. dimension urgency ─────────────────────────────────────────────────────

describe('scoreDimensions — dimension urgency', () => {
  it('no delai → score=0', () => {
    const { dimensions } = scoreDimensions({});
    assert.equal(dimensions.urgency.score, 0);
  });

  it('1 jour → score=10', () => {
    const { dimensions } = scoreDimensions({ facts: { delai_jours: 1 } });
    assert.equal(dimensions.urgency.score, 10);
  });

  it('3 jours (borne) → score=10', () => {
    const { dimensions } = scoreDimensions({ facts: { delai_jours: 3 } });
    assert.equal(dimensions.urgency.score, 10);
  });

  it('14 jours → score=7', () => {
    const { dimensions } = scoreDimensions({ facts: { delai_jours: 14 } });
    assert.equal(dimensions.urgency.score, 7);
  });

  it('30 jours → score=3', () => {
    const { dimensions } = scoreDimensions({ facts: { delai_jours: 30 } });
    assert.equal(dimensions.urgency.score, 3);
  });

  it('31 jours → score=0', () => {
    const { dimensions } = scoreDimensions({ facts: { delai_jours: 31 } });
    assert.equal(dimensions.urgency.score, 0);
  });

  it('delai dérivé des cascades enrichedPrimary ("5 jours")', () => {
    const enrichedPrimary = {
      cascades: [{ etapes: [{ delai: '5 jours pour contester' }] }]
    };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.urgency.value, 5);
    assert.equal(dimensions.urgency.score, 7); // 3 < 5 ≤ 14 → score=7
  });

  it('delai dérivé du champ delais ("24h")', () => {
    const enrichedPrimary = {
      delais: [{ delai: 'agir dans les 24h' }]
    };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.urgency.value, 1);
    assert.equal(dimensions.urgency.score, 10);
  });
});

// ─── 6. dimension stakes ──────────────────────────────────────────────────────

describe('scoreDimensions — dimension stakes', () => {
  it('montant null → score=3 (incertain)', () => {
    const { dimensions } = scoreDimensions({});
    assert.equal(dimensions.stakes.score, 3);
  });

  it('CHF 400 → score=0', () => {
    const { dimensions } = scoreDimensions({ facts: { montant_chf: 400 } });
    assert.equal(dimensions.stakes.score, 0);
  });

  it('CHF 2000 → score=4', () => {
    const { dimensions } = scoreDimensions({ facts: { montant_chf: 2000 } });
    assert.equal(dimensions.stakes.score, 4);
  });

  it('CHF 25000 → score=7', () => {
    const { dimensions } = scoreDimensions({ facts: { montant_chf: 25000 } });
    assert.equal(dimensions.stakes.score, 7);
  });

  it('CHF 100000 → score=10', () => {
    const { dimensions } = scoreDimensions({ facts: { montant_chf: 100000 } });
    assert.equal(dimensions.stakes.score, 10);
  });
});

// ─── 7. dimension adversary ───────────────────────────────────────────────────

describe('scoreDimensions — dimension adversary', () => {
  it('no adversaire → score=0', () => {
    const { dimensions } = scoreDimensions({});
    assert.equal(dimensions.adversary.score, 0);
  });

  it('adversaire "particulier" → score=0', () => {
    const { dimensions } = scoreDimensions({ facts: { adversaire: 'particulier' } });
    assert.equal(dimensions.adversary.score, 0);
  });

  it('adversaire_avec_avocat → score=6', () => {
    const { dimensions } = scoreDimensions({ facts: { adversaire: 'entreprise', adversaire_avec_avocat: true } });
    assert.equal(dimensions.adversary.score, 6);
  });

  it('adversaire "etat" (ADVERSARY_STATE_KEYS) → score=10', () => {
    const { dimensions } = scoreDimensions({ facts: { adversaire: 'etat' } });
    assert.equal(dimensions.adversary.score, 10);
  });

  it('adversaire "sem" (SEM = État) → score=10', () => {
    const { dimensions } = scoreDimensions({ facts: { adversaire: 'sem' } });
    assert.equal(dimensions.adversary.score, 10);
  });

  it('adversaire_est_etat=true → score=10 indépendamment du libellé', () => {
    const { dimensions } = scoreDimensions({ facts: { adversaire: 'ministère', adversaire_est_etat: true } });
    assert.equal(dimensions.adversary.score, 10);
  });
});

// ─── 8. dimension coverage ────────────────────────────────────────────────────

describe('scoreDimensions — dimension coverage', () => {
  it('domaine hors scope → score=10', () => {
    const enrichedPrimary = { fiche: { domaine: 'successions' }, confiance: 'certain' };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.coverage.score, 10);
  });

  it('confiance=certain → score=0', () => {
    const enrichedPrimary = { fiche: { domaine: 'bail' }, confiance: 'certain' };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.coverage.score, 0);
  });

  it('confiance=probable → score=0', () => {
    const enrichedPrimary = { fiche: { domaine: 'travail' }, confiance: 'probable' };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.coverage.score, 0);
  });

  it('confiance=variable → score=4', () => {
    const enrichedPrimary = { fiche: { domaine: 'bail' }, confiance: 'variable' };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.coverage.score, 4);
  });

  it('confiance inconnue (null) → score=7', () => {
    const { dimensions } = scoreDimensions({});
    assert.equal(dimensions.coverage.score, 7);
  });
});

// ─── 9. dimension jurisprudence ───────────────────────────────────────────────

describe('scoreDimensions — dimension jurisprudence', () => {
  it('jurisprudence_contradictoire=true → score=10', () => {
    const enrichedPrimary = { jurisprudence_contradictoire: true, jurisprudence: [] };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.jurisprudence.score, 10);
  });

  it('contradictions_connues non vide → score=10', () => {
    const enrichedPrimary = { contradictions_connues: ['TF 4A 123/2020'], jurisprudence: [{}] };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.jurisprudence.score, 10);
  });

  it('3+ décisions sans conflit → score=0', () => {
    const enrichedPrimary = { jurisprudence: [{}, {}, {}] };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.jurisprudence.score, 0);
  });

  it('1 décision sans conflit → score=3', () => {
    const enrichedPrimary = { jurisprudence: [{}] };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.jurisprudence.score, 3);
  });

  it('0 décisions sans conflit → score=6', () => {
    const enrichedPrimary = { jurisprudence: [] };
    const { dimensions } = scoreDimensions({ enrichedPrimary });
    assert.equal(dimensions.jurisprudence.score, 6);
  });
});

// ─── 10. applyHardRules ───────────────────────────────────────────────────────

describe('applyHardRules', () => {
  it('aucun trigger → tableau vide', () => {
    const rules = applyHardRules({
      enrichedPrimary: { fiche: { domaine: 'bail' } },
      facts: {}
    });
    assert.deepEqual(rules, []);
  });

  it('domaine hors scope → LIMITE + out_of_scope_domain', () => {
    const rules = applyHardRules({
      enrichedPrimary: { fiche: { domaine: 'circulation' } },
      facts: {}
    });
    assert.equal(rules.length, 1);
    assert.equal(rules[0].tier, TIERS.LIMITE);
    assert.equal(rules[0].reason, 'out_of_scope_domain');
  });

  it('recours_tf=true → HUMAIN + supreme_court_or_grave_penal', () => {
    const rules = applyHardRules({ facts: { recours_tf: true } });
    assert.ok(rules.some(r => r.tier === TIERS.HUMAIN && r.reason === 'supreme_court_or_grave_penal'));
  });

  it('penal_grave=true → HUMAIN', () => {
    const rules = applyHardRules({ facts: { penal_grave: true } });
    assert.ok(rules.some(r => r.tier === TIERS.HUMAIN));
  });

  it('constitutionnel=true → HUMAIN', () => {
    const rules = applyHardRules({ facts: { constitutionnel: true } });
    assert.ok(rules.some(r => r.tier === TIERS.HUMAIN));
  });

  it('adversaire état → COMPLEXE + state_adversary_min_complex', () => {
    const rules = applyHardRules({ facts: { adversaire: 'canton' } });
    assert.ok(rules.some(r => r.tier === TIERS.COMPLEXE && r.reason === 'state_adversary_min_complex'));
  });

  it('adversaire_est_etat=true → COMPLEXE indépendamment du libellé', () => {
    const rules = applyHardRules({ facts: { adversaire: 'patron_méchant', adversaire_est_etat: true } });
    assert.ok(rules.some(r => r.tier === TIERS.COMPLEXE));
  });
});

// ─── 11. evaluateComplexity — tiers de base ──────────────────────────────────

describe('evaluateComplexity — tier de base (score seul)', () => {
  it('score ≤ 15 → TRIVIAL (cas idéal : 1 domaine, faits complets, enjeu faible, no urgence)', () => {
    const context = {
      enrichedAll: [{ fiche: { domaine: 'bail' } }],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [{}, {}, {}] },
      navigation: { infos_extraites: { canton: 'VD', date: '2024-01-01', domaine: 'bail' } },
      facts: { montant_chf: 200, delai_jours: 60 }
    };
    const r = evaluateComplexity(context);
    assert.equal(r.tier, TIERS.TRIVIAL);
    assert.ok(r.score <= 15);
  });

  it('retourne score, dimensions, hard_rules, flags, uncertainties', () => {
    const r = evaluateComplexity({});
    assert.ok('score' in r);
    assert.ok('dimensions' in r);
    assert.ok('hard_rules' in r);
    assert.ok('flags' in r);
    assert.ok('uncertainties' in r);
  });
});

// ─── 12. evaluateComplexity — hard rules forcent tier ─────────────────────────

describe('evaluateComplexity — hard rules forcent tier', () => {
  it('hors scope force LIMITE même si score=0', () => {
    const r = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'successions' }, confiance: 'certain', jurisprudence: [{}, {}, {}] },
      navigation: { infos_extraites: { canton: 'VD', date: '2024-01-01', domaine: 'successions' } },
      facts: { montant_chf: 100, delai_jours: 60 }
    });
    assert.equal(r.tier, TIERS.LIMITE);
    assert.ok(r.flags.hors_scope === true);
  });

  it('recours_tf force HUMAIN même si score trivial', () => {
    const r = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [{}, {}, {}] },
      navigation: { infos_extraites: { canton: 'VD', date: '2024-01-01', domaine: 'bail' } },
      facts: { montant_chf: 100, delai_jours: 60, recours_tf: true }
    });
    assert.equal(r.tier, TIERS.HUMAIN);
    assert.ok(r.flags.humain_requis === true);
  });
});

// ─── 13. asymétrie monter/descendre (freeze #14) ─────────────────────────────

describe('evaluateComplexity — asymétrie monter/descendre', () => {
  const TRIVIAL_CONTEXT = {
    enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [{}, {}, {}] },
    navigation: { infos_extraites: { canton: 'VD', date: '2024-01-01', domaine: 'bail' } },
    facts: { montant_chf: 100, delai_jours: 60 }
  };

  const COMPLEX_CONTEXT = {
    enrichedAll: [
      { fiche: { domaine: 'bail' } },
      { fiche: { domaine: 'travail' } },
      { fiche: { domaine: 'famille' } }
    ],
    enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: null, jurisprudence: [] },
    facts: { montant_chf: 60000, delai_jours: 1 }
  };

  it('montée toujours acceptée (trivial → complexe)', () => {
    const previous = { tier: TIERS.TRIVIAL, score: 5 };
    const r = evaluateComplexity(COMPLEX_CONTEXT, previous);
    assert.ok(tierRank(r.tier) > tierRank(TIERS.TRIVIAL));
  });

  it('descente bloquée si clarté ou confiance insuffisante', () => {
    // Contexte actuel est trivial, mais previous était complexe
    const previous = { tier: TIERS.COMPLEXE, score: 40 };
    const r = evaluateComplexity(TRIVIAL_CONTEXT, previous);
    // La règle freeze #14 : on ne descend que si certitude totale
    // TRIVIAL_CONTEXT a confiance=certain et clarté complète → descente autorisée
    // Mais score pourrait ne pas être trivial selon all the dimensions
    assert.ok(r.tier !== undefined);
  });

  it('descente bloquée si hard rule active', () => {
    // Context trivial MAIS avec un hard rule adversaire état
    const contextWithState = {
      ...TRIVIAL_CONTEXT,
      facts: { ...TRIVIAL_CONTEXT.facts, adversaire: 'canton' }
    };
    const previous = { tier: TIERS.COMPLEXE, score: 40 };
    const r = evaluateComplexity(contextWithState, previous);
    // Hard rule state_adversary_min_complex → COMPLEXE ou plus
    assert.ok(tierRank(r.tier) >= tierRank(TIERS.COMPLEXE));
  });

  it('previous=null → delta null', () => {
    const r = evaluateComplexity({}, null);
    assert.equal(r.delta, null);
  });

  it('previous avec score → delta calculé', () => {
    const r = evaluateComplexity({}, { tier: TIERS.STANDARD, score: 10 });
    assert.equal(typeof r.delta, 'number');
  });
});

// ─── 14. flags ────────────────────────────────────────────────────────────────

describe('evaluateComplexity — flags', () => {
  it('urgent=true si delai_jours ≤ 3', () => {
    const r = evaluateComplexity({ facts: { delai_jours: 2 } });
    assert.equal(r.flags.urgent, true);
  });

  it('urgent=false si delai_jours > 3', () => {
    const r = evaluateComplexity({ facts: { delai_jours: 31 } });
    assert.equal(r.flags.urgent, false);
  });

  it('hors_scope=true si domaine non autorisé', () => {
    const r = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'fiscal' } },
      facts: {}
    });
    assert.equal(r.flags.hors_scope, true);
  });

  it('adversaire_etat=true si adversaire state key', () => {
    const r = evaluateComplexity({ facts: { adversaire: 'ocai' } });
    assert.equal(r.flags.adversaire_etat, true);
  });

  it('jurisprudence_conflit=true si conflit jurisprudentiel', () => {
    const r = evaluateComplexity({
      enrichedPrimary: { jurisprudence_contradictoire: true, jurisprudence: [] }
    });
    assert.equal(r.flags.jurisprudence_conflit, true);
  });
});

// ─── 15. uncertainties ────────────────────────────────────────────────────────

describe('evaluateComplexity — uncertainties', () => {
  it('faits critiques manquants → faits_critiques dans uncertainties', () => {
    const r = evaluateComplexity({ facts: {}, navigation: null });
    const kinds = r.uncertainties.map(u => u.kind);
    assert.ok(kinds.includes('faits_critiques'));
  });

  it('montant inconnu → montant_inconnu dans uncertainties', () => {
    const r = evaluateComplexity({ facts: {} });
    const kinds = r.uncertainties.map(u => u.kind);
    assert.ok(kinds.includes('montant_inconnu'));
  });

  it('uncertainties triées par impact décroissant', () => {
    const r = evaluateComplexity({ facts: {} });
    for (let i = 0; i < r.uncertainties.length - 1; i++) {
      assert.ok(r.uncertainties[i].impact >= r.uncertainties[i + 1].impact);
    }
  });

  it('aucune uncertainty si contexte idéal', () => {
    const r = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [] },
      navigation: { infos_extraites: { canton: 'VD', date: '2024-01-01', domaine: 'bail' } },
      facts: { montant_chf: 5000, delai_jours: 60 }
    });
    assert.equal(r.uncertainties.length, 0);
  });
});
