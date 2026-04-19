/**
 * Round Orchestrator — boucle multi-round adaptative du triage.
 *
 * Implémente les règles du freeze :
 *   #13  cap dur 3 rounds × 3 questions max = 9 questions
 *   #14  asymétrie tier : monter sur suspicion, descendre sur certitude
 *   #15  contradictions levées d'abord (mono-question dédiée)
 *   #18  stop sur stabilisation (Δ score < 10% entre deux rounds successifs)
 *   #10  pivot détecté → caller reset case (via case-store.recordPivot)
 *
 * Le module est PUR (pas d'état interne) : il reçoit l'état depuis le case-store
 * et renvoie la décision. L'appelant (triage-engine) applique.
 */

import { evaluateComplexity, TIERS } from './complexity-router.mjs';
import { detectRoundContradictions, shouldBlockForContradiction, buildContradictionQuestion } from './round-contradiction-detector.mjs';
import { detectPivot } from './pivot-detector.mjs';

export const MAX_ROUNDS = 3;
export const MAX_QUESTIONS_PER_ROUND = 3;
export const STABILIZATION_THRESHOLD = 0.10;

/**
 * Décide de l'action suivante du triage.
 *
 * @param {object} params
 * @param {object} params.previousEval — eval complexité du round précédent (null au R1)
 * @param {object} params.currentContext — { enrichedAll, enrichedPrimary, navigation, facts }
 * @param {object} params.previousFacts — faits du round précédent (pour contradictions)
 * @param {object} params.previousNavigation — navigation round précédent (pour pivot)
 * @param {number} params.roundsDone — nombre de rounds déjà terminés
 * @param {Array}  params.marginalQuestions — candidats de questions rangés par impact
 *                                            (sortie de marginal-questioner existant)
 *
 * @returns {object} {
 *   action: 'ask_contradiction' | 'ask_questions' | 'pivot_detected' | 'tier_humain' | 'ready_for_pipeline',
 *   eval: <complexity result>,
 *   questions?: [...],
 *   pivot?: {...},
 *   reasons: [...],
 *   should_stop: boolean,
 *   progress: {rounds_done, rounds_max, questions_budget_left}
 * }
 */
export function decideNext({
  previousEval = null,
  currentContext = {},
  previousFacts = null,
  previousNavigation = null,
  roundsDone = 0,
  marginalQuestions = []
} = {}) {
  const reasons = [];
  const currentEval = evaluateComplexity(currentContext, previousEval);

  // 1. Hard rule : humain requis → stop immédiat
  if (currentEval.tier === TIERS.HUMAIN) {
    reasons.push('tier_humain_triggered');
    return {
      action: 'tier_humain',
      eval: currentEval,
      reasons,
      should_stop: true,
      progress: progressSnapshot(roundsDone, 0)
    };
  }

  // 2. Pivot ? (compare navigation avant/après)
  if (previousNavigation && currentContext.navigation) {
    const pivot = detectPivot(
      { navigation: previousNavigation, enriched_primary: previousEval?.enriched_primary },
      {
        navigation: currentContext.navigation,
        enriched_primary: currentContext.enrichedPrimary,
        unresolved_contradictions: currentContext.unresolved_contradictions || []
      }
    );
    if (pivot.is_pivot) {
      reasons.push(...pivot.reasons.map(r => `pivot:${r}`));
      return {
        action: 'pivot_detected',
        eval: currentEval,
        pivot,
        reasons,
        should_stop: false, // pas de stop — le caller crée un nouveau triage
        progress: progressSnapshot(roundsDone, 0)
      };
    }
  }

  // 3. Contradictions inter-round à lever d'abord
  if (previousFacts && currentContext.facts) {
    const contras = detectRoundContradictions(previousFacts, currentContext.facts);
    if (contras.length && shouldBlockForContradiction(contras)) {
      const q = buildContradictionQuestion(contras);
      reasons.push(`contradiction:${contras[0].key}`);
      return {
        action: 'ask_contradiction',
        eval: currentEval,
        questions: [q],
        contradictions: contras,
        reasons,
        should_stop: false,
        progress: progressSnapshot(roundsDone, 1)
      };
    }
  }

  // 4. Cap dur rounds
  if (roundsDone >= MAX_ROUNDS) {
    reasons.push('max_rounds_reached');
    return {
      action: 'ready_for_pipeline',
      eval: currentEval,
      reasons,
      should_stop: true,
      progress: progressSnapshot(roundsDone, 0),
      note: 'analyse avec zones d\'ombre signalées'
    };
  }

  // 5. Stabilisation — Δ score < 10% entre deux rounds successifs, et pas de nouvelle
  //    inconnue critique → stop
  const stabilized = previousEval?.score != null
    && currentEval.delta_pct != null
    && currentEval.delta_pct < STABILIZATION_THRESHOLD
    && !hasNewCriticalUncertainty(previousEval, currentEval);

  if (stabilized && roundsDone >= 1) {
    reasons.push('score_stabilized');
    return {
      action: 'ready_for_pipeline',
      eval: currentEval,
      reasons,
      should_stop: true,
      progress: progressSnapshot(roundsDone, 0)
    };
  }

  // 6. Plus d'incertitudes critiques à lever ? → ready
  if (!currentEval.uncertainties.length || !marginalQuestions.length) {
    reasons.push('no_critical_uncertainty_left');
    return {
      action: 'ready_for_pipeline',
      eval: currentEval,
      reasons,
      should_stop: true,
      progress: progressSnapshot(roundsDone, 0)
    };
  }

  // 7. Sinon, on pose le prochain round (max 3 questions, rangées par impact)
  const questions = [...marginalQuestions]
    .sort((a, b) => (b.impact || 0) - (a.impact || 0))
    .slice(0, MAX_QUESTIONS_PER_ROUND);

  reasons.push(`asking_round_${roundsDone + 1}`);
  return {
    action: 'ask_questions',
    eval: currentEval,
    questions,
    reasons,
    should_stop: false,
    progress: progressSnapshot(roundsDone, questions.length)
  };
}

function hasNewCriticalUncertainty(prev, curr) {
  const prevKinds = new Set((prev?.uncertainties || []).map(u => u.kind));
  for (const u of (curr.uncertainties || [])) {
    if (u.impact >= 5 && !prevKinds.has(u.kind)) return true;
  }
  return false;
}

function progressSnapshot(roundsDone, nextQuestionsCount) {
  return {
    rounds_done: roundsDone,
    rounds_max: MAX_ROUNDS,
    next_questions_count: nextQuestionsCount,
    total_questions_budget: MAX_ROUNDS * MAX_QUESTIONS_PER_ROUND
  };
}
