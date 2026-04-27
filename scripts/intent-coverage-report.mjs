#!/usr/bin/env node
/**
 * intent-coverage-report.mjs — Rapport de couverture des intents
 *
 * Lit src/data/meta/intents-catalog.json et produit :
 *   - src/data/meta/intents-coverage-report.json  (machine-readable)
 *   - docs/intents-coverage.md                    (human-readable)
 *
 * Le rapport contient :
 *   - Totaux par domaine (N, complete, partial, stub, missing)
 *   - Score qualitatif : (complete + partial/2) / total
 *   - Top 20 intents prioritaires (missing ou stub avec volume_estime élevé)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Finding 4 review : supporte --catalog/--json/--md pour isolation test tmpdir.
function flagValue(name, short) {
  const argv = process.argv.slice(2);
  const idx = argv.findIndex(a => a === `--${name}` || (short && a === `-${short}`));
  if (idx >= 0 && argv[idx + 1]) return path.resolve(argv[idx + 1]);
  const eq = argv.find(a => a.startsWith(`--${name}=`));
  if (eq) return path.resolve(eq.slice(`--${name}=`.length));
  return null;
}
const CATALOG_FILE = flagValue('catalog') || path.join(ROOT, 'src/data/meta/intents-catalog.json');
const JSON_OUT = flagValue('json') || path.join(ROOT, 'src/data/meta/intents-coverage-report.json');
const MD_OUT = flagValue('md') || path.join(ROOT, 'docs/intents-coverage.md');

function load() {
  if (!fs.existsSync(CATALOG_FILE)) {
    console.error(`[intent-coverage-report] Manque ${CATALOG_FILE}. Lancer d'abord : node scripts/build-intent-catalog.mjs`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
}

function qualityScore(stats) {
  if (!stats.total) return 0;
  // Pondération : complete=1, partial=0.5, stub=0.2, missing=0
  const w = stats.complete * 1 + stats.partial * 0.5 + stats.stub * 0.2;
  return Math.round((w / stats.total) * 100);
}

function buildReport(intents) {
  const byDomain = {};
  for (const i of intents) {
    const d = i.domaines[0] || 'autre';
    byDomain[d] = byDomain[d] || {
      domain: d, total: 0, complete: 0, partial: 0, stub: 0, missing: 0,
    };
    byDomain[d].total += 1;
    byDomain[d][i.etat_couverture] += 1;
  }
  const domainRows = Object.values(byDomain).map(s => ({
    ...s,
    quality_pct: qualityScore(s),
  })).sort((a, b) => b.total - a.total);

  // Priorité : état > domaine sous-couvert > volume_estime > id
  // Les domaines avec la qualité la plus basse passent d'abord, ce qui
  // donne un top 20 représentatif (pas 20 intents d'un seul domaine).
  const rank = { missing: 3, stub: 2, partial: 1, complete: 0 };
  const domainQuality = Object.fromEntries(
    domainRows.map(d => [d.domain, d.quality_pct]),
  );
  const prioritized = [...intents]
    .filter(i => i.etat_couverture !== 'complete')
    .sort((a, b) => {
      const ra = rank[a.etat_couverture] || 0;
      const rb = rank[b.etat_couverture] || 0;
      if (ra !== rb) return rb - ra;
      const qa = domainQuality[a.domaines[0]] ?? 100;
      const qb = domainQuality[b.domaines[0]] ?? 100;
      if (qa !== qb) return qa - qb; // domaine + faible qualité = priorité
      const va = a.volume_estime ?? 0;
      const vb = b.volume_estime ?? 0;
      if (va !== vb) return vb - va;
      return a.id.localeCompare(b.id);
    });

  // Diversification : on garde au plus 4 intents par domaine dans le top 20
  const perDomainCap = 4;
  const counts = {};
  const top20 = [];
  for (const i of prioritized) {
    const d = i.domaines[0] || '_autre';
    counts[d] = counts[d] || 0;
    if (counts[d] >= perDomainCap) continue;
    counts[d] += 1;
    top20.push({
      id: i.id,
      domaine: i.domaines[0] || null,
      label_citoyen: i.label_citoyen,
      etat_couverture: i.etat_couverture,
      volume_estime: i.volume_estime,
    });
    if (top20.length >= 20) break;
  }

  const totals = intents.reduce((acc, i) => {
    acc.total += 1;
    acc[i.etat_couverture] += 1;
    return acc;
  }, { total: 0, complete: 0, partial: 0, stub: 0, missing: 0 });
  totals.quality_pct = qualityScore(totals);

  return {
    totals,
    by_domain: domainRows,
    top_20_priority: top20,
  };
}

function toMarkdown(report) {
  const lines = [];
  lines.push(`# Intents — Couverture`);
  lines.push('');
  lines.push(`_Généré automatiquement par \`scripts/intent-coverage-report.mjs\`_`);
  lines.push('');
  lines.push(`## Totaux`);
  lines.push('');
  lines.push(`- **Total intents** : ${report.totals.total}`);
  lines.push(`- Complete : ${report.totals.complete}`);
  lines.push(`- Partial  : ${report.totals.partial}`);
  lines.push(`- Stub     : ${report.totals.stub}`);
  lines.push(`- Missing  : ${report.totals.missing}`);
  lines.push(`- **Qualité globale** : ${report.totals.quality_pct}%`);
  lines.push('');
  lines.push(`## Par domaine`);
  lines.push('');
  lines.push(`| Domaine | Total | Complete | Partial | Stub | Missing | Qualité |`);
  lines.push(`|---|---:|---:|---:|---:|---:|---:|`);
  for (const d of report.by_domain) {
    lines.push(`| ${d.domain} | ${d.total} | ${d.complete} | ${d.partial} | ${d.stub} | ${d.missing} | ${d.quality_pct}% |`);
  }
  lines.push('');
  lines.push(`## Top 20 intents prioritaires`);
  lines.push('');
  lines.push(`Priorité : missing > stub > partial, puis volume estimé décroissant.`);
  lines.push('');
  lines.push(`| # | Domaine | Intent | État | Volume estimé |`);
  lines.push(`|---:|---|---|---|---:|`);
  report.top_20_priority.forEach((i, idx) => {
    lines.push(`| ${idx + 1} | ${i.domaine || '-'} | \`${i.id}\` — ${i.label_citoyen} | ${i.etat_couverture} | ${i.volume_estime ?? '–'} |`);
  });
  lines.push('');
  return lines.join('\n');
}

function main() {
  const intents = load();
  const report = buildReport(intents);

  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 2) + '\n', 'utf8');

  fs.mkdirSync(path.dirname(MD_OUT), { recursive: true });
  fs.writeFileSync(MD_OUT, toMarkdown(report), 'utf8');

  console.log(`[intent-coverage-report] ${intents.length} intents analysés`);
  console.log(`  Qualité globale : ${report.totals.quality_pct}%`);
  console.log(`  JSON → ${path.relative(ROOT, JSON_OUT)}`);
  console.log(`  MD   → ${path.relative(ROOT, MD_OUT)}`);
}

main();
