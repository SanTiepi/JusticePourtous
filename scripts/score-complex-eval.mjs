/**
 * score-complex-eval.mjs — Scoring HARM-WEIGHTED de l'éval triage cas complexes.
 *
 * Recadrage Codex (2026-05-31) : « ≥1 fiche pertinente » ne suffit pas si la fiche MANQUÉE
 * porte un enjeu grave. On ne vise pas un recall abstrait — on vise 0 OMISSION DANGEREUSE.
 *
 * Lit les sorties d'éval figées (docs/eval/complex-eval-2026-05-31.json — produites par
 * run-complex-eval.mjs) + les cas (test/complex-cases.mjs) + le jury d'expansion (optionnel)
 * et produit des métriques reproductibles :
 *   - critical_omission : fiche attendue manquée portant délai péremptoire / sécurité /
 *                         recours / séjour (étrangers) / poursuite (dettes)
 *   - benign_omission   : fiche secondaire informative manquée (sans enjeu grave)
 *   - harmful_noise     : fiche AJOUTÉE hors-faits (jugée non pertinente par le jury)
 *   - au_moins_une      : cas avec ≥1 fiche pertinente trouvée (filet plancher)
 *
 * Usage : node scripts/score-complex-eval.mjs [--eval <json>] [--judged <json>] [--out <json>]
 */
import { queryComplete } from '../src/services/knowledge-engine.mjs';
import { isPeremptoire } from '../src/services/triage-engine.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const EVAL = flag('--eval', join(ROOT, 'docs/eval/complex-eval-2026-05-31.json'));
const JUDGED = flag('--judged', join(ROOT, 'docs/eval/expansion-judged-2026-05-31.json'));
const OUT = flag('--out', join(ROOT, 'docs/eval/harm-weighted-score.json'));

// Domaines à fort enjeu (omission = potentiellement dangereuse).
const HARM_DOMAINS = {
  etrangers: 'séjour',      // perte de permis / renvoi
  dettes: 'poursuite',      // commandement de payer, saisie, délai d'opposition 10j
  violence: 'sécurité',     // danger pour la personne
};
// Signaux "recours / voie de droit" dans l'id ou les tags (délai souvent péremptoire).
const RECOURS_RE = /recours|opposition|contestation|conteste|renvoi|expulsion|appel|reclamation|réclamation|plainte/i;

/**
 * Classe une fiche MANQUÉE : 'critical' (enjeu grave) ou 'benign' (informatif secondaire).
 * Critères transparents : délai péremptoire OU domaine à fort enjeu OU voie de recours.
 */
function classifyMiss(ficheId) {
  const c = queryComplete(ficheId);
  if (c.status !== 200) return { harm: 'benign', raison: 'fiche introuvable' };
  const f = c.data.fiche;
  const delais = c.data.delais || [];
  const cascade = f.reponse?.delais || [];
  // 1. Délai péremptoire (perte de droit)
  const peremptoire = [...delais, ...cascade].some(d => isPeremptoire(d.consequence, d.attention, d.delai));
  if (peremptoire) return { harm: 'critical', raison: 'délai péremptoire', domaine: f.domaine };
  // 2. Domaine à fort enjeu
  if (HARM_DOMAINS[f.domaine]) return { harm: 'critical', raison: HARM_DOMAINS[f.domaine], domaine: f.domaine };
  // 3. Voie de recours (id ou tags)
  const blob = `${ficheId} ${(f.tags || []).join(' ')}`;
  if (RECOURS_RE.test(blob)) return { harm: 'critical', raison: 'voie de recours', domaine: f.domaine };
  return { harm: 'benign', raison: 'informatif secondaire', domaine: f.domaine };
}

// ── Charge cas + éval ─────────────────────────────────────────
const casesUrl = pathToFileURL(join(ROOT, 'test/complex-cases.mjs')).href;
const { COMPLEX_CASES } = await import(casesUrl);
const caseById = new Map(COMPLEX_CASES.map(c => [c.id, c]));
const runs = JSON.parse(readFileSync(EVAL, 'utf8'));

const report = [];
const tally = { critical_omission: 0, benign_omission: 0, expected_total: 0, found_total: 0, cases_with_one: 0, cases_multi: 0 };
const criticalByClass = {};

for (const run of runs) {
  const c = caseById.get(run.case?.id) || run.case;
  if (!c || !Array.isArray(c.expected_fiches) || c.expected_fiches.length < 2) continue;
  tally.cases_multi++;
  const navFound = new Set(run.nav?.fiches_pertinentes || []);
  const found = c.expected_fiches.filter(f => navFound.has(f));
  const missing = c.expected_fiches.filter(f => !navFound.has(f));
  if (found.length > 0) tally.cases_with_one++;
  tally.expected_total += c.expected_fiches.length;
  tally.found_total += found.length;
  const missClassified = missing.map(id => ({ id, ...classifyMiss(id) }));
  for (const m of missClassified) {
    if (m.harm === 'critical') { tally.critical_omission++; criticalByClass[m.raison] = (criticalByClass[m.raison] || 0) + 1; }
    else tally.benign_omission++;
  }
  report.push({ id: c.id, category: c.category, expected: c.expected_fiches, found, missing: missClassified });
}

// ── harmful_noise depuis le jury d'expansion (si présent) ─────
let noise = null;
if (existsSync(JUDGED)) {
  const judged = JSON.parse(readFileSync(JUDGED, 'utf8')).filter(o => o.relevant !== null);
  const harmful = judged.filter(o => o.relevant === false).length;
  noise = { total_additions: judged.length, harmful, harmful_pct: Math.round((100 * harmful) / judged.length) };
}

const summary = {
  cases_multi: tally.cases_multi,
  au_moins_une_fiche_pertinente: `${tally.cases_with_one}/${tally.cases_multi}`,
  recall_brut: `${tally.found_total}/${tally.expected_total} (${Math.round((100 * tally.found_total) / tally.expected_total)}%)`,
  critical_omission: tally.critical_omission,
  benign_omission: tally.benign_omission,
  critical_par_classe: criticalByClass,
  harmful_noise: noise,
};

writeFileSync(OUT, JSON.stringify({ summary, report }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log(`\n[score] écrit ${OUT}`);
