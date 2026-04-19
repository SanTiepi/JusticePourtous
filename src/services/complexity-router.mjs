/**
 * Complexity Router — scoring 7 dimensions structurées + hard rules.
 *
 * Pas de keywords. Scoring sur données STRUCTURÉES (nav, fiches enrichies,
 * dimensions de contexte explicites). Règle constitutionnelle : un loyer
 * "international" n'est pas complexe — les mots-clés mentent.
 *
 * Règles asymétriques d'oscillation de tier (freeze #14) :
 *   MONTER  dès qu'un indice de complexité apparaît (suspicion suffit)
 *   DESCENDRE uniquement si la preuve est certaine ET couvre tous les faits
 *
 * Hard rules (non négociables) :
 *   - hors scope (domaine pas dans la liste blanche 10) → tier 'limite'
 *   - recours TF / pénal grave / constitutionnel        → tier 'humain'
 *   - adversaire = État                                 → tier ≥ 'complexe'
 */

const ALLOWED_DOMAINS = new Set([
  'bail', 'travail', 'famille', 'dettes', 'etrangers',
  'assurances', 'social', 'violence', 'accident', 'entreprise'
]);

const ADVERSARY_STATE_KEYS = new Set([
  'etat', 'canton', 'commune', 'ai', 'orp', 'spop', 'ocai', 'afc', 'douane', 'sem',
  'office_avs', 'caisse_chomage', 'admin'
]);

export const TIERS = Object.freeze({
  TRIVIAL: 'trivial',
  STANDARD: 'standard',
  COMPLEXE: 'complexe',
  LIMITE: 'limite',
  HUMAIN: 'humain'
});

const TIER_ORDER = [TIERS.TRIVIAL, TIERS.STANDARD, TIERS.COMPLEXE, TIERS.LIMITE, TIERS.HUMAIN];

function tierRank(tier) {
  const i = TIER_ORDER.indexOf(tier);
  return i < 0 ? 1 : i; // default = STANDARD rank
}

function maxTier(a, b) {
  return tierRank(a) >= tierRank(b) ? a : b;
}

/**
 * Score d'une dimension individuelle. Chaque dimension : 0-10.
 *
 * @param {object} context
 * @param {object[]} context.enrichedAll — fiches enrichies identifiées
 * @param {object}   context.enrichedPrimary — fiche principale enrichie
 * @param {object}   context.navigation — sortie LLM navigator
 * @param {object}   context.facts — faits extraits (canton, date, montant, adversaire, ...)
 * @returns {object} dimensions et total
 */
export function scoreDimensions(context = {}) {
  const { enrichedAll = [], enrichedPrimary = null, navigation = null, facts = {} } = context;
  const dims = {};

  // 1. Nombre de domaines potentiellement touchés
  const domains = new Set();
  for (const e of enrichedAll) if (e?.fiche?.domaine) domains.add(e.fiche.domaine);
  if (enrichedPrimary?.fiche?.domaine) domains.add(enrichedPrimary.fiche.domaine);
  const dCount = domains.size;
  dims.domains = {
    value: dCount,
    score: dCount <= 1 ? 0 : dCount === 2 ? 5 : 10,
    note: `${dCount} domaine(s) identifié(s)`
  };

  // 2. Clarté des faits — faits critiques présents ?
  const criticalFacts = ['canton', 'date', 'domaine'];
  const present = criticalFacts.filter(k => facts[k] || navigation?.infos_extraites?.[k]);
  const clartyRatio = present.length / criticalFacts.length;
  dims.clarity = {
    value: clartyRatio,
    score: clartyRatio >= 0.9 ? 0 : clartyRatio >= 0.6 ? 4 : 8,
    note: `${present.length}/${criticalFacts.length} faits critiques présents`
  };

  // 3. Urgence — délai applicable
  const delaiJours = facts.delai_jours ?? derivDelaiJours(enrichedPrimary);
  dims.urgency = {
    value: delaiJours,
    score: delaiJours == null ? 0 : delaiJours <= 3 ? 10 : delaiJours <= 14 ? 7 : delaiJours <= 30 ? 3 : 0,
    note: delaiJours == null ? 'pas de délai court détecté' : `${delaiJours}j avant échéance`
  };

  // 4. Enjeu financier
  const montant = facts.montant_chf ?? null;
  dims.stakes = {
    value: montant,
    score: montant == null ? 3 : montant < 500 ? 0 : montant < 5000 ? 4 : montant < 50000 ? 7 : 10,
    note: montant == null ? 'montant non précisé' : `CHF ${montant}`
  };

  // 5. Adversaire (particulier / entreprise / avocat / État)
  const adv = (facts.adversaire || '').toLowerCase();
  const isState = ADVERSARY_STATE_KEYS.has(adv) || facts.adversaire_est_etat === true;
  const hasLawyer = !!facts.adversaire_avec_avocat;
  dims.adversary = {
    value: isState ? 'etat' : hasLawyer ? 'avocat' : adv || 'inconnu',
    score: isState ? 10 : hasLawyer ? 6 : 0,
    note: isState ? 'État partie — procédure admin' : hasLawyer ? 'adversaire avec avocat' : 'particulier ou inconnu'
  };

  // 6. Couverture (standard / edge case / hors scope)
  const primaryDomain = enrichedPrimary?.fiche?.domaine;
  const inScope = primaryDomain ? ALLOWED_DOMAINS.has(primaryDomain) : null;
  const confiance = enrichedPrimary?.confiance || null;
  let covScore;
  if (inScope === false) covScore = 10;
  else if (confiance === 'certain' || confiance === 'probable') covScore = 0;
  else if (confiance === 'variable') covScore = 4;
  else covScore = 7;
  dims.coverage = {
    value: { in_scope: inScope, confiance },
    score: covScore,
    note: inScope === false ? 'hors scope' : `confiance ${confiance || 'inconnue'}`
  };

  // 7. Uniformité jurisprudence
  const jurisConflict = !!enrichedPrimary?.jurisprudence_contradictoire
    || (enrichedPrimary?.contradictions_connues || []).length > 0;
  const jurisCount = (enrichedPrimary?.jurisprudence || []).length;
  dims.jurisprudence = {
    value: { count: jurisCount, conflict: jurisConflict },
    score: jurisConflict ? 10 : jurisCount >= 3 ? 0 : jurisCount >= 1 ? 3 : 6,
    note: jurisConflict ? 'jurisprudence contradictoire' : `${jurisCount} décisions trouvées`
  };

  const total = Object.values(dims).reduce((s, d) => s + d.score, 0);
  return { dimensions: dims, total, max: 70 };
}

/** Délai minimum en jours dérivé des cascades/délais d'une fiche enrichie. */
function derivDelaiJours(primary) {
  if (!primary) return null;
  const candidates = [];
  for (const d of (primary.delais || [])) {
    const s = (d.delai || '').toLowerCase();
    if (s.includes('immédiat')) candidates.push(1);
    if (s.includes('24h')) candidates.push(1);
    if (s.includes('48h')) candidates.push(2);
    const m = s.match(/(\d+)\s*jours?/);
    if (m) candidates.push(parseInt(m[1], 10));
  }
  for (const c of (primary.cascades || [])) {
    const s = (c.etapes?.[0]?.delai || '').toLowerCase();
    const m = s.match(/(\d+)\s*jours?/);
    if (m) candidates.push(parseInt(m[1], 10));
  }
  return candidates.length ? Math.min(...candidates) : null;
}

/**
 * Tier basé sur score total — monter sur suspicion.
 */
function tierFromScore(total) {
  if (total <= 15) return TIERS.TRIVIAL;
  if (total <= 30) return TIERS.STANDARD;
  if (total <= 50) return TIERS.COMPLEXE;
  return TIERS.LIMITE;
}

/**
 * Hard rules non-négociables — peuvent forcer tier supérieur.
 * @returns {{tier?, reason?}[]}
 */
export function applyHardRules(context = {}) {
  const triggered = [];
  const { enrichedPrimary = null, facts = {} } = context;
  const primaryDomain = enrichedPrimary?.fiche?.domaine;

  if (primaryDomain && !ALLOWED_DOMAINS.has(primaryDomain)) {
    triggered.push({ tier: TIERS.LIMITE, reason: 'out_of_scope_domain' });
  }

  if (facts.recours_tf || facts.penal_grave || facts.constitutionnel) {
    triggered.push({ tier: TIERS.HUMAIN, reason: 'supreme_court_or_grave_penal' });
  }

  const adv = (facts.adversaire || '').toLowerCase();
  if (ADVERSARY_STATE_KEYS.has(adv) || facts.adversaire_est_etat === true) {
    triggered.push({ tier: TIERS.COMPLEXE, reason: 'state_adversary_min_complex' });
  }

  return triggered;
}

/**
 * Évaluation complète.
 *
 * @param {object} context
 * @param {object} [previous] — résultat précédent pour asymétrie monter/descendre
 * @returns {object} { tier, score, dimensions, flags, hard_rules, uncertainties, delta }
 */
export function evaluateComplexity(context = {}, previous = null) {
  const { dimensions, total, max } = scoreDimensions(context);
  const hardRules = applyHardRules(context);

  // Tier de base depuis le score, puis max avec hard rules
  let baseTier = tierFromScore(total);
  let finalTier = baseTier;
  for (const r of hardRules) finalTier = maxTier(finalTier, r.tier);

  // Asymétrie : si on avait un tier précédent, on ne descend que sur certitude
  if (previous?.tier) {
    const goingUp = tierRank(finalTier) > tierRank(previous.tier);
    const goingDown = tierRank(finalTier) < tierRank(previous.tier);

    if (goingDown) {
      // Certitude requise = clarté > 0.9 ET confiance ≥ probable ET aucun hard rule actif
      const clarityOk = dimensions.clarity.value >= 0.9;
      const confOk = ['certain', 'probable'].includes(dimensions.coverage.value?.confiance);
      const noHard = hardRules.length === 0;
      if (!(clarityOk && confOk && noHard)) {
        finalTier = previous.tier;
      }
    }
    // goingUp : toujours accepté (suspicion suffit)
  }

  // Inconnues critiques restantes (dimensions à score élevé liées à info manquante)
  const uncertainties = [];
  if (dimensions.clarity.score >= 4) uncertainties.push({ kind: 'faits_critiques', impact: dimensions.clarity.score });
  if (dimensions.coverage.score >= 4 && dimensions.coverage.value?.in_scope !== false) {
    uncertainties.push({ kind: 'confiance_faible', impact: dimensions.coverage.score });
  }
  if (dimensions.stakes.value == null) uncertainties.push({ kind: 'montant_inconnu', impact: 3 });

  // Flags exploitables côté orchestrateur/API
  const flags = {
    urgent: dimensions.urgency.score >= 7,
    hors_scope: hardRules.some(r => r.reason === 'out_of_scope_domain'),
    adversaire_etat: hardRules.some(r => r.reason === 'state_adversary_min_complex'),
    humain_requis: finalTier === TIERS.HUMAIN,
    jurisprudence_conflit: dimensions.jurisprudence.value?.conflict === true
  };

  const delta = previous?.score != null ? total - previous.score : null;
  const deltaPct = previous?.score ? Math.abs(delta) / Math.max(1, previous.score) : null;

  return {
    tier: finalTier,
    score: total,
    max,
    dimensions,
    hard_rules: hardRules,
    flags,
    uncertainties: uncertainties.sort((a, b) => b.impact - a.impact),
    delta,
    delta_pct: deltaPct
  };
}

export { TIER_ORDER, tierRank, maxTier, ALLOWED_DOMAINS };
