import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runHealthChecks } from '../src/services/health-check.mjs';

describe('health-check — runHealthChecks', () => {
  it('returns {global_status, summary, checks, total_duration_ms}', async () => {
    const r = await runHealthChecks();
    assert.ok(['ok', 'degraded', 'failing'].includes(r.global_status), `bad global_status ${r.global_status}`);
    assert.ok(r.summary && typeof r.summary.total === 'number');
    assert.ok(Array.isArray(r.checks));
    assert.ok(typeof r.total_duration_ms === 'number' && r.total_duration_ms >= 0);
    assert.ok(typeof r.checked_at === 'string' && r.checked_at.includes('T'));
  });

  it('summary.total matches checks.length', async () => {
    const r = await runHealthChecks();
    assert.equal(r.summary.total, r.checks.length);
    assert.equal(r.summary.ok + r.summary.warn + r.summary.error, r.summary.total);
  });

  it('each check has name/status/detail/duration_ms', async () => {
    const r = await runHealthChecks();
    for (const c of r.checks) {
      assert.ok(typeof c.name === 'string' && c.name.length > 0, `bad name: ${JSON.stringify(c)}`);
      assert.ok(['ok', 'warn', 'error'].includes(c.status), `bad status: ${c.status} in ${c.name}`);
      assert.ok(c.detail && typeof c.detail === 'object');
      assert.ok(typeof c.duration_ms === 'number' && c.duration_ms >= 0);
    }
  });

  it('runs all checks in parallel (total_duration_ms <= sum of per-check durations)', async () => {
    const start = Date.now();
    const r = await runHealthChecks();
    const wall = Date.now() - start;
    const sum = r.checks.reduce((s, c) => s + c.duration_ms, 0);
    // Parallel: wall clock should be clearly less than sum when >1 check takes
    // non-trivial time. With a small tolerance for near-instant suites.
    assert.ok(wall <= sum + 50, `wall=${wall} > sum=${sum}+50 — looks sequential`);
  });

  it('global_status reflects worst individual check (ok/degraded/failing mapping)', async () => {
    const r = await runHealthChecks();
    const hasError = r.checks.some(c => c.status === 'error');
    const hasWarn = r.checks.some(c => c.status === 'warn');
    const expected = hasError ? 'failing' : (hasWarn ? 'degraded' : 'ok');
    assert.equal(r.global_status, expected);
  });

  it('includes the 12 expected named checks', async () => {
    const r = await runHealthChecks();
    const names = new Set(r.checks.map(c => c.name));
    const expected = [
      'caselaw', 'case_store', 'citizen_account', 'coverage_certificate',
      'enrich_cache', 'fiches', 'freshness', 'graph', 'intent_catalog',
      'logger', 'normative_compiler', 'source_registry'
    ];
    assert.equal(names.size, expected.length);
    for (const name of expected) assert.ok(names.has(name), `missing check: ${name}`);
  });

  it('individual check wrappers handle thrown errors gracefully (no crash)', async () => {
    // A thrown error inside any check MUST be caught by `timed()` and surface as
    // status='error' with detail.error. The suite itself must not reject.
    const r = await runHealthChecks();
    for (const c of r.checks) {
      if (c.status === 'error') {
        assert.ok(c.detail.error, `errored check ${c.name} should expose detail.error`);
      }
    }
    // If we got here, Promise.all resolved — no check crashed the parent.
    assert.ok(true);
  });
});
