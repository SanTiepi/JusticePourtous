/**
 * Tests Cortex Caselaw 2.0 — pipeline provider → normalizer → resolver →
 * classifier → holding-extractor → leading-case-ranker.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OpenCaseLawProvider } from '../src/services/caselaw/provider-opencaselaw.mjs';
import { EntscheidsucheProvider } from '../src/services/caselaw/provider-entscheidsuche.mjs';
import { normalizeDecision, dedupeDecisions, hashDecision, normalizeCourt, deriveTier, detectLanguage } from '../src/services/caselaw/decision-normalizer.mjs';
import { resolveArticlesForDecision, extractFromText, fromRawReferences } from '../src/services/caselaw/article-resolver.mjs';
import { classifyRole } from '../src/services/caselaw/role-classifier.mjs';
import { extractHoldingForDecision, extractHolding, classifyHoldingType } from '../src/services/caselaw/holding-extractor.mjs';
import { rankDecisions, scoreDecision, recencyBonus, tierScore } from '../src/services/caselaw/leading-case-ranker.mjs';
import { buildCanonForFiche, getCanonCompleteness } from '../src/services/caselaw/index.mjs';

// ─── Provider base ────────────────────────────────────────────

describe('caselaw — providers', () => {
  it('OpenCaseLaw mock retourne des décisions bien formées', async () => {
    const p = new OpenCaseLawProvider({ mode: 'mock' });
    const decisions = await p.search({ domain: 'bail', limit: 10 });
    assert.ok(Array.isArray(decisions));
    assert.ok(decisions.length > 0);
    for (const d of decisions) {
      assert.equal(d.provider_source, 'opencaselaw');
      assert.ok(d.external_id);
      assert.ok(d.signature);
      assert.ok(d.court);
      assert.ok(d.instance);
      assert.ok(d.date);
    }
  });

  it('Entscheidsuche mock retourne des décisions bien formées', async () => {
    const p = new EntscheidsucheProvider({ mode: 'mock' });
    const decisions = await p.search({ domain: 'travail', canton: 'VD', limit: 5 });
    assert.ok(decisions.length > 0);
    for (const d of decisions) {
      assert.equal(d.provider_source, 'entscheidsuche');
      assert.equal(d.canton, 'VD');
      assert.equal(d.domain || d.domaine || null, null); // pas exposé au niveau raw
    }
  });

  it('provider health retourne enabled + mode', () => {
    const p = new OpenCaseLawProvider({ mode: 'mock' });
    const h = p.getHealth();
    assert.equal(h.enabled, true);
    assert.equal(h.mode, 'mock');
  });
});

// ─── Normalizer ───────────────────────────────────────────────

describe('caselaw — normalizer', () => {
  it('normalizeCourt slug correct pour TF / cantonal / admin', () => {
    assert.equal(normalizeCourt('Tribunal fédéral').court_id, 'tf');
    assert.equal(normalizeCourt('Tribunal fédéral').instance, 'tribunal_federal');
    assert.equal(normalizeCourt('Cour de justice GE').court_id, 'ge-cj');
    assert.equal(normalizeCourt('Cour de justice GE').instance, 'cantonal_superior');
    assert.equal(normalizeCourt('Tribunal cantonal VD').court_id, 'vd-tc');
    assert.equal(normalizeCourt('Office des poursuites').instance, 'administrative');
    assert.equal(normalizeCourt(null).instance, 'unknown');
  });

  it('deriveTier : ATF=1, TF non-publié=2, cantonal=3, admin=4', () => {
    assert.equal(deriveTier({ instance: 'tribunal_federal' }, 'published', 'ATF 140 III 215').tier, 1);
    assert.equal(deriveTier({ instance: 'tribunal_federal' }, 'unofficial', '4A_32/2018').tier, 2);
    assert.equal(deriveTier({ instance: 'cantonal_superior' }, 'unofficial', 'X').tier, 3);
    assert.equal(deriveTier({ instance: 'administrative' }, 'unknown', '').tier, 4);
  });

  it('detectLanguage FR/DE/IT depuis texte', () => {
    assert.equal(detectLanguage({ text_excerpt: 'Le tribunal considère que dans cette affaire une décision doit être prise avec pour motif' }), 'fr');
    assert.equal(detectLanguage({ text_excerpt: 'Das Bundesgericht erwägt und nicht anders zu entscheiden werden wird' }), 'de');
    assert.equal(detectLanguage({ text_excerpt: 'Considerato che una decisione non può essere con questo motivo' }), 'it');
  });

  it('normalizeDecision produit un DecisionCanonical avec tier et decision_id', () => {
    const raw = {
      provider_source: 'opencaselaw',
      external_id: 'x1',
      signature: 'ATF 140 III 215',
      court: 'Tribunal fédéral',
      canton: 'CH',
      date: '2014-03-15',
      title: 'Test',
      abstract: 'Le tribunal retient que',
      references: ['CO 259a'],
      published: 'official'
    };
    const norm = normalizeDecision(raw);
    assert.ok(norm.decision_id);
    assert.equal(norm.tier, 1);
    assert.equal(norm.instance_level, 'tribunal_federal');
    assert.equal(norm.year, 2014);
    assert.ok(norm.ingested_at);
  });

  it('dedupeDecisions élimine les doublons cross-provider', () => {
    const a = { decision_id: 'aaa', title: 'x' };
    const b = { decision_id: 'bbb', title: 'y' };
    const c = { decision_id: 'aaa', title: 'x-duplicate' };
    const out = dedupeDecisions([a, b, c]);
    assert.equal(out.length, 2);
  });
});

// ─── Article resolver ─────────────────────────────────────────

describe('caselaw — article-resolver', () => {
  it('extractFromText détecte "CO 259a"', () => {
    const refs = extractFromText('Le tribunal considère selon l\'art. CO 259a que le bailleur doit...');
    assert.ok(refs.length >= 1);
    assert.ok(refs.some(r => r.ref === 'CO 259a'));
  });

  it('fromRawReferences parse "CO 259a" et "art. 259a CO"', () => {
    const out = fromRawReferences(['CO 259a', 'art. 274 CO']);
    assert.ok(out.some(r => r.ref === 'CO 259a'));
    assert.ok(out.some(r => r.ref === 'CO 274'));
  });

  it('resolveArticlesForDecision remplit article_refs_resolved avec source_id', () => {
    const decision = {
      references_raw: ['CO 259a', 'LP 74'],
      abstract: 'Le tribunal applique CO 259a.',
      text_excerpt: 'Selon l\'art. CO 259a le bailleur...',
      title: null
    };
    const enriched = resolveArticlesForDecision(decision);
    assert.ok(Array.isArray(enriched.article_refs_resolved));
    assert.ok(enriched.article_refs_count >= 2);
    const co = enriched.article_refs_resolved.find(r => r.ref === 'CO 259a');
    assert.ok(co);
    assert.ok(co.source_id);
    assert.equal(co.resolved, true);
    assert.ok(enriched.article_refs_resolution_pct >= 50);
  });
});

// ─── Role classifier ──────────────────────────────────────────

describe('caselaw — role-classifier', () => {
  it('outcome admis → role favorable si domaine fourni', () => {
    const d = {
      tier: 2,
      outcome_raw: 'admis',
      title: 'Bail',
      abstract: 'Le locataire obtient gain de cause',
      text_excerpt: '',
      references_raw: []
    };
    const r = classifyRole(d, 'bail');
    assert.ok(['favorable', 'nuance', 'neutre'].includes(r.role_citizen));
  });

  it('outcome rejeté → role defavorable + contra_strength', () => {
    const d = { tier: 2, outcome_raw: 'rejeté', title: '', abstract: '', text_excerpt: '', references_raw: [] };
    const r = classifyRole(d, 'bail');
    assert.equal(r.role_citizen, 'defavorable');
    assert.ok(r.contra_strength >= 3);
  });

  it('outcome partiellement → nuance', () => {
    const d = { tier: 2, outcome_raw: 'partiellement_admis', title: '', abstract: '', text_excerpt: '', references_raw: [] };
    const r = classifyRole(d, 'bail');
    assert.equal(r.role_citizen, 'nuance');
  });
});

// ─── Holding extractor ────────────────────────────────────────

describe('caselaw — holding-extractor', () => {
  it('extractHolding capture phrase-marqueur', () => {
    const d = { abstract: 'Considérant que le bailleur doit supporter les défauts structurels selon la jurisprudence constante applicable dans ce domaine.', text_excerpt: '' };
    const holding = extractHolding(d);
    assert.ok(holding);
    assert.ok(holding.length >= 50);
  });

  it('extractHoldingForDecision pose holding_validated false si rien d\'extractible', () => {
    const d = { abstract: 'court', text_excerpt: '' };
    const r = extractHoldingForDecision(d);
    assert.equal(r.holding_validated, false);
  });

  it('classifyHoldingType détecte exception / nuance / rejet', () => {
    assert.equal(classifyHoldingType('sauf si le défaut est causé par X', 'favorable'), 'exception');
    assert.equal(classifyHoldingType('à condition que les délais soient respectés', 'favorable'), 'nuance');
    assert.equal(classifyHoldingType('', 'defavorable'), 'rejet');
    assert.equal(classifyHoldingType('le tribunal retient que', 'favorable'), 'regle');
  });
});

// ─── Leading case ranker ──────────────────────────────────────

describe('caselaw — leading-case-ranker', () => {
  it('tierScore décroît avec le tier', () => {
    assert.ok(tierScore(1) > tierScore(2));
    assert.ok(tierScore(2) > tierScore(3));
    assert.ok(tierScore(3) > tierScore(4));
  });

  it('recencyBonus élevé pour récent, 0 pour très ancien', () => {
    assert.ok(recencyBonus(new Date().getFullYear() - 2) >= 10);
    assert.equal(recencyBonus(1980), 0);
    assert.equal(recencyBonus(null), 0);
  });

  it('rankDecisions sépare leading / nuances / cantonal_practice', () => {
    const base = {
      article_refs_resolved: [{ ref: 'CO 259a', resolved: true }],
      holding_validated: true,
      holding_text: 'x'.repeat(60),
      citizen_summary: 'summary',
      year: 2022
    };
    const input = [
      { ...base, decision_id: 'a', tier: 1, role_citizen: 'favorable', canton: 'CH' },
      { ...base, decision_id: 'b', tier: 2, role_citizen: 'nuance', canton: 'CH' },
      { ...base, decision_id: 'c', tier: 3, role_citizen: 'favorable', canton: 'VD' },
      { ...base, decision_id: 'd', tier: 3, role_citizen: 'nuance', canton: 'GE' },
      { ...base, decision_id: 'e', tier: 4, role_citizen: 'defavorable', canton: 'VD', contra_strength: 4 }
    ];
    const ranked = rankDecisions(input, { citizenCanton: 'VD' });
    assert.ok(ranked.leading_cases.length >= 1);
    assert.ok(ranked.cantonal_practice.length >= 1);
    // Priorité canton VD dans cantonal_practice
    assert.equal(ranked.cantonal_practice[0].canton, 'VD');
  });

  it('ranker filtre les décisions sans holding_validated', () => {
    const input = [
      { decision_id: 'a', tier: 1, role_citizen: 'favorable', holding_validated: false, article_refs_resolved: [] }
    ];
    const ranked = rankDecisions(input);
    assert.equal(ranked.leading_cases.length, 0);
  });
});

// ─── Pipeline bout-en-bout ────────────────────────────────────

describe('caselaw — pipeline end-to-end', () => {
  it('buildCanonForFiche produit leading + nuances + cantonal_practice', async () => {
    const fiche = {
      id: 'bail_test',
      domaine: 'bail',
      tags: ['moisissure'],
      reponse: { articles: [{ ref: 'CO 259a' }] }
    };
    const canon = await buildCanonForFiche(fiche, { citizenCanton: 'VD' });
    assert.ok(Array.isArray(canon.leading_cases));
    assert.ok(Array.isArray(canon.nuances));
    assert.ok(Array.isArray(canon.cantonal_practice));
    assert.ok(Array.isArray(canon.similar_cases));
    assert.ok(canon.leading_cases.length > 0, 'avec mocks enrichis, leading_cases doit être non-vide');
    for (const lc of canon.leading_cases) {
      assert.ok(lc.tier <= 2);
      assert.ok(lc.holding_validated);
      assert.ok(lc.citizen_summary);
    }
  });

  it('getCanonCompleteness retourne canon_complete sur fiche bail enrichie', async () => {
    const fiche = {
      id: 'bail_defaut',
      domaine: 'bail',
      tags: ['moisissure', 'défaut'],
      reponse: { articles: [{ ref: 'CO 259a' }] }
    };
    const cc = await getCanonCompleteness(fiche, { citizenCanton: 'VD' });
    assert.equal(cc.canon_complete, true, 'canon doit être complet avec mocks');
    assert.equal(cc.max_score, 4);
    assert.ok(cc.score >= 3);
  });

  it('buildCanonForFiche gère fiche sans domaine → tableaux vides', async () => {
    const canon = await buildCanonForFiche({ id: 'x' });
    assert.equal(canon.leading_cases.length, 0);
    assert.equal(canon.nuances.length, 0);
    assert.equal(canon.cantonal_practice.length, 0);
  });

  it('cantonal_practice priorise le canton du citoyen', async () => {
    const fiche = {
      id: 'bail_test2',
      domaine: 'bail',
      tags: ['moisissure'],
      reponse: { articles: [{ ref: 'CO 259a' }] }
    };
    const canonVD = await buildCanonForFiche(fiche, { citizenCanton: 'VD' });
    if (canonVD.cantonal_practice.length > 0) {
      // Le premier élément doit être VD si un match VD existe
      const vdFirst = canonVD.cantonal_practice[0].canton === 'VD';
      const allCantons = canonVD.cantonal_practice.map(c => c.canton);
      assert.ok(vdFirst || !allCantons.includes('VD'),
        'Si VD existe dans le pool cantonal_practice, il doit être premier');
    }
  });
});
