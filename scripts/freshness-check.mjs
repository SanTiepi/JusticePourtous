/**
 * Freshness Check — Détecte les articles potentiellement obsolètes
 *
 * Compare nos articles stockés avec les métadonnées Fedlex.
 * Signale : articles modifiés, abrogés, ou non vérifiés depuis > 6 mois.
 *
 * Usage: node scripts/freshness-check.mjs
 * Output: src/data/meta/freshness-report.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const loiDir = join(dataDir, 'loi');
const metaDir = join(dataDir, 'meta');
const reportFile = join(metaDir, 'freshness-report.json');

// ─── Load all local articles ────────────────────────────────────

function loadLocalArticles() {
  const articles = [];
  if (!existsSync(loiDir)) return articles;
  for (const f of readdirSync(loiDir).filter(f => f.endsWith('.json'))) {
    try {
      const data = JSON.parse(readFileSync(join(loiDir, f), 'utf-8'));
      if (Array.isArray(data)) articles.push(...data);
    } catch { /* skip corrupt files */ }
  }
  return articles;
}

// ─── Check a single Fedlex URL ──────────────────────────────────

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url) { resolve({ status: 'no_url', code: null }); return; }
    try {
      const parsedUrl = new URL(url);
      const req = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'HEAD',
        headers: { 'User-Agent': 'JusticeBot-Freshness/1.0' },
        timeout: 10000
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ status: 'ok', code: res.statusCode });
        } else if (res.statusCode === 404) {
          resolve({ status: 'not_found', code: 404 });
        } else {
          resolve({ status: 'error', code: res.statusCode });
        }
      });
      req.on('error', () => resolve({ status: 'network_error', code: null }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 'timeout', code: null }); });
      req.end();
    } catch {
      resolve({ status: 'invalid_url', code: null });
    }
  });
}

// ─── Age calculation ────────────────────────────────────────────

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

function computeAge(dateStr) {
  if (!dateStr) return { age_ms: Infinity, stale: true, age_label: 'unknown' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { age_ms: Infinity, stale: true, age_label: 'invalid_date' };
  const age = Date.now() - d.getTime();
  const days = Math.floor(age / (24 * 60 * 60 * 1000));
  return {
    age_ms: age,
    stale: age > SIX_MONTHS_MS,
    age_label: days < 30 ? `${days}d` : days < 365 ? `${Math.floor(days/30)}mo` : `${Math.floor(days/365)}y`,
  };
}

// ─── Main freshness audit ───────────────────────────────────────

async function runFreshnessCheck(options = {}) {
  const articles = loadLocalArticles();
  const checkUrls = options.checkUrls !== false; // default true
  const sampleSize = options.sampleSize || 20; // check N random URLs

  console.log(`Freshness check: ${articles.length} articles loaded`);

  const report = {
    total_articles: articles.length,
    with_fedlex_url: 0,
    without_fedlex_url: 0,
    stale_articles: [],
    no_date_articles: [],
    url_checks: [],
    summary: {},
  };

  // 1. Age analysis
  const byAge = { fresh: 0, stale: 0, unknown: 0 };
  for (const art of articles) {
    const { stale, age_label } = computeAge(art.harvestDate);
    if (art.lienFedlex) report.with_fedlex_url++;
    else report.without_fedlex_url++;

    if (!art.harvestDate) {
      byAge.unknown++;
      report.no_date_articles.push({ ref: art.ref, rs: art.rs });
    } else if (stale) {
      byAge.stale++;
      report.stale_articles.push({ ref: art.ref, rs: art.rs, harvestDate: art.harvestDate, age: age_label });
    } else {
      byAge.fresh++;
    }
  }

  // 2. URL spot-check — échantillon déterministe et uniformément distribué
  // (tri alphabétique par ref puis stride régulier → reproductible entre runs,
  // tout en couvrant l'ensemble du corpus plutôt que les N premiers)
  if (checkUrls) {
    const withUrl = articles.filter(a => a.lienFedlex);
    let sample;
    if (withUrl.length <= sampleSize) {
      sample = withUrl;
    } else {
      const sorted = [...withUrl].sort((a, b) => (a.ref || '').localeCompare(b.ref || ''));
      const stride = sorted.length / sampleSize;
      sample = Array.from({ length: sampleSize }, (_, i) => sorted[Math.floor(i * stride)]);
    }

    console.log(`Checking ${sample.length} Fedlex URLs...`);
    for (const art of sample) {
      const result = await checkUrl(art.lienFedlex);
      report.url_checks.push({
        ref: art.ref,
        url: art.lienFedlex,
        ...result,
      });
      if (result.status !== 'ok') {
        console.log(`  ⚠ ${art.ref}: ${result.status} (${result.code})`);
      }
    }
  }

  // 3. Summary
  const brokenUrls = report.url_checks.filter(c => c.status !== 'ok');
  report.summary = {
    freshness: byAge,
    freshness_rate: articles.length > 0
      ? Math.round((byAge.fresh / articles.length) * 100) + '%'
      : 'N/A',
    stale_rate: articles.length > 0
      ? Math.round((byAge.stale / articles.length) * 100) + '%'
      : 'N/A',
    broken_urls: brokenUrls.length,
    url_check_sample_size: report.url_checks.length,
    needs_reharvest: byAge.stale > 0 || brokenUrls.length > 0,
  };

  // Write report
  writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\nFreshness report written to ${reportFile}`);
  console.log(`Fresh: ${byAge.fresh} | Stale: ${byAge.stale} | Unknown: ${byAge.unknown}`);
  console.log(`URLs checked: ${report.url_checks.length} | Broken: ${brokenUrls.length}`);

  return report;
}

// ─── Programmatic API (for tests + pipeline) ───────────────────

export { runFreshnessCheck, computeAge, loadLocalArticles };

// CLI execution
if (process.argv[1] && process.argv[1].includes('freshness-check')) {
  runFreshnessCheck({ sampleSize: 20 });
}
