/**
 * Source Registry — Registre universel des sources juridiques
 *
 * Chaque source (article, arrêt, directive, pattern) reçoit :
 *   - source_id   — identifiant stable et unique
 *   - tier        — 1 (officiel contraignant), 2 (quasi-officiel), 3 (pratique structurée)
 *   - binding_strength — decisif / analogique / indicatif / obsolete
 *   - date        — date de publication ou récolte
 *   - perimetre   — bail, travail, dettes, etc.
 *   - statut_validite — current / stale / unknown
 *
 * Constitution: "Chaque source a source_id, tier, date, périmètre, statut_validité."
 */

import { loadAllData } from './graph-builder.mjs';

// ─── Tier classification ────────────────────────────────────────────

const TIERS = {
  1: { label: 'Officiel contraignant', binding_strength: 'decisif', description: 'Fedlex (lois), ATF publiés, ordonnances' },
  2: { label: 'Quasi-officiel', binding_strength: 'analogique', description: 'Arrêts TF non publiés, directives OFAS/SEM, messages CF' },
  3: { label: 'Pratique structurée', binding_strength: 'indicatif', description: 'Patterns praticien, anti-erreurs, cas anonymisés, barèmes SVIT' },
};

// ─── Source ID generation ───────────────────────────────────────────

function articleSourceId(ref, rs) {
  // "CO 259a" + "RS 220" → "fedlex:rs220:co-259a"
  // Normalize: always ensure "rs" prefix, strip spaces
  let rsNorm = (rs || '').replace(/\s+/g, '').toLowerCase();
  if (rsNorm && !rsNorm.startsWith('rs')) rsNorm = 'rs' + rsNorm;
  const refNorm = ref.toLowerCase().replace(/\s+/g, '-');
  return `fedlex:${rsNorm}:${refNorm}`;
}

function arretSourceId(signature, tribunal) {
  // "4A_32/2018" + "TF" → "juris:tf:4a_32-2018"
  const trib = (tribunal || 'tf').toLowerCase();
  const sig = signature.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-');
  return `juris:${trib}:${sig}`;
}

function patternSourceId(domaine, index) {
  return `pattern:${domaine}:${index}`;
}

function antiErreurSourceId(domaine, index) {
  return `anti-erreur:${domaine}:${index}`;
}

function casPratiqueSourceId(domaine, index) {
  return `cas-pratique:${domaine}:${index}`;
}

function preuveSourceId(procedure) {
  const proc = (procedure || 'unknown').toLowerCase().replace(/\s+/g, '-');
  return `preuve:${proc}`;
}

function delaiSourceId(domaine, id) {
  const d = (domaine || 'general').toLowerCase();
  const i = (id || 'unknown').toLowerCase().replace(/\s+/g, '-');
  return `delai:${d}:${i}`;
}

// ─── Tier assignment logic ──────────────────────────────────────────

function classifyArticle(article) {
  // Articles from Fedlex = Tier 1 (binding law)
  if (article.lienFedlex) return 1;
  // Practice articles (texteSimple, no fedlex link) = Tier 3
  if (article.texteSimple && !article.lienFedlex) return 3;
  return 1; // default: law articles are Tier 1
}

function classifyArret(arret) {
  // Published TF decisions (ATF) = Tier 1
  if (arret.signature?.startsWith('ATF') || arret.publie) return 1;
  // TF decisions = Tier 2 (quasi-official)
  if (arret.tribunal === 'TF') return 2;
  // Cantonal court decisions = Tier 2
  return 2;
}

// ─── Freshness / validity ───────────────────────────────────────────

const STALE_THRESHOLD_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

function computeFreshness(dateStr) {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'unknown';
  const age = Date.now() - d.getTime();
  return age > STALE_THRESHOLD_MS ? 'stale' : 'current';
}

// ─── Registry builder ───────────────────────────────────────────────

let _registry = null;
let _lookupById = null;
let _lookupByRef = null;
let _lookupBySig = null;

export function buildSourceRegistry(data) {
  const allData = data || loadAllData();
  const entries = [];

  // 1. Articles of law → Tier 1 (or 3 for practice)
  // Deduplicate: same ref+rs can appear in multiple domain files
  const seenArticles = new Map();
  for (const art of allData.articles) {
    const id = articleSourceId(art.ref, art.rs);
    if (seenArticles.has(id)) {
      // Merge domains
      const existing = seenArticles.get(id);
      for (const d of (art.domaines || [])) {
        if (!existing.perimetre.includes(d)) existing.perimetre.push(d);
      }
      // Prefer fedlex version (tier 1) over practice version
      if (art.lienFedlex && !existing.lienFedlex) {
        existing.lienFedlex = art.lienFedlex;
        existing.tier = 1;
        existing.binding_strength = TIERS[1].binding_strength;
        existing.statut_validite = 'current';
      }
      continue;
    }
    const tier = classifyArticle(art);
    const entry = {
      source_id: id,
      type: 'article',
      tier,
      binding_strength: TIERS[tier].binding_strength,
      ref: art.ref,
      rs: art.rs,
      titre: art.titre,
      lienFedlex: art.lienFedlex || null,
      date: art.harvestDate || null,
      perimetre: [...(art.domaines || [])],
      statut_validite: art.lienFedlex ? 'current' : computeFreshness(art.harvestDate),
    };
    seenArticles.set(id, entry);
    entries.push(entry);
  }

  // 2. Jurisprudence → Tier 1 (ATF) or 2 (TF non publiés)
  // Deduplicate: same arrêt can appear in multiple domain files
  const seenArrets = new Set();
  for (const arret of allData.arrets) {
    const id = arretSourceId(arret.signature, arret.tribunal);
    if (seenArrets.has(id)) continue;
    seenArrets.add(id);
    const tier = classifyArret(arret);
    entries.push({
      source_id: id,
      type: 'arret',
      tier,
      binding_strength: TIERS[tier].binding_strength,
      signature: arret.signature,
      tribunal: arret.tribunal,
      date: arret.date || null,
      perimetre: arret.tags || [],
      statut_validite: computeFreshness(arret.date),
      resultat: arret.resultat || null,
      principeCle: arret.principeCle || null,
    });
  }

  // 3. Patterns praticien → Tier 3
  const patternsByDomaine = {};
  for (const p of allData.patterns) {
    const d = p.domaine || 'general';
    if (!patternsByDomaine[d]) patternsByDomaine[d] = 0;
    const idx = patternsByDomaine[d]++;
    entries.push({
      source_id: patternSourceId(d, idx),
      type: 'pattern',
      tier: 3,
      binding_strength: 'indicatif',
      titre: p.titre || p.situation || `Pattern ${d} #${idx}`,
      date: null,
      perimetre: [d],
      statut_validite: 'current',
    });
  }

  // 4. Anti-erreurs → Tier 3
  const aeByDomaine = {};
  for (const ae of allData.antiErreurs) {
    const d = ae.domaine || 'general';
    if (!aeByDomaine[d]) aeByDomaine[d] = 0;
    const idx = aeByDomaine[d]++;
    entries.push({
      source_id: antiErreurSourceId(d, idx),
      type: 'anti_erreur',
      tier: 3,
      binding_strength: 'indicatif',
      titre: ae.erreur || ae.titre || `Anti-erreur ${d} #${idx}`,
      date: null,
      perimetre: [d],
      statut_validite: 'current',
    });
  }

  // 5. Cas pratiques → Tier 3
  const cpByDomaine = {};
  for (const cp of allData.casPratiques) {
    const d = cp.domaine || 'general';
    if (!cpByDomaine[d]) cpByDomaine[d] = 0;
    const idx = cpByDomaine[d]++;
    entries.push({
      source_id: casPratiqueSourceId(d, idx),
      type: 'cas_pratique',
      tier: 3,
      binding_strength: 'indicatif',
      titre: cp.titre || cp.situation || `Cas ${d} #${idx}`,
      date: null,
      perimetre: [d],
      statut_validite: 'current',
    });
  }

  // 6. Preuves → Tier 3 (practice knowledge)
  for (const pr of allData.preuves) {
    entries.push({
      source_id: preuveSourceId(pr.procedure),
      type: 'preuve',
      tier: 3,
      binding_strength: 'indicatif',
      titre: pr.procedure || 'Preuve',
      date: null,
      perimetre: [pr.domaine || 'general'],
      statut_validite: 'current',
    });
  }

  // 7. Délais → Tier 1 (legal deadlines from law) or 3 (practice)
  for (const dl of allData.delais) {
    const hasArticle = !!dl.baseLegale || !!dl.base_legale || !!dl.article;
    const tier = hasArticle ? 1 : 3;
    entries.push({
      source_id: delaiSourceId(dl.domaine, dl.id || dl.procedure),
      type: 'delai',
      tier,
      binding_strength: TIERS[tier].binding_strength,
      titre: dl.procedure || dl.titre || 'Délai',
      baseLegale: dl.baseLegale || dl.base_legale || dl.article || null,
      date: null,
      perimetre: [dl.domaine || 'general'],
      statut_validite: 'current',
    });
  }

  // Build lookup indexes
  _lookupById = new Map(entries.map(e => [e.source_id, e]));
  _lookupByRef = new Map();
  _lookupBySig = new Map();
  for (const e of entries) {
    if (e.type === 'article' && e.ref) _lookupByRef.set(e.ref, e);
    if (e.type === 'arret' && e.signature) _lookupBySig.set(e.signature, e);
  }

  _registry = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    tiers: TIERS,
    totalSources: entries.length,
    byTier: {
      1: entries.filter(e => e.tier === 1).length,
      2: entries.filter(e => e.tier === 2).length,
      3: entries.filter(e => e.tier === 3).length,
    },
    byType: countBy(entries, 'type'),
    entries,
  };

  return _registry;
}

function countBy(arr, key) {
  const counts = {};
  for (const item of arr) {
    const v = item[key] || 'unknown';
    counts[v] = (counts[v] || 0) + 1;
  }
  return counts;
}

// ─── Public API ─────────────────────────────────────────────────────

export function getRegistry() {
  if (!_registry) buildSourceRegistry();
  return _registry;
}

export function getSourceById(sourceId) {
  if (!_registry) buildSourceRegistry();
  return _lookupById.get(sourceId) || null;
}

export function getSourceByRef(ref) {
  if (!_registry) buildSourceRegistry();
  const direct = _lookupByRef.get(ref);
  if (direct) return direct;
  // Fallback RS Fedlex : si la ref matche un préfixe connu (CO, CC, LP, LAA, …),
  // construire dynamiquement un source_id au format fedlex:rsXXX:xxx
  return resolveByPrefix(ref);
}

/**
 * Table des recueils systématiques Fedlex (code → {rs, titre, tier, scope}).
 * Étendue progressivement selon les refs rencontrées dans les fiches.
 */
export const RS_BY_PREFIX = Object.freeze({
  // Codes civils et obligations
  CC: { rs: '210', titre: 'Code civil suisse', tier: 1, scope: 'CH' },
  CO: { rs: '220', titre: 'Code des obligations', tier: 1, scope: 'CH' },
  CP: { rs: '311.0', titre: 'Code pénal suisse', tier: 1, scope: 'CH' },
  CPP: { rs: '312.0', titre: 'Code de procédure pénale', tier: 1, scope: 'CH' },
  CPC: { rs: '272', titre: 'Code de procédure civile', tier: 1, scope: 'CH' },
  CST: { rs: '101', titre: 'Constitution fédérale', tier: 1, scope: 'CH' },
  // Poursuites et faillites
  LP: { rs: '281.1', titre: 'Loi fédérale sur la poursuite pour dettes et la faillite', tier: 1, scope: 'CH' },
  // Assurances sociales
  LPGA: { rs: '830.1', titre: 'Loi fédérale partie générale assurances sociales', tier: 1, scope: 'CH' },
  LAA: { rs: '832.20', titre: 'Loi fédérale sur l\'assurance-accidents', tier: 1, scope: 'CH' },
  OLAA: { rs: '832.202', titre: 'Ordonnance sur l\'assurance-accidents', tier: 1, scope: 'CH' },
  LAI: { rs: '831.20', titre: 'Loi fédérale sur l\'assurance-invalidité', tier: 1, scope: 'CH' },
  RAI: { rs: '831.201', titre: 'Règlement sur l\'assurance-invalidité', tier: 1, scope: 'CH' },
  LAMal: { rs: '832.10', titre: 'Loi fédérale sur l\'assurance-maladie', tier: 1, scope: 'CH' },
  LAVS: { rs: '831.10', titre: 'Loi fédérale sur l\'assurance-vieillesse et survivants', tier: 1, scope: 'CH' },
  LPC: { rs: '831.30', titre: 'Loi fédérale sur les prestations complémentaires', tier: 1, scope: 'CH' },
  LAPG: { rs: '834.1', titre: 'Loi fédérale sur les allocations pour perte de gain', tier: 1, scope: 'CH' },
  LAFam: { rs: '836.2', titre: 'Loi fédérale sur les allocations familiales', tier: 1, scope: 'CH' },
  LACI: { rs: '837.0', titre: 'Loi fédérale sur l\'assurance-chômage', tier: 1, scope: 'CH' },
  LPP: { rs: '831.40', titre: 'Loi fédérale sur la prévoyance professionnelle', tier: 1, scope: 'CH' },
  // Étrangers & asile
  LAsi: { rs: '142.31', titre: 'Loi sur l\'asile', tier: 1, scope: 'CH' },
  LEI: { rs: '142.20', titre: 'Loi fédérale sur les étrangers et l\'intégration', tier: 1, scope: 'CH' },
  LN: { rs: '141.0', titre: 'Loi sur la nationalité suisse', tier: 1, scope: 'CH' },
  // Aide aux victimes
  LAVI: { rs: '312.5', titre: 'Loi fédérale sur l\'aide aux victimes d\'infractions', tier: 1, scope: 'CH' },
  // Circulation & contrats
  LCR: { rs: '741.01', titre: 'Loi sur la circulation routière', tier: 1, scope: 'CH' },
  OCR: { rs: '741.11', titre: 'Ordonnance sur les règles de la circulation routière', tier: 1, scope: 'CH' },
  LAO: { rs: '741.03', titre: 'Loi fédérale sur les amendes d\'ordre', tier: 1, scope: 'CH' },
  OAO: { rs: '741.031', titre: 'Ordonnance sur les amendes d\'ordre', tier: 1, scope: 'CH' },
  OETV: { rs: '741.41', titre: 'Ordonnance concernant les exigences techniques requises pour les véhicules', tier: 1, scope: 'CH' },
  LCA: { rs: '221.229.1', titre: 'Loi fédérale sur le contrat d\'assurance', tier: 1, scope: 'CH' },
  LTr: { rs: '822.11', titre: 'Loi fédérale sur le travail', tier: 1, scope: 'CH' },
  LEg: { rs: '151.1', titre: 'Loi fédérale sur l\'égalité', tier: 1, scope: 'CH' },
  LPD: { rs: '235.1', titre: 'Loi fédérale sur la protection des données', tier: 1, scope: 'CH' },
  LCD: { rs: '241', titre: 'Loi fédérale contre la concurrence déloyale', tier: 1, scope: 'CH' },
  LDIP: { rs: '291', titre: 'Loi fédérale sur le droit international privé', tier: 1, scope: 'CH' },
  // Cantonal / pratique (pas un RS Fedlex, mais on reconnaît)
  LASV: { rs: 'vd.lasv', titre: 'Loi vaudoise sur l\'action sociale', tier: 1, scope: 'VD' },
  LIASI: { rs: 'ge.liasi', titre: 'Loi genevoise sur l\'insertion et l\'aide sociale individuelle', tier: 1, scope: 'GE' },
  LVLAMal: { rs: 'vd.lvlamal', titre: 'Loi vaudoise d\'application LAMal', tier: 1, scope: 'VD' },
  CSIAS: { rs: 'csias', titre: 'Normes CSIAS (Conférence suisse des institutions d\'action sociale)', tier: 3, scope: 'CH' }
});

/** Extrait le préfixe d'une ref type "CO 259a" → "CO". */
export function extractPrefix(ref) {
  if (!ref || typeof ref !== 'string') return null;
  const m = ref.trim().match(/^([A-Z][A-Za-z]*)\s/);
  return m ? m[1] : null;
}

/**
 * Résout dynamiquement une ref via le préfixe RS. Retourne null si préfixe
 * inconnu. Le source_id généré est stable : fedlex:rs{RS}:{slug-ref}.
 */
export function resolveByPrefix(ref) {
  const prefix = extractPrefix(ref);
  if (!prefix) return null;
  const entry = RS_BY_PREFIX[prefix];
  if (!entry) return null;
  // Slug : "CO 259a" → "co-259a"
  const slug = ref.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w.\-:]/g, '');
  return {
    source_id: `fedlex:rs${entry.rs}:${slug}`,
    ref,
    titre: entry.titre,
    tier: entry.tier,
    scope: entry.scope,
    resolvedBy: 'prefix_fallback'
  };
}

export function getSourceBySignature(sig) {
  if (!_registry) buildSourceRegistry();
  return _lookupBySig.get(sig) || null;
}

export function getSourcesForArticleRef(ref) {
  return getSourceByRef(ref);
}

export function getSourcesForArretSignature(sig) {
  return getSourceBySignature(sig);
}

/**
 * Resolve a list of source_ids to full source entries.
 * Returns { resolved, missing } — missing = source_ids not found.
 */
export function resolveSources(sourceIds) {
  if (!_registry) buildSourceRegistry();
  const resolved = [];
  const missing = [];
  for (const id of sourceIds) {
    const entry = _lookupById.get(id);
    if (entry) resolved.push(entry);
    else missing.push(id);
  }
  return { resolved, missing };
}

/**
 * Validate a claim's source references.
 * Returns { valid, issues } for pipeline V3 claim verification.
 */
export function validateClaimSources(sourceIds) {
  if (!_registry) buildSourceRegistry();
  const issues = [];
  let hasBinding = false;

  for (const id of sourceIds) {
    const entry = _lookupById.get(id);
    if (!entry) {
      issues.push({ source_id: id, issue: 'source_not_found' });
      continue;
    }
    if (entry.statut_validite === 'stale') {
      issues.push({ source_id: id, issue: 'stale_source', date: entry.date });
    }
    if (entry.tier === 1) hasBinding = true;
  }

  if (!hasBinding && sourceIds.length > 0) {
    issues.push({ issue: 'no_binding_source', message: 'Aucune source Tier 1 (contraignante) ne soutient ce claim' });
  }

  return {
    valid: issues.length === 0,
    hasBindingSource: hasBinding,
    issues,
  };
}

/**
 * Get sources by tier (for pipeline dossier builder).
 */
export function getSourcesByTier(tier) {
  if (!_registry) buildSourceRegistry();
  return _registry.entries.filter(e => e.tier === tier);
}

/**
 * Get sources by domain.
 */
export function getSourcesByDomain(domaine) {
  if (!_registry) buildSourceRegistry();
  return _registry.entries.filter(e =>
    e.perimetre.includes(domaine)
  );
}

/**
 * Registry stats summary (for /api/sources/stats).
 */
export function getRegistryStats() {
  const reg = getRegistry();
  const staleCount = reg.entries.filter(e => e.statut_validite === 'stale').length;
  const unknownCount = reg.entries.filter(e => e.statut_validite === 'unknown').length;
  return {
    version: reg.version,
    generatedAt: reg.generatedAt,
    totalSources: reg.totalSources,
    byTier: reg.byTier,
    byType: reg.byType,
    freshness: {
      current: reg.totalSources - staleCount - unknownCount,
      stale: staleCount,
      unknown: unknownCount,
    },
    tiers: reg.tiers,
  };
}

// ─── ID generation exports (for other modules) ─────────────────────

export { articleSourceId, arretSourceId };
