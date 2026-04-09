import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeAge, loadLocalArticles } from '../scripts/freshness-check.mjs';

describe('Freshness Check', () => {
  it('computeAge: recent date is not stale', () => {
    const recent = new Date().toISOString();
    const { stale } = computeAge(recent);
    assert.equal(stale, false);
  });

  it('computeAge: 1 year old is stale', () => {
    const old = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const { stale } = computeAge(old);
    assert.equal(stale, true);
  });

  it('computeAge: null date is stale + unknown', () => {
    const { stale, age_label } = computeAge(null);
    assert.equal(stale, true);
    assert.equal(age_label, 'unknown');
  });

  it('computeAge: invalid date is stale', () => {
    const { stale } = computeAge('not-a-date');
    assert.equal(stale, true);
  });

  it('loadLocalArticles returns non-empty array', () => {
    const articles = loadLocalArticles();
    assert.ok(articles.length > 0, 'Should have articles');
  });

  it('most articles have harvestDate', () => {
    const articles = loadLocalArticles();
    const withDate = articles.filter(a => a.harvestDate);
    const ratio = withDate.length / articles.length;
    assert.ok(ratio > 0.5, `Only ${Math.round(ratio*100)}% have harvestDate`);
  });

  it('most articles with Fedlex URLs are fresh (< 6 months)', () => {
    const articles = loadLocalArticles();
    const fedlex = articles.filter(a => a.lienFedlex && a.harvestDate);
    const fresh = fedlex.filter(a => !computeAge(a.harvestDate).stale);
    if (fedlex.length === 0) return; // skip if no fedlex articles
    const ratio = fresh.length / fedlex.length;
    assert.ok(ratio > 0.5, `Only ${Math.round(ratio*100)}% Fedlex articles are fresh`);
  });
});
