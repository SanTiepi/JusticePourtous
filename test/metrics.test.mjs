import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { recordHttp, recordError, snapshot, reset } from '../src/services/metrics.mjs';

describe('metrics — recordHttp', () => {
  beforeEach(() => reset());

  it('increments total + maps status classes 2xx/3xx/4xx/5xx', () => {
    recordHttp({ path: '/a', status: 200, duration_ms: 10 });
    recordHttp({ path: '/b', status: 301, duration_ms: 5 });
    recordHttp({ path: '/c', status: 404, duration_ms: 2 });
    recordHttp({ path: '/d', status: 500, duration_ms: 99 });
    const s = snapshot();
    assert.equal(s.http.total, 4);
    assert.equal(s.http.by_class['2xx'], 1);
    assert.equal(s.http.by_class['3xx'], 1);
    assert.equal(s.http.by_class['4xx'], 1);
    assert.equal(s.http.by_class['5xx'], 1);
  });

  it('normalizes hex ids → /:id', () => {
    recordHttp({ path: '/api/case/deadbeef1234/letter', status: 200, duration_ms: 1 });
    const s = snapshot();
    const paths = s.http.top_paths.map(p => p.path);
    assert.ok(paths.includes('/api/case/:id/letter'), `got ${JSON.stringify(paths)}`);
  });

  it('normalizes numeric ids → /:num', () => {
    recordHttp({ path: '/api/users/42', status: 200, duration_ms: 1 });
    const s = snapshot();
    assert.ok(s.http.top_paths.some(p => p.path === '/api/users/:num'));
  });

  it('top_paths sorted by count desc and capped at 20', () => {
    for (let i = 0; i < 25; i++) {
      const hits = 25 - i;
      for (let j = 0; j < hits; j++) recordHttp({ path: `/p${i}`, status: 200, duration_ms: 1 });
    }
    const s = snapshot();
    assert.equal(s.http.top_paths.length, 20);
    for (let i = 1; i < s.http.top_paths.length; i++) {
      assert.ok(s.http.top_paths[i - 1].count >= s.http.top_paths[i].count, 'not sorted desc');
    }
  });

  it('computes avg_duration_ms correctly', () => {
    recordHttp({ path: '/a', status: 200, duration_ms: 100 });
    recordHttp({ path: '/b', status: 200, duration_ms: 200 });
    const s = snapshot();
    assert.equal(s.http.avg_duration_ms, 150);
  });
});

describe('metrics — recordError', () => {
  beforeEach(() => reset());

  it('increments errors counter keyed by module:event', () => {
    recordError('triage', 'llm_failed');
    recordError('triage', 'llm_failed');
    recordError('triage', 'llm_timeout');
    const { errors } = snapshot();
    const key = errors.find(e => e.key === 'triage:llm_failed');
    assert.ok(key);
    assert.equal(key.count, 2);
    assert.ok(errors.some(e => e.key === 'triage:llm_timeout' && e.count === 1));
  });
});

describe('metrics — snapshot & reset', () => {
  beforeEach(() => reset());

  it('snapshot returns uptime_ms, http, errors', () => {
    const s = snapshot();
    assert.ok(typeof s.uptime_ms === 'number' && s.uptime_ms >= 0);
    assert.ok(s.http && typeof s.http.total === 'number');
    assert.ok(Array.isArray(s.errors));
  });

  it('reset clears all counters and resets started_at', async () => {
    recordHttp({ path: '/x', status: 200, duration_ms: 5 });
    recordError('m', 'e');
    await new Promise(r => setTimeout(r, 5));
    reset();
    const s = snapshot();
    assert.equal(s.http.total, 0);
    assert.equal(s.http.by_class['2xx'], 0);
    assert.equal(s.http.top_paths.length, 0);
    assert.equal(s.errors.length, 0);
    assert.ok(s.uptime_ms < 1000);
  });
});
