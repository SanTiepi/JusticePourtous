/**
 * leading-case-ranker.mjs — Classe les décisions par importance "leading case".
 *
 * Score prend en compte :
 *   - tier (1=ATF, 2=TF non publié, 3=cantonal sup, 4=1ère inst. / admin)
 *   - récence (exponentielle décroissante)
 *   - marqueur "leading" dans le texte
 *   - nombre d'articles résolus
 *   - holding validé
 *   - role_citizen non-neutre (favorable > nuance > defavorable > neutre)
 *
 * Sort trois listes :
 *   - leading_cases : 3-5 cas canoniques tier 1-2, role favorable/nuance
 *   - nuances : 1-2 cas qui limitent/précisent (role nuance ou contra_strength ≥ 3)
 *   - cantonal_practice : 1-3 cas cantonaux avec holding et article résolu
 */

const ROLE_WEIGHT = { favorable: 10, nuance: 7, defavorable: 4, neutre: 1 };

function recencyBonus(year, now = new Date().getFullYear()) {
  if (!year || !Number.isFinite(year)) return 0;
  const age = Math.max(0, now - year);
  // Bonus exp décroissant : récent (0-5 ans) +10, 5-10 ans +5, 10-20 +2, 20+ 0
  if (age <= 5) return 10;
  if (age <= 10) return 5;
  if (age <= 20) return 2;
  return 0;
}

function tierScore(tier) {
  // Tier 1 (ATF publié) = 50, Tier 2 = 30, Tier 3 = 10, Tier 4 = 3
  if (tier === 1) return 50;
  if (tier === 2) return 30;
  if (tier === 3) return 10;
  return 3;
}

function scoreDecision(d) {
  let score = tierScore(d.tier);
  score += recencyBonus(d.year);
  score += ROLE_WEIGHT[d.role_citizen] || 0;
  if (d.holding_validated) score += 10;
  score += Math.min(10, (d.article_refs_resolved || []).filter(r => r.resolved).length * 3);
  if (d.publication_status === 'leading') score += 20;
  if (d.publication_status === 'published') score += 10;
  return score;
}

/**
 * Classe une liste de décisions canoniques en 3 catégories.
 * @param {object[]} decisions — normalisées + classifiées + holding extrait
 * @param {object} [opts]
 * @param {string} [opts.citizenCanton]  - prioriser pratique cantonale du citoyen
 * @param {number} [opts.maxLeading=5]
 * @param {number} [opts.maxNuances=2]
 * @param {number} [opts.maxCantonalPractice=3]
 */
export function rankDecisions(decisions, opts = {}) {
  const {
    citizenCanton = null,
    maxLeading = 5,
    maxNuances = 2,
    maxCantonalPractice = 3
  } = opts;

  const scored = decisions
    .map(d => ({ ...d, _score: scoreDecision(d) }))
    .filter(d => d.holding_validated); // gate : pas d'affichage sans holding validé

  // Leading : tier 1-2, role favorable ou nuance, tri score desc
  const leading = scored
    .filter(d => d.tier <= 2 && (d.role_citizen === 'favorable' || d.role_citizen === 'nuance'))
    .sort((a, b) => b._score - a._score)
    .slice(0, maxLeading);

  const leadingIds = new Set(leading.map(d => d.decision_id));

  // Nuances : non déjà en leading, role nuance ou contra_strength ≥ 3
  const nuances = scored
    .filter(d => !leadingIds.has(d.decision_id))
    .filter(d => d.role_citizen === 'nuance' || (d.contra_strength || 0) >= 3)
    .sort((a, b) => b._score - a._score)
    .slice(0, maxNuances);

  const nuancesIds = new Set(nuances.map(d => d.decision_id));

  // Pratique cantonale : tier 3-4, prioriser canton du citoyen
  const cantonalPool = scored
    .filter(d => !leadingIds.has(d.decision_id) && !nuancesIds.has(d.decision_id))
    .filter(d => d.tier >= 3)
    .filter(d => (d.article_refs_resolved || []).some(r => r.resolved));

  const cantonal_practice = cantonalPool
    .sort((a, b) => {
      // Priorité 1 : canton du citoyen
      const aSelf = a.canton === citizenCanton ? 1 : 0;
      const bSelf = b.canton === citizenCanton ? 1 : 0;
      if (aSelf !== bSelf) return bSelf - aSelf;
      return b._score - a._score;
    })
    .slice(0, maxCantonalPractice);

  return {
    leading_cases: leading.map(stripScore),
    nuances: nuances.map(stripScore),
    cantonal_practice: cantonal_practice.map(stripScore),
    similar_cases: scored
      .filter(d => !leadingIds.has(d.decision_id) && !nuancesIds.has(d.decision_id)
                && !cantonal_practice.some(c => c.decision_id === d.decision_id))
      .sort((a, b) => b._score - a._score)
      .slice(0, 10)
      .map(stripScore)
  };
}

function stripScore(d) {
  const { _score, ...rest } = d;
  return rest;
}

export { scoreDecision, recencyBonus, tierScore };
