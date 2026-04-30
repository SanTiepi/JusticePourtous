#!/usr/bin/env node
/**
 * verify-sitemap-integrity.mjs — Vérifie que toutes les URLs dans
 * src/public/sitemap.xml correspondent à des fichiers HTML existants.
 *
 * Évite les 404 SEO catastrophiques (Google déréfère les sites avec trop
 * de 404 dans leur sitemap).
 *
 * Usage : node scripts/verify-sitemap-integrity.mjs
 *         node scripts/verify-sitemap-integrity.mjs --fix    (regen sitemap)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'src/public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

const SITE_URL = 'https://justicepourtous.ch';

function loadSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`[sitemap-integrity] manque ${SITEMAP_PATH}`);
    process.exit(1);
  }
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, ''));
}

function checkUrl(url) {
  // Convertit URL absolue en path relatif
  let rel = url.replace(SITE_URL, '');
  if (rel === '' || rel === '/') rel = '/index.html';
  // Path file system
  const filePath = path.join(PUBLIC_DIR, rel);
  return fs.existsSync(filePath);
}

function main() {
  const urls = loadSitemap();
  console.log(`Sitemap : ${urls.length} URLs`);

  const missing = [];
  const ok = [];
  for (const url of urls) {
    if (checkUrl(url)) ok.push(url);
    else missing.push(url);
  }

  console.log(`✓ ${ok.length} URLs présentes (HTML existe)`);
  if (missing.length > 0) {
    console.log(`✗ ${missing.length} URLs MANQUANTES (404 SEO) :`);
    missing.slice(0, 20).forEach(u => console.log('  -', u));
    if (missing.length > 20) console.log(`  ... et ${missing.length - 20} autres`);
    process.exitCode = 1;
  } else {
    console.log('✓ Sitemap intègre — aucun 404 attendu.');
  }

  // Audit inverse : guides HTML qui ne sont PAS dans le sitemap (orphelins SEO)
  const guidesDir = path.join(PUBLIC_DIR, 'guides');
  if (fs.existsSync(guidesDir)) {
    const frFiles = fs.readdirSync(guidesDir)
      .filter(f => f.endsWith('.html'))
      .map(f => `${SITE_URL}/guides/${f}`);
    const orphans = frFiles.filter(f => !urls.includes(f));
    if (orphans.length > 0) {
      console.log(`\n⚠ ${orphans.length} guides FR existent mais PAS dans sitemap (orphelins SEO) :`);
      orphans.slice(0, 10).forEach(o => console.log('  -', o));
      if (orphans.length > 10) console.log(`  ... et ${orphans.length - 10} autres`);
    } else {
      console.log('✓ Tous les guides FR sont référencés dans le sitemap.');
    }
  }
}

main();
