/**
 * Triage Orchestration — Phase 6 : couche unifiée entre HTTP et triage-engine.
 *
 * Expose deux fonctions d'entrée :
 *   - handleTriageStart({ texte, canton })
 *   - handleTriageNext({ case_id, action, answers, wallet_session })
 *
 * Responsabilités :
 *   1. Court-circuits safety (Phase 4) — detresse, violence, menace, mineur, illegal
 *   2. Court-circuits scope (Phase 4) — hors scope ou tier humain
 *   3. Payment gate enforcement (Phase 1) — R1 gratuit, paywall si continuation,
 *      débit wallet unique 200 centimes, mark_paid
 *   4. Snapshot last_public_response dans case-store pour reprise fidèle
 *   5. Contrat de sortie uniforme : { status, case_id, payment_gate, resume_expires_at_iso, progress, ...data }
 *
 * Statuts de sortie possibles (spec freeze) :
 *   ask_questions, ask_contradiction, payment_required, pivot_detected,
 *   ready_for_pipeline, human_tier, safety_stop, out_of_scope, error
 */

import { triage as runTriage } from './triage-engine.mjs';
import {
  getCase,
  updateCaseState,
  canProceed,
  advancePaymentGate,
  exportCase,
  recordPivot
} from './case-store.mjs';
import { classifySafety, buildSafetyResponse } from './safety-classifier.mjs';
import { analyzeScope } from './scope-refuser.mjs';
import { detectLanguage, shouldRouteToRhetoroman, translationDisclaimer } from './language-router.mjs';
import { detectRoundContradictions, shouldBlockForContradiction, buildContradictionQuestion } from './round-contradiction-detector.mjs';
import { detectPivot } from './pivot-detector.mjs';
import { debitSession } from './premium.mjs';
import { requireSufficientCertificate } from './coverage-certificate.mjs';
import { shapePayload } from './payload-shaper.mjs';

/** Prix de la continuation (round 2+) = 200 centimes (2 CHF). */
export const CONTINUATION_PRICE_CENTIMES = 200;

/** Coût API brut pour le débit (debitSession applique x2.5 margin → ~200c facturés). */
const CONTINUATION_RAW_API_COST = 80;

/**
 * Démarre un cas de triage. Court-circuits safety/scope d'abord, puis lance le flux
 * habituel (triage-engine crée le case, fait R1, retourne nav + questions).
 *
 * @param {object} p
 * @param {string} p.texte
 * @param {string} [p.canton]
 * @returns {Promise<object>} payload avec status
 */
export async function handleTriageStart({ texte, canton } = {}) {
  if (!texte || typeof texte !== 'string' || texte.trim().length < 3) {
    return errorPayload('Décrivez votre problème en quelques mots', 400);
  }

  // 1. Safety classifier — court-circuit AVANT tout appel LLM
  // (toujours prioritaire sur la détection langue : un cri de détresse en
  //  allemand reste un cri de détresse — on déclenche en français mais on ne
  //  rate pas le signal)
  const safety = classifySafety(texte);
  if (safety.triggered) {
    return {
      status: 'safety_stop',
      safety_response: buildSafetyResponse(safety.signal_type),
      signal_type: safety.signal_type,
      log_entry: safety.log_entry
    };
  }

  // 2. Scope refuser — hors scope / tier humain
  const scope = analyzeScope(texte);
  if (scope.is_human_tier) {
    return {
      status: 'human_tier',
      human_tier_response: scope.response,
      reason: scope.reason
    };
  }
  if (scope.is_out_of_scope) {
    return {
      status: 'out_of_scope',
      out_of_scope_response: scope.response,
      reason: scope.reason,
      label: scope.label
    };
  }

  // 3. Détection langue
  // - FR, DE, IT et autres locales offertes → flux normal
  // - RM → court-circuit human_tier (pas de couverture honnête possible)
  const langDetection = detectLanguage(texte);
  if (shouldRouteToRhetoroman(texte)) {
    return {
      status: 'human_tier',
      reason: 'language_unsupported_rm',
      source_language: 'rm',
      language_detection: langDetection,
      human_tier_response: {
        type: 'language_redirect',
        title: 'Cussegliaziun en rumantsch',
        message: 'Nus n\'havain anc nagina cuvrida cumplaina per il rumantsch. Per ina cussegliaziun giuridica en rumantsch, contactai per plaschair in survetsch local.',
        message_fr: 'Nous n\'avons pas encore de couverture pour le romanche. Pour une consultation juridique en romanche, veuillez contacter un service local.',
        suggested_resources: [
          { name: 'Lia Rumantscha', url: 'https://www.liarumantscha.ch' },
          { name: 'Annuaire JusticePourtous', url: '/annuaire.html?lang=rm' }
        ]
      }
    };
  }

  // 4. Triage normal (crée case, R1 gratuit, retourne data)
  const result = await runTriage(texte, canton);
  if (result.error) return errorPayload(result.error, result.status || 500);

  const payload = finalizePayload(result.data);
  // Langue source : FR = flux normal (pas de marquage spécifique — c'est la langue pivot).
  // DE/IT = mode dégradé — on expose source_language + degraded_mode + translation_disclaimer
  // pour que le frontend affiche le bandeau "analyse en français".
  if (langDetection.lang === 'de' || langDetection.lang === 'it') {
    payload.source_language = langDetection.lang;
    payload.degraded_mode = true;
    payload.translation_disclaimer = translationDisclaimer(langDetection.lang);
    payload.language_detection = langDetection;
  }
  // Note : FR et 'unknown' ne reçoivent AUCUN champ langue (évite de polluer le payload FR).
  return payload;
}

/**
 * Traite la suite d'un cas : resume ou answer.
 *
 * @param {object} p
 * @param {string} p.case_id
 * @param {string} p.action — 'resume' | 'answer'
 * @param {object} [p.answers]
 * @param {string} [p.wallet_session]
 * @returns {Promise<object>} payload avec status
 */
export async function handleTriageNext({ case_id, action, answers, wallet_session } = {}) {
  if (!case_id) return errorPayload('case_id requis', 400);
  const caseRec = getCase(case_id);
  if (!caseRec) return errorPayload('Session expirée ou introuvable. Recommencez l\'analyse.', 404);

  if (action === 'resume') {
    return handleResume(caseRec);
  }
  if (action === 'answer') {
    return handleAnswer(caseRec, answers || {}, wallet_session);
  }
  return errorPayload('action inconnue (resume|answer attendus)', 400);
}

// ============================================================
// RESUME — renvoie le last_public_response snapshot
// ============================================================

function handleResume(caseRec) {
  const last = caseRec.state.last_public_response;
  const exportSnap = exportCase(caseRec.case_id);
  if (!last) {
    return {
      status: 'error',
      error: 'Aucun état de reprise disponible',
      case_id: caseRec.case_id,
      payment_gate: exportSnap?.payment_gate || null,
      resume_expires_at_iso: exportSnap?.resume_expires_at_iso || null
    };
  }
  return {
    ...last,
    status: last._resume_status || last.status || 'ask_questions',
    payment_gate: exportSnap?.payment_gate || last.payment_gate || null,
    resume_expires_at_iso: exportSnap?.resume_expires_at_iso || null
  };
}

// ============================================================
// ANSWER — gate + contradictions + pivot + refine
// ============================================================

async function handleAnswer(caseRec, answers, wallet_session) {
  const case_id = caseRec.case_id;

  // 1. Payment gate enforcement
  const proceed = canProceed(case_id, { action: 'refine' });
  if (!proceed.ok && proceed.reason === 'payment_required') {
    const paymentResult = tryDebitWallet(case_id, wallet_session);
    if (!paymentResult.ok) {
      const snap = exportCase(case_id);
      return {
        status: 'payment_required',
        case_id,
        required_amount_centimes: CONTINUATION_PRICE_CENTIMES,
        payment_gate: snap?.payment_gate || null,
        resume_expires_at_iso: snap?.resume_expires_at_iso || null,
        reason: paymentResult.reason || 'wallet_required',
        wallet_error: paymentResult.error || null
      };
    }
    // débit réussi : case_id passe à PAID
  } else if (!proceed.ok) {
    return errorPayload(`case inaccessible : ${proceed.reason}`, 403);
  }

  // 2. Snapshot faits & navigation AVANT refine pour comparaison post-refine
  const beforeFacts = caseRec.state.navigation?.infos_extraites || {};
  const beforeNav = caseRec.state.navigation;
  const beforePrimary = caseRec.state.enriched_primary;

  // 3. Refine via triage-engine (qui utilise case-store sous le capot)
  const refined = await runTriage(null, null, case_id, answers);
  if (refined.error) return errorPayload(refined.error, refined.status || 500);

  // Re-load case : refineTriage a mis à jour navigation + enriched
  const caseRecAfter = getCase(case_id);
  const afterFacts = caseRecAfter?.state.navigation?.infos_extraites || answers;
  const afterNav = caseRecAfter?.state.navigation;
  const afterPrimary = caseRecAfter?.state.enriched_primary;

  // 4. Contradiction detection inter-round (mono-question si bloquant)
  const mergedBeforeFacts = { ...beforeFacts, ...(caseRec.state.last_answers || {}) };
  const mergedAfterFacts = { ...afterFacts, ...answers };
  const contras = detectRoundContradictions(mergedBeforeFacts, mergedAfterFacts);
  if (contras.length && shouldBlockForContradiction(contras)) {
    const q = buildContradictionQuestion(contras);
    const snap = exportCase(case_id);
    const payload = {
      status: 'ask_contradiction',
      case_id,
      contradiction_question: q,
      contradictions: contras,
      payment_gate: snap?.payment_gate || null,
      resume_expires_at_iso: snap?.resume_expires_at_iso || null
    };
    updateCaseState(case_id, { last_public_response: { ...payload, _resume_status: 'ask_contradiction' } });
    return payload;
  }

  // 5. Pivot detection : domaine change OU fiche primaire shift substantiel
  const pivotResult = detectPivot(
    { navigation: beforeNav, enriched_primary: beforePrimary },
    { navigation: afterNav, enriched_primary: afterPrimary }
  );
  if (pivotResult.is_pivot) {
    const pivotRec = recordPivot(case_id, {
      from_summary: beforeNav?.resume_situation || null,
      to_summary: afterNav?.resume_situation || null
    });
    const snap = exportCase(case_id);
    if (pivotRec.forced_new) {
      return {
        status: 'pivot_detected',
        case_id,
        forced_new: true,
        reason: pivotRec.reason,
        message: 'Votre situation a substantiellement changé — nouveau triage nécessaire.',
        payment_gate: snap?.payment_gate || null,
        resume_expires_at_iso: snap?.resume_expires_at_iso || null
      };
    }
    // Pivot accepté (<= MAX_PIVOTS) — on continue avec le même case
    const pivotPayload = {
      status: 'pivot_detected',
      case_id,
      forced_new: false,
      pivots_count: pivotRec.pivots_count,
      pivot_reasons: pivotResult.reasons,
      message: 'Votre situation a évolué — analyse en cours sur le nouveau cadre.',
      payment_gate: snap?.payment_gate || null,
      resume_expires_at_iso: snap?.resume_expires_at_iso || null,
      ...refined.data
    };
    // Review vague 2 — wrappers quality/pipeline même pour pivot_detected
    const shapedPivot = shapePayload(pivotPayload);
    updateCaseState(case_id, { last_public_response: { ...shapedPivot, _resume_status: 'pivot_detected' } });
    return shapedPivot;
  }

  // 6. Cas standard : questions manquantes → ask_questions, sinon ready_for_pipeline
  return finalizePayload(refined.data);
}

// ============================================================
// Helpers
// ============================================================

/**
 * Tente de débiter le wallet pour la continuation. Retourne {ok, reason?, error?}.
 */
function tryDebitWallet(case_id, wallet_session) {
  if (!wallet_session) {
    return { ok: false, reason: 'wallet_required' };
  }
  const debit = debitSession(wallet_session, CONTINUATION_RAW_API_COST, 'triage_continuation');
  if (debit.error) {
    return { ok: false, reason: 'debit_failed', error: debit.error };
  }
  advancePaymentGate(case_id, 'mark_paid', {
    wallet_session,
    amount_centimes: debit.charged || CONTINUATION_PRICE_CENTIMES
  });
  return { ok: true, charged: debit.charged };
}

/**
 * Finalise un payload triage-engine : ajoute `status` selon questions manquantes,
 * snapshot dans case-store pour reprise.
 *
 * Cortex gate 30j : avant de retourner un payload `ready_for_pipeline`, on passe
 * par `requireSufficientCertificate()`. Si le gate bloque :
 *  - on ajoute un bloc `certificate` au payload (status, critical_fails, warnings)
 *  - on ajoute `quality_warning: true` si status gate = 'insufficient'
 *  - on NE SUPPRIME PAS le payload — on downgrade seulement (voir frontend bandeau)
 */
function finalizePayload(data) {
  if (!data) return errorPayload('Payload vide', 500);
  const hasQuestions = Array.isArray(data.questionsManquantes) && data.questionsManquantes.length > 0;
  const status = hasQuestions ? 'ask_questions' : 'ready_for_pipeline';
  const payload = { status, ...data };

  // Gate bloquant UNIQUEMENT pour les sorties "finales" (ready_for_pipeline).
  // Les étapes intermédiaires (ask_questions) n'ont pas encore de claims exposés.
  if (status === 'ready_for_pipeline') {
    const gate = requireSufficientCertificate(payload);
    payload.certificate = {
      status: gate.status,
      critical_fails: gate.critical_fails,
      warnings: gate.warnings,
      checked_at: gate.checked_at,
    };
    if (gate.status === 'insufficient') {
      // Downgrade signal visible citoyen. On garde status=ready_for_pipeline
      // (pour compat frontend), mais on hisse un quality_warning explicite.
      payload.quality_warning = true;
    }
  }

  // Review vague 2 (findings #4 & #5) — wrappers `quality{}` + `pipeline{}`.
  // NON-BREAKING : les champs racine restent en place, dupliqués sous les
  // wrappers. Le frontend migre progressivement. Voir payload-shaper.mjs pour
  // le plan de dépréciation.
  const shaped = shapePayload(payload);

  if (data.case_id) {
    updateCaseState(data.case_id, {
      last_public_response: { ...shaped, _resume_status: status },
      last_answers: data.infosExtraites || null
    });
  }
  return shaped;
}

function errorPayload(error, http_status = 500) {
  return { status: 'error', error, http_status };
}
