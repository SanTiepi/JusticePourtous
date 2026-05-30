/**
 * Tests directs pour cantonal-juris-matcher.mjs — fonction scoreMatch.
 *
 * scoreMatch(fiche, decision, citoyenCanton) est la logique de scoring
 * des décisions cantonales. Elle n'est pas exportée publiquement et n'était
 * couverte qu'indirectement via findCantonalMatches dans phase-cortex-cantonal-juris.test.mjs.
 *
 * 5 dimensions testées :
 *   - domaine (strict, retourne 0 si différent)
 *   - canton (exact match +5, autre canton +2, pas de canton = +0)
 *   - articles partagés (+5 par article commun, case-insensitive, trim)
 *   - tags matchés (+2 par tag dans title/summary)
 *   - combinaisons + guards entrées dégénérées
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { _internals } from '../src/services/cantonal-juris-matcher.mjs';

const { scoreMatch } = _internals;

// ─── Fixtures ────────────────────────────────────────────────────────────────

function mkFiche(overrides = {}) {
  return {
    domaine: 'bail',
    tags: [],
    reponse: { articles: [] },
    ...overrides,
  };
}

function mkDecision(overrides = {}) {
  return {
    domaine: 'bail',
    canton: 'VD',
    references: [],
    title: '',
    summary: '',
    ...overrides,
  };
}

// ─── Suite 1 : domaine — condition obligatoire ────────────────────────────────

describe('scoreMatch — domaine (condition obligatoire)', () => {
  it('domaine identique → score > 0 (même sans autres matches)', () => {
    const fiche = mkFiche({ domaine: 'bail' });
    const decision = mkDecision({ domaine: 'bail', canton: 'VD' });
    const score = scoreMatch(fiche, decision, null);
    assert.ok(score > 0, `score devrait être > 0, reçu ${score}`);
  });

  it('domaine différent → score = 0 strictement', () => {
    const fiche = mkFiche({ domaine: 'bail' });
    const decision = mkDecision({ domaine: 'travail' });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });

  it('decision sans domaine → score = 0', () => {
    const fiche = mkFiche({ domaine: 'bail' });
    const decision = mkDecision({ domaine: undefined });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });

  it('decision domaine null → score = 0', () => {
    const fiche = mkFiche({ domaine: 'bail' });
    const decision = mkDecision({ domaine: null });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });

  it('domaines bail et travail tous deux valides — cross-domain = 0', () => {
    const fiche = mkFiche({ domaine: 'travail' });
    const decision = mkDecision({ domaine: 'bail' });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });
});

// ─── Suite 2 : canton scoring ─────────────────────────────────────────────────

describe('scoreMatch — canton scoring', () => {
  it('citoyenCanton exact match → +5', () => {
    const fiche = mkFiche();
    const decision = mkDecision({ canton: 'VD' });
    const score = scoreMatch(fiche, decision, 'VD');
    assert.equal(score, 5);
  });

  it('citoyenCanton différent, decision.canton présent → +2', () => {
    const fiche = mkFiche();
    const decision = mkDecision({ canton: 'GE' });
    const score = scoreMatch(fiche, decision, 'VD');
    assert.equal(score, 2);
  });

  it('citoyenCanton null, decision.canton présent → +2', () => {
    const fiche = mkFiche();
    const decision = mkDecision({ canton: 'VD' });
    const score = scoreMatch(fiche, decision, null);
    assert.equal(score, 2);
  });

  it('citoyenCanton défini, decision.canton absent → +0 (pas de bonus canton)', () => {
    const fiche = mkFiche();
    const decision = mkDecision({ canton: undefined });
    const score = scoreMatch(fiche, decision, 'VD');
    assert.equal(score, 0);
  });

  it('canton exact match > autre canton (comparaison)', () => {
    const fiche = mkFiche();
    const dec_exact = mkDecision({ canton: 'BE' });
    const dec_autre = mkDecision({ canton: 'ZH' });
    assert.ok(scoreMatch(fiche, dec_exact, 'BE') > scoreMatch(fiche, dec_autre, 'BE'));
  });
});

// ─── Suite 3 : articles partagés (+5 par article en commun) ──────────────────

describe('scoreMatch — articles partagés', () => {
  it('0 article commun → contribution articles = 0', () => {
    const fiche = mkFiche({ reponse: { articles: [{ ref: 'CO 259a' }] } });
    const decision = mkDecision({ canton: null, references: ['CO 271'] });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });

  it('1 article commun → +5', () => {
    const fiche = mkFiche({ reponse: { articles: [{ ref: 'CO 259a' }] } });
    const decision = mkDecision({ canton: null, references: ['CO 259a'] });
    assert.equal(scoreMatch(fiche, decision, null), 5);
  });

  it('2 articles communs → +10', () => {
    const fiche = mkFiche({ reponse: { articles: [{ ref: 'CO 259a' }, { ref: 'CO 259d' }] } });
    const decision = mkDecision({ canton: null, references: ['CO 259a', 'CO 259d'] });
    assert.equal(scoreMatch(fiche, decision, null), 10);
  });

  it('match insensible à la casse', () => {
    const fiche = mkFiche({ reponse: { articles: [{ ref: 'CO 259A' }] } });
    const decision = mkDecision({ canton: null, references: ['co 259a'] });
    assert.equal(scoreMatch(fiche, decision, null), 5);
  });

  it('trim autour des références', () => {
    const fiche = mkFiche({ reponse: { articles: [{ ref: '  CO 259a  ' }] } });
    const decision = mkDecision({ canton: null, references: ['CO 259a'] });
    assert.equal(scoreMatch(fiche, decision, null), 5);
  });

  it('article sans ref ignoré sans crash', () => {
    const fiche = mkFiche({ reponse: { articles: [{ ref: '' }, { ref: 'CO 259a' }] } });
    const decision = mkDecision({ canton: null, references: ['CO 259a'] });
    assert.equal(scoreMatch(fiche, decision, null), 5);
  });

  it('fiche sans articles → 0 articles partagés', () => {
    const fiche = mkFiche({ reponse: { articles: [] } });
    const decision = mkDecision({ canton: null, references: ['CO 259a'] });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });

  it('fiche reponse null → pas de crash, 0 articles', () => {
    const fiche = mkFiche({ reponse: null });
    const decision = mkDecision({ canton: null, references: ['CO 259a'] });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });
});

// ─── Suite 4 : tag matching (+2 par tag dans title ou summary) ────────────────

describe('scoreMatch — tag matching', () => {
  it('tag présent dans title → +2', () => {
    const fiche = mkFiche({ tags: ['résiliation'] });
    const decision = mkDecision({ canton: null, title: 'Affaire de résiliation de bail VD' });
    assert.equal(scoreMatch(fiche, decision, null), 2);
  });

  it('tag présent dans summary → +2', () => {
    const fiche = mkFiche({ tags: ['moisissure'] });
    const decision = mkDecision({ canton: null, summary: 'Le locataire signale une moisissure dans les murs.' });
    assert.equal(scoreMatch(fiche, decision, null), 2);
  });

  it('tag absent de title et summary → +0', () => {
    const fiche = mkFiche({ tags: ['caution'] });
    const decision = mkDecision({ canton: null, title: 'Résiliation pour faute', summary: 'Bailleur et locataire.' });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });

  it('2 tags matchés → +4', () => {
    const fiche = mkFiche({ tags: ['résiliation', 'locataire'] });
    const decision = mkDecision({ canton: null, title: 'Résiliation pour un locataire' });
    assert.equal(scoreMatch(fiche, decision, null), 4);
  });

  it('matching insensible à la casse (tag en minuscule, decision en majuscule)', () => {
    const fiche = mkFiche({ tags: ['résiliation'] });
    const decision = mkDecision({ canton: null, title: 'RÉSILIATION DE BAIL' });
    assert.equal(scoreMatch(fiche, decision, null), 2);
  });

  it('fiche sans tags → 0 tags matchés', () => {
    const fiche = mkFiche({ tags: [] });
    const decision = mkDecision({ canton: null, title: 'Résiliation de bail VD' });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });

  it('fiche tags null → pas de crash, 0 tags', () => {
    const fiche = mkFiche({ tags: null });
    const decision = mkDecision({ canton: null, title: 'Résiliation de bail VD' });
    assert.equal(scoreMatch(fiche, decision, null), 0);
  });
});

// ─── Suite 5 : scores combinés et guards ────────────────────────────────────

describe('scoreMatch — scores combinés', () => {
  it('canton exact + 1 article commun → 5 + 5 = 10', () => {
    const fiche = mkFiche({ reponse: { articles: [{ ref: 'CO 259a' }] } });
    const decision = mkDecision({ canton: 'VD', references: ['CO 259a'] });
    assert.equal(scoreMatch(fiche, decision, 'VD'), 10);
  });

  it('canton exact + 1 article + 1 tag → 5 + 5 + 2 = 12', () => {
    const fiche = mkFiche({
      tags: ['moisissure'],
      reponse: { articles: [{ ref: 'CO 259a' }] },
    });
    const decision = mkDecision({
      canton: 'VD',
      references: ['CO 259a'],
      title: 'Moisissure dans appartement',
    });
    assert.equal(scoreMatch(fiche, decision, 'VD'), 12);
  });

  it('autre canton + 2 articles + 2 tags → 2 + 10 + 4 = 16', () => {
    const fiche = mkFiche({
      tags: ['résiliation', 'locataire'],
      reponse: { articles: [{ ref: 'CO 271' }, { ref: 'CO 271a' }] },
    });
    const decision = mkDecision({
      canton: 'GE',
      references: ['CO 271', 'CO 271a'],
      title: 'Résiliation abusive — locataire',
    });
    assert.equal(scoreMatch(fiche, decision, 'VD'), 16);
  });

  it('domaine différent ignore tout le reste (score = 0 même si articles et tags matchent)', () => {
    const fiche = mkFiche({
      domaine: 'bail',
      tags: ['résiliation'],
      reponse: { articles: [{ ref: 'CO 271' }] },
    });
    const decision = mkDecision({
      domaine: 'travail',
      canton: 'VD',
      references: ['CO 271'],
      title: 'Résiliation',
    });
    assert.equal(scoreMatch(fiche, decision, 'VD'), 0);
  });

  it('fiche et decision minimales (domaine seulement + canton) → score positif', () => {
    const fiche = mkFiche();
    const decision = mkDecision({ canton: 'VD' });
    assert.ok(scoreMatch(fiche, decision, 'VD') > 0);
  });
});
