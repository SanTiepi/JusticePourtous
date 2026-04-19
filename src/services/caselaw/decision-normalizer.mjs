/**
 * decision-normalizer.mjs — Normalise les RawDecision de n'importe quel provider
 * vers DecisionCanonical (schéma interne unique).
 *
 * Invariants :
 *   - `tier` juridique DÉRIVÉ du tribunal et de l'instance, jamais du provider
 *   - `decision_id` = hash stable pour dédup cross-provider
 *   - Langue détectée si absente (heuristique)
 *   - Références articles non résolues ici (cf. article-resolver)
 */

import { createHash } from 'node:crypto';

/**
 * @typedef {object} DecisionCanonical
 * @property {string} decision_id                - sha256 stable court|date|signature|title
 * @property {string} provider_source            - 'opencaselaw' | 'entscheidsuche' | ...
 * @property {string} external_id                - id dans la source
 * @property {string|null} signature             - ex: "4A_32/2018"
 * @property {string|null} court
 * @property {string|null} court_id              - slug normalisé
 * @property {string} instance_level             - 'tribunal_federal' | 'cantonal_superior' | 'cantonal_first' | 'administrative' | 'unknown'
 * @property {string|null} canton                - "CH" | "VD" | "GE" | ... | null
 * @property {string} decision_language          - 'fr' | 'de' | 'it' | 'rm' | 'unknown'
 * @property {string|null} date                  - ISO YYYY-MM-DD
 * @property {number|null} year
 * @property {string|null} title
 * @property {string|null} abstract
 * @property {string|null} text_excerpt
 * @property {string[]} references_raw           - refs telles qu'extraites du provider
 * @property {string|null} outcome_raw
 * @property {string|null} url
 * @property {string} publication_status         - 'published' | 'leading' | 'unofficial' | 'unknown'
 * @property {number} tier                       - 1 (ATF publié) | 2 (TF non publié) | 3 (cantonal sup) | 4 (1ère inst. / admin)
 * @property {string} tier_label
 * @property {string} ingested_at                - ISO timestamp
 */

const COURT_SLUG_MAP = [
  { re: /tribunal\s+f[ée]d[ée]ral|bundesgericht|tribunale\s+federale|TF\b/i, slug: 'tf', instance: 'tribunal_federal' },
  { re: /tribunal\s+administratif\s+f[ée]d[ée]ral|TAF\b/i, slug: 'taf', instance: 'tribunal_federal' },
  { re: /tribunal\s+p[ée]nal\s+f[ée]d[ée]ral|TPF\b/i, slug: 'tpf', instance: 'tribunal_federal' },
  { re: /cour\s+de\s+justice\s+([A-Z]{2})/i, slug: (m) => `${m[1].toLowerCase()}-cj`, instance: 'cantonal_superior' },
  { re: /tribunal\s+cantonal\s+([A-Z]{2})/i, slug: (m) => `${m[1].toLowerCase()}-tc`, instance: 'cantonal_superior' },
  { re: /obergericht\s+([A-Z]{2})/i, slug: (m) => `${m[1].toLowerCase()}-og`, instance: 'cantonal_superior' },
  { re: /bezirksgericht|tribunal\s+de\s+premi[èe]re\s+instance|pretura/i, slug: 'cantonal-first', instance: 'cantonal_first' },
  { re: /autorit[ée]|office\s+des\s+poursuites|amt|ufficio/i, slug: 'admin', instance: 'administrative' }
];

function normalizeCourt(court) {
  if (!court) return { court_id: null, instance: 'unknown' };
  for (const r of COURT_SLUG_MAP) {
    const m = court.match(r.re);
    if (m) {
      const slug = typeof r.slug === 'function' ? r.slug(m) : r.slug;
      return { court_id: slug, instance: r.instance };
    }
  }
  return { court_id: 'other', instance: 'unknown' };
}

function deriveTier(normalizedCourt, publicationStatus, signature) {
  const sig = String(signature || '').trim();
  if (/^ATF/i.test(sig)) return { tier: 1, label: 'Tribunal fédéral — publié (ATF)' };
  if (normalizedCourt.instance === 'tribunal_federal') {
    if (publicationStatus === 'official' || publicationStatus === 'leading') {
      return { tier: 1, label: 'Tribunal fédéral — publié' };
    }
    if (/^\d[A-Z]_\d+\/\d{4}/.test(sig)) {
      return { tier: 2, label: 'Tribunal fédéral — non publié' };
    }
    return { tier: 2, label: 'Tribunal fédéral' };
  }
  if (normalizedCourt.instance === 'cantonal_superior') return { tier: 3, label: 'Cantonal supérieur' };
  if (normalizedCourt.instance === 'cantonal_first') return { tier: 4, label: 'Cantonal 1ère instance' };
  if (normalizedCourt.instance === 'administrative') return { tier: 4, label: 'Autorité administrative' };
  return { tier: 4, label: 'Autre' };
}

function detectLanguage(raw) {
  if (raw.language) return raw.language;
  const text = [raw.title, raw.abstract, raw.text_excerpt].filter(Boolean).join(' ').toLowerCase();
  if (!text) return 'unknown';
  const frMarkers = ['que', 'une', 'dans', 'pour', 'avec', 'leur', 'mais', 'selon', 'considérant'];
  const deMarkers = ['der', 'die', 'das', 'und', 'nicht', 'mit', 'auf', 'werden', 'erwägung'];
  const itMarkers = ['che', 'una', 'con', 'per', 'non', 'questo', 'considerato'];
  const fr = frMarkers.filter(m => text.includes(m)).length;
  const de = deMarkers.filter(m => text.includes(m)).length;
  const it = itMarkers.filter(m => text.includes(m)).length;
  const top = Math.max(fr, de, it);
  if (top === 0) return 'unknown';
  if (top === fr) return 'fr';
  if (top === de) return 'de';
  return 'it';
}

function hashDecision({ court, date, signature, title }) {
  return createHash('sha256')
    .update([court || '', date || '', signature || '', (title || '').slice(0, 120)].join('|'))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Normalise une décision.
 * @param {object} raw — RawDecision
 * @returns {DecisionCanonical}
 */
export function normalizeDecision(raw) {
  const { court_id, instance: rawInstance } = normalizeCourt(raw.court);
  const instance = raw.instance || rawInstance || 'unknown';
  const publicationStatus = raw.published === 'official' ? 'published'
                         : raw.published === 'leading' ? 'leading'
                         : raw.published === 'unofficial' ? 'unofficial'
                         : 'unknown';
  const court = raw.court || null;
  const { tier, label: tier_label } = deriveTier(
    { court_id, instance },
    publicationStatus,
    raw.signature
  );
  const year = raw.date ? Number(String(raw.date).slice(0, 4)) : null;
  return {
    decision_id: hashDecision(raw),
    provider_source: raw.provider_source,
    external_id: raw.external_id,
    signature: raw.signature || null,
    court,
    court_id,
    instance_level: instance,
    canton: raw.canton || null,
    decision_language: detectLanguage(raw),
    date: raw.date || null,
    year: Number.isFinite(year) ? year : null,
    title: raw.title || null,
    abstract: raw.abstract || null,
    text_excerpt: raw.text_excerpt || null,
    references_raw: Array.isArray(raw.references) ? raw.references : [],
    outcome_raw: raw.outcome || null,
    url: raw.url || null,
    publication_status: publicationStatus,
    tier,
    tier_label,
    ingested_at: new Date().toISOString()
  };
}

/**
 * Déduplique une liste de DecisionCanonical par decision_id.
 * Conserve la première occurrence (priorité d'appel à l'ordre des providers).
 */
export function dedupeDecisions(decisions) {
  const seen = new Set();
  const out = [];
  for (const d of decisions) {
    if (!d || !d.decision_id) continue;
    if (seen.has(d.decision_id)) continue;
    seen.add(d.decision_id);
    out.push(d);
  }
  return out;
}

export { hashDecision, normalizeCourt, deriveTier, detectLanguage };
