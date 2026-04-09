import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestions, generateDossierQuestions, FACT_DIMENSIONS } from '../src/services/marginal-questioner.mjs';

describe('Marginal Value Questioner', () => {

  it('has at least 5 fact dimensions', () => {
    assert.ok(FACT_DIMENSIONS.length >= 5);
  });

  it('each dimension has id, question, why, impacts, detect_missing', () => {
    for (const fd of FACT_DIMENSIONS) {
      assert.ok(fd.id, 'missing id');
      assert.ok(fd.question, `${fd.id} missing question`);
      assert.ok(fd.why, `${fd.id} missing why`);
      assert.ok(Array.isArray(fd.impacts), `${fd.id} impacts not array`);
      assert.ok(typeof fd.detect_missing === 'function', `${fd.id} detect_missing not function`);
    }
  });

  it('empty comprehension returns questions for all missing facts', () => {
    const qs = generateQuestions({ faits: [], documents: [] });
    assert.ok(qs.length > 0, 'Should have questions for empty comprehension');
    assert.ok(qs.length <= 3, 'Should be max 3 questions');
  });

  it('comprehension with canton filled does not ask for canton', () => {
    const qs = generateQuestions({ canton: 'VD', faits: [], documents: [] });
    assert.ok(!qs.some(q => q.id === 'canton'), 'Should not ask for canton when provided');
  });

  it('comprehension with duration filled does not ask for duration', () => {
    const qs = generateQuestions({ faits: ['depuis 6 mois'], documents: [] });
    assert.ok(!qs.some(q => q.id === 'duree'), 'Should not ask for duration when mentioned');
  });

  it('questions are ranked by score (descending)', () => {
    const qs = generateQuestions({ faits: [], documents: [] }, null, null, 5);
    for (let i = 1; i < qs.length; i++) {
      assert.ok(qs[i].score <= qs[i-1].score, `Question ${i} score ${qs[i].score} > ${qs[i-1].score}`);
    }
  });

  it('canton question scores high for bail domain', () => {
    const qs = generateQuestions(
      { faits: [], documents: [] },
      { domaine: 'bail' },
      { critical_fails: ['delai'] },
      10
    );
    const cantonQ = qs.find(q => q.id === 'canton');
    assert.ok(cantonQ, 'Canton should be in questions');
    assert.ok(cantonQ.score >= 3, 'Canton should score high');
  });

  it('anciennete question scores high for travail domain', () => {
    const qs = generateQuestions(
      { faits: [], documents: [] },
      { domaine: 'travail' },
      null,
      10
    );
    const ancQ = qs.find(q => q.id === 'anciennete');
    assert.ok(ancQ, 'Anciennete should be in questions for travail');
    assert.ok(ancQ.score >= 3, 'Anciennete should score high for travail');
  });

  it('null comprehension returns empty array', () => {
    const qs = generateQuestions(null);
    assert.equal(qs.length, 0);
  });

  it('generateDossierQuestions works with full context', () => {
    const qs = generateDossierQuestions(
      { faits: [], documents: [], canton: null },
      { issues: [{ domaine: 'bail' }] },
      { issues: [{ critical_fails: ['delai'] }] },
      3
    );
    assert.ok(qs.length > 0);
    assert.ok(qs.length <= 3);
  });
});
