/**
 * Vulgarisation Loader — Enrichit les fiches avec du contenu citoyen
 *
 * Sources : ASLOCA Kit, guidesocial.ch, ch.ch, etc.
 * Chaque entrée de vulgarisation est liée à 1+ fiches existantes.
 * Le contenu n'est JAMAIS généré par le LLM — il vient de sources vérifiées.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vulgarisationDir = join(__dirname, '..', 'data', 'vulgarisation');

let _cache = null;

/**
 * Load all vulgarisation entries from all source files.
 */
export function loadVulgarisation() {
  if (_cache) return _cache;

  const entries = [];

  if (!existsSync(vulgarisationDir)) return { entries: [], byFiche: {}, bySource: {} };

  const files = readdirSync(vulgarisationDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(vulgarisationDir, file), 'utf-8'));
      const items = Array.isArray(data) ? data : [data];
      entries.push(...items);
    } catch (e) {
      console.error(`vulgarisation: failed to load ${file}: ${e.message}`);
    }
  }

  // Index by fiche ID for fast lookup
  const byFiche = {};
  for (const entry of entries) {
    for (const ficheId of (entry.fiches_liees || [])) {
      if (!byFiche[ficheId]) byFiche[ficheId] = [];
      byFiche[ficheId].push(entry);
    }
  }

  // Index by source
  const bySource = {};
  for (const entry of entries) {
    const src = entry.source_id || 'unknown';
    if (!bySource[src]) bySource[src] = [];
    bySource[src].push(entry);
  }

  _cache = { entries, byFiche, bySource };
  return _cache;
}

/**
 * Get vulgarisation content for a specific fiche.
 * Returns citizen-friendly Q&As, anti-erreurs, and deadlines.
 */
export function getVulgarisationForFiche(ficheId) {
  const { byFiche } = loadVulgarisation();
  const entries = byFiche[ficheId] || [];

  if (entries.length === 0) return null;

  return {
    ficheId,
    questions_citoyennes: entries.map(e => ({
      question: e.question,
      reponse_courte: e.reponse_courte,
      reponse_detail: e.reponse_detail,
      source: e.source_id,
      numero: e.numero,
    })),
    anti_erreurs: entries.flatMap(e => (e.anti_erreurs || []).map(ae => ({
      erreur: ae,
      source: e.source_id,
      question_ref: e.numero,
    }))),
    delais: entries
      .filter(e => e.delai)
      .map(e => ({
        delai: e.delai,
        contexte: e.question,
        source: e.source_id,
      })),
    articles_cles: [...new Set(entries.flatMap(e => e.articles_cles || []))],
  };
}

/**
 * Get all vulgarisation entries for a domaine.
 */
export function getVulgarisationByDomaine(domaine) {
  const { entries } = loadVulgarisation();
  return entries.filter(e => e.domaine === domaine);
}

/**
 * Get stats about vulgarisation coverage.
 */
export function getVulgarisationStats() {
  const { entries, byFiche, bySource } = loadVulgarisation();

  return {
    total_entries: entries.length,
    sources: Object.entries(bySource).map(([id, items]) => ({
      source_id: id,
      count: items.length,
      domaines: [...new Set(items.map(i => i.domaine))],
    })),
    fiches_enrichies: Object.keys(byFiche).length,
    total_anti_erreurs: entries.reduce((sum, e) => sum + (e.anti_erreurs?.length || 0), 0),
    total_delais: entries.filter(e => e.delai).length,
    domaines: [...new Set(entries.map(e => e.domaine))],
  };
}

/**
 * Clear cache (for testing).
 */
export function clearVulgarisationCache() {
  _cache = null;
}
