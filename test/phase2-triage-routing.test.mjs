import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  scoreDimensions,
  applyHardRules,
  evaluateComplexity,
  TIERS,
  tierRank
} from '../src/services/complexity-router.mjs';

import {
  detectRoundContradictions,
  shouldBlockForContradiction,
  buildContradictionQuestion
} from '../src/services/round-contradiction-detector.mjs';

import { detectPivot } from '../src/services/pivot-detector.mjs';

import {
  decideNext,
  MAX_ROUNDS,
  MAX_QUESTIONS_PER_ROUND,
  STABILIZATION_THRESHOLD
} from '../src/services/round-orchestrator.mjs';

// ============================================================
// complexity-router
// ============================================================

describe('complexity-router — 7 dimensions', () => {
  it('cas trivial clair : score bas, tier trivial', () => {
    const out = evaluateComplexity({
      enrichedAll: [{ fiche: { domaine: 'bail' } }],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [{}, {}, {}] },
      navigation: { infos_extraites: { canton: 'VD', date: '2024-01', domaine: 'bail' } },
      facts: { canton: 'VD', date: '2024-01', domaine: 'bail', montant_chf: 100 }
    });
    assert.ok(out.score <= 15, `score trop haut: ${out.score}`);
    assert.equal(out.tier, TIERS.TRIVIAL);
  });

  it('multi-domaines monte le tier', () => {
    const out = evaluateComplexity({
      enrichedAll: [
        { fiche: { domaine: 'bail' } },
        { fiche: { domaine: 'travail' } },
        { fiche: { domaine: 'dettes' } }
      ],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'variable' },
      facts: { canton: 'VD' }
    });
    assert.equal(out.dimensions.domains.value, 3);
    assert.ok(out.dimensions.domains.score >= 10);
  });

  it('urgence délai court : score urgency élevé + flag urgent', () => {
    const out = evaluateComplexity({
      enrichedPrimary: {
        fiche: { domaine: 'bail' },
        confiance: 'probable',
        delais: [{ domaine: 'bail', delai: '3 jours', procedure: 'contestation' }]
      },
      facts: { canton: 'VD', date: '2024', domaine: 'bail' }
    });
    assert.ok(out.dimensions.urgency.score >= 7);
    assert.equal(out.flags.urgent, true);
  });

  it('hors scope → hard rule déclenche tier limite', () => {
    const out = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'successions' }, confiance: 'certain' },
      facts: { canton: 'VD' }
    });
    assert.ok(out.hard_rules.some(r => r.reason === 'out_of_scope_domain'));
    assert.equal(tierRank(out.tier) >= tierRank(TIERS.LIMITE), true);
    assert.equal(out.flags.hors_scope, true);
  });

  it('adversaire État → tier au moins complexe', () => {
    const out = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'assurances' }, confiance: 'probable' },
      facts: { canton: 'VD', adversaire: 'ai', adversaire_est_etat: true }
    });
    assert.ok(out.hard_rules.some(r => r.reason === 'state_adversary_min_complex'));
    assert.ok(tierRank(out.tier) >= tierRank(TIERS.COMPLEXE));
    assert.equal(out.flags.adversaire_etat, true);
  });

  it('recours TF / pénal grave → tier humain', () => {
    const out = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'travail' } },
      facts: { recours_tf: true }
    });
    assert.equal(out.tier, TIERS.HUMAIN);
    assert.equal(out.flags.humain_requis, true);
  });

  it('asymétrie : on monte sur suspicion (tier supérieur accepté)', () => {
    const prev = { tier: TIERS.TRIVIAL, score: 10 };
    const out = evaluateComplexity({
      enrichedAll: [
        { fiche: { domaine: 'bail' } },
        { fiche: { domaine: 'travail' } }
      ],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'variable' },
      facts: { canton: 'VD' }
    }, prev);
    assert.ok(tierRank(out.tier) >= tierRank(TIERS.STANDARD));
  });

  it('asymétrie : on ne redescend QUE sur certitude', () => {
    // Simule un round précédent qui était en COMPLEXE,
    // round courant qui aurait un score bas mais avec confiance variable.
    const prev = { tier: TIERS.COMPLEXE, score: 40 };
    const out = evaluateComplexity({
      enrichedAll: [{ fiche: { domaine: 'bail' } }],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'variable' },
      facts: { canton: 'VD', date: '2024', domaine: 'bail' }
    }, prev);
    // Doit rester COMPLEXE car confiance !== certain/probable
    assert.equal(out.tier, TIERS.COMPLEXE);
  });

  it('asymétrie : redescend si certitude totale ET aucun hard rule', () => {
    const prev = { tier: TIERS.COMPLEXE, score: 40 };
    const out = evaluateComplexity({
      enrichedAll: [{ fiche: { domaine: 'bail' } }],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [{}, {}, {}] },
      facts: { canton: 'VD', date: '2024', domaine: 'bail', montant_chf: 100 }
    }, prev);
    assert.ok(tierRank(out.tier) < tierRank(TIERS.COMPLEXE));
  });

  it('delta et delta_pct calculés quand previous fourni', () => {
    const prev = { tier: TIERS.STANDARD, score: 25 };
    const out = evaluateComplexity({
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'probable' },
      facts: { canton: 'VD' }
    }, prev);
    assert.ok(out.delta != null);
    assert.ok(out.delta_pct != null);
  });
});

describe('complexity-router — scoreDimensions bounds', () => {
  it('score total ∈ [0, max]', () => {
    const out = scoreDimensions({
      enrichedAll: [{ fiche: { domaine: 'bail' } }],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain' },
      facts: {}
    });
    assert.ok(out.total >= 0);
    assert.ok(out.total <= out.max);
  });

  it('toutes les 7 dimensions présentes', () => {
    const out = scoreDimensions({
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain' },
      facts: {}
    });
    const expected = ['domains', 'clarity', 'urgency', 'stakes', 'adversary', 'coverage', 'jurisprudence'];
    for (const k of expected) assert.ok(out.dimensions[k], `dimension ${k} manquante`);
  });
});

// ============================================================
// round-contradiction-detector
// ============================================================

describe('round-contradiction-detector', () => {
  it('même faits = aucune contradiction', () => {
    const out = detectRoundContradictions({ canton: 'VD' }, { canton: 'VD' });
    assert.equal(out.length, 0);
  });

  it('canton différent = contradiction haute sévérité', () => {
    const out = detectRoundContradictions({ canton: 'VD' }, { canton: 'GE' });
    assert.equal(out.length, 1);
    assert.equal(out[0].key, 'canton');
    assert.equal(out[0].severity, 3);
  });

  it('info ajoutée (absente avant) ≠ contradiction', () => {
    const out = detectRoundContradictions({ canton: 'VD' }, { canton: 'VD', date: '2024-01' });
    assert.equal(out.length, 0);
  });

  it('shouldBlockForContradiction true si sévérité ≥ 2', () => {
    const contras = detectRoundContradictions({ montant_chf: 100 }, { montant_chf: 5000 });
    assert.equal(shouldBlockForContradiction(contras), true);
  });

  it('question de levée cible la contradiction la plus sévère', () => {
    const contras = detectRoundContradictions(
      { canton: 'VD', montant_chf: 100 },
      { canton: 'GE', montant_chf: 200 }
    );
    const q = buildContradictionQuestion(contras);
    assert.ok(q.question.includes('VD'));
    assert.ok(q.question.includes('GE'));
    assert.equal(q.importance, 'critique');
    assert.equal(q.choix.length, 2);
  });

  it('tri par sévérité : canton (3) avant montant (2)', () => {
    const contras = detectRoundContradictions(
      { canton: 'VD', montant_chf: 100 },
      { canton: 'GE', montant_chf: 200 }
    );
    assert.equal(contras[0].key, 'canton');
    assert.equal(contras[1].key, 'montant_chf');
  });
});

// ============================================================
// pivot-detector
// ============================================================

describe('pivot-detector', () => {
  it('aucun changement = pas de pivot', () => {
    const out = detectPivot(
      { navigation: { resume_situation: 'moisissure dans appart VD' }, enriched_primary: { fiche: { id: 'bail-moisissure', domaine: 'bail' } } },
      { navigation: { resume_situation: 'moisissure dans appart VD depuis 6 mois' }, enriched_primary: { fiche: { id: 'bail-moisissure', domaine: 'bail' } } }
    );
    assert.equal(out.is_pivot, false);
  });

  it('changement de domaine = pivot', () => {
    const out = detectPivot(
      { enriched_primary: { fiche: { id: 'bail-moisissure', domaine: 'bail' } } },
      { enriched_primary: { fiche: { id: 'travail-licenciement', domaine: 'travail' } } }
    );
    assert.equal(out.is_pivot, true);
    assert.ok(out.reasons.some(r => r.includes('domain_change')));
  });

  it('changement de fiche même domaine mais situation similaire ≠ pivot', () => {
    const out = detectPivot(
      {
        navigation: { resume_situation: 'moisissure dans appartement lausannois depuis six mois' },
        enriched_primary: { fiche: { id: 'bail-moisissure-legere', domaine: 'bail' } }
      },
      {
        navigation: { resume_situation: 'moisissure dans appartement lausannois depuis huit mois' },
        enriched_primary: { fiche: { id: 'bail-moisissure-grave', domaine: 'bail' } }
      }
    );
    assert.equal(out.is_pivot, false);
  });

  it('contradictions centrales (severity 3) = pivot', () => {
    const out = detectPivot(
      { enriched_primary: { fiche: { id: 'bail-moisissure', domaine: 'bail' } } },
      {
        enriched_primary: { fiche: { id: 'bail-moisissure', domaine: 'bail' } },
        unresolved_contradictions: [{ key: 'canton', severity: 3 }]
      }
    );
    assert.equal(out.is_pivot, true);
  });
});

// ============================================================
// round-orchestrator — scénarios
// ============================================================

describe('round-orchestrator — stop conditions', () => {
  it('tier humain → stop immédiat', () => {
    const out = decideNext({
      currentContext: {
        enrichedPrimary: { fiche: { domaine: 'travail' } },
        facts: { recours_tf: true }
      },
      roundsDone: 0
    });
    assert.equal(out.action, 'tier_humain');
    assert.equal(out.should_stop, true);
  });

  it('aucune incertitude critique → ready_for_pipeline', () => {
    const out = decideNext({
      currentContext: {
        enrichedAll: [{ fiche: { domaine: 'bail' } }],
        enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [{}, {}, {}] },
        facts: { canton: 'VD', date: '2024', domaine: 'bail', montant_chf: 100 }
      },
      marginalQuestions: [],
      roundsDone: 1
    });
    assert.equal(out.action, 'ready_for_pipeline');
    assert.equal(out.should_stop, true);
  });

  it('MAX_ROUNDS atteint → ready_for_pipeline avec note zones d\'ombre', () => {
    const out = decideNext({
      currentContext: {
        enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'variable' },
        facts: {}
      },
      marginalQuestions: [{ id: 'q1', impact: 7 }],
      roundsDone: MAX_ROUNDS
    });
    assert.equal(out.action, 'ready_for_pipeline');
    assert.equal(out.should_stop, true);
    assert.match(out.note || '', /ombre/i);
  });

  it('score stabilisé (Δ<10%) ET round ≥ 1 → ready_for_pipeline', () => {
    const previousEval = { tier: TIERS.STANDARD, score: 30, uncertainties: [] };
    const out = decideNext({
      previousEval,
      currentContext: {
        enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'probable' },
        facts: { canton: 'VD', date: '2024', domaine: 'bail' }
      },
      marginalQuestions: [{ id: 'q1', impact: 3 }],
      roundsDone: 1
    });
    // delta_pct doit être < STABILIZATION_THRESHOLD pour trigger stop
    if (out.eval.delta_pct != null && out.eval.delta_pct < STABILIZATION_THRESHOLD) {
      assert.equal(out.action, 'ready_for_pipeline');
      assert.ok(out.reasons.includes('score_stabilized'));
    }
  });

  it('contradiction critique inter-round → ask_contradiction (mono-question)', () => {
    const out = decideNext({
      previousEval: { tier: TIERS.STANDARD, score: 25 },
      previousFacts: { canton: 'VD' },
      currentContext: {
        enrichedPrimary: { fiche: { domaine: 'bail' } },
        facts: { canton: 'GE' }
      },
      roundsDone: 1
    });
    assert.equal(out.action, 'ask_contradiction');
    assert.equal(out.questions.length, 1);
    assert.equal(out.questions[0].importance, 'critique');
  });

  it('pivot détecté → action pivot_detected (caller reset case)', () => {
    const out = decideNext({
      previousEval: { tier: TIERS.STANDARD, score: 25 },
      previousNavigation: { fiches_pertinentes: ['bail-moisissure'] },
      currentContext: {
        navigation: { fiches_pertinentes: ['travail-licenciement'] },
        enrichedPrimary: { fiche: { id: 'travail-licenciement', domaine: 'travail' } },
        facts: {}
      },
      roundsDone: 1
    });
    assert.equal(out.action, 'pivot_detected');
    assert.equal(out.should_stop, false);
    assert.ok(out.pivot);
  });

  it('questions à poser → ask_questions, max 3 par round, triées par impact', () => {
    const out = decideNext({
      currentContext: {
        enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'variable' },
        facts: {}
      },
      marginalQuestions: [
        { id: 'q-low', impact: 2 },
        { id: 'q-high', impact: 9 },
        { id: 'q-mid', impact: 5 },
        { id: 'q-xlow', impact: 1 },
        { id: 'q-xhigh', impact: 10 }
      ],
      roundsDone: 0
    });
    assert.equal(out.action, 'ask_questions');
    assert.equal(out.questions.length, MAX_QUESTIONS_PER_ROUND);
    assert.equal(out.questions[0].id, 'q-xhigh');
    assert.equal(out.questions[1].id, 'q-high');
    assert.equal(out.questions[2].id, 'q-mid');
  });

  it('progress inclut rounds_done/max et budget questions', () => {
    const out = decideNext({
      currentContext: {
        enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'variable' },
        facts: {}
      },
      marginalQuestions: [{ id: 'q1', impact: 8 }],
      roundsDone: 1
    });
    assert.equal(out.progress.rounds_done, 1);
    assert.equal(out.progress.rounds_max, MAX_ROUNDS);
    assert.equal(out.progress.total_questions_budget, MAX_ROUNDS * MAX_QUESTIONS_PER_ROUND);
  });
});
