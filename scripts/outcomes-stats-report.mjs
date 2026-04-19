#!/usr/bin/env node
/**
 * Outcomes Stats Report — Cortex Phase 4.
 *
 * Génère un rapport agrégé par intent_id (k-anonymity ≥ 5).
 * Sort : src/data/meta/outcomes-stats-report.json
 *
 * Usage : node scripts/outcomes-stats-report.mjs
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  snapshotStore,
  getOutcomeStats,
  K_ANONYMITY_THRESHOLD
} from '../src/services/outcomes-tracker.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'meta', 'outcomes-stats-report.json');

function buildReport() {
  const { outcomes } = snapshotStore();
  const intents = new Set();
  const domaines = new Set();
  const cantons = new Set();
  for (const o of outcomes) {
    if (o.intent_id) intents.add(o.intent_id);
    if (o.domaine) domaines.add(o.domaine);
    if (o.canton) cantons.add(o.canton);
  }

  const by_intent = {};
  let published = 0;
  let suppressed_low_n = 0;
  for (const intent_id of intents) {
    const stats = getOutcomeStats({ intent_id });
    if (stats) {
      by_intent[intent_id] = stats;
      published++;
    } else {
      suppressed_low_n++;
    }
  }

  const by_domaine_canton = {};
  for (const domaine of domaines) {
    for (const canton of cantons) {
      const stats = getOutcomeStats({ domaine, canton });
      if (!stats) continue;
      const key = `${domaine}|${canton}`;
      by_domaine_canton[key] = stats;
    }
  }

  return {
    generated_at: new Date().toISOString(),
    k_anonymity_threshold: K_ANONYMITY_THRESHOLD,
    total_outcomes: outcomes.length,
    intents_tracked: intents.size,
    intents_published: published,
    intents_suppressed_low_n: suppressed_low_n,
    by_intent,
    by_domaine_canton
  };
}

function main() {
  const report = buildReport();
  const dir = dirname(OUT_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`[outcomes-stats-report] wrote ${OUT_PATH}`);
  console.log(`  total outcomes : ${report.total_outcomes}`);
  console.log(`  intents tracked: ${report.intents_tracked}`);
  console.log(`  published (k≥${report.k_anonymity_threshold}): ${report.intents_published}`);
  console.log(`  suppressed     : ${report.intents_suppressed_low_n}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('outcomes-stats-report.mjs')) {
  main();
}

export { buildReport };
