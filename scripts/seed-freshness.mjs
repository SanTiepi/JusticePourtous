#!/usr/bin/env node
/**
 * Seed Freshness — Ajoute les 3 champs de fraîcheur sur chaque fiche
 *
 * Champs injectés (si absents — idempotent) :
 *   - last_verified_at : date de dernière vérification (défaut : 2026-04-07)
 *   - review_scope     : scope de la revue (défaut : "draft_automated")
 *   - review_expiry    : 12 mois après last_verified_at
 *
 * Respecte toute valeur déjà présente (ne sur-écrit jamais ce qui est
 * validé humainement ou via un autre process).
 *
 * Usage : node scripts/seed-freshness.mjs
 * Output: modification in-place des fichiers src/data/fiches/*.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fichesDir = join(__dirname, '..', 'src', 'data', 'fiches');

// Snapshot origine — toutes les fiches actuelles sont issues de ce build
const DEFAULT_LAST_VERIFIED_AT = '2026-04-07';
const DEFAULT_REVIEW_SCOPE = 'draft_automated';

/** Add 12 months to an ISO date string (YYYY-MM-DD). Returns YYYY-MM-DD. */
function plus12Months(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const newYear = y + 1;
  // Keep same month/day. If 2026-02-29-like (not here but safe):
  const date = new Date(Date.UTC(newYear, m - 1, d));
  return date.toISOString().slice(0, 10);
}

function seedFiche(fiche) {
  let changed = false;

  if (!fiche.last_verified_at) {
    fiche.last_verified_at = DEFAULT_LAST_VERIFIED_AT;
    changed = true;
  }
  if (!fiche.review_scope) {
    fiche.review_scope = DEFAULT_REVIEW_SCOPE;
    changed = true;
  }
  if (!fiche.review_expiry) {
    fiche.review_expiry = plus12Months(fiche.last_verified_at);
    changed = true;
  }

  return changed;
}

function run() {
  const files = readdirSync(fichesDir).filter(f => f.endsWith('.json'));
  let totalFiches = 0;
  let totalSeeded = 0;
  const perFile = [];

  for (const file of files) {
    const path = join(fichesDir, file);
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) continue;

    let seededInFile = 0;
    for (const fiche of data) {
      totalFiches++;
      if (seedFiche(fiche)) {
        seededInFile++;
        totalSeeded++;
      }
    }

    if (seededInFile > 0) {
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    }
    perFile.push({ file, fiches: data.length, seeded: seededInFile });
  }

  console.log('=== Seed Freshness ===');
  console.log(`Total fiches processed : ${totalFiches}`);
  console.log(`Fields seeded (at least one) : ${totalSeeded}`);
  console.log('Per-file breakdown:');
  for (const r of perFile) {
    console.log(`  ${r.file.padEnd(18)}  fiches=${String(r.fiches).padStart(3)}  seeded=${r.seeded}`);
  }
  console.log('Done.');
}

run();
