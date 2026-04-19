/**
 * cantonal-juris-matcher.mjs — Matche les décisions cantonales ingérées depuis
 * entscheidsuche.ch avec les fiches citoyennes.
 *
 * Distinct de `enrich-with-corpus-jurisprudence.mjs` (qui matche la base TF).
 * Ici on expose aux citoyens un corpus cantonal typiquement invisible :
 *   "5 décisions VD de 1ère instance similaires à votre cas sur 2020-2024"
 *
 * Critères de match :
 *   - même domaine
 *   - même canton (prioritaire) ou CH (fallback)
 *   - articles en commun avec la fiche (≥ 1)
 *   - score = articles_partagés × 5 + canton_match × 3 + tags_match × 2
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CANTONAL_DIR = join(ROOT, 'src/data/jurisprudence-cantonale');

let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function loadCantonalCorpus() {
  if (_cache && (Date.now() - _cacheAt) < CACHE_TTL_MS) return _cache;
  const all = [];
  if (!existsSync(CANTONAL_DIR)) { _cache = []; _cacheAt = Date.now(); return _cache; }
  for (const f of readdirSync(CANTONAL_DIR).filter(x => x.endsWith('.json'))) {
    try {
      const arr = JSON.parse(readFileSync(join(CANTONAL_DIR, f), 'utf8'));
      if (Array.isArray(arr)) all.push(...arr);
    } catch { /* skip */ }
  }
  _cache = all;
  _cacheAt = Date.now();
  return _cache;
}

function scoreMatch(fiche, decision, citoyenCanton = null) {
  let score = 0;

  // 1. Domaine (obligatoire pour compter)
  if (!decision.domaine || decision.domaine !== fiche.domaine) return 0;

  // 2. Canton — priorité au canton du citoyen > canton de la fiche > autre
  if (citoyenCanton && decision.canton === citoyenCanton) score += 5;
  else if (decision.canton) score += 2; // canton différent mais cantonal = mieux que rien

  // 3. Articles partagés
  const ficheArticles = new Set(((fiche.reponse && fiche.reponse.articles) || [])
    .map(a => String(a.ref || '').toLowerCase().trim())
    .filter(Boolean));
  const decArticles = new Set((decision.references || [])
    .map(r => String(r).toLowerCase().trim()));
  let articlesShared = 0;
  for (const a of ficheArticles) if (decArticles.has(a)) articlesShared++;
  score += articlesShared * 5;

  // 4. Tags
  const ficheTags = new Set((fiche.tags || []).map(t => String(t).toLowerCase()));
  const decTitleLower = (decision.title || '').toLowerCase();
  const decSummaryLower = (decision.summary || '').toLowerCase();
  let tagsMatched = 0;
  for (const tag of ficheTags) {
    if (decTitleLower.includes(tag) || decSummaryLower.includes(tag)) tagsMatched++;
  }
  score += tagsMatched * 2;

  return score;
}

/**
 * Retourne les N meilleures décisions cantonales pour une fiche donnée.
 * @param {object} fiche
 * @param {object} [opts]
 * @param {string} [opts.canton] — canton du citoyen pour prioriser
 * @param {number} [opts.limit=5]
 * @param {number} [opts.minScore=3]
 */
export function findCantonalMatches(fiche, opts = {}) {
  const { canton = null, limit = 5, minScore = 3 } = opts;
  if (!fiche || !fiche.domaine) return [];
  const corpus = loadCantonalCorpus();
  const candidates = corpus
    .map(d => ({ decision: d, score: scoreMatch(fiche, d, canton) }))
    .filter(c => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return candidates.map(c => ({
    ...c.decision,
    match_score: c.score
  }));
}

export function getCantonalCorpusStats() {
  const corpus = loadCantonalCorpus();
  const byCanton = {};
  const byDomaine = {};
  for (const d of corpus) {
    if (d.canton) byCanton[d.canton] = (byCanton[d.canton] || 0) + 1;
    if (d.domaine) byDomaine[d.domaine] = (byDomaine[d.domaine] || 0) + 1;
  }
  return { total: corpus.length, by_canton: byCanton, by_domaine: byDomaine };
}

export function _resetCacheForTests() { _cache = null; _cacheAt = 0; }
