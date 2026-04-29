#!/usr/bin/env node
/**
 * legal-review-summary.mjs — Rapport standalone de l'avancement du chantier
 * legal review (claude_legal_review_date sur les fiches).
 *
 * Sortie : tableau Markdown sur stdout + écriture src/data/meta/legal-review-summary.json
 *
 * Usage : node scripts/legal-review-summary.mjs
 *
 * Idempotent (déterministe) — pas de timestamp dans la sortie JSON pour
 * éviter le bruit git (cohérent avec chore(audits) commit fa9d8d6).
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FICHES_DIR = join(ROOT, 'src/data/fiches');
const OUT_PATH = join(ROOT, 'src/data/meta/legal-review-summary.json');

function buildSummary() {
  const files = readdirSync(FICHES_DIR).filter(f => f.endsWith('.json')).sort();
  const all = [];
  for (const f of files) {
    const arr = JSON.parse(readFileSync(join(FICHES_DIR, f), 'utf8'));
    all.push(...arr);
  }

  const total = all.length;
  let actionable = 0;
  let infoOnly = 0;
  let reviewed = 0;
  const notes = { verified: 0, fixed: 0, verified_minor_imprecision: 0, verified_information_only: 0 };
  const byDomain = {};
  const pending = [];

  for (const fiche of all) {
    const dom = fiche.domaine || 'unknown';
    if (!byDomain[dom]) byDomain[dom] = { total: 0, reviewed: 0, pending: 0 };
    byDomain[dom].total++;

    if (fiche.information_only) infoOnly++;
    else actionable++;

    if (fiche.claude_legal_review_date) {
      reviewed++;
      byDomain[dom].reviewed++;
      const note = fiche.claude_legal_review_notes || 'verified';
      if (notes[note] !== undefined) notes[note]++;
    } else {
      byDomain[dom].pending++;
      pending.push({ id: fiche.id, domaine: dom, information_only: !!fiche.information_only });
    }
  }

  return {
    total,
    actionable,
    information_only: infoOnly,
    reviewed,
    reviewed_pct: total > 0 ? Math.round((reviewed / total) * 100) : 0,
    notes_breakdown: notes,
    by_domain: Object.fromEntries(
      Object.entries(byDomain).sort().map(([d, s]) => [d, { ...s, pct: s.total > 0 ? Math.round((s.reviewed / s.total) * 100) : 0 }])
    ),
    pending
  };
}

function toMarkdown(s) {
  const lines = [];
  lines.push('# Legal Review — Summary');
  lines.push('');
  lines.push(`- **Total fiches** : ${s.total}`);
  lines.push(`- **Actionnables** : ${s.actionable}`);
  lines.push(`- **Information only** : ${s.information_only}`);
  lines.push(`- **Legal-reviewed** : ${s.reviewed} (${s.reviewed_pct}%)`);
  lines.push('');
  lines.push('## Breakdown notes');
  for (const [k, v] of Object.entries(s.notes_breakdown)) {
    lines.push(`- ${k}: ${v}`);
  }
  lines.push('');
  lines.push('## Par domaine');
  lines.push('');
  lines.push('| Domaine | Total | Reviewed | Pending | % |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const [d, st] of Object.entries(s.by_domain)) {
    lines.push(`| ${d} | ${st.total} | ${st.reviewed} | ${st.pending} | ${st.pct}% |`);
  }
  lines.push('');
  if (s.pending.length > 0) {
    lines.push('## Pending');
    for (const p of s.pending.slice(0, 50)) {
      lines.push(`- ${p.id} (${p.domaine})${p.information_only ? ' [info-only]' : ''}`);
    }
  } else {
    lines.push('## ✅ Aucune fiche pending — couverture 100%');
  }
  return lines.join('\n');
}

function main() {
  const summary = buildSummary();
  writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2) + '\n', 'utf8');
  console.log(toMarkdown(summary));
  console.log('');
  console.log(`→ JSON : ${OUT_PATH}`);
}

main();
