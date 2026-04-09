/**
 * Adversarial eval test — non-regression guard.
 *
 * Ces cas sont écrits SANS regarder le dictionnaire de synonymes
 * ou le catalogue de fiches. Ils mesurent la qualité RÉELLE telle
 * que vue par un utilisateur qui formule son problème à sa manière.
 *
 * Le seuil (85%) est un plancher de régression, pas une cible. Si
 * ce test échoue, un fix récent a dégradé la qualité adversarial.
 *
 * NE PAS viser 100% en "corrigeant" les cas — corriger le pipeline.
 *
 * SKIP by default: requires ANTHROPIC_API_KEY and costs ~20 API calls per run.
 * Run explicitly with: RUN_ADVERSARIAL_EVAL=1 node --test test/adversarial-eval.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ADVERSARIAL_CASES } from './adversarial-cases.mjs';
import { triage } from '../src/services/triage-engine.mjs';
import { queryComplete } from '../src/services/knowledge-engine.mjs';

const SHOULD_RUN = process.env.RUN_ADVERSARIAL_EVAL === '1' && !!process.env.ANTHROPIC_API_KEY;

const REGRESSION_FLOOR = 85; // global score must stay ≥ this value
const DOMAIN_ACCURACY_FLOOR = 95; // domain accuracy must stay ≥ this value

describe('Adversarial eval (LLM-first, non-regression)', { skip: !SHOULD_RUN }, () => {
  it(`global score ≥ ${REGRESSION_FLOOR}%, domain accuracy ≥ ${DOMAIN_ACCURACY_FLOOR}%`, async () => {
    const results = [];
    for (const gc of ADVERSARIAL_CASES) {
      const r = await triage(gc.query, gc.canton);
      const d = r?.data || {};
      let articleRefs = [];
      if (d.ficheId) {
        const complete = queryComplete(d.ficheId);
        if (complete.status === 200 && complete.data?.articles) {
          articleRefs = complete.data.articles.map(a => a.ref);
        }
      }
      const domainCorrect = d.domaine === gc.expected_domaine;
      const articleFound = articleRefs.some(ref => gc.expected_any_article.includes(ref));
      // Simple weighted score: found=2, domain=3, article=3, contacts=1, delais=1 → max 10
      let points = 0;
      if (d.trouve) points += 2;
      if (domainCorrect) points += 3;
      if (articleFound) points += 3;
      if ((d.contacts || []).length > 0) points += 1;
      if ((d.delaisCritiques || []).length > 0) points += 1;
      results.push({
        id: gc.id,
        score: Math.round((points / 10) * 100),
        domainCorrect,
        articleFound,
      });
    }

    const globalScore = Math.round(
      results.reduce((s, r) => s + r.score, 0) / results.length
    );
    const domainAccuracy = Math.round(
      (results.filter(r => r.domainCorrect).length / results.length) * 100
    );

    const failed = results.filter(r => r.score < 100);
    const msg = [
      `Global: ${globalScore}%   Domain: ${domainAccuracy}%`,
      `Failing cases (${failed.length}/${results.length}):`,
      ...failed.map(r => `  ${r.id}: ${r.score}% (domain=${r.domainCorrect} article=${r.articleFound})`),
    ].join('\n');

    assert.ok(
      globalScore >= REGRESSION_FLOOR,
      `Adversarial regression: global ${globalScore}% < ${REGRESSION_FLOOR}%\n${msg}`
    );
    assert.ok(
      domainAccuracy >= DOMAIN_ACCURACY_FLOOR,
      `Adversarial regression: domain ${domainAccuracy}% < ${DOMAIN_ACCURACY_FLOOR}%\n${msg}`
    );
  });
});
