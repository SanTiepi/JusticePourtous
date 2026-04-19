#!/usr/bin/env node
/**
 * enrich-with-corpus-jurisprudence.mjs — Enrichit les fiches avec les arrêts
 * du corpus jurisprudence existant (src/data/jurisprudence/index-*.json).
 *
 * Ne fabrique RIEN : copie des références déjà indexées et vérifiées.
 * Matche par tags + keywords entre fiche et arrêt.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FICHES_DIR = join(ROOT, 'src/data/fiches');
const JURIS_DIR = join(ROOT, 'src/data/jurisprudence');
const DRY_RUN = process.argv.includes('--dry-run');

function loadCorpusByDomain() {
  const byDomain = {};
  if (!existsSync(JURIS_DIR)) return byDomain;
  for (const f of readdirSync(JURIS_DIR).filter(x => x.endsWith('.json'))) {
    const m = f.match(/^index-([a-z]+)\.json$/);
    if (!m) continue;
    const domaine = m[1];
    try {
      const arr = JSON.parse(readFileSync(join(JURIS_DIR, f), 'utf8'));
      byDomain[domaine] = Array.isArray(arr) ? arr : [];
    } catch { byDomain[domaine] = []; }
  }
  return byDomain;
}

function scoreMatch(arret, fiche) {
  const fTags = new Set((fiche.tags || []).map(t => String(t).toLowerCase()));
  const aTags = new Set((arret.tags || []).map(t => String(t).toLowerCase()));
  let score = 0;
  for (const t of fTags) if (aTags.has(t)) score += 3;
  // Match articles
  const fArticles = new Set(((fiche.reponse && fiche.reponse.articles) || []).map(a => String(a.ref || '').toLowerCase()));
  const aArticles = new Set((arret.articlesAppliques || []).map(x => String(x).toLowerCase()));
  for (const a of fArticles) if (aArticles.has(a)) score += 5;
  // Match sousDomaine dans theme
  const sub = String(fiche.sousDomaine || '').toLowerCase();
  if (sub && String(arret.theme || '').toLowerCase().includes(sub)) score += 2;
  return score;
}

function alreadyCited(fiche, signature) {
  const existing = (fiche.reponse && fiche.reponse.jurisprudence) || [];
  return existing.some(j => String(j.signature || j.ref || '').toLowerCase() === String(signature).toLowerCase());
}

function enrichFiche(fiche, corpusByDomain) {
  const jurisprudence = (fiche.reponse && fiche.reponse.jurisprudence) || [];
  if (jurisprudence.length >= 2) return { touched: false, added: 0 };
  const domain = fiche.domaine;
  const corpus = corpusByDomain[domain] || [];
  if (corpus.length === 0) return { touched: false, added: 0 };

  // Scorer tous les arrêts du domaine, prendre les top qui ne sont pas déjà cités
  const candidates = corpus
    .filter(a => a.signature && !alreadyCited(fiche, a.signature))
    .map(a => ({ arret: a, score: scoreMatch(a, fiche) }))
    .filter(c => c.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2 - jurisprudence.length);

  if (candidates.length === 0) return { touched: false, added: 0 };

  const toAdd = candidates.map(c => ({
    signature: c.arret.signature,
    tribunal: c.arret.tribunal || 'TF',
    date: c.arret.date || null,
    resume: c.arret.resume || c.arret.theme || '',
    role: c.arret.resultat?.includes('favorable') ? 'favorable'
         : c.arret.resultat?.includes('defavorable') ? 'defavorable' : 'neutre',
    resultat: c.arret.resultat || null,
    from_corpus: true,
    match_score: c.score
  }));

  fiche.reponse = fiche.reponse || {};
  fiche.reponse.jurisprudence = [...jurisprudence, ...toAdd];
  return { touched: true, added: toAdd.length };
}

function main() {
  const corpusByDomain = loadCorpusByDomain();
  let total = 0, enriched = 0, added = 0;
  const byDomain = {};

  for (const f of readdirSync(FICHES_DIR).filter(x => x.endsWith('.json'))) {
    const path = join(FICHES_DIR, f);
    const arr = JSON.parse(readFileSync(path, 'utf8'));
    let fileTouched = false;
    let dEnriched = 0, dAdded = 0;

    for (const fiche of arr) {
      total++;
      const res = enrichFiche(fiche, corpusByDomain);
      if (res.touched) {
        enriched++;
        dEnriched++;
        added += res.added;
        dAdded += res.added;
        fileTouched = true;
      }
    }

    byDomain[f.replace('.json', '')] = {
      total: arr.length,
      enriched: dEnriched,
      added: dAdded
    };
    if (fileTouched && !DRY_RUN) {
      writeFileSync(path, JSON.stringify(arr, null, 2) + '\n', 'utf8');
    }
  }

  console.log(`[corpus-juris] ${enriched} fiches enrichies, +${added} arrêts au total (${total} fiches au total)`);
  for (const [d, s] of Object.entries(byDomain)) {
    if (s.enriched > 0) console.log(`  ${d}: ${s.enriched} fiches, +${s.added} arrêts`);
  }
  if (DRY_RUN) console.log('[corpus-juris] DRY-RUN — aucune fiche modifiée');
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes('enrich-with-corpus-jurisprudence')) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}

export { main, enrichFiche };
