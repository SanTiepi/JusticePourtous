#!/usr/bin/env node
/**
 * Adversarial eval via le chemin LLM-first (triage engine).
 *
 * C'est le chemin PROD utilisé par /api/search. Mesure la qualité
 * réelle telle que vue par un utilisateur du site.
 *
 * Usage: ANTHROPIC_API_KEY=... node scripts/run-adversarial-eval-llm.mjs
 */

import { ADVERSARIAL_CASES } from '../test/adversarial-cases.mjs';
import { triage } from '../src/services/triage-engine.mjs';
import { queryComplete } from '../src/services/knowledge-engine.mjs';

// ─── Rubrics ──────────────────────────────────────────────────

const RUBRICS = [
  {
    id: 'found',
    label: 'Situation trouvée (trouve=true)',
    weight: 2,
    check: (ctx) => ctx.trouve === true,
  },
  {
    id: 'domain_correct',
    label: 'Domaine correct',
    weight: 3,
    check: (ctx) => ctx.domaine === ctx.expected_domaine,
  },
  {
    id: 'article_required',
    label: 'Au moins 1 article attendu cité',
    weight: 3,
    check: (ctx) => {
      const required = new Set(ctx.expected_any_article);
      return ctx.articleRefs.some(ref => required.has(ref));
    },
  },
  {
    id: 'no_wrong_domain_contacts',
    label: 'Contacts du bon domaine',
    weight: 1,
    check: (ctx) => ctx.contactCount > 0,
  },
  {
    id: 'delai_present',
    label: 'Délai fourni',
    weight: 1,
    check: (ctx) => ctx.delaisCount > 0,
  },
];

// ─── Runner ────────────────────────────────────────────────────

async function evalCase(gc, index) {
  process.stdout.write(`  [${index + 1}/${ADVERSARIAL_CASES.length}] ${gc.id}...`);
  const start = Date.now();

  let result;
  try {
    result = await triage(gc.query, gc.canton);
  } catch (err) {
    console.log(` ERROR: ${err.message}`);
    return { id: gc.id, error: err.message, score: 0 };
  }

  const elapsed = Date.now() - start;
  const d = result?.data || {};

  // Get article refs from the enriched fiche
  let articleRefs = [];
  if (d.ficheId) {
    const complete = queryComplete(d.ficheId);
    if (complete.status === 200 && complete.data?.articles) {
      articleRefs = complete.data.articles.map(a => a.ref);
    }
  }

  const ctx = {
    expected_domaine: gc.expected_domaine,
    expected_any_article: gc.expected_any_article,
    trouve: d.trouve,
    domaine: d.domaine,
    ficheId: d.ficheId,
    articleRefs,
    contactCount: (d.contacts || []).length,
    delaisCount: (d.delaisCritiques || []).length,
    resume: d.resumeSituation,
    mode: d.mode || 'llm',
  };

  const maxScore = RUBRICS.reduce((s, r) => s + r.weight, 0);
  const rubrics = RUBRICS.map(r => ({
    id: r.id,
    label: r.label,
    weight: r.weight,
    passed: r.check(ctx),
  }));
  const totalPoints = rubrics.reduce((s, r) => s + (r.passed ? r.weight : 0), 0);
  const score = Math.round((totalPoints / maxScore) * 100);

  process.stdout.write(` ${score}% (${elapsed}ms)\n`);

  return { id: gc.id, query: gc.query, notes: gc.notes, score, rubrics, ctx, elapsed };
}

// ─── Main ──────────────────────────────────────────────────────

console.log('='.repeat(72));
console.log(`ADVERSARIAL EVAL (LLM path) — ${ADVERSARIAL_CASES.length} cases`);
console.log('='.repeat(72));
console.log();

const results = [];
for (let i = 0; i < ADVERSARIAL_CASES.length; i++) {
  const r = await evalCase(ADVERSARIAL_CASES[i], i);
  results.push(r);
}

console.log();

const validResults = results.filter(r => r.score !== undefined);
const globalScore = validResults.length > 0
  ? Math.round(validResults.reduce((s, r) => s + r.score, 0) / validResults.length)
  : 0;

console.log('='.repeat(72));
console.log(`GLOBAL SCORE: ${globalScore}%   (${validResults.length}/${results.length} cases evaluated)`);
console.log('='.repeat(72));
console.log();

// Distribution
const buckets = { '100': 0, '80-99': 0, '50-79': 0, '0-49': 0 };
for (const r of validResults) {
  if (r.score === 100) buckets['100']++;
  else if (r.score >= 80) buckets['80-99']++;
  else if (r.score >= 50) buckets['50-79']++;
  else buckets['0-49']++;
}
console.log('DISTRIBUTION:');
console.log(`  100%      : ${buckets['100']}`);
console.log(`  80-99%    : ${buckets['80-99']}`);
console.log(`  50-79%    : ${buckets['50-79']}`);
console.log(`  0-49%     : ${buckets['0-49']}`);
console.log();

// Rubric failures
const failCounts = {};
for (const r of validResults) {
  for (const rub of (r.rubrics || [])) {
    if (!rub.passed) failCounts[rub.label] = (failCounts[rub.label] || 0) + 1;
  }
}
console.log('RUBRIC FAILURE COUNT (sorted):');
const total = validResults.length;
const ranked = Object.entries(failCounts).sort((a, b) => b[1] - a[1]);
for (const [label, count] of ranked) {
  const pct = Math.round((count / total) * 100);
  console.log(`  ${String(count).padStart(3)} / ${total}  (${String(pct).padStart(3)}%)  ${label}`);
}
console.log();

// Worst cases
const worst = [...validResults].sort((a, b) => a.score - b.score);
console.log('WORST CASES (bottom 10):');
console.log();
for (const r of worst.slice(0, 10)) {
  if (r.score === 100) break;
  const marker = r.score >= 80 ? 'WARN' : 'FAIL';
  console.log(`[${marker}] ${String(r.score).padStart(3)}%  ${r.id}  (${r.elapsed}ms)`);
  console.log(`         Query: "${r.query.slice(0, 85)}${r.query.length > 85 ? '...' : ''}"`);
  console.log(`         Note:  ${r.notes}`);
  console.log(`         Expected: domaine=${r.ctx.expected_domaine}  articles=${r.ctx.expected_any_article.join('|')}`);
  console.log(`         Got:      domaine=${r.ctx.domaine || 'NONE'}  ficheId=${r.ctx.ficheId || 'NONE'}  articles=[${r.ctx.articleRefs.slice(0, 5).join(', ')}${r.ctx.articleRefs.length > 5 ? '...' : ''}]`);
  const failed = (r.rubrics || []).filter(rub => !rub.passed);
  if (failed.length > 0) {
    console.log(`         MISS: ${failed.map(f => f.label).join(' | ')}`);
  }
  console.log();
}

// Stage diagnosis
console.log('DIAGNOSIS:');
const notFound = validResults.filter(r => r.ctx.trouve === false).length;
const domainWrong = validResults.filter(r => r.ctx.trouve && r.ctx.domaine !== r.ctx.expected_domaine).length;
const articleMissing = validResults.filter(r => !r.ctx.articleRefs.some(ref => r.ctx.expected_any_article.includes(ref))).length;
console.log(`  Not found (trouve=false)       : ${notFound}/${total}`);
console.log(`  Wrong domain                   : ${domainWrong}/${total}`);
console.log(`  No expected article found      : ${articleMissing}/${total}`);
