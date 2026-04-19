#!/usr/bin/env node
/**
 * mark-information-only.mjs — Marque les fiches "informatives" pour review.
 *
 * Certaines fiches expliquent une loi/institution de manière générale
 * sans avoir de délai procédural direct (ex : "qu'est-ce que la LAA ?").
 * Les marquer `information_only: true` les exempte du critère "délai requis"
 * dans le review Claude.
 *
 * Critères pour marquer information_only :
 *   - Pas de délai structuré ni cascade
 *   - Explication ≥ 400 chars ET ≥ 2 articles ET ≥ 1 jurisprudence
 *   - Titre/tags suggèrent information générale (pas de "contestation", "opposition", "recours", "plainte", "mise en demeure", "dénoncer")
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FICHES_DIR = join(ROOT, 'src/data/fiches');
const DRY_RUN = process.argv.includes('--dry-run');

const ACTION_KEYWORDS = /contestation|opposition|recours|plainte|mise\s*en\s*demeure|d[ée]noncer|r[ée]silier|r[ée]clam|demander|saisir/i;

function hasDelaiSomewhere(fiche) {
  const delais = (fiche.reponse && fiche.reponse.delais) || fiche.delais || [];
  if (delais.length > 0) return true;
  const cascades = fiche.cascades || [];
  return cascades.some(c => (c.etapes || []).some(e => e.delai));
}

function shouldMarkInformationOnly(fiche) {
  if (fiche.information_only) return false; // déjà marqué
  if (hasDelaiSomewhere(fiche)) return false;
  const exp = (fiche.reponse && fiche.reponse.explication) || '';
  const articles = (fiche.reponse && fiche.reponse.articles) || [];
  const juris = (fiche.reponse && fiche.reponse.jurisprudence) || [];
  if (exp.length < 400 || articles.length < 2 || juris.length < 1) return false;
  // Si le titre/id/tags évoquent une action procédurale, ne pas marquer info-only
  const sig = [fiche.id, ...(fiche.tags || [])].join(' ').toLowerCase();
  if (ACTION_KEYWORDS.test(sig)) return false;
  // Si l'explication elle-même est orientée action
  if (ACTION_KEYWORDS.test(exp)) return false;
  return true;
}

function main() {
  const files = readdirSync(FICHES_DIR).filter(f => f.endsWith('.json'));
  let total = 0, marked = 0;
  const byDomain = {};

  for (const f of files) {
    const path = join(FICHES_DIR, f);
    const arr = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    let domainMarked = 0;

    for (const fiche of arr) {
      total++;
      if (shouldMarkInformationOnly(fiche)) {
        fiche.information_only = true;
        marked++;
        domainMarked++;
        touched = true;
      }
    }

    byDomain[f.replace('.json', '')] = { total: arr.length, marked: domainMarked };
    if (touched && !DRY_RUN) {
      writeFileSync(path, JSON.stringify(arr, null, 2) + '\n', 'utf8');
    }
  }

  console.log(`[mark-info-only] ${marked}/${total} fiches marquées information_only`);
  for (const [d, s] of Object.entries(byDomain)) {
    if (s.marked > 0) console.log(`  ${d}: ${s.marked}/${s.total}`);
  }
  if (DRY_RUN) console.log(`[mark-info-only] DRY-RUN : aucune fiche modifiée`);
  return { total, marked, byDomain };
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes('mark-information-only')) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}

export { main, shouldMarkInformationOnly };
