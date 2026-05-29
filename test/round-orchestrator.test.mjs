/**
 * Tests unitaires — round-orchestrator.mjs
 *
 * Couvre les règles freeze :
 *   #13  cap dur 3 rounds × 3 questions max
 *   #14  tier_humain prime sur tout (stop immédiat)
 *   #15  contradictions inter-round levées en premier (mono-question dédiée)
 *   #18  stop sur stabilisation (Δ score < 10%)
 *
 * Zéro LLM, zéro réseau — module pur.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decideNext, MAX_ROUNDS, MAX_QUESTIONS_PER_ROUND, STABILIZATION_THRESHOLD } from '../src/services/round-orchestrator.mjs';

// ── Fixtures ────────────────────────────────────────────────────────────────

// Score 9 (trivial) : clarity=100% (nav.infos_extraites), confiance=certain, 0 juris
// Seule incertitude résiduelle : montant_inconnu impact=3 (< seuil 5 → non-bloquante)
const CTX_TRIVIAL = Object.freeze({
  enrichedAll: [],
  enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'certain', jurisprudence: [] },
  navigation: { infos_extraites: { canton: 'VD', date: '2026-01-01', domaine: 'bail' } },
  facts: {}
});

// Résultat pré-calculé d'une évaluation triviale — passé comme previousEval
const PREV_EVAL_TRIVIAL = Object.freeze({
  score: 9,
  tier: 'trivial',
  uncertainties: [{ kind: 'montant_inconnu', impact: 3 }]
});

const CTX_HUMAIN = Object.freeze({ facts: { recours_tf: true } });
const CTX_PENAL  = Object.freeze({ facts: { penal_grave: true } });

// ── Suite 1 : tier_humain (freeze #14 — hard rule stop immédiat) ─────────────

describe('round-orchestrator — tier_humain (freeze #14)', () => {
  it('recours_tf → action=tier_humain, should_stop=true', () => {
    const r = decideNext({ currentContext: CTX_HUMAIN });
    assert.equal(r.action, 'tier_humain');
    assert.equal(r.should_stop, true);
    assert.ok(r.reasons.includes('tier_humain_triggered'));
  });

  it('penal_grave → action=tier_humain', () => {
    assert.equal(decideNext({ currentContext: CTX_PENAL }).action, 'tier_humain');
  });

  it('tier_humain prime sur roundsDone >= MAX_ROUNDS (freeze #14 > #13)', () => {
    const r = decideNext({ currentContext: CTX_HUMAIN, roundsDone: MAX_ROUNDS });
    assert.equal(r.action, 'tier_humain');
    assert.equal(r.should_stop, true);
  });

  it('tier_humain retourne un eval et un progress avec rounds_max correct', () => {
    const r = decideNext({ currentContext: CTX_HUMAIN });
    assert.ok(r.eval, 'doit retourner un eval');
    assert.ok(r.progress, 'doit retourner un progress');
    assert.equal(r.progress.rounds_max, MAX_ROUNDS);
  });
});

// ── Suite 2 : cap dur rounds (freeze #13) ────────────────────────────────────

describe('round-orchestrator — cap dur rounds (freeze #13)', () => {
  it('roundsDone = MAX_ROUNDS → ready_for_pipeline + max_rounds_reached + should_stop', () => {
    const r = decideNext({ currentContext: CTX_TRIVIAL, roundsDone: MAX_ROUNDS });
    assert.equal(r.action, 'ready_for_pipeline');
    assert.ok(r.reasons.includes('max_rounds_reached'));
    assert.equal(r.should_stop, true);
  });

  it('roundsDone = MAX_ROUNDS − 1 → PAS de max_rounds_reached, continue à demander', () => {
    const r = decideNext({
      currentContext: CTX_TRIVIAL,
      roundsDone: MAX_ROUNDS - 1,
      marginalQuestions: [{ id: 'q1', impact: 5 }]
    });
    assert.notEqual(r.action, 'ready_for_pipeline');
    assert.ok(!r.reasons.includes('max_rounds_reached'));
  });

  it('progress.rounds_done = MAX_ROUNDS sur chemin max_rounds_reached', () => {
    const r = decideNext({ currentContext: CTX_TRIVIAL, roundsDone: MAX_ROUNDS });
    assert.equal(r.progress.rounds_done, MAX_ROUNDS);
    assert.equal(r.progress.rounds_max, MAX_ROUNDS);
  });
});

// ── Suite 3 : contradictions inter-round (freeze #15) ─────────────────────────

describe('round-orchestrator — contradictions inter-round (freeze #15)', () => {
  it('montant_chf différent → ask_contradiction avant ask_questions', () => {
    const r = decideNext({
      currentContext: { ...CTX_TRIVIAL, facts: { montant_chf: 2000 } },
      previousFacts:  { montant_chf: 1000 },
      marginalQuestions: [{ id: 'q1', impact: 5 }]
    });
    assert.equal(r.action, 'ask_contradiction');
    assert.ok(r.reasons.some(rs => rs.startsWith('contradiction:')));
    assert.equal(r.questions.length, 1);
    assert.ok(r.questions[0].id.startsWith('contradiction_'));
  });

  it('canton différent → ask_contradiction (severity 3 = bloquant)', () => {
    const r = decideNext({
      currentContext: { ...CTX_TRIVIAL, facts: { canton: 'GE' } },
      previousFacts:  { canton: 'VD' }
    });
    assert.equal(r.action, 'ask_contradiction');
  });

  it('nombre_enfants différent → PAS de contradiction bloquante (severity 1 < 2)', () => {
    const r = decideNext({
      currentContext: { ...CTX_TRIVIAL, facts: { nombre_enfants: 2 } },
      previousFacts:  { nombre_enfants: 1 }
    });
    assert.notEqual(r.action, 'ask_contradiction');
  });

  it('previousFacts null → pas de comparaison, jamais ask_contradiction', () => {
    const r = decideNext({
      currentContext: { ...CTX_TRIVIAL, facts: { montant_chf: 2000 } },
      previousFacts: null,
      marginalQuestions: [{ id: 'q1', impact: 5 }]
    });
    assert.notEqual(r.action, 'ask_contradiction');
  });

  it('ask_contradiction should_stop = false (round dédié, pas un stop final)', () => {
    const r = decideNext({
      currentContext: { ...CTX_TRIVIAL, facts: { montant_chf: 2000 } },
      previousFacts:  { montant_chf: 1000 }
    });
    assert.equal(r.action, 'ask_contradiction');
    assert.equal(r.should_stop, false);
  });
});

// ── Suite 4 : stabilisation score (freeze #18) ────────────────────────────────

describe('round-orchestrator — stabilisation score (freeze #18)', () => {
  it('Δ score = 0, roundsDone = 1 → ready_for_pipeline + score_stabilized', () => {
    const r = decideNext({
      previousEval: PREV_EVAL_TRIVIAL,
      currentContext: CTX_TRIVIAL,
      roundsDone: 1
    });
    assert.equal(r.action, 'ready_for_pipeline');
    assert.ok(r.reasons.includes('score_stabilized'));
    assert.equal(r.should_stop, true);
  });

  it('stabilisation ne se déclenche PAS à roundsDone = 0 (exige ≥ 1 round déjà terminé)', () => {
    const r = decideNext({
      previousEval: PREV_EVAL_TRIVIAL,
      currentContext: CTX_TRIVIAL,
      roundsDone: 0
    });
    assert.ok(!r.reasons.includes('score_stabilized'));
  });

  it('sans previousEval → pas de delta disponible → stabilisation impossible', () => {
    const r = decideNext({
      previousEval: null,
      currentContext: CTX_TRIVIAL,
      roundsDone: 1
    });
    assert.ok(!r.reasons.includes('score_stabilized'));
  });
});

// ── Suite 5 : ask_questions — cap 3 questions + tri impact (freeze #13) ──────

describe('round-orchestrator — ask_questions (freeze #13)', () => {
  it('5 marginalQuestions → seulement les 3 à plus fort impact, triées desc', () => {
    const qs = [
      { id: 'q5', impact: 5 },
      { id: 'q1', impact: 1 },
      { id: 'q9', impact: 9 },
      { id: 'q7', impact: 7 },
      { id: 'q3', impact: 3 }
    ];
    const r = decideNext({ currentContext: CTX_TRIVIAL, marginalQuestions: qs });
    assert.equal(r.action, 'ask_questions');
    assert.equal(r.questions.length, MAX_QUESTIONS_PER_ROUND);
    assert.equal(r.questions[0].id, 'q9');
    assert.equal(r.questions[1].id, 'q7');
    assert.equal(r.questions[2].id, 'q5');
  });

  it('marginalQuestions vide → ready_for_pipeline (no_critical_uncertainty_left)', () => {
    const r = decideNext({ currentContext: CTX_TRIVIAL, marginalQuestions: [] });
    assert.equal(r.action, 'ready_for_pipeline');
    assert.ok(r.reasons.includes('no_critical_uncertainty_left'));
  });

  it('ask_questions should_stop = false', () => {
    const r = decideNext({
      currentContext: CTX_TRIVIAL,
      marginalQuestions: [{ id: 'q1', impact: 5 }]
    });
    assert.equal(r.action, 'ask_questions');
    assert.equal(r.should_stop, false);
  });

  it('progress.next_questions_count = nombre de questions réellement posées', () => {
    const qs = [{ id: 'q1', impact: 5 }, { id: 'q2', impact: 3 }];
    const r = decideNext({
      currentContext: CTX_TRIVIAL,
      marginalQuestions: qs,
      roundsDone: 1
    });
    assert.equal(r.action, 'ask_questions');
    assert.equal(r.progress.next_questions_count, 2);
    assert.equal(r.progress.rounds_done, 1);
  });

  it('raison contient le numéro de round suivant (asking_round_N)', () => {
    const r = decideNext({
      currentContext: CTX_TRIVIAL,
      marginalQuestions: [{ id: 'q1', impact: 5 }],
      roundsDone: 1
    });
    assert.ok(r.reasons.some(rs => rs.includes('round_2')));
  });
});

// ── Suite 6 : robustesse — entrées dégénérées ─────────────────────────────────

describe('round-orchestrator — robustesse entrées dégénérées', () => {
  it('decideNext() sans args → ne crash pas, retourne une action', () => {
    assert.doesNotThrow(() => decideNext());
    const r = decideNext();
    assert.ok(r.action);
    assert.ok(Array.isArray(r.reasons));
  });

  it('currentContext undefined (défaut {}) → retourne ready_for_pipeline', () => {
    assert.doesNotThrow(() => decideNext({ currentContext: undefined }));
    const r = decideNext({ currentContext: undefined });
    assert.ok(r.action);
  });

  it('marginalQuestions undefined (défaut []) → traité comme vide → no_critical_uncertainty_left', () => {
    const r = decideNext({ currentContext: CTX_TRIVIAL, marginalQuestions: undefined });
    assert.equal(r.action, 'ready_for_pipeline');
    assert.ok(r.reasons.includes('no_critical_uncertainty_left'));
  });
});
