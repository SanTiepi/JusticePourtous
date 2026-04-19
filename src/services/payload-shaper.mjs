/**
 * Payload Shaper — wrappers `quality{}` et `pipeline{}` (review vague 2, findings #4 & #5).
 *
 * OBJECTIF
 * --------
 * Le payload public `/api/triage/*` expose aujourd'hui ~40 champs au top-level
 * (certificate, freshness, confiance, tier, tier_score, uncertainties,
 * complexite, hard_rules_triggered, recommended_domain_order, urgency_marker,
 * pivot_reasons, degraded_mode, source_language, translation_disclaimer,
 * dimensions_detail, flags, jurisprudence, jurisprudence_enriched, ...).
 *
 * Deux frictions identifiées :
 *   1. "Fatigue schéma" côté frontend — quel champ lire ?
 *   2. Deux versions de jurisprudence (brute vs enrichie tier-aware) — laquelle afficher ?
 *
 * STRATÉGIE — NON-BREAKING absolu
 * --------------------------------
 * On introduit deux sous-objets agrégateurs :
 *   - payload.quality    = { certificate, freshness, confidence, jurisprudence }
 *   - payload.pipeline   = { complexite, hard_rules_triggered, ... }
 *
 * RÈGLE D'OR : les champs à la racine restent EN PLACE, dupliqués sous les
 * wrappers. Aucun test existant, aucun consommateur déployé ne doit casser.
 * Les wrappers sont un **shim de rétro-compatibilité** : le frontend migre
 * progressivement vers `payload.quality.*` / `payload.pipeline.*`, et dans une
 * future majeure (v2), on pourra geler puis retirer les champs racine.
 *
 * Migration frontend (à faire séparément, hors de ce module) :
 *   - lire `payload.quality.certificate` plutôt que `payload.certificate`
 *   - lire `payload.quality.confidence.tier` plutôt que `payload.tier`
 *   - lire `payload.quality.jurisprudence` (unifiée, dédupliquée) plutôt que
 *     `jurisprudence_enriched` ou `jurisprudence`
 *   - lire `payload.pipeline.complexite` plutôt que `payload.complexite`
 *   - ...
 *
 * DÉDUPLICATION JURISPRUDENCE (finding #4)
 * ----------------------------------------
 *   - Préférer `jurisprudence_enriched` (déjà tier/date/scope/strength_badge)
 *   - Sinon fabriquer depuis `primary.jurisprudence` via enrichDecisionHolding
 *   - Déduplication par `signature` exact match (case-insensitive, trim)
 */

import * as _objectRegistry from './object-registry.mjs';

// Import défensif : si object-registry n'expose pas enrichDecisionHolding
// (version antérieure du module), on garde un passthrough no-op. Ce module
// doit fonctionner même si l'enrichissement n'est pas disponible.
const enrichDecisionHolding = typeof _objectRegistry.enrichDecisionHolding === 'function'
  ? _objectRegistry.enrichDecisionHolding
  : (arret) => arret;

/**
 * Retourne un payload shapé : les champs racine sont conservés + deux wrappers
 * `quality` et `pipeline` sont ajoutés. Idempotent — ré-appliquer ne casse rien.
 *
 * @param {object} rawPayload — payload tel que produit par triage-engine
 * @returns {object} payload + wrappers
 */
export function shapePayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object') return rawPayload;

  return {
    ...rawPayload,
    quality: {
      certificate: rawPayload.certificate || null,
      freshness: rawPayload.freshness || extractFreshnessFromPrimary(rawPayload),
      confidence: {
        level: rawPayload.confiance || null,
        tier: rawPayload.tier ?? null,
        tier_score: rawPayload.tier_score ?? null,
        tier_max: rawPayload.tier_max ?? null,
        uncertainties: Array.isArray(rawPayload.uncertainties) ? rawPayload.uncertainties : [],
        warnings: collectWarnings(rawPayload),
      },
      jurisprudence: unifyJurisprudence(rawPayload),
    },
    pipeline: {
      complexite: rawPayload.complexite || null,
      complexite_score: rawPayload.complexiteScore ?? null,
      hard_rules_triggered: Array.isArray(rawPayload.hard_rules_triggered)
        ? rawPayload.hard_rules_triggered : [],
      recommended_domain_order: Array.isArray(rawPayload.recommended_domain_order)
        ? rawPayload.recommended_domain_order : [],
      urgency_marker: rawPayload.urgency_marker || null,
      pivot_reasons: Array.isArray(rawPayload.pivot_reasons) ? rawPayload.pivot_reasons : [],
      degraded_mode: rawPayload.degraded_mode === true,
      source_language: rawPayload.source_language || null,
      translation_disclaimer: rawPayload.translation_disclaimer || null,
      dimensions_detail: rawPayload.dimensions_detail || null,
      flags: (rawPayload.flags && typeof rawPayload.flags === 'object') ? rawPayload.flags : {},
    },
  };
}

/**
 * Unifie et déduplique la jurisprudence.
 *
 * Ordre de préférence :
 *   1. `jurisprudence_enriched` (déjà tier-aware) — source préférée
 *   2. `primary.jurisprudence` enrichi à la volée via enrichDecisionHolding
 *   3. `jurisprudence` racine (legacy) enrichi à la volée
 *
 * Dédup par signature (case-insensitive, trim). Les champs enrichis gagnent
 * sur les champs bruts en cas de collision.
 *
 * @param {object} payload
 * @returns {Array} liste unique enrichie
 */
export function unifyJurisprudence(payload) {
  if (!payload) return [];

  const byKey = new Map();

  function add(list, { enrich = false } = {}) {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const enriched = enrich ? enrichDecisionHolding(entry) : entry;
      const key = dedupKey(enriched);
      if (!key) continue;
      // Premier hit gagne (préférence explicite par l'ordre d'appel).
      if (!byKey.has(key)) byKey.set(key, enriched);
    }
  }

  // 1. Préférer la version enrichie si présente
  add(payload.jurisprudence_enriched, { enrich: false });

  // 2. Compléter avec primary.jurisprudence enrichie à la volée
  if (payload.primary && Array.isArray(payload.primary.jurisprudence)) {
    add(payload.primary.jurisprudence, { enrich: true });
  }

  // 3. Complément legacy : `jurisprudence` racine brute
  add(payload.jurisprudence, { enrich: true });

  return [...byKey.values()];
}

/**
 * Dérive une clé de dédup stable pour un arrêt.
 * Priorité : signature > source_id > id. Case-insensitive, trim.
 */
function dedupKey(entry) {
  const raw = entry?.signature || entry?.source_id || entry?.id;
  if (!raw || typeof raw !== 'string') return null;
  return raw.trim().toLowerCase();
}

/**
 * Extrait la fraîcheur depuis `primary.fiche.freshness` si absente au top-level.
 * Utilisé uniquement en fallback — triage-engine n'expose pas `primary` dans
 * le payload public, mais certains consommateurs internes l'attachent.
 */
export function extractFreshnessFromPrimary(payload) {
  if (!payload) return null;
  // Essai direct : `fiche.freshness` si quelqu'un a inliné la fiche.
  if (payload.fiche && payload.fiche.freshness) return payload.fiche.freshness;
  // Essai via primary (structure interne knowledge-engine).
  if (payload.primary && payload.primary.fiche && payload.primary.fiche.freshness) {
    return payload.primary.fiche.freshness;
  }
  return null;
}

/**
 * Collecte les warnings disponibles dans le payload (certificate, quality_warning,
 * degraded_mode). Retourne une liste de strings humaines.
 */
export function collectWarnings(payload) {
  const out = [];
  if (!payload) return out;

  // Certificate warnings (limited downgrade, checks non critiques qui échouent)
  if (payload.certificate && Array.isArray(payload.certificate.warnings)) {
    for (const w of payload.certificate.warnings) {
      if (typeof w === 'string' && w.length) out.push(w);
    }
  }

  // Quality warning flag global (certificate = insufficient)
  if (payload.quality_warning === true) {
    out.push('Certificat de couverture insuffisant — réponse à consommer avec prudence.');
  }

  // Mode dégradé langue
  if (payload.degraded_mode === true) {
    const lang = payload.source_language || 'langue non couverte';
    out.push(`Mode dégradé linguistique : ${lang}.`);
  }

  return out;
}
