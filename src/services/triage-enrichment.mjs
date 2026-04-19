/**
 * Triage Enrichment — couche de champs dérivés ajoutés à la réponse API triage.
 *
 * Branche complexity-router + domain-recommender + urgency-marker sur les données
 * déjà calculées par triage-engine (navigation + enrichedFiches) pour produire
 * les nouveaux états exposés dans l'API (freeze Phase 3).
 *
 * Non-breaking : n'altère pas les champs existants. Ajoute uniquement.
 */

import { evaluateComplexity } from './complexity-router.mjs';
import { recommendDomainOrder } from './domain-recommender.mjs';
import { buildUrgencyMarker } from './urgency-marker.mjs';

/**
 * @param {object} input
 * @param {object} input.navigation — sortie LLM navigator
 * @param {object} input.enrichedPrimary — fiche principale enrichie
 * @param {Array}  input.enrichedAll — toutes les fiches identifiées
 * @param {object} [input.facts] — faits extraits normalisés (canton, date, montant, ...)
 * @param {object} [input.previousEval] — eval complexité round précédent (asymétrie)
 *
 * @returns {object} champs enrichis non-breaking à merger dans la réponse API
 */
export function enrichTriageResult({
  navigation = {},
  enrichedPrimary = null,
  enrichedAll = [],
  facts = null,
  previousEval = null
} = {}) {
  const factsResolved = facts || extractFactsFromNav(navigation);

  const evalResult = evaluateComplexity(
    { enrichedAll, enrichedPrimary, navigation, facts: factsResolved },
    previousEval
  );

  const recommended = recommendDomainOrder(enrichedAll);

  const delaiMin = evalResult.dimensions?.urgency?.value ?? null;
  const firstDelai = (enrichedPrimary?.delais || [])[0];
  const urgency_marker = buildUrgencyMarker({
    delaiJours: delaiMin,
    procedure: firstDelai?.procedure || null
  });

  return {
    tier: evalResult.tier,
    tier_score: evalResult.score,
    tier_max: evalResult.max,
    dimensions_detail: evalResult.dimensions,
    hard_rules_triggered: evalResult.hard_rules,
    flags: evalResult.flags,
    uncertainties: evalResult.uncertainties,
    recommended_domain_order: recommended,
    urgency_marker,
    _eval_snapshot: {
      tier: evalResult.tier,
      score: evalResult.score,
      delta: evalResult.delta,
      delta_pct: evalResult.delta_pct
    }
  };
}

function extractFactsFromNav(nav = {}) {
  const infos = nav.infos_extraites || {};
  return {
    canton: infos.canton || null,
    date: infos.date || null,
    domaine: infos.domaine || null,
    montant_chf: infos.montant_chf ?? null,
    adversaire: infos.adversaire || null,
    delai_jours: infos.delai_jours ?? null,
    statut_employeur: infos.statut_employeur || null,
    statut_locataire: infos.statut_locataire || null
  };
}
