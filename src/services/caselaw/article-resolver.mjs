/**
 * article-resolver.mjs — Extrait et résout les références d'articles dans une
 * décision canonique.
 *
 * Entrée : DecisionCanonical.references_raw + abstract + text_excerpt
 * Sortie : article_refs_resolved[] avec source_id Fedlex, ref normalisée, tier
 *
 * Utilise source-registry.mjs (via getSourceByRef + fallback RS) pour obtenir
 * le source_id canonique au format fedlex:rsXXX:xxx.
 */

import { getSourceByRef } from '../source-registry.mjs';

// Regex pour les refs dans du texte libre
const INLINE_REFS = [
  /\b(CO|CC|LP|LAA|LAI|LAMal|LAsi|LEI|LN|LAVS|LACI|LAFam|LAPG|LPP|LPC|LAVI|LCR|LCA|LCD|LTr|LEg|LPD|LDIP|CP|CPP|CPC|CST|OCR|OAO|LAO|OLAA|RAI)\s*(\d+[a-z]*)(?:\s*al\.?\s*(\d+))?/gi
];

const COMMON_PREFIXES = new Set([
  'CO','CC','LP','LAA','LAI','LAMal','LAsi','LEI','LN','LAVS','LACI','LAFam','LAPG','LPP','LPC','LAVI','LCR','LCA','LCD','LTr','LEg','LPD','LDIP','CP','CPP','CPC','CST','OCR','OAO','LAO','OLAA','RAI'
]);

function normalizeRef(prefix, num, alinea) {
  const n = String(num).toLowerCase().replace(/\s+/g, '');
  if (alinea) return `${prefix} ${n} al. ${alinea}`;
  return `${prefix} ${n}`;
}

function extractFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const out = [];
  for (const re of INLINE_REFS) {
    const matches = [...text.matchAll(re)];
    for (const m of matches) {
      const prefix = m[1].toUpperCase();
      if (!COMMON_PREFIXES.has(prefix)) continue;
      out.push({
        ref: normalizeRef(prefix, m[2]),
        ref_with_alinea: m[3] ? normalizeRef(prefix, m[2], m[3]) : null,
        prefix,
        article_num: m[2]
      });
    }
  }
  return out;
}

function fromRawReferences(refs = []) {
  const out = [];
  for (const r of refs) {
    if (!r) continue;
    if (typeof r === 'string') {
      // Parse string like "CO 259a" or "art. 259a CO"
      const cleaned = r.trim().replace(/^art\.?\s*/i, '');
      // Try "PREFIX NUM" pattern
      const m1 = cleaned.match(/^([A-Z][A-Za-z]*)\s+(\d+[a-z]*)/);
      if (m1 && COMMON_PREFIXES.has(m1[1].toUpperCase())) {
        out.push({ ref: normalizeRef(m1[1].toUpperCase(), m1[2]), prefix: m1[1].toUpperCase(), article_num: m1[2] });
        continue;
      }
      // Try "NUM PREFIX" pattern (ex: "259a CO")
      const m2 = cleaned.match(/^(\d+[a-z]*)\s+([A-Z][A-Za-z]*)/);
      if (m2 && COMMON_PREFIXES.has(m2[2].toUpperCase())) {
        out.push({ ref: normalizeRef(m2[2].toUpperCase(), m2[1]), prefix: m2[2].toUpperCase(), article_num: m2[1] });
        continue;
      }
    } else if (typeof r === 'object' && r.ref) {
      // Already normalized somewhere upstream
      out.push({ ref: r.ref, prefix: r.prefix || null, article_num: r.article_num || null });
    }
  }
  return out;
}

function dedupeRefs(list) {
  const seen = new Set();
  const out = [];
  for (const r of list) {
    const key = r.ref.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/**
 * Résout les articles d'une décision canonique.
 * Retourne la décision enrichie avec `article_refs_resolved[]`.
 */
export function resolveArticlesForDecision(decision) {
  const fromRefs = fromRawReferences(decision.references_raw || []);
  const fromAbstract = extractFromText(decision.abstract);
  const fromExcerpt = extractFromText(decision.text_excerpt);
  const fromTitle = extractFromText(decision.title);

  const merged = dedupeRefs([...fromRefs, ...fromAbstract, ...fromExcerpt, ...fromTitle]);

  const resolved = [];
  for (const r of merged) {
    let source;
    try { source = getSourceByRef(r.ref); } catch { source = null; }
    resolved.push({
      ref: r.ref,
      prefix: r.prefix,
      article_num: r.article_num,
      source_id: source?.source_id || null,
      source_tier: source?.tier || null,
      source_title: source?.titre || null,
      resolved: !!source?.source_id
    });
  }

  const resolvedCount = resolved.filter(x => x.resolved).length;
  const resolutionPct = resolved.length ? Math.round((resolvedCount / resolved.length) * 100) : 0;

  return {
    ...decision,
    article_refs_resolved: resolved,
    article_refs_count: resolved.length,
    article_refs_resolution_pct: resolutionPct
  };
}

export { extractFromText, fromRawReferences, dedupeRefs };
