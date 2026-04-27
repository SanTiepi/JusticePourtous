#!/usr/bin/env node
/**
 * audit-fiches-schema.mjs — Phase Cortex 4
 *
 * Parcourt toutes les fiches, applique fiche-validator.mjs, écrit
 * src/data/meta/fiches-schema-audit.json et logue un rapport console.
 *
 * Flags :
 *   --tolerant : exit 0 même en présence d'erreurs (CI permissive / cron quotidien)
 *   --strict   : warnings deviennent des erreurs
 *   --quiet    : pas de top problématique en console
 *
 * Exit codes :
 *   0 : aucune erreur (ou --tolerant)
 *   1 : ≥ 1 erreur critique sans --tolerant
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateAllFiches,
  countFicheSchemaIssues
} from '../src/services/fiche-validator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const META_DIR = path.resolve(__dirname, '../src/data/meta');
const REPORT_PATH = path.join(META_DIR, 'fiches-schema-audit.json');

const args = new Set(process.argv.slice(2));
const TOLERANT = args.has('--tolerant');
const STRICT = args.has('--strict');
const QUIET = args.has('--quiet');

function fmtPct(n, total) {
  if (total === 0) return '0%';
  return `${Math.round(1000 * n / total) / 10}%`;
}

function main() {
  const started = Date.now();

  const report = validateAllFiches({ strict: STRICT });
  const stats = countFicheSchemaIssues(report);

  const out = {
    strict: STRICT,
    summary: {
      total: stats.total,
      valid_count: stats.valid_count,
      invalid_count: stats.invalid_count,
      valid_pct: stats.valid_pct,
      warning_count: stats.warning_count,
      error_count: stats.error_count,
      duplicates: stats.duplicates
    },
    by_error_code: stats.by_error_code,
    by_warning_code: stats.by_warning_code,
    by_domain: stats.by_domain,
    per_file: report.per_file,
    top_problematic: stats.top_problematic,
    invalid_fiches: report.per_fiche
      .filter(f => !f.valid)
      .map(f => ({ id: f.id, file: f.file, errors: f.errors }))
  };

  if (!fs.existsSync(META_DIR)) fs.mkdirSync(META_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(out, null, 2));

  // Console report
  const took = Date.now() - started;
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AUDIT SCHEMA FICHES — JusticePourtous');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Généré : ${new Date().toISOString()}  (${took} ms)`);
  console.log(`  Mode   : ${STRICT ? 'STRICT' : 'normal'}${TOLERANT ? ' (tolerant)' : ''}`);
  console.log('');
  console.log(`  Total fiches      : ${stats.total}`);
  console.log(`  Valides           : ${stats.valid_count}  (${fmtPct(stats.valid_count, stats.total)})`);
  console.log(`  Invalides         : ${stats.invalid_count}`);
  console.log(`  Erreurs totales   : ${stats.error_count}`);
  console.log(`  Warnings totales  : ${stats.warning_count}`);
  console.log(`  IDs dupliqués     : ${stats.duplicates.length}`);
  console.log('');

  if (Object.keys(stats.by_error_code).length > 0) {
    console.log('  Top codes d\'erreur :');
    for (const [code, n] of Object.entries(stats.by_error_code).sort((a, b) => b[1] - a[1])) {
      console.log(`    - ${code.padEnd(28)} ${n}`);
    }
    console.log('');
  }

  if (Object.keys(stats.by_warning_code).length > 0) {
    console.log('  Top codes de warning :');
    for (const [code, n] of Object.entries(stats.by_warning_code).sort((a, b) => b[1] - a[1])) {
      console.log(`    - ${code.padEnd(34)} ${n}`);
    }
    console.log('');
  }

  console.log('  Par domaine :');
  for (const [d, c] of Object.entries(stats.by_domain).sort()) {
    const total = c.valid + c.invalid;
    console.log(`    ${d.padEnd(14)} ${c.valid}/${total} valides  (${fmtPct(c.valid, total)})`);
  }
  console.log('');

  if (!QUIET && stats.top_problematic.length > 0) {
    console.log('  Top 10 fiches les plus problématiques :');
    for (const p of stats.top_problematic.slice(0, 10)) {
      console.log(`    ${p.id.padEnd(40)} err=${p.error_count}  warn=${p.warning_count}  (${p.file})`);
    }
    console.log('');
  }

  console.log(`  Rapport JSON      : ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  if (stats.invalid_count > 0 && !TOLERANT) {
    console.error(`✗ Audit échoué : ${stats.invalid_count} fiche(s) invalide(s).`);
    process.exit(1);
  }
  if (stats.invalid_count > 0 && TOLERANT) {
    console.warn(`⚠ ${stats.invalid_count} fiche(s) invalide(s) tolérée(s) (--tolerant).`);
  } else {
    console.log('✓ Toutes les fiches respectent le schéma critique.');
  }
  process.exit(0);
}

main();
