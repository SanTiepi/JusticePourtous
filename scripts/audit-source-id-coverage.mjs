/**
 * Audit Source ID Coverage — Mesure la couverture du source-registry
 *
 * Parcourt toutes les fiches src/data/fiches/*.json, collecte toutes les refs
 * d'articles dans reponse.articles[].ref, et vérifie combien résolvent via
 * getSourceByRef() du source-registry.
 *
 * Usage: node scripts/audit-source-id-coverage.mjs
 * Output:
 *   - src/data/meta/source-id-coverage-audit.json (détails)
 *   - Rapport console avec "Coverage: X%"
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getSourceByRef, buildSourceRegistry } from '../src/services/source-registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const fichesDir = join(dataDir, 'fiches');
const metaDir = join(dataDir, 'meta');

// Ensure meta dir exists
if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });

function loadJSON(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
}

function loadAllFiches() {
  if (!existsSync(fichesDir)) return [];
  const fiches = [];
  for (const f of readdirSync(fichesDir).filter(f => f.endsWith('.json'))) {
    const data = loadJSON(join(fichesDir, f));
    if (Array.isArray(data)) {
      for (const fiche of data) fiches.push({ ...fiche, _file: f });
    }
  }
  return fiches;
}

function normalizeRef(ref) {
  if (!ref || typeof ref !== 'string') return null;
  return ref.trim()
    .replace(/^art\.?\s*/i, '')
    .replace(/\s+/g, ' ');
}

function extractPrefix(ref) {
  // "CO 259a" → "CO", "LAA 36" → "LAA"
  const m = ref.match(/^([A-Za-zÉèêàâ.\-]+)(?:\s|$)/);
  return m ? m[1].toUpperCase() : 'UNKNOWN';
}

function collectRefs(fiches) {
  const refs = [];
  for (const fiche of fiches) {
    const articles = fiche?.reponse?.articles || [];
    for (const art of articles) {
      if (art?.ref) {
        refs.push({
          ref: normalizeRef(art.ref),
          titre: art.titre || null,
          ficheId: fiche.id,
          domaine: fiche.domaine,
          file: fiche._file,
        });
      }
    }
  }
  return refs;
}

function auditCoverage() {
  console.log('\n=== Audit Source ID Coverage ===\n');

  // Force build registry
  buildSourceRegistry();

  const fiches = loadAllFiches();
  console.log(`Fiches chargées : ${fiches.length}`);

  const allRefs = collectRefs(fiches);
  console.log(`Refs d'articles collectées : ${allRefs.length}\n`);

  const refCounts = new Map();   // ref → occurrences
  const refSamples = new Map();  // ref → first fiche metadata

  for (const r of allRefs) {
    if (!r.ref) continue;
    refCounts.set(r.ref, (refCounts.get(r.ref) || 0) + 1);
    if (!refSamples.has(r.ref)) refSamples.set(r.ref, r);
  }

  const uniqueRefs = [...refCounts.keys()];
  console.log(`Refs uniques : ${uniqueRefs.length}`);

  const resolved = [];
  const unresolved = [];

  for (const ref of uniqueRefs) {
    const src = getSourceByRef(ref);
    if (src && src.source_id) {
      resolved.push({ ref, occurrences: refCounts.get(ref), source_id: src.source_id, tier: src.tier });
    } else {
      unresolved.push({
        ref,
        occurrences: refCounts.get(ref),
        prefix: extractPrefix(ref),
        sample: refSamples.get(ref),
      });
    }
  }

  // Group unresolved by prefix
  const unresolvedByPrefix = {};
  for (const u of unresolved) {
    if (!unresolvedByPrefix[u.prefix]) unresolvedByPrefix[u.prefix] = [];
    unresolvedByPrefix[u.prefix].push(u);
  }

  // Count occurrences total
  const totalOccurrences = allRefs.length;
  const resolvedOccurrences = resolved.reduce((s, r) => s + r.occurrences, 0);
  const unresolvedOccurrences = unresolved.reduce((s, r) => s + r.occurrences, 0);

  const coverageUnique = uniqueRefs.length === 0
    ? 100
    : (resolved.length / uniqueRefs.length) * 100;
  const coverageOccurrences = totalOccurrences === 0
    ? 100
    : (resolvedOccurrences / totalOccurrences) * 100;

  console.log('');
  console.log(`Refs résolues        : ${resolved.length} / ${uniqueRefs.length} (${coverageUnique.toFixed(1)}%)`);
  console.log(`Occurrences résolues : ${resolvedOccurrences} / ${totalOccurrences} (${coverageOccurrences.toFixed(1)}%)`);
  console.log('');
  console.log(`Coverage: ${coverageUnique.toFixed(1)}%`);
  console.log('');

  // List unresolved by prefix (sorted by total occurrences)
  const prefixStats = Object.entries(unresolvedByPrefix).map(([prefix, items]) => ({
    prefix,
    count: items.length,
    occurrences: items.reduce((s, i) => s + i.occurrences, 0),
    refs: items.sort((a, b) => b.occurrences - a.occurrences),
  })).sort((a, b) => b.occurrences - a.occurrences);

  if (prefixStats.length > 0) {
    console.log('=== Refs non résolues par préfixe ===\n');
    for (const ps of prefixStats) {
      console.log(`${ps.prefix}: ${ps.count} refs (${ps.occurrences} occurrences)`);
      for (const r of ps.refs.slice(0, 10)) {
        console.log(`    ${r.ref.padEnd(25)} x${r.occurrences}  [${r.sample.ficheId}]`);
      }
      if (ps.refs.length > 10) console.log(`    ... et ${ps.refs.length - 10} autres`);
      console.log('');
    }
  }

  // Top 20 most common unresolved
  const top20 = unresolved
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 20);
  if (top20.length > 0) {
    console.log('=== Top 20 refs non résolues (par occurrences) ===\n');
    for (const u of top20) {
      console.log(`  ${u.ref.padEnd(30)} x${u.occurrences}`);
    }
    console.log('');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      fiches: fiches.length,
      totalRefOccurrences: totalOccurrences,
      uniqueRefs: uniqueRefs.length,
      resolvedUnique: resolved.length,
      unresolvedUnique: unresolved.length,
      resolvedOccurrences,
      unresolvedOccurrences,
    },
    coverage: {
      uniquePercent: +coverageUnique.toFixed(2),
      occurrencesPercent: +coverageOccurrences.toFixed(2),
    },
    unresolvedByPrefix: prefixStats.map(ps => ({
      prefix: ps.prefix,
      count: ps.count,
      occurrences: ps.occurrences,
      refs: ps.refs.map(r => ({ ref: r.ref, occurrences: r.occurrences, ficheId: r.sample.ficheId, domaine: r.sample.domaine })),
    })),
    top20Unresolved: top20.map(u => ({ ref: u.ref, occurrences: u.occurrences })),
    resolvedSample: resolved.slice(0, 30),
  };

  const outPath = join(metaDir, 'source-id-coverage-audit.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Rapport écrit : ${outPath}\n`);

  return report;
}

// Run if invoked directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('audit-source-id-coverage.mjs')) {
  auditCoverage();
}

export { auditCoverage, collectRefs, loadAllFiches };
