#!/usr/bin/env node
/**
 * Adversarial eval runner — mesure la qualité sur des cas écrits
 * SANS regarder le dictionnaire de synonymes du moteur de recherche.
 *
 * Produit un rapport détaillé par cas + diagnostic par étape du pipeline
 * pour identifier le vrai maillon faible.
 *
 * Usage: node scripts/run-adversarial-eval.mjs
 */

import { ADVERSARIAL_CASES } from '../test/adversarial-cases.mjs';
import { queryByProblem } from '../src/services/knowledge-engine.mjs';
import { semanticSearch } from '../src/services/semantic-search.mjs';
import { getAllFiches } from '../src/services/fiches.mjs';
import { certifyIssue } from '../src/services/coverage-certificate.mjs';

const fiches = getAllFiches();

// ─── Rubrics strictes ─────────────────────────────────────────
const STRICT_RUBRICS = [
  {
    id: 'domain_top1',
    label: 'Domaine correct en top-1 (semantic search)',
    weight: 3,
    check: (ctx) => ctx.topFiche?.domaine === ctx.expected_domaine,
  },
  {
    id: 'domain_enriched',
    label: 'Domaine correct après enrichissement',
    weight: 2,
    check: (ctx) => ctx.enrichedDomaine === ctx.expected_domaine,
  },
  {
    id: 'article_required',
    label: 'Au moins 1 article attendu présent',
    weight: 3,
    check: (ctx) => {
      const required = new Set(ctx.expected_any_article);
      return ctx.articleRefs.some(ref => required.has(ref));
    },
  },
  {
    id: 'no_article_hallucination',
    label: 'Aucun article hors corpus',
    weight: 1,
    check: (ctx) => ctx.articleRefs.length === 0 || ctx.articleRefs.every(ref => ctx.knownRefs.has(ref)),
  },
  {
    id: 'juris_present',
    label: 'Jurisprudence trouvée',
    weight: 1,
    check: (ctx) => ctx.jurisCount > 0,
  },
  {
    id: 'delai_present',
    label: 'Délai trouvé',
    weight: 1,
    check: (ctx) => ctx.delaiCount > 0,
  },
  {
    id: 'contact_present',
    label: 'Contact cantonal fourni',
    weight: 1,
    check: (ctx) => ctx.contactCount > 0,
  },
  {
    id: 'certificate_sufficient',
    label: 'Coverage certificate = sufficient',
    weight: 2,
    check: (ctx) => ctx.certStatus === 'sufficient',
  },
];

// Build a set of known article refs for hallucination detection
const knownRefs = new Set();
for (const f of fiches) {
  for (const ref of (f.articles || [])) knownRefs.add(ref);
}

// ─── Runner ────────────────────────────────────────────────────

function evalCase(gc) {
  const top = semanticSearch(gc.query, fiches, 5);
  const topFiche = top[0]?.fiche || null;
  const alternatives = top.slice(0, 5).map(t => ({ id: t.fiche.id, domaine: t.fiche.domaine, score: t.score }));

  const resp = queryByProblem(gc.query, gc.canton);
  let enrichedDomaine = null;
  let articleRefs = [];
  let jurisCount = 0;
  let delaiCount = 0;
  let contactCount = 0;
  let certStatus = 'insufficient';
  let ficheId = null;

  if (resp.status === 200 && resp.data?.fiche) {
    const d = resp.data;
    enrichedDomaine = d.fiche.domaine;
    ficheId = d.fiche.id;
    articleRefs = (d.articles || []).map(a => a.ref);
    jurisCount = (d.jurisprudence || []).length;
    delaiCount = (d.delais || []).length;
    contactCount = (d.escalade || []).length;

    const issue = {
      issue_id: ficheId,
      domaine: enrichedDomaine,
      articles: (d.articles || []).map(a => ({ ref: a.ref, source_id: a.source_id })),
      arrets: (d.jurisprudence || []).map(j => ({
        signature: j.signature,
        role: j.role || 'neutre',
        resultat: j.resultat,
        source_id: j.source_id,
      })),
      delais: d.delais || [],
      preuves: d.preuves || [],
      anti_erreurs: d.antiErreurs || [],
      patterns: d.patterns || [],
      contacts: d.escalade || [],
    };
    certStatus = certifyIssue(issue).status;
  }

  const ctx = {
    expected_domaine: gc.expected_domaine,
    expected_any_article: gc.expected_any_article,
    topFiche,
    enrichedDomaine,
    ficheId,
    articleRefs,
    jurisCount,
    delaiCount,
    contactCount,
    certStatus,
    knownRefs,
    alternatives,
  };

  const maxScore = STRICT_RUBRICS.reduce((s, r) => s + r.weight, 0);
  const rubrics = STRICT_RUBRICS.map(r => {
    const passed = r.check(ctx);
    return { id: r.id, label: r.label, weight: r.weight, passed };
  });
  const totalPoints = rubrics.reduce((s, r) => s + (r.passed ? r.weight : 0), 0);
  const score = Math.round((totalPoints / maxScore) * 100);

  return { id: gc.id, query: gc.query, notes: gc.notes, score, rubrics, ctx };
}

// ─── Main ──────────────────────────────────────────────────────

const results = ADVERSARIAL_CASES.map(evalCase);

const total = results.length;
const globalScore = Math.round(results.reduce((s, r) => s + r.score, 0) / total);

console.log('='.repeat(72));
console.log(`ADVERSARIAL EVAL — ${total} cases, global score: ${globalScore}%`);
console.log('='.repeat(72));
console.log();

// Distribution
const buckets = { '100': 0, '80-99': 0, '50-79': 0, '0-49': 0 };
for (const r of results) {
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

// Rubric failure counts
const failCounts = {};
for (const r of results) {
  for (const rub of r.rubrics) {
    if (!rub.passed) failCounts[rub.label] = (failCounts[rub.label] || 0) + 1;
  }
}
console.log('RUBRIC FAILURE COUNT (sorted):');
const ranked = Object.entries(failCounts).sort((a, b) => b[1] - a[1]);
for (const [label, count] of ranked) {
  const pct = Math.round((count / total) * 100);
  console.log(`  ${String(count).padStart(3)} / ${total}  (${String(pct).padStart(3)}%)  ${label}`);
}
console.log();

// Worst cases detail
const worst = [...results].sort((a, b) => a.score - b.score);
console.log('WORST CASES (top 10):');
console.log();
for (const r of worst.slice(0, 10)) {
  const marker = r.score === 100 ? 'OK  ' : r.score >= 80 ? 'WARN' : 'FAIL';
  console.log(`[${marker}] ${String(r.score).padStart(3)}%  ${r.id}`);
  console.log(`         Query: "${r.query.slice(0, 90)}${r.query.length > 90 ? '...' : ''}"`);
  console.log(`         Note:  ${r.notes}`);
  console.log(`         Expected: domaine=${r.ctx.expected_domaine}  articles=${r.ctx.expected_any_article.join('|')}`);
  console.log(`         Got:      top1=${r.ctx.topFiche?.id || 'NONE'}(${r.ctx.topFiche?.domaine || '-'})  enriched=${r.ctx.enrichedDomaine || '-'}  articles=[${r.ctx.articleRefs.slice(0, 5).join(', ')}${r.ctx.articleRefs.length > 5 ? '...' : ''}]  cert=${r.ctx.certStatus}`);
  const failed = r.rubrics.filter(rub => !rub.passed);
  if (failed.length > 0) {
    console.log(`         MISS: ${failed.map(f => f.label).join(' | ')}`);
  }
  console.log();
}

// By stage diagnosis
console.log('STAGE DIAGNOSIS:');
const semanticWrong = results.filter(r => r.ctx.topFiche?.domaine !== r.ctx.expected_domaine).length;
const enrichWrong = results.filter(r => r.ctx.enrichedDomaine !== r.ctx.expected_domaine && r.ctx.enrichedDomaine !== null).length;
const articleMiss = results.filter(r => !r.ctx.articleRefs.some(ref => r.ctx.expected_any_article.includes(ref))).length;
console.log(`  Semantic search wrong domain (top-1)  : ${semanticWrong}/${total}`);
console.log(`  Enriched fiche wrong domain           : ${enrichWrong}/${total}`);
console.log(`  No expected article found             : ${articleMiss}/${total}`);
