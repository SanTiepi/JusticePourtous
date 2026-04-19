/**
 * role-classifier.mjs — Classe le rôle d'une décision du point de vue citoyen.
 *
 * Valeurs `role_citizen` :
 *   - 'favorable' : renforce la position typique du demandeur citoyen
 *   - 'defavorable' : position rejetée / charge à la partie citoyenne
 *   - 'nuance' : limite / précision à la règle principale
 *   - 'neutre' : décision qui n'oriente pas clairement
 *
 * `contra_strength` (1-5) : force de la jurisprudence contraire si applicable.
 *
 * Heuristique + mots-clés d'outcome, sans LLM. Une passe LLM complémentaire
 * (holding-extractor) raffine dans un second temps.
 */

const POSITIVE_OUTCOMES = /admis|gut[ge]heissen|accolto|favorable_demandeur|favorable_locataire|favorable_travailleur|reconnu|acceptée/i;
const NEGATIVE_OUTCOMES = /rejet[ée]|abgewiesen|respinto|defavorable|irrecevable|unzulässig/i;
const PARTIAL_OUTCOMES = /partiellement|teilweise|in parte|parzialmente/i;
const LEADING_MARKERS = /principe fondamental|grundsatz|principle|consid[ée]rant fondamental|précédent/i;

// Rôles par domaine : "demandeur citoyen standard" est souvent locataire,
// travailleur, débiteur contesté, assuré, personne visée par une décision admin.
const DOMAIN_CITIZEN_SIDE = {
  bail: /locataire|mieter|conduttore/i,
  travail: /travailleur|employé|arbeitnehmer|lavoratore/i,
  famille: /demandeur|parent|époux/i,
  dettes: /débiteur|opposant|poursuivi/i,
  etrangers: /recourant|requérant/i,
  assurances: /assuré|recourant/i,
  social: /requérant|demandeur d'aide/i,
  violence: /victime|plaignante/i,
  accident: /accidenté|assuré|demandeur/i,
  entreprise: /entreprise|indépendant|créancier/i,
  consommation: /consommateur|acheteur/i,
  voisinage: /plaignant|immissionaire/i,
  circulation: /conducteur|assuré|amendé/i,
  successions: /héritier|légataire/i,
  sante: /patient|assuré/i
};

/**
 * Classe une décision canonique.
 * @param {object} decision — normalisée + article_refs_resolved
 * @param {string} [domaineHint] — domaine du contexte (intent)
 * @returns {object} decision + { role_citizen, contra_strength, classification_reasons }
 */
export function classifyRole(decision, domaineHint = null) {
  const reasons = [];
  const outcome = String(decision.outcome_raw || '').toLowerCase();
  const textBlob = [decision.abstract, decision.text_excerpt, decision.title]
    .filter(Boolean).join(' ').toLowerCase();

  const citizenSideRegex = domaineHint ? DOMAIN_CITIZEN_SIDE[domaineHint] : null;
  const mentionsCitizenSide = citizenSideRegex ? citizenSideRegex.test(textBlob) : false;

  let role_citizen = 'neutre';
  let contra_strength = 0;

  // 1. Outcome-based heuristics
  if (POSITIVE_OUTCOMES.test(outcome)) {
    role_citizen = mentionsCitizenSide ? 'favorable' : 'neutre';
    reasons.push('outcome_positive');
  }
  if (NEGATIVE_OUTCOMES.test(outcome)) {
    role_citizen = 'defavorable';
    contra_strength = Math.max(contra_strength, 3);
    reasons.push('outcome_negative');
  }
  if (PARTIAL_OUTCOMES.test(outcome)) {
    role_citizen = 'nuance';
    contra_strength = Math.max(contra_strength, 2);
    reasons.push('outcome_partial');
  }

  // 2. Leading case marker
  if (LEADING_MARKERS.test(textBlob) && decision.tier <= 2) {
    if (role_citizen === 'neutre') role_citizen = 'favorable';
    reasons.push('leading_marker');
  }

  // 3. Tier boost : un ATF publié est toujours significatif
  if (decision.tier === 1 && role_citizen === 'neutre' && outcome) {
    role_citizen = 'nuance';
    reasons.push('atf_published_significance');
  }

  // 4. Contra strength finale
  if (role_citizen === 'defavorable') contra_strength = Math.max(contra_strength, 4 - (decision.tier - 1));
  if (role_citizen === 'nuance') contra_strength = Math.max(contra_strength, 2);

  return {
    ...decision,
    role_citizen,
    contra_strength,
    classification_reasons: reasons
  };
}

export { DOMAIN_CITIZEN_SIDE };
