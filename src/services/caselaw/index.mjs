/**
 * caselaw/index.mjs — API publique de la couche jurisprudence.
 *
 * Usage :
 *   import { buildCanonForFiche, getCanonCompleteness } from './services/caselaw/index.mjs';
 *
 *   const canon = await buildCanonForFiche(fiche, { citizenCanton: 'VD' });
 *   // → { leading_cases, nuances, cantonal_practice, similar_cases }
 *
 * Architecture :
 *   providers (OpenCaseLaw, Entscheidsuche, TF)
 *      → normalizer (schéma canonique)
 *         → dedupe cross-provider
 *            → article-resolver (source_id Fedlex)
 *               → role-classifier (favorable/nuance/defavorable/neutre)
 *                  → holding-extractor (holding + citizen_summary)
 *                     → leading-case-ranker (leading / nuances / cantonal)
 */

import { OpenCaseLawProvider } from './provider-opencaselaw.mjs';
import { EntscheidsucheProvider } from './provider-entscheidsuche.mjs';
import { normalizeDecision, dedupeDecisions } from './decision-normalizer.mjs';
import { resolveArticlesForDecision } from './article-resolver.mjs';
import { classifyRole } from './role-classifier.mjs';
import { extractHoldingForDecision } from './holding-extractor.mjs';
import { rankDecisions } from './leading-case-ranker.mjs';

let _providers = null;

function getProviders() {
  if (_providers) return _providers;
  _providers = [
    new OpenCaseLawProvider(),
    new EntscheidsucheProvider()
  ];
  return _providers;
}

/** Pour tests : réinitialise les providers. */
export function _resetProviders() { _providers = null; }

/** Pour tests : injecte un pipeline providers custom. */
export function _setProviders(providers) { _providers = providers; }

/**
 * Cherche et traite les décisions pour une fiche donnée.
 * @param {object} fiche
 * @param {object} [opts]
 * @param {string} [opts.citizenCanton]
 * @param {number} [opts.limitPerProvider=30]
 */
export async function buildCanonForFiche(fiche, opts = {}) {
  const { citizenCanton = null, limitPerProvider = 30 } = opts;
  if (!fiche || !fiche.domaine) {
    return { leading_cases: [], nuances: [], cantonal_practice: [], similar_cases: [] };
  }

  const domain = fiche.domaine;
  const firstArticle = (fiche.reponse?.articles || [])[0]?.ref || null;

  // 1. Fetch all providers in parallel
  const providers = getProviders();
  const rawLists = await Promise.all(providers.map(p =>
    p.search({ domain, articleRef: firstArticle, limit: limitPerProvider }).catch(() => [])
  ));

  // 2. Flatten + normalize
  const normalized = rawLists.flat().map(normalizeDecision);

  // 3. Dedupe cross-provider
  const deduped = dedupeDecisions(normalized);

  // 4. Resolve articles
  const resolved = deduped.map(resolveArticlesForDecision);

  // 5. Classify role
  const classified = resolved.map(d => classifyRole(d, domain));

  // 6. Extract holding
  const withHolding = classified.map(extractHoldingForDecision);

  // 7. Rank
  return rankDecisions(withHolding, { citizenCanton });
}

/**
 * Canon completeness pour un intent/fiche.
 * Un intent est "canon_complete" si :
 *   - ≥ 1 leading case (base TF forte OU cantonal avec holding)
 *   - ≥ 1 nuance OU contra
 *   - ≥ 1 pratique cantonale si disponibles
 *   - ≥ 1 résumé citoyen validé (via holding_validated)
 */
export async function getCanonCompleteness(fiche, opts = {}) {
  const canon = await buildCanonForFiche(fiche, opts);
  const hasLeading = canon.leading_cases.length >= 1;
  const hasNuance = canon.nuances.length >= 1;
  const hasCantonal = canon.cantonal_practice.length >= 1;
  const hasCitizenSummary = canon.leading_cases.some(c => c.citizen_summary)
                         || canon.cantonal_practice.some(c => c.citizen_summary);
  return {
    intent_id: fiche.id,
    domaine: fiche.domaine,
    canon_complete: hasLeading && hasNuance && hasCitizenSummary,
    has_leading: hasLeading,
    has_nuance: hasNuance,
    has_cantonal_practice: hasCantonal,
    has_citizen_summary: hasCitizenSummary,
    score: [hasLeading, hasNuance, hasCantonal, hasCitizenSummary].filter(Boolean).length,
    max_score: 4
  };
}

export { OpenCaseLawProvider, EntscheidsucheProvider };
