#!/usr/bin/env node
/**
 * probe-sitemap-urls.mjs — Échantillonne N URLs du sitemap et vérifie qu'elles
 * répondent < 500. Détecte les bugs serveur type "fichier listé mais render
 * fail" (cas trouvé tick #14 : /guides/de/travail_licenciement_abusif.html → 500).
 *
 * Usage : node scripts/probe-sitemap-urls.mjs [--all|--sample=N]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'src/public/sitemap.xml');

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const sampleArg = args.find(a => a.startsWith('--sample='));
const SAMPLE = sampleArg ? parseInt(sampleArg.slice('--sample='.length), 10) : (ALL ? Infinity : 50);
const CONCURRENCY = 8;

function loadUrls() {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, ''));
}

function pickSample(urls, n) {
  if (n >= urls.length) return urls;
  // Échantillonnage uniforme par stride pour couvrir tout le sitemap
  const stride = urls.length / n;
  return Array.from({ length: n }, (_, i) => urls[Math.floor(i * stride)]);
}

async function probe(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    return { url, status: res.status, duration_ms: Date.now() - started };
  } catch (err) {
    return { url, status: 0, error: err.message, duration_ms: Date.now() - started };
  }
}

async function runWithConcurrency(items, fn, concurrency) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      const r = await fn(items[idx]);
      results[idx] = r;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const urls = loadUrls();
  console.log(`Sitemap : ${urls.length} URLs total. Sampling ${Math.min(SAMPLE, urls.length)}…`);
  const sample = pickSample(urls, SAMPLE);
  const results = await runWithConcurrency(sample, probe, CONCURRENCY);

  const ok = results.filter(r => r.status >= 200 && r.status < 400);
  const redir = results.filter(r => r.status >= 300 && r.status < 400);
  const c4xx = results.filter(r => r.status >= 400 && r.status < 500);
  const c5xx = results.filter(r => r.status >= 500);
  const dead = results.filter(r => r.status === 0);

  console.log(`✓ ${ok.length} OK (incl. ${redir.length} redirect)`);
  if (c4xx.length) console.log(`⚠ ${c4xx.length} 4xx`);
  if (c5xx.length) {
    console.log(`✗ ${c5xx.length} 5xx (CRITIQUE) :`);
    c5xx.forEach(r => console.log(`  ${r.status}  ${r.url}`));
  }
  if (dead.length) {
    console.log(`💥 ${dead.length} dead (no response) :`);
    dead.forEach(r => console.log(`  ${r.error}  ${r.url}`));
  }

  // Statistique perf
  const durations = ok.map(r => r.duration_ms).sort((a, b) => a - b);
  const median = durations[Math.floor(durations.length / 2)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  console.log(`Perf : médiane ${median}ms, p95 ${p95}ms`);

  if (c5xx.length || dead.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exitCode = 2;
});
