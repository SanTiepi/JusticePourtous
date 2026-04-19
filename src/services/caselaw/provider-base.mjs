/**
 * provider-base.mjs — Interface commune pour les fournisseurs de jurisprudence.
 *
 * Chaque provider (OpenCaseLaw, Entscheidsuche, TF direct) implémente la même
 * forme. Le pipeline de normalisation/classification/ranking en aval reste
 * indépendant de la source technique. Le `tier` juridique vient du tribunal
 * et de l'instance, jamais de l'agrégateur.
 *
 * Interface :
 *   - id : identifiant unique du provider
 *   - label : nom public
 *   - search({ domain, canton, articleRef, date_from, limit }) → RawDecision[]
 *   - fetchOne(id) → RawDecision | null
 *   - getHealth() → { enabled, last_success, error_rate }
 */

export const PROVIDER_IDS = Object.freeze({
  OPENCASELAW: 'opencaselaw',
  ENTSCHEIDSUCHE: 'entscheidsuche',
  TF_DIRECT: 'tf_direct'
});

/**
 * Schéma RawDecision — forme minimale qu'un provider doit retourner.
 * La normalisation vers DecisionCanonical est faite par decision-normalizer.
 *
 * @typedef {object} RawDecision
 * @property {string} provider_source       - 'opencaselaw' | 'entscheidsuche' | 'tf_direct'
 * @property {string} external_id           - identifiant dans la source
 * @property {string} [signature]            - ex: "4A_32/2018", "ATF 140 III 215"
 * @property {string} [court]                - ex: "Tribunal fédéral", "Cour de justice GE"
 * @property {string} [instance]             - tribunal_federal | cantonal_superior | ...
 * @property {string} [canton]               - "CH" | "VD" | "GE" | ...
 * @property {string} [language]             - "fr" | "de" | "it" | "rm"
 * @property {string} [date]                 - ISO date
 * @property {string} [title]                - sujet/en-tête
 * @property {string} [abstract]             - résumé si présent
 * @property {string} [text]                 - texte de la décision
 * @property {string} [text_excerpt]         - extrait si texte trop long
 * @property {string[]} [references]         - refs d'articles citées (format source)
 * @property {string} [outcome]              - issue selon source
 * @property {string} [url]                  - URL publique
 * @property {string} [published]            - "official" | "unofficial" | "unknown"
 * @property {object} [raw]                  - payload brut du provider
 */

/**
 * Abstract base. Un provider concret étend et implémente.
 */
export class CaseLawProvider {
  /** @returns {string} */
  get id() { throw new Error('CaseLawProvider: id getter must be implemented'); }

  /** @returns {string} */
  get label() { throw new Error('CaseLawProvider: label getter must be implemented'); }

  /**
   * Recherche de décisions selon critères.
   * @param {object} query
   * @param {string} [query.domain]
   * @param {string} [query.canton]
   * @param {string} [query.articleRef]
   * @param {string} [query.date_from]
   * @param {number} [query.limit]
   * @returns {Promise<RawDecision[]>}
   */
  async search(_query) { throw new Error('CaseLawProvider.search() must be implemented'); }

  /**
   * Récupère une décision par son id externe.
   * @param {string} id
   * @returns {Promise<RawDecision|null>}
   */
  async fetchOne(_id) { throw new Error('CaseLawProvider.fetchOne() must be implemented'); }

  /**
   * Santé du provider.
   * @returns {{ enabled: boolean, last_success?: string, error_rate?: number }}
   */
  getHealth() {
    return { enabled: true };
  }
}
