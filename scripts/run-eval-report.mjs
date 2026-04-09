#!/usr/bin/env node
/**
 * Eval runner — produit un rapport détaillé par cas et par rubrique
 * pour identifier où les 8% se perdent dans les 4 cas imparfaits.
 *
 * Usage: node scripts/run-eval-report.mjs
 */

import { runEvalSuite, GOLDEN_CASES, RUBRICS } from '../src/services/eval-harness.mjs';
import { queryByProblem } from '../src/services/knowledge-engine.mjs';
import { certifyIssue } from '../src/services/coverage-certificate.mjs';

// Adapter queryByProblem output → shape expected by evaluateCase
async function analyze(query, canton) {
  const resp = queryByProblem(query, canton);
  if (resp.status !== 200 || !resp.data) {
    return { domaine: null, fiche_id: null, articles: [], arrets: [], delais: [], anti_erreurs: [], contacts: [], certificate: { status: 'insufficient' } };
  }

  const d = resp.data;
  const ficheDomaine = d.fiche?.domaine || d._meta?.domaine || null;
  const ficheId = d.fiche?.id || d._meta?.ficheId || null;
  const articles = (d.articles || []).map(a => ({ ref: a.ref, source_id: a.source_id }));
  const arrets = (d.jurisprudence || []).map(j => ({
    signature: j.signature,
    role: j.role || 'neutre',
    resultat: j.resultat,
    source_id: j.source_id,
  }));
  const delais = d.delais || [];
  const anti_erreurs = d.antiErreurs || [];
  const contacts = d.escalade || [];

  // Build issue shape for certifyIssue
  const issue = {
    issue_id: ficheId,
    domaine: ficheDomaine,
    articles,
    arrets,
    delais,
    preuves: d.preuves || [],
    anti_erreurs,
    patterns: d.patterns || [],
    contacts,
  };
  const certificate = certifyIssue(issue);

  return {
    domaine: ficheDomaine,
    fiche_id: ficheId,
    articles,
    arrets,
    delais,
    anti_erreurs,
    contacts,
    certificate,
  };
}

const report = await runEvalSuite(analyze);

console.log('='.repeat(72));
console.log(`EVAL REPORT — ${report.total_cases} cases, global score: ${report.global_score}%`);
console.log('='.repeat(72));
console.log();

console.log('BY DOMAIN:');
for (const [dom, s] of Object.entries(report.by_domain)) {
  console.log(`  ${dom.padEnd(10)} avg=${s.avg_score}%  min=${s.min_score}%  max=${s.max_score}%  (${s.cases} cases)`);
}
console.log();

// Sort results: worst first
const sorted = [...report.results].sort((a, b) => a.score - b.score);

console.log('PER CASE (worst → best):');
console.log();
for (const r of sorted) {
  const marker = r.score === 100 ? 'OK  ' : r.score >= 80 ? 'WARN' : 'FAIL';
  console.log(`[${marker}] ${r.score}%  ${r.case_id}  (${r.description})`);
  if (r.score < 100) {
    const failed = (r.evaluations || []).filter(e => !e.passed);
    for (const f of failed) {
      console.log(`         - MISS: ${f.label}  (weight ${f.weight})`);
    }
    console.log();
  }
}

console.log();
console.log('RUBRIC FAILURE COUNT (across all cases):');
const failCounts = {};
for (const r of report.results) {
  for (const e of (r.evaluations || [])) {
    if (!e.passed) failCounts[e.label] = (failCounts[e.label] || 0) + 1;
  }
}
const ranked = Object.entries(failCounts).sort((a, b) => b[1] - a[1]);
for (const [label, count] of ranked) {
  console.log(`  ${count}x  ${label}`);
}
