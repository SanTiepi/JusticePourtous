#!/usr/bin/env node
/**
 * recall-regression.mjs — Gate de régression recall multi-issues (permanent).
 *
 * Pourquoi : l'union navigator (2 modèles) a fait passer le recall multi-issues de
 * 60 % → 85 % (cas parfaits 13 → 29, CO 336c récupéré). Ce gain doit être VERROUILLÉ :
 * un changement de prompt / modèle / cap qui le ferait régresser doit casser la CI,
 * pas passer silencieusement. Ce script formalise le harnais jetable de la revue.
 *
 * Déterministe, sans LLM : il SCORE un fixture de sorties navigator déjà capturées.
 * Le fixture est régénéré par la machine qui a l'accès LLM live (cf. --fixture) ;
 * ce script ne fait que mesurer + gater.
 *
 * ── Schéma du fixture (JSON) ─────────────────────────────────────────────
 *   [
 *     {
 *       "id": "cx_multi_01",
 *       "query": "…texte citoyen…",
 *       "expected": ["travail_licenciement_maladie", "bail_augmentation_loyer"],
 *       "found":    ["travail_licenciement_maladie", "travail_maladie", "bail_augmentation_loyer"],
 *       "critical": ["travail_licenciement_maladie"]   // optionnel : sous-ensemble d'expected à délai péremptoire
 *     },
 *     …
 *   ]
 * Un cas est "simple" si expected.length === 1, "multi" sinon. Le bruit cas-simples
 * (fiches retournées au-delà de la fiche attendue) est le garde-fou Constitution.
 *
 * ── Usage ────────────────────────────────────────────────────────────────
 *   node scripts/recall-regression.mjs                       # snapshot Haiku par défaut (baseline)
 *   node scripts/recall-regression.mjs --fixture eval/union.json
 *   node scripts/recall-regression.mjs --fixture eval/union.json \
 *        --min-recall-multi 0.80 --max-noise-simple 1.5 --min-critical 0.30
 *
 * Sort 0 si tous les seuils tenus, 1 sinon (gate CI).
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
};
const num = (name, def) => { const v = opt(name, null); return v === null ? def : Number(v); };

const THRESHOLDS = {
  minRecallMulti: num('--min-recall-multi', 0.0),   // recall sur cas multi-issues
  minCritical:    num('--min-critical', 0.0),       // recall des fiches à délai péremptoire
  // « Bruit » cas-simple = noyade : fiches retournées AU-DELÀ d'un plafond d'affichage
  // raisonnable. PAS « au-delà de l'attendu » : rendre 2 fiches sur une question simple
  // n'est pas noyer le citoyen (Constitution vise ~8). Définir le bruit « >attendu »
  // crée un plancher structurel de 1.0 pour un cap top-2 (la 2e fiche légitime compte à
  // tort comme bruit) → un gate à 1.0 ferait échouer du comportement sain. On mesure donc
  // l'excès au-delà de DISPLAY_CEILING fiches.
  displayCeiling: num('--display-ceiling', 3),
  maxNoiseSimple: num('--max-noise-simple', Infinity), // moy. fiches au-delà du plafond, sur cas simples
};

// ── chargement du fixture ───────────────────────────────────────────────
function loadFixture() {
  const path = opt('--fixture', null);
  if (path) {
    const full = join(ROOT, path);
    if (!existsSync(full)) { console.error(`Fixture introuvable: ${full}`); process.exit(2); }
    return { src: path, cases: JSON.parse(readFileSync(full, 'utf-8')) };
  }
  // Défaut : reconstruire depuis le snapshot Haiku existant (baseline reproductible).
  const cxPath = join(ROOT, 'docs/eval/complex-eval-2026-05-31.json');
  const hwPath = join(ROOT, 'docs/eval/harm-weighted-score.json');
  if (!existsSync(cxPath) || !existsSync(hwPath)) {
    console.error('Snapshots baseline absents et aucun --fixture fourni.');
    process.exit(2);
  }
  const cx = Object.values(JSON.parse(readFileSync(cxPath, 'utf-8')));
  const hw = JSON.parse(readFileSync(hwPath, 'utf-8')).report;
  const H = Object.fromEntries(hw.map(h => [h.id, h]));
  const cases = [];
  for (const c of cx) {
    const h = H[c.case.id]; if (!h) continue;
    cases.push({
      id: c.case.id,
      query: c.case.query,
      expected: h.expected || [],
      found: (c.nav && c.nav.fiches_pertinentes) || [],
      critical: (h.missing || []).filter(m => m.harm === 'critical').map(m => m.id),
    });
  }
  return { src: 'baseline snapshot Haiku (docs/eval/)', cases };
}

// ── scoring ───────────────────────────────────────────────────────────────
function score(cases) {
  const ceiling = THRESHOLDS.displayCeiling;
  let multiExp = 0, multiFound = 0;          // recall multi-issues
  let critTot = 0, critFound = 0;            // recall délais péremptoires
  let simpleN = 0, simpleDrown = 0, simpleExtra = 0;  // noyade vs « au-delà de l'attendu » (info)
  let perfect = 0, multiCases = 0;

  for (const c of cases) {
    const exp = c.expected || [], found = c.found || [];
    const foundSet = new Set(found);
    if (exp.length >= 2) {
      multiCases++;
      multiExp += exp.length;
      const hit = exp.filter(e => foundSet.has(e)).length;
      multiFound += hit;
      if (hit === exp.length) perfect++;
    } else if (exp.length === 1) {
      simpleN++;
      // Métrique GATÉE : noyade = fiches au-delà du plafond d'affichage (pas d'artefact de plancher).
      simpleDrown += Math.max(0, found.length - ceiling);
      // Métrique INFO : fiches au-delà de l'attendu (a un plancher = taille du cap − 1).
      simpleExtra += Math.max(0, found.filter(f => !exp.includes(f)).length);
    }
    for (const cid of (c.critical || [])) { critTot++; if (foundSet.has(cid)) critFound++; }
  }
  return {
    multiCases, simpleN, ceiling,
    recallMulti: multiExp ? multiFound / multiExp : 1,
    recallMultiStr: `${multiFound}/${multiExp}`,
    perfect, perfectStr: `${perfect}/${multiCases}`,
    critical: critTot ? critFound / critTot : 1,
    criticalStr: `${critFound}/${critTot}`,
    noiseSimple: simpleN ? simpleDrown / simpleN : 0,      // gatée (noyade)
    extraSimple: simpleN ? simpleExtra / simpleN : 0,      // info
  };
}

// ── run ─────────────────────────────────────────────────────────────────
const { src, cases } = loadFixture();
const s = score(cases);

const pct = x => (x * 100).toFixed(1) + '%';
console.log(`\nRecall regression — source: ${src}  (${cases.length} cas)\n`);
console.log(`  Recall multi-issues   : ${pct(s.recallMulti)}  (${s.recallMultiStr})`);
console.log(`  Cas parfaits (multi)  : ${s.perfectStr}`);
console.log(`  Recall délais péremp. : ${pct(s.critical)}  (${s.criticalStr})`);
console.log(`  Noyade cas simple     : ${s.noiseSimple.toFixed(2)} fiche(s) au-delà de ${s.ceiling}  (n=${s.simpleN})  [gatée]`);
console.log(`  (info) au-delà attendu: ${s.extraSimple.toFixed(2)} fiche(s)  — plancher structurel = taille du cap − 1`);

const fails = [];
if (s.recallMulti < THRESHOLDS.minRecallMulti)
  fails.push(`recall multi ${pct(s.recallMulti)} < seuil ${pct(THRESHOLDS.minRecallMulti)}`);
if (s.critical < THRESHOLDS.minCritical)
  fails.push(`recall critique ${pct(s.critical)} < seuil ${pct(THRESHOLDS.minCritical)}`);
if (s.noiseSimple > THRESHOLDS.maxNoiseSimple)
  fails.push(`noyade cas-simple ${s.noiseSimple.toFixed(2)} (>${s.ceiling} fiches) > seuil ${THRESHOLDS.maxNoiseSimple}`);

if (fails.length) {
  console.log(`\n❌ RÉGRESSION:\n   - ${fails.join('\n   - ')}\n`);
  process.exit(1);
}
console.log(`\n✅ Seuils tenus.\n`);
process.exit(0);
