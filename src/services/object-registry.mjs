/**
 * Object Registry — Objets gelés de la Constitution
 *
 * Wraps existing data into the 10 frozen object types with full evidence metadata.
 * Does NOT duplicate data — builds enriched views from existing files + source registry.
 *
 * Constitution: "On n'optimise pas pour tout indexer. On optimise pour produire
 * des claims vérifiés, traçables, prudents et opérables."
 */

import { loadAllData } from './graph-builder.mjs';
import {
  getRegistry, getSourceByRef, getSourceBySignature,
  articleSourceId, arretSourceId
} from './source-registry.mjs';

// ─── Evidence grading (constitution grammaire) ──────────────────────

const BINDING_STRENGTH = ['decisif', 'analogique', 'indicatif', 'obsolete'];
const CERTAINTY = ['certain', 'probable', 'variable', 'incertain', 'insufficient'];
const VERIFICATION_STATUS = ['verified', 'degraded', 'insufficient'];
const FRESHNESS_STATUS = ['current', 'stale', 'unknown'];

// ─── Internal state ─────────────────────────────────────────────────

let _objects = null;
let _data = null;

function ensureLoaded() {
  if (_objects) return;
  _data = loadAllData();
  getRegistry(); // ensure source registry is built
  const raw = {
    norm_fragments: buildNormFragments(_data),
    decision_holdings: buildDecisionHoldings(_data),
    proof_requirements: buildProofRequirements(_data),
    procedure_deadlines: buildProcedureDeadlines(_data),
    amount_ranges: buildAmountRanges(_data),
    anti_errors: buildAntiErrors(_data),
    practitioner_patterns: buildPractitionerPatterns(_data),
    authority_contacts: buildAuthorityContacts(_data),
    coverage_gaps: buildCoverageGaps(_data),
  };
  // Freeze all objects — "gelés" means immutable
  for (const [key, arr] of Object.entries(raw)) {
    for (const obj of arr) Object.freeze(obj);
    raw[key] = Object.freeze(arr);
  }
  _objects = Object.freeze(raw);
  // verified_claim is runtime-only (pipeline V3), schema exported below
}

// ─── 1. norm_fragment ───────────────────────────────────────────────

function buildNormFragments(data) {
  const seen = new Set();
  const fragments = [];
  for (const art of data.articles) {
    const src = getSourceByRef(art.ref);
    if (!src || seen.has(src.source_id)) continue;
    seen.add(src.source_id);
    fragments.push({
      object_type: 'norm_fragment',
      source_id: src.source_id,
      ref: art.ref,
      rs: art.rs,
      titre: art.titre,
      texte: art.texte || art.texteSimple || null,
      lienFedlex: art.lienFedlex || null,
      domaines: art.domaines || [],
      articlesLies: art.articlesLies || [],
      tier: src.tier,
      binding_strength: src.binding_strength,
      verification_status: art.lienFedlex ? 'verified' : 'degraded',
      freshness_status: src.statut_validite,
      date: art.harvestDate || null,
    });
  }
  return fragments;
}

// ─── 2. decision_holding ────────────────────────────────────────────

function buildDecisionHoldings(data) {
  const seen = new Set();
  const holdings = [];
  for (const arret of data.arrets) {
    const src = getSourceBySignature(arret.signature);
    if (!src || seen.has(src.source_id)) continue;
    seen.add(src.source_id);
    holdings.push({
      object_type: 'decision_holding',
      source_id: src.source_id,
      signature: arret.signature,
      tribunal: arret.tribunal,
      date: arret.date,
      theme: arret.theme,
      principeCle: arret.principeCle || null,
      role: classifyRole(arret.resultat),
      resultat: arret.resultat || null,
      fourchette: arret.fourchetteMontant || null,
      articlesAppliques: arret.articlesAppliques || [],
      facteursCles: arret.facteursCles || [],
      tier: src.tier,
      binding_strength: src.binding_strength,
      certainty: deriveCertaintyFromArret(arret),
      verification_status: 'verified', // imported from official source
      freshness_status: src.statut_validite,
    });
  }
  return holdings;
}

// Actors who represent the "weaker party" (citoyen perspective)
const CITIZEN_ACTORS = new Set([
  'locataire', 'employe', 'debiteur', 'etranger', 'enfant',
  'epouse', 'mere', 'pere', 'heritier'
]);
const AUTHORITY_ACTORS = new Set([
  'bailleur', 'employeur', 'creancier', 'autorite'
]);

function classifyRole(resultat) {
  if (!resultat) return 'neutre';
  const normalized = resultat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (normalized.includes('rejete') || normalized.includes('rejet')) return 'defavorable';
  if (normalized.startsWith('partiellement')) return 'neutre';

  // "favorable_locataire" = favorable (citizen wins)
  // "favorable_bailleur" = defavorable (authority wins, citizen loses)
  if (normalized.startsWith('favorable_')) {
    const actor = normalized.replace('favorable_', '');
    if (CITIZEN_ACTORS.has(actor)) return 'favorable';
    if (AUTHORITY_ACTORS.has(actor)) return 'defavorable';
    return 'favorable'; // default: if unknown actor, assume favorable
  }

  if (normalized.includes('favorable')) return 'favorable';
  return 'neutre';
}

function deriveCertaintyFromArret(arret) {
  if (arret.signature?.startsWith('ATF')) return 'certain';
  if (arret.tribunal === 'TF') return 'probable';
  return 'variable';
}

// ─── 3. proof_requirement ───────────────────────────────────────────

function buildProofRequirements(data) {
  return data.preuves.map((pr, i) => {
    const baseLegaleRef = pr.base_legale || null;
    const src = baseLegaleRef ? getSourceByRef(baseLegaleRef) : null;
    return {
      object_type: 'proof_requirement',
      id: `preuve:${(pr.procedure || `unknown-${i}`).toLowerCase().replace(/\s+/g, '-')}`,
      procedure: pr.procedure,
      domaine: pr.domaine,
      preuves_necessaires: pr.preuves_necessaires || [],
      preuves_utiles: pr.preuves_utiles || [],
      charge_de_la_preuve: pr.charge_de_la_preuve || null,
      moyens_admis: pr.moyens_admis || [],
      attention: pr.attention || null,
      base_legale: baseLegaleRef,
      source_id: src?.source_id || null,
      tier: src?.tier || 3,
      binding_strength: src ? src.binding_strength : 'indicatif',
      verification_status: src ? 'verified' : 'degraded',
      freshness_status: 'current',
    };
  });
}

// ─── 4. procedure_deadline ──────────────────────────────────────────

function buildProcedureDeadlines(data) {
  return data.delais.map((dl, i) => {
    const baseLegaleRef = dl.base_legale || dl.baseLegale || null;
    const src = baseLegaleRef ? getSourceByRef(baseLegaleRef) : null;
    return {
      object_type: 'procedure_deadline',
      id: `delai:${(dl.domaine || 'general')}:${(dl.id || dl.procedure || `unknown-${i}`).toLowerCase().replace(/\s+/g, '-')}`,
      procedure: dl.procedure || dl.titre,
      domaine: dl.domaine,
      delai: dl.delai,
      computation: dl.computation || null,
      feries: dl.feries || null,
      suspension: dl.suspension || null,
      consequence: dl.consequence || null,
      base_legale: baseLegaleRef,
      attention: dl.attention || null,
      source_id: src?.source_id || null,
      tier: src?.tier || 3,
      binding_strength: src ? src.binding_strength : 'indicatif',
      // Deadlines from law = deterministic (constitution rule)
      deterministic: !!baseLegaleRef,
      verification_status: src ? 'verified' : 'degraded',
      freshness_status: 'current',
    };
  });
}

// ─── 5. amount_range ────────────────────────────────────────────────

function buildAmountRanges(data) {
  const ranges = [];

  // From jurisprudence fourchetteMontant
  const seen = new Set();
  for (const arret of data.arrets) {
    if (!arret.fourchetteMontant) continue;
    const src = getSourceBySignature(arret.signature);
    if (!src) continue;
    const key = `${arret.signature}:fourchette`;
    if (seen.has(key)) continue;
    seen.add(key);
    ranges.push({
      object_type: 'amount_range',
      id: `range:juris:${arret.signature.toLowerCase().replace(/[\s/]/g, '-')}`,
      source_type: 'jurisprudence',
      source_id: src.source_id,
      context: arret.theme || arret.resume?.slice(0, 80),
      min: arret.fourchetteMontant.min,
      max: arret.fourchetteMontant.max,
      median: arret.fourchetteMontant.median || null,
      currency: 'CHF',
      scope: inferScope(arret.fourchetteMontant),
      conditions: arret.facteursCles || [],
      tier: src.tier,
      binding_strength: src.binding_strength,
      freshness_status: src.statut_validite,
    });
  }

  // From costs procedures
  for (const cout of data.couts) {
    ranges.push({
      object_type: 'amount_range',
      id: `range:cout:${(cout.procedure || cout.id || 'unknown').toLowerCase().replace(/\s+/g, '-')}`,
      source_type: 'procedure_cost',
      source_id: null,
      context: cout.procedure || cout.titre,
      min: cout.cout?.min || cout.cout || null,
      max: cout.cout?.max || cout.cout || null,
      median: null,
      currency: 'CHF',
      scope: 'total',
      conditions: [],
      tier: 3,
      binding_strength: 'indicatif',
      freshness_status: 'current',
    });
  }

  return ranges;
}

function inferScope(fourchette) {
  const str = JSON.stringify(fourchette).toLowerCase();
  if (str.includes('%')) return 'percentage';
  if (str.includes('mois')) return 'monthly';
  return 'total';
}

// ─── 6. anti_error ──────────────────────────────────────────────────

function buildAntiErrors(data) {
  return data.antiErreurs.map((ae, i) => {
    const baseLegaleRef = ae.base_legale || null;
    const src = baseLegaleRef ? getSourceByRef(baseLegaleRef) : null;
    return {
      object_type: 'anti_error',
      id: `anti-erreur:${(ae.domaine || 'general')}:${i}`,
      domaine: ae.domaine,
      erreur: ae.erreur,
      gravite: ae.gravite || 'moyenne',
      consequence: ae.consequence || null,
      correction: ae.correction || null,
      base_legale: baseLegaleRef,
      frequence: ae.frequence || null,
      error_type: classifyErrorType(ae),
      source_id: src?.source_id || null,
      tier: 3, // practice knowledge
      binding_strength: 'indicatif',
      verification_status: ae.frequence ? 'verified' : 'degraded',
      freshness_status: 'current',
    };
  });
}

function classifyErrorType(ae) {
  const text = `${ae.erreur} ${ae.consequence}`.toLowerCase();
  if (text.includes('délai') || text.includes('prescription') || text.includes('forclusion')) return 'procedural';
  if (text.includes('preuve') || text.includes('document')) return 'evidentiary';
  if (text.includes('montant') || text.includes('calcul')) return 'computational';
  return 'substantive';
}

// ─── 7. practitioner_pattern ────────────────────────────────────────

function buildPractitionerPatterns(data) {
  return data.patterns.map((p, i) => ({
    object_type: 'practitioner_pattern',
    id: `pattern:${(p.domaine || 'general')}:${i}`,
    domaine: p.domaine,
    situation: p.situation,
    strategieOptimale: p.strategieOptimale || p.ordreDesActions || [],
    neJamaisFaire: p.neJamaisFaire || [],
    signauxFaibles: p.signauxFaibles || [],
    erreurFrequente: p.erreurFrequente || null,
    quandNePasAgir: p.quandNePasAgir || null,
    tempsTypique: p.tempsTypique || null,
    confiance: p.confiance || 'variable',
    tier: 3,
    binding_strength: 'indicatif',
    verification_status: p.confiance === 'certain' ? 'verified' : 'degraded',
    freshness_status: 'current',
  }));
}

// ─── 8. authority_contact ───────────────────────────────────────────

function buildAuthorityContacts(data) {
  const contacts = [];
  const seen = new Set();

  // From annuaire (escalade includes relais network)
  const sources = [...(data.escalade || [])];

  for (const e of sources) {
    // Escalade entries can have multiple cantons
    const cantons = e.cantons || (e.canton ? [e.canton] : ['CH']);
    for (const canton of cantons) {
      const key = `${e.id || e.nom}:${canton}`;
      if (seen.has(key)) continue;
      seen.add(key);
      contacts.push({
        object_type: 'authority_contact',
        id: `contact:${canton.toLowerCase()}:${(e.id || e.nom || `unknown-${contacts.length}`).toLowerCase().replace(/\s+/g, '-')}`,
        nom: e.nom || e.organisme,
        type: e.type || 'service',
        canton,
        competence: e.domaines || e.quandEscalader ? [e.quandEscalader] : [],
        telephone: e.telephone || e.tel || null,
        url: e.url || null,
        adresse: e.adresse || null,
        conditions: e.conditions || null,
        langues: e.langues || ['fr'],
        service_level: e.gratuit !== false ? 'gratuit' : 'payant',
        verification_date: null, // TODO: track contact freshness
        freshness_status: 'unknown',
      });
    }
  }

  return contacts;
}

// ─── 9. coverage_gap ────────────────────────────────────────────────

function buildCoverageGaps(data) {
  const gaps = [];
  const domaines = new Set(data.fiches.map(f => f.domaine));

  // Domains without jurisprudence
  for (const d of domaines) {
    const hasJuris = data.arrets.some(a =>
      a.tags?.some(t => t.toLowerCase().includes(d)) ||
      a.theme?.toLowerCase().includes(d)
    );
    if (!hasJuris) {
      gaps.push({
        object_type: 'coverage_gap',
        id: `gap:juris:${d}`,
        domain: d,
        issue_type: 'missing_jurisprudence',
        description: `Domaine "${d}" n'a pas de jurisprudence indexée`,
        reason: 'not_harvested',
        estimated_effort: 'medium',
        impact: 'moyen',
      });
    }
  }

  // Fiches without articles
  for (const f of data.fiches) {
    const artRefs = f.reponse?.articles?.map(a => a.ref) || [];
    const hasIndexed = artRefs.some(ref => getSourceByRef(ref));
    if (artRefs.length > 0 && !hasIndexed) {
      gaps.push({
        object_type: 'coverage_gap',
        id: `gap:articles:${f.id}`,
        domain: f.domaine,
        issue_type: 'articles_not_indexed',
        description: `Fiche "${f.id}" cite des articles non indexés: ${artRefs.join(', ')}`,
        reason: 'not_harvested',
        estimated_effort: 'low',
        impact: 'faible',
      });
    }
  }

  // V1 scope check: bail, travail, dettes only
  const V1_DOMAINS = ['bail', 'travail', 'dettes'];
  for (const d of domaines) {
    if (!V1_DOMAINS.includes(d)) {
      gaps.push({
        object_type: 'coverage_gap',
        id: `gap:scope:${d}`,
        domain: d,
        issue_type: 'out_of_v1_scope',
        description: `Domaine "${d}" est hors scope V1 (bail/travail/dettes uniquement)`,
        reason: 'scope_limitation',
        estimated_effort: 'high',
        impact: 'faible',
      });
    }
  }

  return gaps;
}

// ─── 10. verified_claim — Schema only (runtime object) ──────────────

export const VERIFIED_CLAIM_SCHEMA = {
  object_type: 'verified_claim',
  fields: {
    id: 'string — unique claim identifier',
    claim_text: 'string — the assertion in natural language',
    source_ids: 'string[] — references to source registry entries',
    conditions: 'string[] — when this claim applies',
    verification_status: 'verified | degraded | insufficient',
    certainty: 'certain | probable | variable | incertain | insufficient',
    binding_strength: 'decisif | analogique | indicatif',
    contradictions: 'string[] — known counter-arguments or conflicting sources',
    scope: '{ domaines: string[], cantons?: string[] }',
  },
  rules: [
    'A claim without at least one valid source_id is REJECTED',
    'If contradiction exists and is unresolved → certainty = "incertain"',
    'Deadlines and amounts in claims must come from deterministic code, never LLM',
    'Claims are produced at runtime by pipeline V3, not stored statically',
  ],
};

// ─── Public API ─────────────────────────────────────────────────────

export function getObjectRegistry() {
  ensureLoaded();
  return _objects;
}

export function getObjectsByType(type) {
  ensureLoaded();
  const key = typeToKey(type);
  return key ? [...(_objects[key] || [])] : [];
}

export function getObjectById(type, id) {
  const objects = getObjectsByType(type);
  return objects.find(o => o.id === id || o.source_id === id) || null;
}

export function getObjectsByDomain(type, domaine) {
  const objects = getObjectsByType(type);
  const d = domaine.toLowerCase();
  return objects.filter(o =>
    o.domaine === d ||
    o.domain === d ||
    (Array.isArray(o.domaines) && o.domaines.includes(d)) ||
    (Array.isArray(o.perimetre) && o.perimetre.some(p => p.toLowerCase().includes(d))) ||
    // decision_holdings: tags-based domain matching
    (o.object_type === 'decision_holding' && o.articlesAppliques?.some(ref => {
      const src = getSourceByRef(ref);
      return src?.perimetre?.includes(d);
    }))
  );
}

export function getObjectStats() {
  ensureLoaded();
  const stats = {};
  for (const [key, arr] of Object.entries(_objects)) {
    const verified = arr.filter(o => o.verification_status === 'verified').length;
    const degraded = arr.filter(o => o.verification_status === 'degraded').length;
    const stale = arr.filter(o => o.freshness_status === 'stale').length;
    stats[key] = {
      total: arr.length,
      verified,
      degraded,
      insufficient: arr.length - verified - degraded,
      stale,
    };
  }
  return {
    object_types: Object.keys(stats).length,
    total_objects: Object.values(stats).reduce((s, v) => s + v.total, 0),
    stats,
    verified_claim_schema: VERIFIED_CLAIM_SCHEMA,
  };
}

/**
 * For pipeline V3: get all objects relevant to a domain, organized by type.
 * This is the "dossier builder" input.
 */
export function getDossierObjects(domaine) {
  ensureLoaded();
  return {
    norm_fragments: getObjectsByDomain('norm_fragment', domaine),
    decision_holdings: getObjectsByDomain('decision_holding', domaine),
    proof_requirements: getObjectsByDomain('proof_requirement', domaine),
    procedure_deadlines: getObjectsByDomain('procedure_deadline', domaine),
    amount_ranges: getObjectsByDomain('amount_range', domaine),
    anti_errors: getObjectsByDomain('anti_error', domaine),
    practitioner_patterns: getObjectsByDomain('practitioner_pattern', domaine),
    authority_contacts: getObjectsByDomain('authority_contact', domaine),
    coverage_gaps: getObjectsByDomain('coverage_gap', domaine),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function typeToKey(type) {
  const map = {
    'norm_fragment': 'norm_fragments',
    'decision_holding': 'decision_holdings',
    'proof_requirement': 'proof_requirements',
    'procedure_deadline': 'procedure_deadlines',
    'amount_range': 'amount_ranges',
    'anti_error': 'anti_errors',
    'practitioner_pattern': 'practitioner_patterns',
    'authority_contact': 'authority_contacts',
    'coverage_gap': 'coverage_gaps',
  };
  return map[type] || null;
}

// ─── Decision-holding enrichment helpers ────────────────────────────
// Phase Quality — exposés ici (et non dans caselaw/decision-normalizer.mjs)
// pour que les fiches & le pipeline V3 puissent enrichir un arret minimal
// (signature/tribunal/date) en un objet riche avec tier, age, strength_badge.

/**
 * Tier d'un arret :
 *   1 = TF publié (ATF) — décisif
 *   2 = TF non publié (4A_/5A_/6B_/9C_…)
 *   3 = Cantonal / inférieur / inconnu
 * @param {string} signature
 * @param {string} tribunal
 * @param {boolean} [publie] - flag explicite si TF publié sans préfixe ATF
 */
export function deriveTier(signature, tribunal, publie = false) {
  const sig = String(signature || '').trim();
  if (/^ATF/i.test(sig)) return 1;
  if (tribunal === 'TF' && publie === true) return 1;
  if (/^\d[A-Z]_\d+\/\d{4}/.test(sig)) return 2;
  if (tribunal === 'TF') return 2;
  return 3;
}

const TIER_LABELS = {
  1: '1 - Tribunal Fédéral publié (ATF)',
  2: '2 - Tribunal Fédéral arrêt',
  3: '3 - Cantonal ou inférieur',
};

export function deriveTierLabel(tier) {
  return TIER_LABELS[tier] || '3 - Cantonal ou inférieur';
}

/**
 * Normalise une date vers ISO YYYY-MM-DD.
 * Accepte ISO ('2020-06-15') ou DD.MM.YYYY ('15.06.2020').
 * Retourne null si invalide ou null/empty.
 */
export function normalizeDate(input) {
  if (input === null || input === undefined || input === '') return null;
  const s = String(input).trim();
  // ISO YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`);
    if (Number.isNaN(dt.getTime())) return null;
    return `${y}-${mo}-${d}`;
  }
  // DD.MM.YYYY
  m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`);
    if (Number.isNaN(dt.getTime())) return null;
    return `${y}-${mo}-${d}`;
  }
  return null;
}

/**
 * Calcule l'age (en années entières) d'une date par rapport à `now`.
 * Retourne null si date invalide.
 */
export function yearsAgo(input, now = new Date()) {
  const iso = normalizeDate(input);
  if (!iso) return null;
  const dt = new Date(`${iso}T00:00:00Z`);
  const ref = now instanceof Date ? now : new Date(now);
  let age = ref.getUTCFullYear() - dt.getUTCFullYear();
  const m = ref.getUTCMonth() - dt.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < dt.getUTCDate())) age -= 1;
  return age;
}

/**
 * Construit un libellé "YYYY-MM-DD (il y a X ans)".
 * Retourne null si la date n'est pas normalisable.
 */
export function buildDateDisplay(input, now = new Date()) {
  const iso = normalizeDate(input);
  if (!iso) return null;
  const age = yearsAgo(iso, now);
  if (age === null) return iso;
  if (age <= 0) return `${iso} (cette année)`;
  const plural = age > 1 ? 'ans' : 'an';
  return `${iso} (il y a ${age} ${plural})`;
}

/** Alias accepting non-ISO formats — same behaviour as buildDateDisplay. */
export function formatDateDisplay(input, now = new Date()) {
  return buildDateDisplay(input, now);
}

/**
 * Force la note de robustesse d'un arret (tier × age) :
 *   - age >= 20 → 'weak' (toujours)
 *   - tier 1 & age < 10 → 'strong'
 *   - tier 1 & age >= 10 → 'moderate'
 *   - tier 2 & age < 10 → 'strong' (proche TF)
 *   - tier 2 & age >= 10 → 'moderate'
 *   - tier 3 & age <= 10 → 'moderate'
 *   - tier 3 & age > 10 → 'weak'
 */
export function computeStrength(tier, age) {
  const a = Number.isFinite(age) ? age : 0;
  if (a >= 20) return 'weak';
  if (tier === 1) return a < 10 ? 'strong' : 'moderate';
  if (tier === 2) return a < 10 ? 'strong' : 'moderate';
  // tier 3
  return a <= 10 ? 'moderate' : 'weak';
}

/**
 * Enrichit un arret minimal en objet décisionnel complet.
 * Input : { signature, tribunal, date?, publie?, canton? }
 * Output : { tier, tier_label, date_iso, age_years, date_display, strength_badge, scope_territorial }
 */
export function enrichDecisionHolding(raw, now = new Date()) {
  const tier = deriveTier(raw?.signature, raw?.tribunal, raw?.publie === true);
  const tier_label = deriveTierLabel(tier);
  const date_iso = normalizeDate(raw?.date);
  const age_years = date_iso ? yearsAgo(date_iso, now) : null;
  const date_display = date_iso ? buildDateDisplay(date_iso, now) : null;
  const strength_badge = computeStrength(tier, age_years);
  // scope territorial : TF couvre toute la CH ; cantonal limité au canton (ou null)
  const scope_territorial = raw?.tribunal === 'TF'
    ? 'CH'
    : (raw?.canton || null);
  return {
    ...raw,
    tier,
    tier_label,
    date_iso,
    age_years,
    date_display,
    strength_badge,
    scope_territorial,
  };
}
