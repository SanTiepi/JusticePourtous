#!/usr/bin/env node
/**
 * evaluate-canon-completeness.mjs — Mesure canon_completeness par fiche.
 *
 * Pour chaque fiche des 5 domaines core, appelle `getCanonCompleteness` et
 * agrège le taux de fiches dont le canon jurisprudentiel est complet
 * (leading + nuance + citizen_summary validé).
 *
 * Cible roadmap : ≥ 80% canon_complete sur bail/travail/dettes/famille/etrangers.
 *
 * Output : src/data/meta/canon-completeness-report.json
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCanonCompleteness } from '../src/services/caselaw/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FICHES_DIR = join(ROOT, 'src/data/fiches');
const OUT = join(ROOT, 'src/data/meta/canon-completeness-report.json');

const CORE_DOMAINS = new Set(['bail', 'travail', 'dettes', 'famille', 'etrangers']);

function loadFichesCore() {
  const all = [];
  for (const f of readdirSync(FICHES_DIR).filter(x => x.endsWith('.json'))) {
    try {
      const arr = JSON.parse(readFileSync(join(FICHES_DIR, f), 'utf8'));
      for (const fiche of arr) {
        if (CORE_DOMAINS.has(fiche.domaine)) all.push(fiche);
      }
    } catch { /* skip */ }
  }
  return all;
}

async function main() {
  const start = Date.now();
  const fiches = loadFichesCore();
  console.log(`[canon-eval] évaluation ${fiches.length} fiches core`);
  const results = [];
  let done = 0;
  for (const fiche of fiches) {
    const cc = await getCanonCompleteness(fiche, { citizenCanton: 'VD' });
    results.push(cc);
    done++;
    if (done % 10 === 0) process.stdout.write(`  ${done}/${fiches.length}\r`);
  }
  process.stdout.write('\n');

  const canonComplete = results.filter(r => r.canon_complete).length;
  const byDomain = {};
  for (const r of results) {
    const d = r.domaine;
    byDomain[d] = byDomain[d] || { total: 0, complete: 0 };
    byDomain[d].total++;
    if (r.canon_complete) byDomain[d].complete++;
  }
  for (const k of Object.keys(byDomain)) {
    byDomain[k].percent = Math.round((byDomain[k].complete / byDomain[k].total) * 100);
  }

  const report = {
    total_evaluated: results.length,
    canon_complete_count: canonComplete,
    percent: Math.round((canonComplete / results.length) * 100),
    by_domain: byDomain,
    gate_target_percent: 80,
    gate_passed: (canonComplete / results.length) >= 0.80,
    results_sample: results.slice(0, 5)
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');

  console.log(`[canon-eval] ${canonComplete}/${results.length} canon_complete (${report.percent}%)`);
  console.log(`[canon-eval] gate 80% : ${report.gate_passed ? 'PASSÉ ✅' : 'NON PASSÉ ❌'}`);
  console.log(`[canon-eval] par domaine :`);
  for (const [d, s] of Object.entries(byDomain)) {
    console.log(`  ${d.padEnd(12)} : ${s.complete}/${s.total} (${s.percent}%)`);
  }
  console.log(`[canon-eval] rapport : ${OUT}`);
  return report;
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes('evaluate-canon-completeness')) {
  main().catch(e => { console.error(e); process.exit(1); });
}

export { main };
